#!/usr/bin/env python3
"""
Debug script to check BEA API response format.
"""

import os
import requests
import json

def debug_bea_api():
    api_key = "5181B2AA-C467-4435-8F9B-91A8002E40EC"
    
    params = {
        "UserID": api_key,
        "method": "GetData",
        "datasetname": "Regional",
        "TableName": "RPPALL",
        "Year": "2024",
        "LineCode": 1,
        "GeoFips": "*",
    }
    url = "https://apps.bea.gov/api/data"
    
    print("Making BEA API request...")
    print(f"URL: {url}")
    print(f"Params: {params}")
    
    try:
        response = requests.get(url, params=params, timeout=40)
        response.raise_for_status()
        
        data = response.json()
        print(f"\nResponse structure:")
        print(json.dumps(data, indent=2)[:1000] + "..." if len(json.dumps(data, indent=2)) > 1000 else json.dumps(data, indent=2))
        
        # Check for different possible keys
        if "BEAAPI" in data:
            beaapi = data["BEAAPI"]
            print(f"\nBEAAPI keys: {list(beaapi.keys())}")
            
            if "Results" in beaapi:
                results = beaapi["Results"]
                print(f"Results keys: {list(results.keys())}")
                
                if "Data" in results:
                    print(f"Data found! {len(results['Data'])} records")
                elif "Error" in results:
                    print(f"API Error: {results['Error']}")
                else:
                    print(f"No Data key, available keys: {list(results.keys())}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_bea_api()