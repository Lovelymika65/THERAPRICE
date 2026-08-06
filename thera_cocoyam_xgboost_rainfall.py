import pandas as pd
from darts import TimeSeries
from darts.models import XGBModel
from darts.metrics import mape
import matplotlib.pyplot as plt

# --- Load price data ---
df = pd.read_csv("cocoyam_yaounde_2016_2026.csv")
series = TimeSeries.from_dataframe(df, time_col="date", value_cols="value")

# --- Load rainfall data (fetched separately via fetch_rainfall.py) ---
rain_df = pd.read_csv("yaounde_rainfall_2016_2026.csv")
rainfall = TimeSeries.from_dataframe(rain_df, time_col="date", value_cols="rainfall_mm")

# Align rainfall to the same time range as the price series
rainfall = rainfall.slice_intersect(series)
series_aligned = series.slice_intersect(rainfall)

model = XGBModel(
    lags=12,                      # past 12 months of price
    lags_past_covariates=12,      # past 12 months of rainfall
    add_encoders={
        "datetime_attribute": {"past": ["month"]}
    },
)

historical_forecasts = model.historical_forecasts(
    series_aligned,
    past_covariates=rainfall,
    start=0.5,
    forecast_horizon=12,
    stride=1,
    retrain=True,
    verbose=True,
)

overall_mape = mape(series_aligned, historical_forecasts)
print(f"\nXGBoost + rainfall rolling backtest MAPE: {overall_mape:.2f}%")
print("Naive baseline was:        20.78%")
print("SARIMA was:                22.52%")
print("Prophet was:               16.28%")
print("XGBoost was:  24.58%")

series_aligned.plot(label="actual")
historical_forecasts.plot(label="XGBoost + rainfall forecast")
plt.legend()
plt.title("Cocoyam Prices: Rolling Backtest (XGBoost + Rainfall)")
plt.show()
