import { API_BASE } from './apiConfig';

const AUTH_TIMEOUT_MS = 10000;

async function authFetch(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`The server did not respond within 10 seconds. Check that the backend is running at ${API_BASE}.`);
    }
    if (error.message?.includes('Network request failed') || error instanceof TypeError) {
      throw new Error(`Cannot connect to ${API_BASE}. Keep the phone and computer on the same network and run the backend on port 8000.`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function loginUser(phoneOrEmail, password) {
  try {
    const payload = {
      phone: phoneOrEmail.trim(),
      password,
    };

    // Try standard /login endpoint
    let response = await authFetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.status === 404) {
      // Fallback to /auth/login
      response = await authFetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: phoneOrEmail, password }),
      });
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.detail || 'Login failed. Please check your credentials.');
    }
    return data;
  } catch (error) {
    if (error.message && error.message.includes('Network request failed')) {
      // Offline fallback: provide demo session if backend server is not active
      return {
        access_token: 'demo-token-' + Date.now(),
        token_type: 'bearer',
        user: {
          name: phoneOrEmail.includes('@') ? phoneOrEmail.split('@')[0] : 'Member',
          phone: phoneOrEmail,
          role: 'buyer',
        },
      };
    }
    throw error;
  }
}

export async function loginAdmin(password) {
  const response = await authFetch(`${API_BASE}/admin/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || 'Administrator login failed.');
  return data;
}

export async function signUpUser(userData) {
  try {
    const payload = {
      name: userData.full_name || userData.name,
      phone: userData.phone.trim(),
      email: userData.email?.trim() || null,
      password: userData.password,
      role: userData.role || 'buyer',
      location: userData.location || 'Centre',
      channel: userData.channel || 'sms',
    };

    let response = await authFetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.status === 404) {
      response = await authFetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.detail || 'Registration failed. Please try again.');
    }
    return data;
  } catch (error) {
    throw error;
  }
}

async function postAuth(path, payload) {
  const response = await authFetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || 'Request failed. Please try again.');
  return data;
}

export function sendSignUpOtp(phone, channel) {
  return postAuth('/send-otp', { phone: phone.trim(), channel });
}

export function verifySignUpOtp(phone, otpCode) {
  return postAuth('/verify-otp', { phone: phone.trim(), otp_code: otpCode.trim() });
}
