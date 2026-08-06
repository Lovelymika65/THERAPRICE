import pandas as pd
from darts import TimeSeries
from darts.models import NaiveSeasonal, ARIMA, Prophet
from darts.metrics import mape
import matplotlib.pyplot as plt


df = pd.read_csv("cocoyam_yaounde_2016_2026.csv")
series = TimeSeries.from_dataframe(df, time_col="date", value_cols="value")


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
    score = mape(series, hf)
    results[name] = score
    forecasts[name] = hf
    print(f"{name} MAPE: {score:.2f}%")

# --- Summary table ---
print("\n=== MAPE Comparison (lower is better) ===")
for name, score in sorted(results.items(), key=lambda x: x[1]):
    print(f"{name:20s} {score:6.2f}%")

# --- Combined plot ---
series.plot(label="actual")
for name, hf in forecasts.items():
    hf.plot(label=f"{name} forecast")
plt.legend()
plt.title("Cocoyam Prices: Model Comparison (Rolling Backtest)")
plt.show()
