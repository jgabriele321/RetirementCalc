#!/usr/bin/env python3
"""
Check BEA API parameters to understand the correct format.
"""

import os
import requests
import json

def check_bea_params():
    api_key = "5181B2AA-C467-4435-8F9B-91A8002E40EC"
    
    # First, let's check what tables are available
    params = {
        "UserID": api_key,
        "method": "GetParameterValues",
        "datasetname": "Regional",
        "ParameterName": "TableName",
    }
    url = "https://apps.bea.gov/api/data"
    
    print("Checking available tables...")
    
    try:
        response = requests.get(url, params=params, timeout=40)
        response.raise_for_status()
        
        data = response.json()
        if "BEAAPI" in data and "Results" in data["BEAAPI"]:
            results = data["BEAAPI"]["Results"]
            if "ParamValue" in results:
                print("Available tables:")
                for table in results["ParamValue"]:
                    if "Desc" in table:
                        print(f"  {table.get('Key', 'N/A')}: {table['Desc']}")
            else:
                print("No ParamValue found")
                print(f"Available keys: {list(results.keys())}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_bea_params()