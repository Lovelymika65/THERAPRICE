import pandas as pd
from darts import TimeSeries
from darts.models import NaiveSeasonal
from darts.metrics import mape
df = pd.read_csv("cocoyam_yaounde_2016_2026.csv")
series = TimeSeries.from_dataframe(df, time_col="date", value_cols="value")
train, test = series[:-36], series[-36:]
model = NaiveSeasonal(K=12)
model.fit(train)
forecast = model.predict(n=36)
print(f"MAPE: {mape(test, forecast):.2f}%")
series.plot(label="actual")
forecast.plot(label="naive forecast")
import matplotlib.pyplot as plt
plt.legend()
plt.title("Cocoyam prices: Actual vs Naive Forecast")
plt.show()
