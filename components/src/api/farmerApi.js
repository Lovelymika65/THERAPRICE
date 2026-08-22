import { API_BASE } from './apiConfig';

async function authenticatedRequest(path, token, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || 'Unable to load farmer information.');
  return data;
}

export function fetchMyListings(token) {
  return authenticatedRequest('/me/listings', token);
}

export function fetchMyOrders(token) {
  return authenticatedRequest('/me/orders', token);
}

export function createMyListing(token, listing) {
  return authenticatedRequest('/products', token, {
    method: 'POST',
    body: JSON.stringify(listing),
  });
}

export function submitFarmerVerification(token, verification) {
  return authenticatedRequest('/me/farmer-verification', token, {
    method: 'POST',
    body: JSON.stringify(verification),
  });
}

export function fetchCurrentUser(token) {
  return authenticatedRequest('/me', token);
}

export function fetchFarmerVerificationQueue(token) {
  return authenticatedRequest('/admin/farmer-verifications', token);
}

export function decideFarmerVerification(token, farmerId, approved, rejectionReason = null) {
  return authenticatedRequest(`/admin/farmer-verifications/${farmerId}/decision`, token, {
    method: 'POST',
    body: JSON.stringify({ approved, rejection_reason: rejectionReason }),
  });
}

export function fetchAdminAccounts(token) {
  return authenticatedRequest('/admin/accounts', token);
}

export function setAccountSuspended(token, userId, suspended, reason = null) {
  return authenticatedRequest(`/admin/accounts/${userId}/suspension`, token, {
    method: 'POST', body: JSON.stringify({ suspended, reason }),
  });
}

export function deleteAdminAccount(token, userId) {
  return authenticatedRequest(`/admin/accounts/${userId}`, token, { method: 'DELETE' });
}
