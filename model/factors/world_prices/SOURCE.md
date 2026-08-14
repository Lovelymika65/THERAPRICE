# World benchmark commodity prices (`world_commodity_prices_monthly.csv`)

Monthly international benchmark prices in USD:

* `world_rice_usd_per_t` - Rice (5% broken)
* `world_wheat_usd_per_t` - Wheat (US No. 2, Hard Red Winter)
* `world_palm_oil_usd_per_t` - Palm oil (Crude, c.i.f. Rotterdam)
* `world_maize_usd_per_t` - Maize (US No. 2, Yellow)
* `world_crude_oil_usd_per_bbl` - Crude oil (Brent) - loaded but not
  currently mapped to any commodity in `WORLD_PRICE_MAP`

These are the same benchmark series used in the World Bank Commodity
Markets ("Pink Sheet") - e.g. rice 5% broken and US HRW wheat are Pink
Sheet's own rice/wheat benchmarks.

Source: FAO GIEWS Food Price Monitoring and Analysis (FPMA) tool,
international price series, via https://github.com/tezamo/FPMA
(all_commodity_standardized.csv, price_source == "International").
Retrieved 2026-08-14. Covers 2006-01 through 2026-01.
