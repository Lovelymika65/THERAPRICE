"""
factors.py

Loads the exogenous market-factor data in `factors/` - fuel pump prices,
FAO national supply & demand statistics, the XAF/USD exchange rate, and
world commodity benchmark prices - and aligns it to the monthly commodity
price series in `data/`, so it can be used as regressors by the forecasting
models (production_pipeline.py's ridge autoregression, and main.py's
Prophet/SARIMA pipeline).

Design notes
------------
* Fuel pump prices are government-regulated and public in real time, so the
  current calendar year's value is used directly (no leakage risk).
* FAO supply & demand statistics are published with a delay, so the
  *previous* calendar year's value is used as the feature for any given
  month, to avoid look-ahead leakage in the backtests.
* The XAF/USD exchange rate and world commodity benchmark prices (see
  "Exchange rate and world prices" below) are genuinely monthly series
  looked up with a 1-month lag for the same look-ahead-leakage reason.
  Unlike fuel, they're attached only to commodities with a confident
  world-benchmark match (`WORLD_PRICE_MAP`) - Cameroon's import-linked
  staples - since backtesting showed they add noise rather than signal for
  domestically-grown, non-traded crops.
* All factor sources only run through 2024-2026; forecast months beyond the
  last available period carry the last known value forward (a documented
  nowcast assumption, not a leak, since it uses only past information).
* Commodity file stems in `data/` don't always match the product names used
  in the supply & demand panel (e.g. "cocoyam_fao" vs "cocoyam"). Only
  commodities with a confident name match receive supply & demand features;
  every commodity receives the fuel-price feature since transport/input
  cost is economy-wide.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import numpy as np
import pandas as pd

FACTORS_DIR = Path(__file__).resolve().parent.parent / "factors"

# data/<stem>.csv  ->  product name used in cameroon_supply_demand_ML_ready.csv
SUPPLY_DEMAND_MAP = {
    "cocoyam_fao": "cocoyam",
    "plantains_fao": "plantain",
    "potatoes_fao": "potatoes",
}

SUPPLY_DEMAND_COLUMNS = [
    "Production (t)",
    "Yield (kg/ha)",
    "Export quantity (t)",
    "Import quantity (t)",
    "Food supply quantity (kg/capita/yr) (kg/cap)",
]

FUEL_FILES = {
    "fuel_super": "super_petrol_prices_2007_2026.csv",
    "fuel_gasoil": "gasoil_prices_2007_2026.csv",
    "fuel_lampant": "petrole_lampant_prices_2007_2026.csv",
}

# data/<stem>.csv -> world-benchmark price column in
# factors/world_prices/world_commodity_prices_monthly.csv. Only commodities
# with a confident match to a globally-traded benchmark get this feature -
# Cameroon imports most of its rice, wheat, and (palm/vegetable) cooking oil,
# and maize is also partly import-exposed, so local retail prices track the
# world price plus the exchange rate with a lag.
WORLD_PRICE_MAP = {
    "rice": "world_rice_usd_per_t",
    "wheat_flour": "world_wheat_usd_per_t",
    "oil": "world_palm_oil_usd_per_t",
    "maize": "world_maize_usd_per_t",
}


def _clean_year_series(frame: pd.DataFrame, value_column: str) -> pd.Series:
    """Index a yearly CSV by Year, coerce placeholder codes (e.g. 'DM' for
    'Donnees Manquantes') to NaN, and interpolate any gaps."""
    series = frame.set_index("Year")[value_column]
    series = pd.to_numeric(series.replace({"DM": np.nan}), errors="coerce")
    # A handful of cells in the source FAO panel contain corrupted
    # digit-repetition artifacts (e.g. "31823182...3182", thousands of
    # digits long - seen in plantain/onion Production, onion Import
    # quantity, and potato Stock Variation for 2010-2023) that parse as
    # syntactically valid but astronomically large numbers and overflow to
    # +inf. Treat those as missing so they're interpolated like any other
    # gap instead of poisoning every downstream feature and model.
    series = series.replace([np.inf, -np.inf], np.nan)
    series = series.sort_index()
    full_index = pd.RangeIndex(int(series.index.min()), int(series.index.max()) + 1)
    series = series.reindex(full_index)
    series = series.interpolate(limit_direction="both")
    return series


@lru_cache(maxsize=1)
def load_fuel_prices() -> pd.DataFrame:
    """Yearly pump price (FCFA/litre) for the three regulated fuel grades,
    plus a simple composite (their mean) as a general fuel-cost index."""
    columns = {}
    for name, filename in FUEL_FILES.items():
        path = FACTORS_DIR / "petrol" / filename
        frame = pd.read_csv(path)
        value_column = frame.columns[1]
        columns[name] = _clean_year_series(frame, value_column)
    fuel = pd.DataFrame(columns)
    fuel["fuel_composite"] = fuel.mean(axis=1)
    fuel.index.name = "year"
    return fuel


@lru_cache(maxsize=1)
def load_supply_demand() -> dict[str, pd.DataFrame]:
    """Yearly FAO supply & demand indicators keyed by product name."""
    path = FACTORS_DIR / "Dmand and Supply" / "cameroon_supply_demand_ML_ready.csv"
    long = pd.read_csv(path)
    by_product: dict[str, pd.DataFrame] = {}
    for product, group in long.groupby("product"):
        frame = group.set_index("year")[SUPPLY_DEMAND_COLUMNS].sort_index()
        frame = frame[~frame.index.duplicated(keep="last")]
        # See the note in _clean_year_series: a few cells in this panel are
        # corrupted digit-repetition artifacts that overflow to +inf when
        # parsed (notably plantain/onion Production, onion Import quantity,
        # and potato Stock Variation, 2010-2023). Drop them to NaN so they
        # get interpolated from the surrounding years instead of breaking
        # every model that consumes this factor.
        frame = frame.apply(pd.to_numeric, errors="coerce").replace([np.inf, -np.inf], np.nan)
        full_index = pd.RangeIndex(int(frame.index.min()), int(frame.index.max()) + 1)
        frame = frame.reindex(full_index)
        frame = frame.interpolate(limit_direction="both").ffill().bfill()
        frame.index.name = "year"
        by_product[str(product)] = frame
    return by_product


def available_supply_demand_products() -> list[str]:
    return sorted(load_supply_demand().keys())


@lru_cache(maxsize=1)
def load_exchange_rate() -> pd.DataFrame:
    """Monthly XAF/USD exchange rate, `fx_xaf_usd` (FCFA per US dollar).

    Derived from FAO GIEWS FPMA market-price records for Cameroon that
    report the same observation in both local currency (XAF) and USD: the
    implied rate (local / USD), averaged across all Cameroon commodities
    and markets reporting that month. This tracks the real XAF/USD history
    (~505 in Jan 2007 down through a low near 445 in early 2008, back up to
    a peak near 625 in early 2025, and ~560 in early 2026), consistent with
    published FX data, rather than being a synthetic or estimated series.
    """
    path = FACTORS_DIR / "exchange_rate" / "xaf_usd_monthly.csv"
    frame = pd.read_csv(path, parse_dates=["date"]).set_index("date").sort_index()
    return frame


@lru_cache(maxsize=1)
def load_world_prices() -> pd.DataFrame:
    """Monthly world benchmark commodity prices in USD (rice, wheat, palm
    oil, maize, crude oil), sourced from FAO GIEWS FPMA's international
    price series - the same benchmarks used in the World Bank Pink Sheet
    (e.g. rice 5% broken, US HRW wheat, Rotterdam c.i.f. crude palm oil)."""
    path = FACTORS_DIR / "world_prices" / "world_commodity_prices_monthly.csv"
    frame = pd.read_csv(path, parse_dates=["date"]).set_index("date").sort_index()
    return frame


def _yearly_to_monthly(yearly: pd.DataFrame, dates: pd.DatetimeIndex, lag_years: int = 0) -> pd.DataFrame:
    """Broadcast a year-indexed frame onto a monthly DatetimeIndex, clipping
    to the known year range so out-of-range months carry the nearest known
    year's value instead of producing NaNs."""
    lookup_years = np.clip(dates.year.to_numpy() - lag_years, int(yearly.index.min()), int(yearly.index.max()))
    monthly = yearly.reindex(lookup_years)
    monthly.index = dates
    return monthly


def _monthly_lookup(monthly: pd.DataFrame, dates: pd.DatetimeIndex, lag_months: int = 1) -> pd.DataFrame:
    """Align a month-indexed frame onto `dates` with an `lag_months` lookback
    (e.g. lag_months=1 means the value used for March is February's), to
    avoid look-ahead leakage. Clips to the known month range so dates before
    the first observation or beyond the last carry the nearest known
    month's value, instead of producing NaNs."""
    monthly = monthly.sort_index()
    known_keys = monthly.index.year * 12 + monthly.index.month
    key_to_position = {int(key): position for position, key in enumerate(known_keys)}
    min_key, max_key = int(known_keys.min()), int(known_keys.max())
    target_keys = np.clip(dates.year.to_numpy() * 12 + dates.month.to_numpy() - lag_months, min_key, max_key)
    positions = [key_to_position[key] for key in target_keys]
    result = monthly.iloc[positions].copy()
    result.index = dates
    return result


def build_exogenous_frame(commodity: str, dates: pd.DatetimeIndex) -> pd.DataFrame:
    """Build the monthly exogenous-feature frame aligned to `dates` for a
    given commodity (a `data/<commodity>.csv` file stem). Always includes
    fuel-price and exchange-rate features; includes FAO supply & demand
    features when the commodity has a confident name match in that panel,
    and a world-benchmark price feature when it has a confident match in
    `WORLD_PRICE_MAP`.
    """
    fuel = load_fuel_prices()
    frame = _yearly_to_monthly(fuel, dates, lag_years=0)

    product = SUPPLY_DEMAND_MAP.get(commodity)
    if product is not None:
        supply_demand = load_supply_demand().get(product)
        if supply_demand is not None:
            sd_monthly = _yearly_to_monthly(supply_demand, dates, lag_years=1)
            sd_monthly = sd_monthly.add_prefix("sd_")
            frame = frame.join(sd_monthly)

    # Unlike fuel (economy-wide transport/input cost), the exchange rate and
    # world benchmark price only have a direct transmission mechanism for
    # commodities Cameroon actually imports in volume. Attaching them to
    # domestically-grown, non-traded crops (plantains, potatoes, cassava,
    # cocoyam, beans, bananas) added noise rather than signal in backtesting
    # - so both are gated on the same WORLD_PRICE_MAP match.
    world_column = WORLD_PRICE_MAP.get(commodity)
    if world_column is not None:
        fx = load_exchange_rate()
        frame = frame.join(_monthly_lookup(fx, dates, lag_months=1))
        world_prices = load_world_prices()[[world_column]]
        frame = frame.join(_monthly_lookup(world_prices, dates, lag_months=1))

    frame = frame.astype(float)
    # Some FAO indicators (e.g. "Food supply quantity") are entirely unreported
    # for certain crops (cocoyam, garlic, ginger, okra) or "Yield" for onions -
    # interpolate/ffill/bfill inside load_supply_demand can't fix a column with
    # zero real observations. Guard here so models never receive NaN features:
    # any column still empty after the per-product cleaning is filled with 0.0,
    # which ridge regression treats as an uninformative (zero-variance) feature
    # rather than a training-breaking NaN.
    frame = frame.fillna(0.0)
    return frame
