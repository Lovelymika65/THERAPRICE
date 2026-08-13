import pandas as pd
from darts import TimeSeries
from darts.models import NaiveSeasonal
from darts.metrics import mape
import matplotlib.pyplot as plt

# Load the cleaned cocoyam price data (2016 - Jul 2026, monthly, averaged
# across the 3 Yaoundé markets)
df = pd.read_csv("cocoyam_yaounde_2016_2026.csv")
series = TimeSeries.from_dataframe(df, time_col="date", value_cols="value")

model = NaiveSeasonal(K=12)

# Rolling backtest: instead of one single train/test split, this slides a
# 12-month forecast window across the whole series, retraining each time.
# start=0.5 means the first backtest window begins halfway through the data
# (so the model always has some history to learn from before its first test).
# forecast_horizon=12 means each window predicts 12 months ahead.
# stride=1 means it moves forward 1 month and repeats, generating many
# overlapping tests instead of just one.
historical_forecasts = model.historical_forecasts(
    series,
    start=0.5,
    forecast_horizon=12,
    stride=1,
    retrain=True,
    verbose=True,
)

# This gives ONE overall MAPE, averaged across every rolling window,
# rather than one score that depends on which single window you picked.
overall_mape = mape(series, historical_forecasts)
print(f"Rolling backtest MAPE (averaged across all windows): {overall_mape:.2f}%")

series.plot(label="actual")
historical_forecasts.plot(label="rolling naive forecast")
plt.legend()
plt.title("Cocoyam Prices: Rolling Backtest (Naive Seasonal)")
plt.show()
