# TheraPrice production forecasting pipeline

`production_pipeline.py` trains leakage-free price forecasts for every CSV in
`data/`. It uses only NumPy and pandas, so it can run while the optional Prophet,
SARIMA, and XGBoost dependencies are being installed.

Run from this directory:

```powershell
python production_pipeline.py
```

The pipeline:

1. validates positive, contiguous monthly data;
2. performs expanding-window backtests over recent history, reserving the final
   24 months as an untouched test period;
3. compares seasonal-naive, local-trend, seasonal-trend, and regularized
   autoregressive models - the autoregressive (`ridge_ar_*`) models are trained
   on lagged/seasonal price features **plus market-factor regressors** (see
   "Market factors" below);
4. selects the best model independently for horizons 1 through 12;
5. applies a recent-period promotion gate and falls back to seasonal-naive when
   the proposed selector does not beat that baseline;
6. refits selected models using all available history;
7. writes genuine future forecasts, empirical 80% intervals, backtest metrics,
   and JSON model artifacts to `production_output/`;
8. rolls the monthly forecasts up into a calendar-year summary.

The JSON files are transparent model artifacts suitable for loading into an API.
Price units and geographic coverage must be confirmed from the source datasets
before forecasts are shown in the application.

## Forecast horizon: 3 months (`HORIZON = 3`)

The pipeline forecasts 3 months ahead - with data through 2026-07-01, that's
Aug, Sep, and Oct 2026. This is intentionally short: forecast error compounds
with distance from the last observed price, so a 3-month horizon backtests
meaningfully more accurately than the previous 12-month one across every
commodity (e.g. bananas' test WAPE dropped from 4.5% to 1.4%, cocoyam from
18.1% to 9.8%). To forecast further out, raise `HORIZON` in
`production_pipeline.py` - the backtest and model-selection logic are
already per-horizon, so wider horizons train the same way, just with lower
accuracy and wider intervals the further out you go.

The source data in `data/` is monthly (one price per calendar month), so
that's the finest granularity the models can genuinely predict. There is no
daily or weekly price history to train on - a daily/weekly number would have
to be interpolated from the monthly forecast rather than independently
predicted, which this pipeline deliberately avoids to keep every number
traceable to a real prediction.

Two forecast granularities are produced per commodity:

* **Monthly** - `production_output/forecasts/<commodity>_future.csv`,
  `HORIZON` months ahead: `date`, `horizon_months`, `predicted_price`,
  `lower_80`, `upper_80`, `selected_model`.
* **Yearly** - `production_output/forecasts/<commodity>_yearly_future.csv`,
  the same monthly predictions rolled up by calendar year: `year`,
  `months_covered`, `partial_year`, `avg_predicted_price`, `avg_lower_80`,
  `avg_upper_80`, `min_predicted_price`, `max_predicted_price`. At
  `HORIZON = 3` this is a single partial 2026 row (`months_covered = 3`) -
  `months_covered`/`partial_year` make that explicit rather than presenting
  a 3-month average as a full-year figure. This is an aggregation of the
  monthly model's own predictions, not a separately fit yearly model.
  `production_output/forecasts/all_commodities_yearly_future.csv` combines
  the yearly file for every commodity into one table.

Run the automated checks after training:

```powershell
python -m unittest -v test_production_pipeline.py
```

## Market factors

`utils/factors.py` loads the exogenous data in `factors/` and aligns it
monthly to each commodity's price series:

* **Fuel prices** (`fuel_super`, `fuel_gasoil`, `fuel_lampant`,
  `fuel_composite`) are attached to **every** commodity, since transport and
  input costs are economy-wide. Yearly pump prices
  (`factors/petrol/`), broadcast to each month of that year (public and
  government-regulated, so there's no look-ahead risk).
* **FAO supply/demand indicators** (`sd_Production (t)`, `sd_Yield (kg/ha)`,
  `sd_Export quantity (t)`, `sd_Import quantity (t)`, `sd_Food supply
  quantity (kg/capita/yr) (kg/cap)`, from `factors/Dmand and
  Supply/cameroon_supply_demand_ML_ready.csv`) are attached only to the
  commodities with a confident name match - currently `cocoyam_fao`,
  `plantains_fao`, and `potatoes_fao` (see `SUPPLY_DEMAND_MAP`). Because FAO
  figures publish with a delay, the *previous* calendar year's value is
  used, to avoid leakage in the backtests.
* **XAF/USD exchange rate** (`xaf_per_usd`, `factors/exchange_rate/`) and
  **world benchmark prices** (`world_<commodity>_usd_per_t`,
  `factors/world_prices/`) are genuinely monthly series, sourced from FAO
  GIEWS FPMA market-price records, looked up with a 1-month lag to avoid
  leakage. Unlike fuel, these are attached only to commodities with a
  confident world-benchmark match (`WORLD_PRICE_MAP`) - `rice`,
  `wheat_flour`, `oil` (palm/vegetable oil), and `maize` - since Cameroon
  imports meaningful volumes of these and local prices track the world
  price plus the exchange rate. Backtesting confirmed the mechanism:
  attaching FX/world-price to domestically-grown, non-traded crops
  (plantains, potatoes, cassava, cocoyam, beans, bananas) added noise
  rather than signal, so it's deliberately withheld from those.
  Adding it to the four import-linked commodities improved backtested
  accuracy for three of them (rice test WAPE 6.6%→2.8%, oil 7.2%→3.6%,
  wheat flour 10.5%→3.9%; maize was roughly flat).
* The factors CSV contains a small number of corrupted, astronomically large
  cells (digit-repetition artifacts in plantain/onion Production, onion
  Import quantity, and potato Stock Variation for 2010-2023) that overflow to
  `inf` on parse. `utils/factors.py` treats these as missing and interpolates
  them from the surrounding years rather than letting them poison the model.
* `factors/dataset/*_ML_dataset_2007_2026.csv` duplicates the FAO
  supply/demand panel plus each product's own average price, so it isn't
  loaded separately - loading it as a feature would leak the price target.

Each commodity's `production_output/models/<commodity>_model.json` records
its `factor_columns` and includes them in `feature_definition`, so the
factor set used for every forecast is auditable.

`main.py`'s Prophet/SARIMA/ensemble pipeline uses the same
`utils.factors.build_exogenous_frame(commodity, dates)` helper: Prophet gets
the factor columns as `add_regressor` inputs, and SARIMA gets them as
`SARIMAX(..., exog=...)`.

