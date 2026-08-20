import unittest
from fastapi.testclient import TestClient

from backend.main import app
from backend.models import User


class BackendEndpointsTest(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_root_endpoint(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("status", response.json())

    def test_products_endpoint(self):
        response = self.client.get("/products")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

    def test_users_endpoint(self):
        response = self.client.get("/users")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

    def test_reviews_endpoint(self):
        response = self.client.get("/reviews")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

    def test_checkins_endpoint(self):
        response = self.client.get("/checkins/farmer-1")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

    def test_user_schema_includes_otp_fields(self):
        columns = User.__table__.columns.keys()
        self.assertIn("otp_code", columns)
        self.assertIn("otp_expires_at", columns)

    def test_model_forecast_endpoint_returns_monthly_confidence_and_reason(self):
        response = self.client.get("/forecast/rice?frequency=monthly&include_history=true")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["commodity"], "rice")
        self.assertEqual(body["frequency"], "monthly")
        self.assertGreater(len(body["forecast"]), 0)
        self.assertIn("confidence_score_percent", body["forecast"][0])
        self.assertIn("reason", body["forecast"][0])
        self.assertGreater(len(body["history"]), 0)

    def test_daily_forecast_discloses_monthly_provenance(self):
        response = self.client.get("/forecast/rice?frequency=daily")
        self.assertEqual(response.status_code, 200)
        forecast = response.json()["forecast"]
        self.assertGreater(len(forecast), 0)
        self.assertEqual(forecast[0]["source_frequency"], "derived_from_monthly_model")

    def test_forecast_threshold_alert_triggers_against_model_output(self):
        response = self.client.post(
            "/forecast-alerts",
            json={
                "user_id": "test-alert-user",
                "crop_name": "rice",
                "threshold_price": 1,
                "direction": "above",
                "frequency": "daily",
            },
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.json()["triggered"])


if __name__ == "__main__":
    unittest.main()
