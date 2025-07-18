#!/usr/bin/env python3
"""
Convert CSV data to optimized JSON format for the web application.
"""

import pandas as pd
import json
import pathlib

def csv_to_json():
    """Convert the CSV data to optimized JSON format."""
    
    # Read the CSV file
    csv_path = pathlib.Path("data/col_by_zip.csv")
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV file not found: {csv_path}")
    
    df = pd.read_csv(csv_path)
    print(f"Loaded {len(df)} ZIP codes from CSV")
    
    # Convert to dictionary format optimized for ZIP code lookups
    zip_data = {}
    
    for _, row in df.iterrows():
        zip_code = str(row['zip']).zfill(5)  # Ensure 5-digit ZIP codes
        zip_data[zip_code] = {
            "rpp_all": round(float(row['rpp_all']), 2),
            "rpp_housing": round(float(row['rpp_housing']), 2),
            "rpp_goods": round(float(row['rpp_goods']), 2),
            "rpp_other": round(float(row['rpp_other']), 2),
            "state": str(row['state']),
            "cbsa_code": str(row['cbsa_code']) if pd.notna(row['cbsa_code']) else None
        }
    
    # Create output paths
    public_json_path = pathlib.Path("public/col_by_zip.json")
    src_json_path = pathlib.Path("src/data/col_by_zip.json")
    
    # Ensure directories exist
    public_json_path.parent.mkdir(parents=True, exist_ok=True)
    src_json_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Save to both public and src directories
    with open(public_json_path, 'w') as f:
        json.dump(zip_data, f, separators=(',', ':'))
    
    with open(src_json_path, 'w') as f:
        json.dump(zip_data, f, separators=(',', ':'))
    
    # Calculate file sizes
    public_size = public_json_path.stat().st_size
    src_size = src_json_path.stat().st_size
    
    print(f"✅ JSON files created:")
    print(f"   Public: {public_json_path} ({public_size:,} bytes)")
    print(f"   Source: {src_json_path} ({src_size:,} bytes)")
    print(f"   {len(zip_data)} ZIP codes included")
    
    # Show sample data
    print("\n📊 Sample data:")
    sample_zips = list(zip_data.keys())[:5]
    for zip_code in sample_zips:
        data = zip_data[zip_code]
        print(f"   {zip_code}: RPP {data['rpp_all']} ({data['state']})")
    
    return zip_data

if __name__ == "__main__":
    try:
        csv_to_json()
    except Exception as e:
        print(f"❌ Error: {e}")
        exit(1)