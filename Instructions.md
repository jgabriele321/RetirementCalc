Retirement‑by‑ZIP Calculator — Detailed Project Plan

Version 1.0 · 18 July 2025

1 · Purpose & Scope

Build a mobile‑first static website that lets U.S. users compare how much they need to retire here vs there by adjusting spending for the cost‑of‑living of any 5‑digit ZIP code. All calculations run client‑side; data is bundled as static JSON.

2 · Information Architecture (IA)

UI Level

Item

Notes

Site

Single‑page app (SPA) at /

No additional routes needed; settings modal handled via hash #/settings if deep‑link desirable.

Top Nav

Logo · Settings ⚙︎

Sticky. Settings opens modal for withdrawal rate + inflation assumption.

Main Content

Input Card · Results Split Card

Stacked on mobile; side‑by‑side on ≥640 px.

Footer

Disclaimer · Data sources · GitHub link

Always visible.

Primary Entities & Relationships

UserScenario
 ├─ currentZip (string)
 ├─ targetZip  (string)
 ├─ retirementYears (int)
 ├─ spendBuckets  → SpendingBuckets
 └─ assumptions   → Assumptions

SpendingBuckets
 ├─ housing   (USD / month)
 ├─ groceries (USD / month)
 ├─ health    (USD / month)
 └─ other     (USD / month)

Assumptions
 ├─ withdrawalRate (decimal, default 0.04)
 └─ inflationRate  (decimal, fixed 0.025)

3 · Data Architecture

3.1 Datasets

col_by_zip.json ← generated from col_by_zip.csv (≈220 kB)

Keys: 5‑digit ZIP (string)

Values: { rpp_all, rpp_housing, rpp_goods, rpp_other, state, cbsa_code }

[Optional] median_home_prices.json, fair_market_rent.json (future‑proof) — not in v1.

3.2 Computation Pipeline (client‑side)

lookup(currentZip)   → currentRpp
lookup(targetZip)    → targetRpp
colRatio = targetRpp.rpp_all / currentRpp.rpp_all
inflatedSpendAtRetire = Σ(buckets) × (1 + inflationRate)^retirementYears × colRatio
nestEggNeeded = inflatedSpendAtRetire / withdrawalRate

Missing ZIP handling: fall back to nearest CBSA or state non‑metro RPP; show yellow banner.

4 · Project Structure

retire‑by‑zip/
├─ scripts/
│   └─ build_cost_of_living_dataset.py
├─ data/
│   ├─ col_by_zip.csv   # raw
│   └─ col_by_zip.json  # bundled
├─ src/
│   ├─ assets/
│   │   └─ logo.svg
│   ├─ components/
│   │   ├─ InputCard.tsx
│   │   ├─ BucketInput.tsx
│   │   ├─ ZipAutocomplete.tsx
│   │   ├─ ResultsPanel.tsx
│   │   ├─ Badge.tsx
│   │   └─ SettingsModal.tsx
│   ├─ hooks/
│   │   └─ useCostOfLiving.ts
│   ├─ context/
│   │   └─ ScenarioContext.tsx
│   ├─ pages/
│   │   └─ App.tsx
│   ├─ styles/
│   │   └─ tailwind.css
│   ├─ utils/
│   │   └─ calculations.ts
│   └─ index.tsx
├─ public/
│   └─ col_by_zip.json
├─ .github/
│   └─ workflows/deploy.yml  # Netlify/Vercel CI
├─ vite.config.ts
├─ tailwind.config.ts
└─ README.md

Color tokens defined in tailwind.config.ts under theme.extend.colors:

sand:  '#F8F5F2',
dark:  '#0D1B2A',
accentRed:   '#C63D2F',
accentGreen: '#3AAA35',

5 · Core Functionality

ZIP Autocomplete (current & target) – fuzzy search on 42k ZIPs; offline list.

Bucket Inputs – four number–input rows with USD formatting and responsive labels.

Retirement Slider – 0‑50 years until retirement.

Settings Modal – editable withdrawal rate; inflation rate fixed but displayed.

Real‑time Calculation – recompute on input debounce (300 ms); display:

Monthly spend at retirement (here / there)

Required nest‑egg (here / there)

Red/green badge (“On track” requires user savings input — v2)

Missing ZIP Handler – toast notice + fallback index.

Theme – light minimalist; dark mode opt‑in via OS prefers‑color‑scheme (optional v1.1).

Accessibility – semantic HTML; focus‑traps in modal.

Analytics – none.

Deployment – Git push auto‑deploy to Netlify edge; CDN caching of JSON.

6 · Step‑by‑Step Implementation Plan

Phase 0 · Project Kick‑off (0.5 day)

Create private GitHub repo retire-by-zip.

Copy project plan & script into repo.

Add MIT License & CODEOWNERS.

Phase 1 · Data Build & Verification (1 day)

Sign up for BEA API key.

python scripts/build_cost_of_living_dataset.py → produce col_by_zip.csv.

csvjson col_by_zip.csv > public/col_by_zip.json (or small node script).

Spot‑check 5 random ZIPs against BEA RPP tables for accuracy.

Commit both CSV and JSON (they’re <1 MB). Tag data‑v1.

Phase 2 · Front‑End Scaffold (1 day)

npm create vite@latest retire-by-zip -- --template react-ts.

Install Tailwind 3: npm i -D tailwindcss postcss autoprefixer & init config.

Configure custom colors in tailwind.config.ts.

Clean default boilerplate; render <App /> with placeholder text.

Push; verify Netlify CI builds and deploys.

Phase 3 · Data Layer (0.5 day)

Create useCostOfLiving.ts hook: fetch & cache col_by_zip.json via fetch() at app mount.

Provide lookupZip(zip) util handling missing ZIP fallback.

Unit‑test with Vitest.

Phase 4 · Input Components (1 day)

Build ZipAutocomplete using radix‑ui Combobox + down‑shift or plain list search.

Build BucketInput rows with react-number-format (or custom) for USD.

Add RetirementSlider (range input 0‑50).

Compose inside InputCard; wire form state via React Context.

Phase 5 · Calculation Logic (0.5 day)

Implement calculations.ts exporting computeScenario(state): Result.

Memoize with useMemo; debounce inputs.

Unit‑test edge cases (division‑by‑zero, missing ZIP).

Phase 6 · Results UI (1 day)

Create ResultsPanel → flex container with two cards.

Show breakdown table and headline nest‑egg figure.

Conditionally color delta text (green if target < current, red if opposite).

Add badge: On Track / Needs X $ (v1 shows “Calculation only” if savings not supplied).

Phase 7 · Settings Modal (0.5 day)

Use Radix Dialog; include withdrawal‑rate input.

Persist modal state in localStorage (optional).

Phase 8 · Polish & QA (1 day)

Mobile viewport tweaks (>375 px).

Lighthouse pass > 92 on performance & a11y.

Keyboard nav, focus trapping, ARIA labels.

Favicon, meta tags, OpenGraph image.

Phase 9 · Launch (0.5 day)

Bump version to v1.0.0.

Merge dev into main; Netlify production deploy.

Smoke test live site; tweet/announce.

Phase 10 · Maintenance (ongoing, ~quarterly)

Run data build script → commit new JSON (data‑vX).

Dependabot security updates.

Monitor Netlify build logs.

7 · Future Enhancements (Backlog)

Savings Progress Bar – user enters current portfolio & monthly contribution → Monte Carlo.

Multi‑ZIP Comparison – compare up to 5 locations.

Dark Mode – Tailwind dark: variants.

County‑level MIT Living Wage merge for granular groceries & healthcare split.

Tax overlay – state income + property tax estimate.

PWA installability – offline caching of JSON & app shell.

Disclaimer: This tool is for educational purposes only and does not constitute financial advice. All calculations are estimates.


Sample code for getting data

"""
build_cost_of_living_dataset.py  ·  v0.1  ·  July 2025
====================================================
Creates a *lightweight* U.S. cost‑of‑living lookup table at the 5‑digit ZIP level
for use in your retirement‑by‑ZIP calculator.

Data sources (all public/free):
• **BEA Regional Price Parities (RPP)** – 2024 release (All‑items, Housing/Rents,
  Goods, Other) by State & Metropolitan Statistical Area (MSA) –
  https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area
• **HUD‑USPS ZIP⇄County/CBSA Crosswalk** – 2025 Q1 –
  https://www.huduser.gov/portal/datasets/usps_crosswalk.html

The script does *not* redistribute either dataset. It downloads the most recent
files directly from the official sources at run‑time under their open‑data terms.

Output
------
A single CSV (≈ 220 KB) named **col_by_zip.csv** with columns:
    zip           – 5‑digit ZIP (string)
    state         – 2‑letter state/territory
    county_fips   – 5‑digit FIPS
    cbsa_code     – 5‑digit metropolitan/micropolitan code (nullable)
    rpp_all       – All‑items price parity (100 = US average)
    rpp_housing   – Housing‑rents component
    rpp_goods     – Goods component
    rpp_other     – Other services component

Approximation notes
-------------------
• RPP is published at the CBSA *or* state‑nonmetro level. We forward‑fill each
  ZIP by its CBSA (if available) else by its state‑nonmetro value.
• No separate county adjustment is attempted. Good enough for
  ˜"best‑guess estimates".
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
OUTPUT_CSV = pathlib.Path("col_by_zip.csv")
BEA_API_KEY = os.environ.get("BEA_API_KEY")

# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------

def bea_request(dataset: str, table: str, year: int = 2024) -> pd.DataFrame:
    """Pull one BEA table via API into a DataFrame."""
    if not BEA_API_KEY:
        raise RuntimeError("Set BEA_API_KEY in your env.")
    params = {
        "UserID": BEA_API_KEY,
        "method": "GetData",
        "datasetname": dataset,
        "TableName": table,
        "Year": str(year),
        "LineCode": 1,  # 'All items'; 2=Goods, 3=Rents, 4=Other services
        "GeoFips": "*",
    }
    url = "https://apps.bea.gov/api/data"
    r = requests.get(url, params=params, timeout=40)
    r.raise_for_status()
    data = r.json()["BEAAPI"]["Results"]["Data"]
    df = pd.DataFrame(data)
    # Standardize cols
    df.rename(columns={"GeoFIPS": "geo", "DataValue": "value"}, inplace=True)
    df["value"] = pd.to_numeric(df["value"], errors="coerce")
    return df


def load_rpp(year: int = 2024) -> pd.DataFrame:
    """Return wide RPP table (geo×component)."""
    components = {
        "RPPALL": "rpp_all",
        "RPPGOODS": "rpp_goods",
        "RPPRENTS": "rpp_housing",
        "RPPOTHER": "rpp_other",
    }
    df_list = []
    for tbl, col in components.items():
        part = bea_request("Regional", tbl, year)
        part = part[["geo", "value"]].rename(columns={"value": col})
        df_list.append(part)
    merged = df_list[0]
    for part in df_list[1:]:
        merged = merged.merge(part, on="geo", how="outer")
    return merged


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
    return local_zip


def build_lookup() -> pd.DataFrame:
    print("Loading BEA RPP …")
    rpp = load_rpp()

    print("Loading HUD crosswalk …")
    xwalk_zip = download_hud_crosswalk()
    with zipfile.ZipFile(xwalk_zip) as zf:
        csv_name = [n for n in zf.namelist() if n.endswith(".csv")][0]
        with zf.open(csv_name) as f:
            xwalk = pd.read_csv(f, dtype={"ZIP": str, "RES_RATIO": float, "COUNTY": str, "STATE": str, "CBSA": str})

    # Keep highest RES_RATIO row per ZIP (dominant county)
    xwalk.sort_values(["ZIP", "RES_RATIO"], ascending=[True, False], inplace=True)
    xwalk = xwalk.groupby("ZIP", as_index=False).first()

    # Join RPP via CBSA first, fallback to state‑nonmetro (geo codes start with state FIPS)
    rpp["geo"] = rpp["geo"].str.zfill(5)
    zip_df = xwalk.merge(rpp, left_on="CBSA", right_on="geo", how="left", suffixes=("", "_msa"))

    # Fallback where CBSA missing → use state geo code (two‑digit FIPS)
    need_state = zip_df[zip_df["rpp_all"].isna()].copy()
    if not need_state.empty:
        need_state["state_fips"] = need_state["COUNTY"].str[:2]
        state_rpp = rpp[rpp["geo"].str.len() == 2].rename(columns={"geo": "state_fips"})
        need_state = need_state.drop(columns=[c for c in ["rpp_all", "rpp_goods", "rpp_housing", "rpp_other"]])
        need_state = need_state.merge(state_rpp, on="state_fips", how="left")
        zip_df.update(need_state)

    # Final tidy
    out = zip_df[[
        "ZIP", "STATE", "COUNTY", "CBSA", "rpp_all", "rpp_housing", "rpp_goods", "rpp_other"
    ]].rename(columns={
        "ZIP": "zip",
        "STATE": "state",
        "COUNTY": "county_fips",
        "CBSA": "cbsa_code",
    })

    print(f"Writing {OUTPUT_CSV} … ({len(out):,} rows)")
    out.to_csv(OUTPUT_CSV, index=False)
    return out


if __name__ == "__main__":
    df = build_lookup()
    print(df.head())
