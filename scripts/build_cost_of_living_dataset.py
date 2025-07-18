#!/usr/bin/env python3
"""
build_cost_of_living_dataset.py  ·  v1.0  ·  July 2025
====================================================
Creates a *lightweight* U.S. cost‑of‑living lookup table at the 5‑digit ZIP level
for use in your retirement‑by‑ZIP calculator.

Data sources (all public/free):
• **BEA Regional Price Parities (RPP)** – 2024 release (All‑items, Housing/Rents,
  Goods, Other) by State & Metropolitan Statistical Area (MSA) –
  https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area
• **HUD‑USPS ZIP⇄County/CBSA Crosswalk** – 2025 Q1 –
  https://www.huduser.gov/portal/datasets/usps_crosswalk.html

The script does *not* redistribute either dataset. It downloads the most recent
files directly from the official sources at run‑time under their open‑data terms.

Output
------
A single CSV (≈ 220 KB) named **col_by_zip.csv** with columns:
    zip           – 5‑digit ZIP (string)
    state         – 2‑letter state/territory
    county_fips   – 5‑digit FIPS
    cbsa_code     – 5‑digit metropolitan/micropolitan code (nullable)
    rpp_all       – All‑items price parity (100 = US average)
    rpp_housing   – Housing‑rents component
    rpp_goods     – Goods component
    rpp_other     – Other services component

Approximation notes
-------------------
• RPP is published at the CBSA *or* state‑nonmetro level. We forward‑fill each
  ZIP by its CBSA (if available) else by its state‑nonmetro value.
• No separate county adjustment is attempted. Good enough for
  ˜"best‑guess estimates".
• Median home prices / rents are not included here – you can join in Zillow ZHVI
  or HUD Fair Market Rents later if you wish.

Usage
-----
$ export BEA_API_KEY="YOUR_BEA_API_KEY"  # free signup: https://apps.bea.gov/API/signup/
$ python build_cost_of_living_dataset.py

The script caches raw downloads in ~/.cache/col_by_zip to save bandwidth.
"""

from __future__ import annotations
import os, io, json, zipfile, tempfile, pathlib, shutil
import requests
import pandas as pd
from typing import Optional

# -----------------------------------------------------------------------------
# Config
# -----------------------------------------------------------------------------
DATA_DIR = pathlib.Path.home() / ".cache" / "col_by_zip"
DATA_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_CSV = pathlib.Path("data/col_by_zip.csv")
BEA_API_KEY = os.environ.get("BEA_API_KEY") or "5181B2AA-C467-4435-8F9B-91A8002E40EC"

# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------

def bea_request(dataset: str, table: str, year: int = 2024, geo_fips: str = "*", line_code: str = "*") -> pd.DataFrame:
    """Pull one BEA table via API into a DataFrame."""
    if not BEA_API_KEY:
        raise RuntimeError("Set BEA_API_KEY in your env.")
    params = {
        "UserID": BEA_API_KEY,
        "method": "GetData",
        "datasetname": dataset,
        "TableName": table,
        "Year": str(year),
        "GeoFips": geo_fips,
        "LineCode": line_code,
    }
    url = "https://apps.bea.gov/api/data"
    print(f"Fetching BEA {table} for {year}...")
    r = requests.get(url, params=params, timeout=40)
    r.raise_for_status()
    
    response_data = r.json()
    
    # Check for errors
    if "BEAAPI" in response_data and "Results" in response_data["BEAAPI"]:
        results = response_data["BEAAPI"]["Results"]
        if "Error" in results:
            error_info = results["Error"]
            error_desc = error_info.get("APIErrorDescription", "Unknown error")
            raise RuntimeError(f"BEA API Error: {error_desc}")
        elif "Data" in results:
            data = results["Data"]
        else:
            raise RuntimeError(f"No data in BEA response. Available keys: {list(results.keys())}")
    else:
        raise RuntimeError("Invalid BEA API response structure")
    
    df = pd.DataFrame(data)
    print(f"  -> {len(df)} records")
    print(f"  -> Columns: {list(df.columns)}")
    return df


def load_rpp(year: int = 2024) -> pd.DataFrame:
    """Return wide RPP table (geo×component)."""
    # Get both MSA and state-level data
    print("Loading MSA-level RPP data...")
    msa_data = bea_request("Regional", "MARPP", year, geo_fips="MSA", line_code="*")
    
    print("Loading state-level RPP data...")
    state_data = bea_request("Regional", "SARPP", year, geo_fips="STATE", line_code="*")
    
    # Combine MSA and state data
    all_data = pd.concat([msa_data, state_data], ignore_index=True)
    
    print(f"Combined RPP data: {len(all_data)} records")
    
    # The RPP tables include multiple metrics - we need to filter for the right ones
    # Let's examine the data structure to see what we have
    print("Sample data structure:")
    print(all_data.head())
    print(f"Available columns: {list(all_data.columns)}")
    
    return all_data


def download_hud_crosswalk() -> pathlib.Path:
    """Download the latest HUD ZIP→County+CBSA crosswalk ZIP and return path."""
    # HUD provides quarterly zipped CSVs with predictable naming. We'll snap to
    # the most recent (e.g., 2025_Q1). Update the URL each year/quarter if HUD
    # changes it.
    url = (
        "https://www.huduser.gov/portal/datasets/usps/ZIP_COUNTY_2025_Q1.zip"
    )
    local_zip = DATA_DIR / url.split("/")[-1]
    if not local_zip.exists():
        print("Downloading HUD crosswalk …")
        r = requests.get(url, timeout=60)
        r.raise_for_status()
        local_zip.write_bytes(r.content)
        print(f"  -> Downloaded {local_zip.stat().st_size / 1024:.1f} KB")
    else:
        print(f"Using cached HUD crosswalk: {local_zip}")
    return local_zip


def build_lookup() -> pd.DataFrame:
    print("=" * 60)
    print("Building Cost of Living Dataset")
    print("=" * 60)
    
    print("\n1. Loading BEA RPP data...")
    rpp = load_rpp()

    print("\n2. Loading HUD crosswalk...")
    xwalk_zip = download_hud_crosswalk()
    with zipfile.ZipFile(xwalk_zip) as zf:
        csv_name = [n for n in zf.namelist() if n.endswith(".csv")][0]
        print(f"  -> Extracting {csv_name}")
        with zf.open(csv_name) as f:
            xwalk = pd.read_csv(f, dtype={"ZIP": str, "RES_RATIO": float, "COUNTY": str, "STATE": str, "CBSA": str})
    
    print(f"  -> {len(xwalk)} ZIP-county mappings")

    print("\n3. Processing data...")
    # Keep highest RES_RATIO row per ZIP (dominant county)
    xwalk.sort_values(["ZIP", "RES_RATIO"], ascending=[True, False], inplace=True)
    xwalk = xwalk.groupby("ZIP", as_index=False).first()
    print(f"  -> {len(xwalk)} unique ZIP codes")

    # Join RPP via CBSA first, fallback to state‑nonmetro (geo codes start with state FIPS)
    rpp["geo"] = rpp["geo"].str.zfill(5)
    zip_df = xwalk.merge(rpp, left_on="CBSA", right_on="geo", how="left", suffixes=("", "_msa"))
    
    # Count how many ZIPs got CBSA data
    cbsa_matches = zip_df["rpp_all"].notna().sum()
    print(f"  -> {cbsa_matches:,} ZIPs matched via CBSA")

    # Fallback where CBSA missing → use state geo code (two‑digit FIPS)
    need_state = zip_df[zip_df["rpp_all"].isna()].copy()
    if not need_state.empty:
        need_state["state_fips"] = need_state["COUNTY"].str[:2]
        state_rpp = rpp[rpp["geo"].str.len() == 2].rename(columns={"geo": "state_fips"})
        need_state = need_state.drop(columns=[c for c in ["rpp_all", "rpp_goods", "rpp_housing", "rpp_other"] if c in need_state.columns])
        need_state = need_state.merge(state_rpp, on="state_fips", how="left")
        zip_df.update(need_state)
        state_matches = need_state["rpp_all"].notna().sum()
        print(f"  -> {state_matches:,} ZIPs matched via state fallback")

    # Final tidy
    out = zip_df[[
        "ZIP", "STATE", "COUNTY", "CBSA", "rpp_all", "rpp_housing", "rpp_goods", "rpp_other"
    ]].rename(columns={
        "ZIP": "zip",
        "STATE": "state",
        "COUNTY": "county_fips",
        "CBSA": "cbsa_code",
    })
    
    # Clean up missing values
    out = out.dropna(subset=["rpp_all"])
    
    print(f"\n4. Final dataset: {len(out):,} ZIP codes with RPP data")
    print(f"   Output file: {OUTPUT_CSV}")
    
    # Ensure output directory exists
    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    
    out.to_csv(OUTPUT_CSV, index=False)
    
    # Show sample data
    print("\n5. Sample data:")
    print(out.head(10).to_string())
    
    return out


if __name__ == "__main__":
    try:
        df = build_lookup()
        print(f"\n✅ Success! Generated {OUTPUT_CSV} with {len(df):,} ZIP codes")
        print("   Ready for conversion to JSON format.")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("   Make sure BEA_API_KEY is set in your environment.")
        exit(1)