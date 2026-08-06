import torch
import os
import numpy as np
import pandas as pd
import timesfm
torch.set_float32_matmul_precision("high")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(BASE_DIR, "cocoyam_yaounde_2016_2026.csv")
df = pd.read_csv(csv_path)
df = df.sort_values("date")
history = df["value"].astype(float).to_numpy()
if len(history) > 512:
    history = history[-512:]

model_repo = os.getenv("TIMESFM_MODEL_REPO", "google/timesfm-2p5-200M")
model_path = os.getenv("TIMESFM_MODEL_PATH")
model_token = os.getenv("HUGGINGFACE_HUB_TOKEN")
model_cache = os.getenv("HF_HOME")
local_only = os.getenv("TIMESFM_LOCAL_FILES_ONLY", "0").lower() in ("1", "true", "yes")

try:
    if model_path:
        model_source = model_path
        local_only = True
    else:
        model_source = model_repo

    print(f"Loading TimesFM model from {model_source}")
    model = timesfm.TimesFM_2p5_200M_torch.from_pretrained(
        model_source,
        token=model_token,
        cache_dir=model_cache,
        local_files_only=local_only,
    )
except Exception as e:
    raise RuntimeError(
        "Failed to load TimesFM model. "
        "If you are using a repo, set HUGGINGFACE_HUB_TOKEN and ensure repo access. "
        "If you have a local model, set TIMESFM_MODEL_PATH to the model directory or file."
    ) from e

model.compile(
    timesfm.ForecastConfig(
        max_context=512,
        max_horizon=12,
        normalize_inputs=True,
        use_continuous_quantile_head=True,
        force_flip_invariance=True,
        infer_is_positive=True,
        fix_quantile_crossing=True,
    )
)
point_forecast, quantile_forecast = model.forecast(
    12,
    [history],
)
print(point_forecast[0])
print(quantile_forecast[0])
