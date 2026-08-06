import pandas as pd
from darts import TimeSeries
from darts.models import NaiveSeasonal, ARIMA, Prophet
from darts.metrics import mape, rmse, mae, smape
import matplotlib.pyplot as plt

# Load the cocoyam price data (2016 - Jul 2026, monthly, averaged across
# the 3 Yaoundé markets)
df = pd.read_csv("cocoyam_yaounde_2016_2026.csv")
series = TimeSeries.from_dataframe(df, time_col="date", value_cols="value")

# Same rolling backtest settings for every model, so results are directly
# comparable: train on the first half, then slide a 12-month forecast
# window forward one month at a time, retraining each time.
BACKTEST_SETTINGS = dict(
    start=0.5,
    forecast_horizon=12,
    stride=1,
    retrain=True,
    verbose=True,
)

models = {
    "Naive Seasonal": NaiveSeasonal(K=12),
    "SARIMA": ARIMA(p=1, d=1, q=1, seasonal_order=(1, 1, 1, 12)),
    "Prophet": Prophet(yearly_seasonality=True),
}

results = {}
forecasts = {}

for name, model in models.items():
    print(f"\n--- Running {name} ---")
    hf = model.historical_forecasts(series, **BACKTEST_SETTINGS)
    scores = {
        "MAPE": mape(series, hf),      # % error
        "sMAPE": smape(series, hf),    # % error, symmetric version
        "MAE": mae(series, hf),        # avg error in XAF (price units)
        "RMSE": rmse(series, hf),      # in XAF, punishes big misses harder
    }
    results[name] = scores
    forecasts[name] = hf
    print(f"{name}: MAPE={scores['MAPE']:.2f}%  sMAPE={scores['sMAPE']:.2f}%  "
          f"MAE={scores['MAE']:.1f} XAF  RMSE={scores['RMSE']:.1f} XAF")

# --- Build a table of actual vs forecast values, aligned by date ---
# Forecasts only start partway through (since start=0.5), so we find the
# overlapping date range where every model has produced a forecast.
comparison = series.pd_dataframe().rename(columns={"value": "actual"})

for name, hf in forecasts.items():
    hf_df = hf.pd_dataframe().rename(columns={"value": name})
    comparison = comparison.join(hf_df, how="left")

comparison = comparison.round(2)
comparison.to_csv("cocoyam_actual_vs_forecasts.csv")
print("\nSaved full actual-vs-forecast table to cocoyam_actual_vs_forecasts.csv")
print("\nLast 15 rows (most recent months, where all models have forecasts):")
print(comparison.tail(15).to_string())

# --- Summary table (ranked by MAPE) ---
print("\n=== Model Comparison (lower is better on every column) ===")
print(f"{'Model':20s} {'MAPE':>8s} {'sMAPE':>8s} {'MAE':>10s} {'RMSE':>10s}")
for name, scores in sorted(results.items(), key=lambda x: x[1]['MAPE']):
    print(f"{name:20s} {scores['MAPE']:7.2f}% {scores['sMAPE']:7.2f}% "
          f"{scores['MAE']:9.1f}  {scores['RMSE']:9.1f}")

# --- Combined plot ---
series.plot(label="actual")
for name, hf in forecasts.items():
    hf.plot(label=f"{name} forecast")
plt.legend()
plt.title("Cocoyam Prices: Model Comparison (Rolling Backtest)")
plt.show()
