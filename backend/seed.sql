-- Price predictions (must come first, produce_listings depends on this)
INSERT INTO price_predictions (crop_id, crop_name, region, current_price, direction, direction_change_percent, confidence_tier, confidence_percentage)
VALUES
  ('pred_garlic', 'garlic', 'Yaounde', 1800, 'Stable', 0, 'medium', 60),
  ('pred_tomatoes', 'tomatoes', 'Yaounde', 450, 'Falling', 8.5, 'high', 78),
  ('pred_onions', 'onions', 'Yaounde', 375, 'Stable', 0, 'medium', 55),
  ('pred_cocoyam', 'cocoyam', 'Yaounde', 2600, 'Rising', 5.2, 'low', 47),
  ('pred_plantains', 'plantains', 'Yaounde', 1200, 'Stable', 0, 'medium', 62),
  ('pred_irish_potato', 'irish_potato', 'Yaounde', 900, 'Rising', 3.1, 'medium', 58),
  ('pred_pepper', 'pepper', 'Yaounde', 2200, 'Stable', 0, 'low', 45),
  ('pred_okra', 'okra', 'Yaounde', 600, 'Falling', 4.0, 'medium', 60),
  ('pred_carrot', 'carrot', 'Yaounde', 700, 'Stable', 0, 'medium', 65),
  ('pred_ginger', 'ginger', 'Yaounde', 2500, 'Rising', 6.0, 'low', 50)
ON CONFLICT (crop_id) DO NOTHING;

-- Test farmer
INSERT INTO users (id, name, phone, email, role, location, farm_name, farm_size, verification_status, password_hash)
VALUES (
  'farmer_test_1', 'Jean Mbarga', '+237670000001', 'jean.mbarga@test.com',
  'farmer', 'Yaounde', 'Mbarga Farms', '2 hectares', 'verified', 'placeholder_hash'
)
ON CONFLICT (id) DO NOTHING;

-- 10 pilot products
INSERT INTO produce_listings (id, farmer_id, title, crop_type, category, price_xaf, unit, quantity_available, region, quality_grade, size, description, verification_status)
VALUES
  ('prod_garlic', 'farmer_test_1', 'Fresh Garlic', 'garlic', 'Spices', 1800, 'kg', 50, 'Yaounde', 'Grade A', 'Medium', 'Locally grown garlic, harvested this week', 'verified'),
  ('prod_tomatoes', 'farmer_test_1', 'Ripe Tomatoes', 'tomatoes', 'Vegetables', 450, 'basket', 30, 'Yaounde', 'Grade A', 'Medium', 'Fresh tomatoes from Mfoundi market region', 'verified'),
  ('prod_onions', 'farmer_test_1', 'Red Onions', 'onions', 'Vegetables', 375, 'kg', 40, 'Yaounde', 'Standard', 'Medium', 'Good quality onions', 'verified'),
  ('prod_cocoyam', 'farmer_test_1', 'Cocoyam', 'cocoyam', 'Tubers', 2600, 'basket', 25, 'Yaounde', 'Grade A', 'Large', 'Fresh cocoyam harvest', 'verified'),
  ('prod_plantains', 'farmer_test_1', 'Plantains', 'plantains', 'Fruits', 1200, 'bunch', 35, 'Yaounde', 'Grade A', 'Large', 'Sweet ripe plantains', 'verified'),
  ('prod_irish_potato', 'farmer_test_1', 'Irish Potatoes', 'irish_potato', 'Tubers', 900, 'kg', 45, 'Yaounde', 'Grade A', 'Medium', 'Locally grown Irish potatoes', 'verified'),
  ('prod_pepper', 'farmer_test_1', 'Fresh Pepper', 'pepper', 'Spices', 2200, 'kg', 15, 'Yaounde', 'Premium', 'Small', 'Spicy fresh pepper', 'verified'),
  ('prod_okra', 'farmer_test_1', 'Okra', 'okra', 'Vegetables', 600, 'basket', 20, 'Yaounde', 'Grade A', 'Small', 'Fresh okra', 'verified'),
  ('prod_carrot', 'farmer_test_1', 'Carrots', 'carrot', 'Vegetables', 700, 'kg', 30, 'Yaounde', 'Grade A', 'Medium', 'Sweet crunchy carrots', 'verified'),
  ('prod_ginger', 'farmer_test_1', 'Ginger', 'ginger', 'Spices', 2500, 'kg', 18, 'Yaounde', 'Premium', 'Small', 'Aromatic fresh ginger', 'verified')
ON CONFLICT (id) DO NOTHING;
