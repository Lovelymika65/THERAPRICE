import { API_BASE } from './apiConfig';

export const DISPLAY_NAMES = {
  bananas: 'Bananas',
  beans_fao: 'Beans',
  cassava_fao: 'Cassava',
  cocoyam_fao: 'Cocoyam',
  maize: 'Maize',
  oil: 'Cooking oil',
  plantains_fao: 'Plantains',
  potatoes_fao: 'Potatoes',
  rice: 'Rice',
  wheat_flour: 'Wheat flour',
};

export const PRODUCT_TO_MODEL = {
  'cocoyams': 'cocoyam_fao',
  'maize': 'maize',
  'fresh plantains (green/ripe)': 'plantains_fao',
};

export const formatMoney = (value) => {
  const num = Number(value);
  return `${Math.round(isNaN(num) ? 0 : num).toLocaleString()} FCFA`;
};

async function request(path) {
  try {
    const response = await fetch(`${API_BASE}${path}`);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.detail || `Forecast API returned status ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    if (error.message.includes('Network request failed')) {
      throw new Error('Unable to connect to backend server. Ensure backend is running on port 8000.');
    }
    throw error;
  }
}

export async function fetchCrops() {
  return request('/forecast/crops');
}

export async function fetchForecast(stem) {
  const [monthly, weekly, daily, yearly] = await Promise.all([
    request(`/forecast/${encodeURIComponent(stem)}?frequency=monthly&include_history=true`),
    request(`/forecast/${encodeURIComponent(stem)}?frequency=weekly`),
    request(`/forecast/${encodeURIComponent(stem)}?frequency=daily`),
    request(`/forecast/${encodeURIComponent(stem)}?frequency=yearly`),
  ]);

  return {
    stem,
    monthly: monthly.forecast || [],
    history: monthly.history || [],
    weekly: weekly.forecast || [],
    daily: daily.forecast || [],
    yearly: yearly.forecast || [],
    model: monthly.model || {},
    viewNotes: monthly.view_notes || {},
  };
}

export async function createForecastAlert(userId, cropName, threshold, direction) {
  try {
    const response = await fetch(`${API_BASE}/forecast-alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        crop_name: cropName,
        threshold_price: threshold,
        direction,
        frequency: 'daily',
      }),
    });
    
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.detail || 'Unable to create price alert');
    }
    return data;
  } catch (error) {
    throw new Error(error.message || 'Failed to submit forecast alert.');
  }
}
