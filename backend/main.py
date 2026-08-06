from fastapi import FastAPI
app = FastAPI()
@app.get("/")
def read_root():
    return {"Sta": "Theraprice backend is running"}
FAKE_PRODUCTS = [
    {"id": 1, "name": "Tomatoes", "price": 450, "unit": "basket"},
    {"id": 2, "name": "Garlic", "price": 1800, "unit": "kg"},
    {"id": 3, "name": "Onions", "price": 375, "unit": "kg"},
    ]
@app.get("/products")
def get_products():
    return FAKE_PRODUCTS