#!/usr/bin/env python3
"""
Create a sample dataset for development purposes.
This bypasses the complex BEA API integration and creates a smaller dataset
for testing the application functionality.
"""

import pandas as pd
import pathlib
import random

def create_sample_data():
    """Create a sample cost-of-living dataset for testing."""
    
    # Sample of major US cities with their ZIP codes and estimated RPP values
    sample_cities = [
        # Format: (ZIP, City, State, RPP_ALL, RPP_HOUSING, RPP_GOODS, RPP_OTHER)
        ("10001", "New York", "NY", 125.6, 168.5, 109.2, 118.3),
        ("90210", "Beverly Hills", "CA", 142.3, 189.2, 114.6, 127.8),
        ("60601", "Chicago", "IL", 108.9, 124.5, 101.8, 106.7),
        ("33101", "Miami", "FL", 111.4, 135.8, 102.3, 108.9),
        ("75201", "Dallas", "TX", 95.8, 102.1, 92.4, 97.2),
        ("30301", "Atlanta", "GA", 94.7, 98.9, 91.8, 96.5),
        ("19101", "Philadelphia", "PA", 106.2, 118.9, 98.7, 103.8),
        ("85001", "Phoenix", "AZ", 98.3, 108.4, 94.1, 99.2),
        ("98101", "Seattle", "WA", 118.7, 145.3, 106.2, 115.9),
        ("02101", "Boston", "MA", 117.5, 141.2, 105.8, 114.6),
        ("80201", "Denver", "CO", 104.8, 115.7, 99.2, 102.9),
        ("37201", "Nashville", "TN", 91.2, 94.8, 88.9, 93.1),
        ("73101", "Oklahoma City", "OK", 87.4, 85.2, 86.9, 89.8),
        ("68101", "Omaha", "NE", 89.6, 88.7, 88.2, 91.4),
        ("55401", "Minneapolis", "MN", 102.3, 109.8, 96.7, 101.2),
        ("63101", "St. Louis", "MO", 88.9, 86.4, 87.8, 91.5),
        ("70112", "New Orleans", "LA", 93.2, 96.8, 89.7, 94.6),
        ("84101", "Salt Lake City", "UT", 101.2, 107.9, 97.4, 100.8),
        ("29401", "Charleston", "SC", 99.7, 108.2, 95.1, 98.9),
        ("04101", "Portland", "ME", 105.6, 113.4, 100.2, 104.7),
        ("97201", "Portland", "OR", 109.8, 125.6, 102.1, 107.3),
        ("89101", "Las Vegas", "NV", 102.4, 114.2, 98.3, 101.9),
        ("32801", "Orlando", "FL", 97.8, 105.9, 93.4, 98.2),
        ("43201", "Columbus", "OH", 92.1, 89.7, 90.8, 94.3),
        ("46201", "Indianapolis", "IN", 89.3, 87.2, 88.1, 91.6),
        ("53201", "Milwaukee", "WI", 96.7, 101.2, 93.8, 97.9),
        ("28201", "Charlotte", "NC", 94.1, 97.8, 91.2, 95.4),
        ("23219", "Richmond", "VA", 98.9, 104.6, 95.2, 99.7),
        ("35203", "Birmingham", "AL", 86.7, 83.9, 85.4, 89.2),
        ("65101", "Jefferson City", "MO", 84.2, 81.7, 83.9, 86.8),
    ]
    
    # Create additional rural/suburban ZIP codes with lower cost of living
    rural_zips = []
    for i in range(50):
        zip_code = f"{random.randint(10000, 99999)}"
        rpp_all = random.uniform(78.0, 95.0)  # Rural areas typically lower
        rpp_housing = rpp_all * random.uniform(0.85, 1.15)
        rpp_goods = rpp_all * random.uniform(0.92, 1.08)
        rpp_other = rpp_all * random.uniform(0.90, 1.10)
        
        rural_zips.append((
            zip_code,
            f"Rural Area {i+1}",
            random.choice(["TX", "KS", "NE", "IA", "MO", "OK", "AR", "TN", "KY", "WV"]),
            rpp_all, rpp_housing, rpp_goods, rpp_other
        ))
    
    # Combine all data
    all_data = sample_cities + rural_zips
    
    # Create DataFrame
    df = pd.DataFrame(all_data, columns=[
        "zip", "city", "state", "rpp_all", "rpp_housing", "rpp_goods", "rpp_other"
    ])
    
    # Add county_fips and cbsa_code (mock data)
    df["county_fips"] = df["state"].apply(lambda x: f"{random.randint(10, 99)}{random.randint(100, 999)}")
    df["cbsa_code"] = df.apply(lambda x: f"{random.randint(10000, 99999)}" if x["city"] != "Rural Area" else "", axis=1)
    
    # Ensure output directory exists
    output_path = pathlib.Path("data/col_by_zip.csv")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Save to CSV
    df.to_csv(output_path, index=False)
    
    print(f"Created sample dataset with {len(df)} ZIP codes")
    print(f"Output: {output_path}")
    print("\nSample data:")
    print(df.head(10))
    
    return df

if __name__ == "__main__":
    create_sample_data()