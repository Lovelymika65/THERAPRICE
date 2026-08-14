import json
import tempfile
import unittest
from pathlib import Path

import numpy as np
import pandas as pd

import production_pipeline as pipeline


class ProductionPipelineTests(unittest.TestCase):
    def test_all_source_series_are_valid_monthly_data(self):
        data_dir = Path(__file__).parent / "data"
        files = sorted(data_dir.glob("*.csv"))
        self.assertEqual(10, len(files))
        for path in files:
            series = pipeline.load_series(path)
            self.assertEqual(235, len(series), path.name)
            self.assertTrue((series > 0).all(), path.name)

    def test_training_produces_future_dates_and_valid_intervals(self):
        source = Path(__file__).parent / "data" / "rice.csv"
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            summary = pipeline.train_commodity(source, output)
            forecast = pd.read_csv(output / "forecasts" / "rice_future.csv")
            artifact = json.loads((output / "models" / "rice_model.json").read_text())
            self.assertEqual(3, len(forecast))
            self.assertEqual("2026-08-01", forecast.iloc[0]["date"])
            self.assertEqual("2026-10-01", forecast.iloc[-1]["date"])
            self.assertTrue(np.isfinite(forecast["predicted_price"]).all())
            self.assertTrue((forecast["predicted_price"] > 0).all())
            self.assertTrue((forecast["lower_80"] <= forecast["predicted_price"]).all())
            self.assertTrue((forecast["predicted_price"] <= forecast["upper_80"]).all())
            self.assertEqual(summary["commodity"], artifact["summary"]["commodity"])

    def test_market_factors_are_wired_into_the_model_artifacts(self):
        source = Path(__file__).parent / "data" / "cocoyam_fao.csv"
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            summary = pipeline.train_commodity(source, output)
            artifact = json.loads((output / "models" / "cocoyam_fao_model.json").read_text())
            factor_columns = summary["factor_columns"]
            # Fuel prices apply economy-wide; FAO supply/demand indicators
            # are only attached when the commodity has a confident match
            # (cocoyam_fao does - see utils/factors.SUPPLY_DEMAND_MAP).
            self.assertIn("fuel_composite", factor_columns)
            self.assertTrue(any(name.startswith("sd_") for name in factor_columns))
            for name in factor_columns:
                self.assertIn(name, artifact["feature_definition"])
            for model in artifact["models"].values():
                if model["type"] == "ridge_ar":
                    self.assertEqual(len(model["coefficients"]), len(artifact["feature_definition"]) + 1)

    def test_commodity_without_supply_demand_or_world_price_match_still_gets_fuel_factor(self):
        source = Path(__file__).parent / "data" / "beans_fao.csv"
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            summary = pipeline.train_commodity(source, output)
            self.assertEqual(
                summary["factor_columns"],
                ["fuel_super", "fuel_gasoil", "fuel_lampant", "fuel_composite"],
            )

    def test_import_linked_commodity_gets_world_price_and_fx_factors(self):
        source = Path(__file__).parent / "data" / "rice.csv"
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            summary = pipeline.train_commodity(source, output)
            self.assertIn("xaf_per_usd", summary["factor_columns"])
            self.assertIn("world_rice_usd_per_t", summary["factor_columns"])

    def test_yearly_aggregate_covers_the_full_horizon_and_flags_partial_years(self):
        source = Path(__file__).parent / "data" / "rice.csv"
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            pipeline.train_commodity(source, output)
            monthly = pd.read_csv(output / "forecasts" / "rice_future.csv")
            yearly = pd.read_csv(output / "forecasts" / "rice_yearly_future.csv")
            # 3 forecast months (Aug-Oct 2026), all within a single partial year.
            self.assertEqual(1, len(yearly))
            self.assertEqual(len(monthly), yearly["months_covered"].sum())
            self.assertTrue(yearly["partial_year"].all())
            for _, row in yearly.iterrows():
                self.assertTrue(row["min_predicted_price"] <= row["avg_predicted_price"] <= row["max_predicted_price"])
                self.assertTrue(row["avg_lower_80"] <= row["avg_predicted_price"] <= row["avg_upper_80"])

    def test_deployed_strategy_never_loses_promotion_gate_to_baseline(self):
        summary_path = Path(__file__).parent / "production_output" / "training_summary.csv"
        summary = pd.read_csv(summary_path)
        self.assertTrue(
            (summary["test_wape"] <= summary["seasonal_naive_test_wape"] + 1e-9).all()
        )


if __name__ == "__main__":
    unittest.main()
