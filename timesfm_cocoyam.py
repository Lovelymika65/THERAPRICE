import pandas as pd
from timesfm import TimesFM_2p5_200M_torch
df = pd.read_csv("cocoyam_yaounde_2016_2026.csv")
df = df.sort_values("date")
history = df["value"].astype(float).tolist()
tfm = TimesFM_2p5_200M_torch(
    context_len=512,
    horizon_len=12,
    input_patch_len=32,
    output_patch_len=32,
    num_layers=20,
    model_dims=1280,
    backend="cpu"
)
forecast = tfm.forecast(
    input=[history],
    freq=12
)
print(forecast[0])
