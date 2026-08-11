import unittest
from fastapi.testclient import TestClient

from backend.main import app


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


if __name__ == "__main__":
    unittest.main()
