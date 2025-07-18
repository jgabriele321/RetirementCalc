#!/usr/bin/env python3
"""
Check available line codes for MARPP table.
"""

import requests
import json

def check_marpp_linecodes():
    api_key = "5181B2AA-C467-4435-8F9B-91A8002E40EC"
    
    params = {
        "UserID": api_key,
        "method": "GetParameterValues",
        "datasetname": "Regional",
        "ParameterName": "LineCode",
        "TableName": "MARPP"
    }
    url = "https://apps.bea.gov/api/data"
    
    print("Checking available line codes for MARPP...")
    
    try:
        response = requests.get(url, params=params, timeout=40)
        response.raise_for_status()
        
        data = response.json()
        if "BEAAPI" in data and "Results" in data["BEAAPI"]:
            results = data["BEAAPI"]["Results"]
            if "ParamValue" in results:
                print("Available line codes:")
                for code in results["ParamValue"][:20]:  # Show first 20
                    print(f"  {code.get('Key', 'N/A')}: {code.get('Desc', 'No description')}")
            else:
                print("No ParamValue found")
                print(f"Available keys: {list(results.keys())}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_marpp_linecodes()