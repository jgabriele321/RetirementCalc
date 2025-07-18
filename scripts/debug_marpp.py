#!/usr/bin/env python3
"""
Debug MARPP table request specifically.
"""

import requests
import json

def debug_marpp():
    api_key = "5181B2AA-C467-4435-8F9B-91A8002E40EC"
    
    params = {
        "UserID": api_key,
        "method": "GetData",
        "datasetname": "Regional",
        "TableName": "MARPP",
        "Year": "2023",
        "GeoFips": "MSA",
        "LineCode": "1",
    }
    url = "https://apps.bea.gov/api/data"
    
    print("Testing MARPP request...")
    print(f"Params: {params}")
    
    try:
        response = requests.get(url, params=params, timeout=40)
        response.raise_for_status()
        
        data = response.json()
        print(f"\nResponse:")
        print(json.dumps(data, indent=2))
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_marpp()