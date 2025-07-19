#!/usr/bin/env python3
"""
Optimize dataset for web performance

Creates multiple optimized formats:
1. Core dataset (most common ZIPs) - loads immediately 
2. State-based shards for lazy loading
3. Compressed lookup tables
"""

import json
import pathlib
import gzip
from typing import Dict, Any

def load_full_dataset():
    """Load the comprehensive dataset."""
    with open('src/data/col_by_zip.json', 'r') as f:
        return json.load(f)

def create_core_dataset(full_data: Dict[str, Any], max_size: int = 2000) -> Dict[str, Any]:
    """Create a core dataset with the most important ZIP codes."""
    print(f"Creating core dataset with {max_size} most important ZIP codes...")
    
    # Priority order: Metro areas first, then major state centers
    priority_zips = []
    
    # Major metro areas (real RPP data)
    metro_zips = []
    for zip_code, data in full_data.items():
        cbsa_code = data.get('cbsa_code')
        if cbsa_code and str(cbsa_code).startswith('METRO_'):
            metro_zips.append(zip_code)
    
    # Add metro ZIPs first (highest priority)
    priority_zips.extend(metro_zips[:1500])  # Top 1500 metro ZIPs
    
    # Add major city centers and state capitals
    major_city_prefixes = [
        # State capitals and major cities by ZIP prefix
        '100', '200', '300', '400', '500', '600', '700', '800', '900',  # Major metro areas
        '850', '946', '902', '606', '775', '332', '802', '972', '785',  # Major cities
        '321', '480', '191', '804', '280', '535', '336', '870', '465'   # Additional major areas
    ]
    
    for prefix in major_city_prefixes:
        matching_zips = [z for z in full_data.keys() if z.startswith(prefix)]
        # Add first few ZIPs from each major area
        priority_zips.extend(matching_zips[:10])
    
    # Remove duplicates and limit size
    seen = set()
    core_zips = []
    for zip_code in priority_zips:
        if zip_code not in seen and len(core_zips) < max_size:
            seen.add(zip_code)
            core_zips.append(zip_code)
    
    # Build core dataset
    core_data = {zip_code: full_data[zip_code] for zip_code in core_zips}
    print(f"  -> Created core dataset with {len(core_data)} ZIP codes")
    return core_data

def create_state_shards(full_data: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    """Create state-based data shards for lazy loading."""
    print("Creating state-based data shards...")
    
    state_shards = {}
    
    for zip_code, data in full_data.items():
        state = data.get('state', 'XX')
        if state not in state_shards:
            state_shards[state] = {}
        state_shards[state][zip_code] = data
    
    print(f"  -> Created {len(state_shards)} state shards")
    for state, zips in state_shards.items():
        print(f"    {state}: {len(zips)} ZIP codes")
    
    return state_shards

def create_fallback_lookup():
    """Create a compact fallback lookup for unknown ZIP codes."""
    # ZIP prefix to state mapping
    zip_to_state = {
        '0': 'MA', '1': 'MA', '2': 'MA', '3': 'NH', '4': 'ME', '5': 'VT',
        '6': 'CT', '7': 'NJ', '8': 'NJ', '9': 'NJ',
        '10': 'NY', '11': 'NY', '12': 'NY', '13': 'NY', '14': 'NY',
        '15': 'PA', '16': 'PA', '17': 'PA', '18': 'PA', '19': 'PA',
        '20': 'DC', '21': 'MD', '22': 'VA', '23': 'VA', '24': 'VA',
        '25': 'MA', '26': 'MA', '27': 'MA',
        '28': 'NC', '29': 'SC',
        '30': 'GA', '31': 'GA', '32': 'FL', '33': 'FL', '34': 'FL',
        '35': 'AL', '36': 'AL', '37': 'TN', '38': 'TN', '39': 'OH',
        '40': 'KY', '41': 'KY', '42': 'PA', '43': 'OH', '44': 'OH', '45': 'OH',
        '46': 'IN', '47': 'IN', '48': 'MI', '49': 'MI',
        '50': 'IA', '51': 'IA', '52': 'IA', '53': 'WI', '54': 'WI',
        '55': 'MN', '56': 'MN', '57': 'MN', '58': 'MN', '59': 'MN',
        '60': 'IL', '61': 'IL', '62': 'IL', '63': 'MO', '64': 'MO', '65': 'MO',
        '66': 'KS', '67': 'KS', '68': 'NE', '69': 'NE',
        '70': 'LA', '71': 'LA', '72': 'AR', '73': 'OK', '74': 'OK',
        '75': 'TX', '76': 'TX', '77': 'TX', '78': 'TX', '79': 'TX',
        '80': 'CO', '81': 'CO', '82': 'WY', '83': 'ID', '84': 'UT',
        '85': 'AZ', '86': 'AZ', '87': 'NM', '88': 'NV', '89': 'NV',
        '90': 'CA', '91': 'CA', '92': 'CA', '93': 'CA', '94': 'CA',
        '95': 'CA', '96': 'CA', '97': 'OR', '98': 'WA', '99': 'AK'
    }
    
    # State RPP estimates
    state_rpp = {
        'AL': 86.5, 'AK': 125.0, 'AZ': 97.0, 'AR': 85.0, 'CA': 142.0, 'CO': 105.0,
        'CT': 115.0, 'DE': 102.0, 'FL': 96.0, 'GA': 95.5, 'HI': 150.0, 'ID': 94.0,
        'IL': 108.0, 'IN': 88.5, 'IA': 90.0, 'KS': 89.0, 'KY': 88.0, 'LA': 93.5,
        'ME': 105.5, 'MD': 112.0, 'MA': 117.5, 'MI': 89.5, 'MN': 102.0, 'MS': 84.0,
        'MO': 90.5, 'MT': 95.0, 'NE': 91.0, 'NV': 98.0, 'NH': 103.0, 'NJ': 120.0,
        'NM': 92.5, 'NY': 125.0, 'NC': 94.5, 'ND': 96.0, 'OH': 91.5, 'OK': 87.0,
        'OR': 110.0, 'PA': 108.5, 'RI': 110.0, 'SC': 95.0, 'SD': 93.0, 'TN': 87.5,
        'TX': 94.0, 'UT': 98.5, 'VT': 106.0, 'VA': 99.0, 'WA': 118.0, 'WV': 86.0,
        'WI': 96.5, 'WY': 92.0, 'DC': 130.0
    }
    
    return {
        'zip_to_state': zip_to_state,
        'state_rpp': state_rpp
    }

def optimize_dataset():
    """Create optimized dataset files for web performance."""
    print("=" * 60)
    print("Optimizing Dataset for Web Performance")
    print("=" * 60)
    
    # Load full dataset
    print("1. Loading full dataset...")
    full_data = load_full_dataset()
    print(f"  -> Loaded {len(full_data):,} ZIP codes")
    
    # Create core dataset (immediate loading)
    print("\n2. Creating core dataset...")
    core_data = create_core_dataset(full_data, max_size=2000)
    
    # Create state shards (lazy loading)
    print("\n3. Creating state shards...")
    state_shards = create_state_shards(full_data)
    
    # Create fallback lookup
    print("\n4. Creating fallback lookup...")
    fallback_data = create_fallback_lookup()
    
    # Save optimized files
    print("\n5. Saving optimized files...")
    
    # Core dataset for immediate loading
    core_file = pathlib.Path("public/col_by_zip_core.json")
    with open(core_file, 'w') as f:
        json.dump(core_data, f, separators=(',', ':'))
    
    src_core_file = pathlib.Path("src/data/col_by_zip_core.json")
    with open(src_core_file, 'w') as f:
        json.dump(core_data, f, separators=(',', ':'))
    
    # State shards directory
    shards_dir = pathlib.Path("public/states")
    shards_dir.mkdir(exist_ok=True)
    src_shards_dir = pathlib.Path("src/data/states")
    src_shards_dir.mkdir(exist_ok=True)
    
    for state, shard_data in state_shards.items():
        shard_file = shards_dir / f"{state}.json"
        with open(shard_file, 'w') as f:
            json.dump(shard_data, f, separators=(',', ':'))
        
        src_shard_file = src_shards_dir / f"{state}.json"
        with open(src_shard_file, 'w') as f:
            json.dump(shard_data, f, separators=(',', ':'))
    
    # Fallback lookup
    fallback_file = pathlib.Path("public/col_by_zip_fallback.json")
    with open(fallback_file, 'w') as f:
        json.dump(fallback_data, f, separators=(',', ':'))
    
    src_fallback_file = pathlib.Path("src/data/col_by_zip_fallback.json")
    with open(src_fallback_file, 'w') as f:
        json.dump(fallback_data, f, separators=(',', ':'))
    
    # Print file sizes
    print(f"\n6. Optimization results:")
    core_size = core_file.stat().st_size / 1024
    fallback_size = fallback_file.stat().st_size / 1024
    
    print(f"  Core dataset: {core_size:.1f} KB ({len(core_data)} ZIPs)")
    print(f"  Fallback lookup: {fallback_size:.1f} KB")
    print(f"  State shards: {len(state_shards)} files")
    
    total_shard_size = sum((shards_dir / f"{state}.json").stat().st_size for state in state_shards.keys()) / 1024
    print(f"  Total shard size: {total_shard_size:.1f} KB")
    print(f"  Immediate load: {core_size + fallback_size:.1f} KB (vs {9900} KB original)")
    print(f"  Performance gain: {((9900 - (core_size + fallback_size)) / 9900 * 100):.1f}% reduction in initial load")
    
    return {
        'core_data': core_data,
        'state_shards': state_shards,
        'fallback_data': fallback_data
    }

if __name__ == "__main__":
    try:
        result = optimize_dataset()
        print(f"\n✅ Success! Created optimized dataset structure")
        
        # Test our problem ZIP codes in core dataset
        core_data = result['core_data']
        print(f"\n🔍 Testing core dataset coverage:")
        test_zips = ['48505', '78701', '10001', '94102', '60601']
        
        for zip_code in test_zips:
            if zip_code in core_data:
                rpp = core_data[zip_code]['rpp_all']
                print(f"  {zip_code}: ✅ In core dataset (RPP: {rpp})")
            else:
                print(f"  {zip_code}: 📦 Requires state shard loading")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        exit(1)