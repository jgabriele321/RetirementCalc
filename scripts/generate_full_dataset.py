#!/usr/bin/env python3
"""
generate_full_dataset.py - Generate comprehensive ZIP code cost of living data

This script generates a complete dataset of ~42,000 US ZIP codes with 
Regional Price Parity (RPP) data from BEA and ZIP-to-geography mappings from HUD.
"""

import os
import json
import zipfile
import pathlib
import requests
import pandas as pd
from typing import Dict, Any

# Configuration
BEA_API_KEY = "5181B2AA-C467-4435-8F9B-91A8002E40EC"
CACHE_DIR = pathlib.Path.home() / ".cache" / "retirement_calc"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

def fetch_bea_data(table_name: str, geo_fips: str = "STATE", year: str = "2024") -> pd.DataFrame:
    """Fetch BEA Regional Price Parity data."""
    print(f"Fetching BEA {table_name} data...")
    
    url = "https://apps.bea.gov/api/data"
    params = {
        "UserID": BEA_API_KEY,
        "method": "GetData",
        "datasetname": "Regional",
        "TableName": table_name,
        "LineCode": "1,2,3,4",  # All-items, Goods, Rents, Other
        "GeoFips": geo_fips,
        "Year": year,
        "ResultFormat": "json"
    }
    
    try:
        response = requests.get(url, params=params, timeout=60)
        response.raise_for_status()
        data = response.json()
        
        if "BEAAPI" in data and "Results" in data["BEAAPI"]:
            if "Error" in data["BEAAPI"]["Results"]:
                error = data["BEAAPI"]["Results"]["Error"]
                raise Exception(f"BEA API Error: {error}")
            
            records = data["BEAAPI"]["Results"]["Data"]
            df = pd.DataFrame(records)
            print(f"  -> {len(df)} records fetched")
            return df
        else:
            raise Exception("Invalid BEA API response structure")
            
    except Exception as e:
        print(f"  -> Error fetching {table_name}: {e}")
        return pd.DataFrame()

def download_hud_crosswalk() -> pathlib.Path:
    """Download HUD ZIP to County/CBSA crosswalk."""
    print("Downloading HUD ZIP crosswalk...")
    
    url = "https://www.huduser.gov/portal/datasets/usps/ZIP_COUNTY_2025_Q1.zip"
    local_file = CACHE_DIR / "hud_crosswalk.zip"
    
    if not local_file.exists():
        print(f"  -> Downloading from {url}")
        response = requests.get(url, timeout=120)
        response.raise_for_status()
        local_file.write_bytes(response.content)
        print(f"  -> Downloaded {local_file.stat().st_size / 1024 / 1024:.1f} MB")
    else:
        print(f"  -> Using cached file: {local_file}")
    
    return local_file

def process_rpp_data(state_df: pd.DataFrame, msa_df: pd.DataFrame) -> Dict[str, Dict[str, float]]:
    """Process BEA RPP data into a lookup dictionary."""
    print("Processing RPP data...")
    
    rpp_lookup = {}
    
    # Process state data
    if not state_df.empty:
        for _, row in state_df.iterrows():
            geo_fips = str(row.get('GeoFips', '')).zfill(2)
            line_code = str(row.get('LineCode', ''))
            data_value = row.get('DataValue', 0)
            
            if geo_fips and line_code and data_value != "(NA)":
                try:
                    value = float(str(data_value).replace(',', ''))
                    if geo_fips not in rpp_lookup:
                        rpp_lookup[geo_fips] = {}
                    
                    # Map line codes to RPP components
                    if line_code == "1":  # All items
                        rpp_lookup[geo_fips]['rpp_all'] = value
                    elif line_code == "2":  # Goods
                        rpp_lookup[geo_fips]['rpp_goods'] = value
                    elif line_code == "3":  # Rents
                        rpp_lookup[geo_fips]['rpp_housing'] = value
                    elif line_code == "4":  # Other services
                        rpp_lookup[geo_fips]['rpp_other'] = value
                except ValueError:
                    continue
    
    # Process MSA data
    if not msa_df.empty:
        for _, row in msa_df.iterrows():
            geo_fips = str(row.get('GeoFips', '')).zfill(5)
            line_code = str(row.get('LineCode', ''))
            data_value = row.get('DataValue', 0)
            
            if geo_fips and line_code and data_value != "(NA)":
                try:
                    value = float(str(data_value).replace(',', ''))
                    if geo_fips not in rpp_lookup:
                        rpp_lookup[geo_fips] = {}
                    
                    if line_code == "1":
                        rpp_lookup[geo_fips]['rpp_all'] = value
                    elif line_code == "2":
                        rpp_lookup[geo_fips]['rpp_goods'] = value
                    elif line_code == "3":
                        rpp_lookup[geo_fips]['rpp_housing'] = value
                    elif line_code == "4":
                        rpp_lookup[geo_fips]['rpp_other'] = value
                except ValueError:
                    continue
    
    print(f"  -> Processed {len(rpp_lookup)} geographic areas")
    return rpp_lookup

def generate_comprehensive_dataset():
    """Generate the complete ZIP code dataset."""
    print("=" * 60)
    print("Generating Comprehensive ZIP Code Dataset")
    print("=" * 60)
    
    # Step 1: Fetch BEA data
    print("\n1. Fetching BEA Regional Price Parity data...")
    state_rpp = fetch_bea_data("SARPP", "STATE")
    msa_rpp = fetch_bea_data("MARPP", "MSA")
    
    # Step 2: Process RPP data
    rpp_lookup = process_rpp_data(state_rpp, msa_rpp)
    
    # Step 3: Download HUD crosswalk
    print("\n2. Loading ZIP code mappings...")
    hud_zip = download_hud_crosswalk()
    
    # Step 4: Extract and process ZIP data
    with zipfile.ZipFile(hud_zip) as zf:
        csv_name = [n for n in zf.namelist() if n.endswith(".csv")][0]
        print(f"  -> Extracting {csv_name}")
        
        with zf.open(csv_name) as f:
            zip_df = pd.read_csv(f, dtype={
                "ZIP": str, 
                "COUNTY": str, 
                "STATE": str, 
                "CBSA": str,
                "RES_RATIO": float
            })
    
    print(f"  -> Loaded {len(zip_df)} ZIP-county mappings")
    
    # Step 5: Build final dataset
    print("\n3. Building final dataset...")
    
    # Keep only the highest residential ratio per ZIP
    zip_df = zip_df.sort_values(['ZIP', 'RES_RATIO'], ascending=[True, False])
    zip_df = zip_df.groupby('ZIP').first().reset_index()
    
    print(f"  -> {len(zip_df)} unique ZIP codes")
    
    # Add RPP data
    final_data = {}
    matched_cbsa = 0
    matched_state = 0
    estimated = 0
    
    # State estimates for fallback (same as our current estimates)
    state_estimates = {
        'AL': {'rpp_all': 86.5, 'rpp_housing': 79.0, 'rpp_goods': 91.0, 'rpp_other': 89.5},
        'AK': {'rpp_all': 125.0, 'rpp_housing': 140.0, 'rpp_goods': 118.0, 'rpp_other': 120.0},
        'AZ': {'rpp_all': 97.0, 'rpp_housing': 98.0, 'rpp_goods': 96.5, 'rpp_other': 98.0},
        'AR': {'rpp_all': 85.0, 'rpp_housing': 77.0, 'rpp_goods': 90.0, 'rpp_other': 88.0},
        'CA': {'rpp_all': 142.0, 'rpp_housing': 189.0, 'rpp_goods': 114.5, 'rpp_other': 127.5},
        'CO': {'rpp_all': 105.0, 'rpp_housing': 115.0, 'rpp_goods': 99.0, 'rpp_other': 103.0},
        'CT': {'rpp_all': 115.0, 'rpp_housing': 135.0, 'rpp_goods': 105.0, 'rpp_other': 112.0},
        'DE': {'rpp_all': 102.0, 'rpp_housing': 108.0, 'rpp_goods': 98.0, 'rpp_other': 101.5},
        'FL': {'rpp_all': 96.0, 'rpp_housing': 96.0, 'rpp_goods': 96.5, 'rpp_other': 97.0},
        'GA': {'rpp_all': 95.5, 'rpp_housing': 95.0, 'rpp_goods': 96.0, 'rpp_other': 97.0},
        'HI': {'rpp_all': 150.0, 'rpp_housing': 195.0, 'rpp_goods': 125.0, 'rpp_other': 135.0},
        'ID': {'rpp_all': 94.0, 'rpp_housing': 92.0, 'rpp_goods': 95.0, 'rpp_other': 96.0},
        'IL': {'rpp_all': 108.0, 'rpp_housing': 120.0, 'rpp_goods': 101.0, 'rpp_other': 106.0},
        'IN': {'rpp_all': 88.5, 'rpp_housing': 83.0, 'rpp_goods': 92.5, 'rpp_other': 91.5},
        'IA': {'rpp_all': 90.0, 'rpp_housing': 85.5, 'rpp_goods': 93.0, 'rpp_other': 92.5},
        'KS': {'rpp_all': 89.0, 'rpp_housing': 84.0, 'rpp_goods': 92.5, 'rpp_other': 92.0},
        'KY': {'rpp_all': 88.0, 'rpp_housing': 82.0, 'rpp_goods': 92.0, 'rpp_other': 91.0},
        'LA': {'rpp_all': 93.5, 'rpp_housing': 91.0, 'rpp_goods': 95.5, 'rpp_other': 96.0},
        'ME': {'rpp_all': 105.5, 'rpp_housing': 113.0, 'rpp_goods': 100.0, 'rpp_other': 104.5},
        'MD': {'rpp_all': 112.0, 'rpp_housing': 130.0, 'rpp_goods': 103.0, 'rpp_other': 109.0},
        'MA': {'rpp_all': 117.5, 'rpp_housing': 141.0, 'rpp_goods': 105.5, 'rpp_other': 114.5},
        'MI': {'rpp_all': 89.5, 'rpp_housing': 85.0, 'rpp_goods': 93.0, 'rpp_other': 92.0},
        'MN': {'rpp_all': 102.0, 'rpp_housing': 109.5, 'rpp_goods': 96.5, 'rpp_other': 101.0},
        'MS': {'rpp_all': 84.0, 'rpp_housing': 75.0, 'rpp_goods': 89.0, 'rpp_other': 87.0},
        'MO': {'rpp_all': 90.5, 'rpp_housing': 86.0, 'rpp_goods': 93.5, 'rpp_other': 93.0},
        'MT': {'rpp_all': 95.0, 'rpp_housing': 93.0, 'rpp_goods': 96.0, 'rpp_other': 97.0},
        'NE': {'rpp_all': 91.0, 'rpp_housing': 87.0, 'rpp_goods': 93.5, 'rpp_other': 93.5},
        'NV': {'rpp_all': 98.0, 'rpp_housing': 100.0, 'rpp_goods': 97.0, 'rpp_other': 98.5},
        'NH': {'rpp_all': 103.0, 'rpp_housing': 110.0, 'rpp_goods': 99.0, 'rpp_other': 102.0},
        'NJ': {'rpp_all': 120.0, 'rpp_housing': 150.0, 'rpp_goods': 107.0, 'rpp_other': 116.0},
        'NM': {'rpp_all': 92.5, 'rpp_housing': 89.0, 'rpp_goods': 94.5, 'rpp_other': 95.0},
        'NY': {'rpp_all': 125.0, 'rpp_housing': 165.0, 'rpp_goods': 109.0, 'rpp_other': 118.0},
        'NC': {'rpp_all': 94.5, 'rpp_housing': 93.0, 'rpp_goods': 95.5, 'rpp_other': 96.0},
        'ND': {'rpp_all': 96.0, 'rpp_housing': 94.0, 'rpp_goods': 97.0, 'rpp_other': 98.0},
        'OH': {'rpp_all': 91.5, 'rpp_housing': 88.0, 'rpp_goods': 94.0, 'rpp_other': 94.0},
        'OK': {'rpp_all': 87.0, 'rpp_housing': 80.0, 'rpp_goods': 91.5, 'rpp_other': 90.0},
        'OR': {'rpp_all': 110.0, 'rpp_housing': 125.0, 'rpp_goods': 102.5, 'rpp_other': 107.5},
        'PA': {'rpp_all': 108.5, 'rpp_housing': 118.0, 'rpp_goods': 102.0, 'rpp_other': 107.0},
        'RI': {'rpp_all': 110.0, 'rpp_housing': 125.0, 'rpp_goods': 102.0, 'rpp_other': 108.0},
        'SC': {'rpp_all': 95.0, 'rpp_housing': 94.0, 'rpp_goods': 95.5, 'rpp_other': 96.5},
        'SD': {'rpp_all': 93.0, 'rpp_housing': 90.0, 'rpp_goods': 95.0, 'rpp_other': 95.5},
        'TN': {'rpp_all': 87.5, 'rpp_housing': 81.0, 'rpp_goods': 92.0, 'rpp_other': 90.5},
        'TX': {'rpp_all': 94.0, 'rpp_housing': 92.0, 'rpp_goods': 95.0, 'rpp_other': 95.5},
        'UT': {'rpp_all': 98.5, 'rpp_housing': 101.0, 'rpp_goods': 97.5, 'rpp_other': 99.0},
        'VT': {'rpp_all': 106.0, 'rpp_housing': 115.0, 'rpp_goods': 101.0, 'rpp_other': 105.0},
        'VA': {'rpp_all': 99.0, 'rpp_housing': 104.5, 'rpp_goods': 95.0, 'rpp_other': 99.5},
        'WA': {'rpp_all': 118.0, 'rpp_housing': 145.0, 'rpp_goods': 106.0, 'rpp_other': 115.0},
        'WV': {'rpp_all': 86.0, 'rpp_housing': 78.0, 'rpp_goods': 91.0, 'rpp_other': 89.0},
        'WI': {'rpp_all': 96.5, 'rpp_housing': 97.0, 'rpp_goods': 96.5, 'rpp_other': 97.5},
        'WY': {'rpp_all': 92.0, 'rpp_housing': 88.0, 'rpp_goods': 94.0, 'rpp_other': 94.5},
        'DC': {'rpp_all': 130.0, 'rpp_housing': 170.0, 'rpp_goods': 110.0, 'rpp_other': 125.0}
    }
    
    for _, row in zip_df.iterrows():
        zip_code = str(row['ZIP']).zfill(5)
        state = str(row['STATE'])
        county_fips = str(row['COUNTY']).zfill(5)
        cbsa_code = str(row['CBSA']) if pd.notna(row['CBSA']) else None
        
        rpp_data = None
        
        # Try CBSA match first
        if cbsa_code and cbsa_code in rpp_lookup:
            rpp_data = rpp_lookup[cbsa_code]
            matched_cbsa += 1
        # Then try state match
        elif county_fips[:2] in rpp_lookup:
            rpp_data = rpp_lookup[county_fips[:2]]
            matched_state += 1
        # Finally use state estimate
        elif state in state_estimates:
            rpp_data = state_estimates[state]
            estimated += 1
        else:
            # National average fallback
            rpp_data = {'rpp_all': 100.0, 'rpp_housing': 100.0, 'rpp_goods': 100.0, 'rpp_other': 100.0}
            estimated += 1
        
        # Ensure all required fields are present
        final_rpp = {
            'rpp_all': rpp_data.get('rpp_all', 100.0),
            'rpp_housing': rpp_data.get('rpp_housing', 100.0),
            'rpp_goods': rpp_data.get('rpp_goods', 100.0),
            'rpp_other': rpp_data.get('rpp_other', 100.0),
            'state': state,
            'cbsa_code': cbsa_code
        }
        
        final_data[zip_code] = final_rpp
    
    print(f"  -> CBSA matches: {matched_cbsa:,}")
    print(f"  -> State matches: {matched_state:,}")
    print(f"  -> Estimates used: {estimated:,}")
    print(f"  -> Total ZIP codes: {len(final_data):,}")
    
    # Save to JSON
    output_dir = pathlib.Path("public")
    output_dir.mkdir(exist_ok=True)
    
    json_file = output_dir / "col_by_zip.json"
    with open(json_file, 'w') as f:
        json.dump(final_data, f, separators=(',', ':'))
    
    # Also save to src/data for development
    src_data_dir = pathlib.Path("src/data")
    src_data_dir.mkdir(exist_ok=True)
    src_json_file = src_data_dir / "col_by_zip.json"
    with open(src_json_file, 'w') as f:
        json.dump(final_data, f, separators=(',', ':'))
    
    file_size = json_file.stat().st_size / 1024 / 1024
    print(f"\n4. Generated files:")
    print(f"  -> {json_file} ({file_size:.1f} MB)")
    print(f"  -> {src_json_file} ({file_size:.1f} MB)")
    
    return final_data

if __name__ == "__main__":
    try:
        data = generate_comprehensive_dataset()
        print(f"\n✅ Success! Generated comprehensive dataset with {len(data):,} ZIP codes")
        
        # Test our problem ZIP codes
        print(f"\n🔍 Testing problematic ZIP codes:")
        flint_data = data.get('48505', {})
        austin_data = data.get('78701', {})
        print(f"  Flint, MI (48505): RPP = {flint_data.get('rpp_all', 'N/A')}")
        print(f"  Austin, TX (78701): RPP = {austin_data.get('rpp_all', 'N/A')}")
        
        if flint_data.get('rpp_all', 0) < austin_data.get('rpp_all', 0):
            print(f"  ✅ Correct: Flint is cheaper than Austin")
        else:
            print(f"  ❌ Issue: Flint appears more expensive than Austin")
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        exit(1)