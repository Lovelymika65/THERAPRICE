import pandas as pd
from darts import TimeSeries
from darts.models import XGBModel
from darts.metrics import mape
import matplotlib.pyplot as plt

# --- Load price data ---
df = pd.read_csv("c:\Users\ASUS\Desktop\THERAPRICE\Prediction model\yaounde_rainfall_2016_2026.csv")
series = TimeSeries.from_dataframe(df, time_col="date", value_cols="value")

# --- Load climate data (fetched via fetch_rainfall.py) ---
climate_df = pd.read_csv("yaounde_climate_2016_2026.csv")
covariates = TimeSeries.from_dataframe(
    climate_df,
    time_col="date",
    value_cols=["rainfall_mm", "temp_c", "humidity_pct", "soil_moisture"],
)

# Align both series to their overlapping date range
covariates = covariates.slice_intersect(series)
series_aligned = series.slice_intersect(covariates)

model = XGBModel(
    lags=12,                      # past 12 months of price
    lags_past_covariates=12,      # past 12 months of each climate variable
    add_encoders={
        "datetime_attribute": {"past": ["month"]}
    },
)

historical_forecasts = model.historical_forecasts(
    series_aligned,
    past_covariates=covariates,
    start=0.5,
    forecast_horizon=12,
    stride=1,
    retrain=True,
    verbose=True,
)

overall_mape = mape(series_aligned, historical_forecasts)
print(f"\nXGBoost + full climate data rolling backtest MAPE: {overall_mape:.2f}%")
print("Naive baseline was:            20.78%")
print("SARIMA was:                    22.52%")
print("Prophet was:                   16.28%")
print("XGBoost (price-only) was:      24.58%")
print("XGBoost + rainfall only was:   24.24%")

series_aligned.plot(label="actual")
historical_forecasts.plot(label="XGBoost + climate forecast")
plt.legend()
plt.title("Cocoyam Prices: Rolling Backtest (XGBoost + Full Climate Data)")
plt.show()
