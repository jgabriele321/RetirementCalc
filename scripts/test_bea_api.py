#!/usr/bin/env python3
"""
Test script to verify BEA API key and connectivity.
"""

import os
import requests

def test_bea_api():
    api_key = os.environ.get("BEA_API_KEY")
    
    if not api_key:
        print("❌ BEA_API_KEY environment variable not set")
        print("   Please set it with: export BEA_API_KEY='your_api_key_here'")
        return False
    
    print(f"✅ BEA API key found: {api_key[:8]}...")
    
    # Test API connectivity with a simple request
    try:
        params = {
            "UserID": api_key,
            "method": "GetDataSetList",
            "datasetname": "Regional",
        }
        url = "https://apps.bea.gov/api/data"
        
        print("🔍 Testing BEA API connectivity...")
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        if "BEAAPI" in data:
            print("✅ BEA API connection successful!")
            print(f"   Available datasets: {len(data['BEAAPI']['Results']['Dataset'])}")
            return True
        else:
            print("❌ Unexpected API response format")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ BEA API connection failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Error testing BEA API: {e}")
        return False

if __name__ == "__main__":
    success = test_bea_api()
    exit(0 if success else 1)