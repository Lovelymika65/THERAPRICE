import requests
import pandas as pd

# Yaoundé, Cameroon coordinates
LATITUDE = 3.8480
LONGITUDE = 11.5021

# NASA POWER API - free, no API key required
# PRECTOTCORR = precipitation, T2M = avg temperature, RH2M = humidity,
# GWETROOT = root-zone soil moisture (proxy for actual growing conditions)
url = "https://power.larc.nasa.gov/api/temporal/monthly/point"
params = {
    "parameters": "PRECTOTCORR,T2M,RH2M,GWETROOT",
    "community": "AG",
    "longitude": LONGITUDE,
    "latitude": LATITUDE,
    "start": "2016",
    "end": "2025",
    "format": "JSON",
}

print("Fetching climate data from NASA POWER (rainfall, temp, humidity, soil moisture)...")
response = requests.get(url, params=params)
response.raise_for_status()
data = response.json()

parameters = data["properties"]["parameter"]
all_rows = {}

for param_name, monthly_values in parameters.items():
    for key, value in monthly_values.items():
        year = key[:4]
        month = key[4:6]
        if month == "13":  # skip yearly average entries
            continue
        date = f"{year}-{month}-01"
        all_rows.setdefault(date, {})[param_name] = value

rows = [{"date": date, **values} for date, values in all_rows.items()]
climate_df = pd.DataFrame(rows).sort_values("date").rename(columns={
    "PRECTOTCORR": "rainfall_mm",
    "T2M": "temp_c",
    "RH2M": "humidity_pct",
    "GWETROOT": "soil_moisture",
})
climate_df.to_csv("yaounde_climate_2016_2026.csv", index=False)

print(f"Saved {len(climate_df)} months of climate data to yaounde_climate_2016_2026.csv")
print(climate_df.head())
print(climate_df.tail())
