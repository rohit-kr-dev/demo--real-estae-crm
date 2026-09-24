const API_BASE_URL = 'http://localhost:5000/api';

export function getAuthToken() {
  return localStorage.getItem('crm_token');
}

export function setAuthToken(token) {
  if (token) localStorage.setItem('crm_token', token);
  else localStorage.removeItem('crm_token');
}

export function getCurrentUser() {
  const user = localStorage.getItem('crm_user');
  return user ? JSON.parse(user) : null;
}

export function setCurrentUser(user) {
  if (user) localStorage.setItem('crm_user', JSON.stringify(user));
  else localStorage.removeItem('crm_user');
}

export async function apiRequest(endpoint, method = 'GET', body = null) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'API Request failed');
    }
    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

export async function downloadCsv(endpoint, filename = 'leads_export.csv') {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Failed to download CSV');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
