import requests
import pandas as pd

# Yaoundé, Cameroon coordinates
LATITUDE = 3.8480
LONGITUDE = 11.5021

# NASA POWER API - free, no API key required
# PRECTOTCORR = bias-corrected total precipitation (mm/day, averaged per month)
url = "https://power.larc.nasa.gov/api/temporal/monthly/point"
params = {
    "parameters": "PRECTOTCORR",
    "community": "AG",
    "longitude": LONGITUDE,
    "latitude": LATITUDE,
    "start": "2016",
    "end": "2025",
    "format": "JSON",
}

print("Fetching rainfall data from NASA POWER...")
response = requests.get(url, params=params)
response.raise_for_status()
data = response.json()

# The API returns monthly values keyed like "201601", "201602", ..., plus
# a yearly average value we don't need (key ending in "13")
monthly_values = data["properties"]["parameter"]["PRECTOTCORR"]

rows = []
for key, value in monthly_values.items():
    year = key[:4]
    month = key[4:6]
    if month == "13":  # skip yearly average entries
        continue
    date = f"{year}-{month}-01"
    rows.append({"date": date, "rainfall_mm": value})

rainfall_df = pd.DataFrame(rows).sort_values("date")
rainfall_df.to_csv("yaounde_rainfall_2016_2026.csv", index=False)

print(f"Saved {len(rainfall_df)} months of rainfall data to yaounde_rainfall_2016_2026.csv")
print(rainfall_df.head())
print(rainfall_df.tail())
