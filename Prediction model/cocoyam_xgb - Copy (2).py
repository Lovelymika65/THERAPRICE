import pandas as pd
from darts import TimeSeries
from darts.models import XGBModel
from darts.metrics import mape
import matplotlib.pyplot as plt

df = pd.read_csv("cocoyam_yaounde_2016_2026.csv")
series = TimeSeries.from_dataframe(df, time_col="date", value_cols="value")
model = XGBModel(
    lags=12,
    lags_future_covariates=12,
    add_encoders={
        "datetime_attribute": {"past": ["month"]}
    },
)
model.fit(series)
historical_forecasts = model.historical_forecasts(
    series,
    start=0.5,
    forecast_horizon=12,
    stride=1,
    retrain=True,
    verbose=True,
)
overall_mape = mape(series, historical_forecasts)
print(f"XGBModel (MVP, price-only) rolling backtest MAPE : {overall_mape:.2f}%")
print("Naive baseline was: 20.78%")
print("SAMIRA was: 22.52%")
print("Prophet was: 16.28%")

series.plot(label="actual")
historical_forecasts.plot(label="XGBMODEL rolling forecast")
plt.legend()
plt.title("Cocoyam Prices: Rolling Backtest (XGBModel)")
plt.show()

