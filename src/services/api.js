const configuredApiUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '');
const API_BASE_URL = configuredApiUrl || (import.meta.env.DEV ? 'http://localhost:5000/api' : '');

export const isApiConfigured = Boolean(API_BASE_URL);

function getApiBaseUrl() {
  if (API_BASE_URL) return API_BASE_URL;
  throw new Error('CRM API is not configured. Set VITE_API_BASE_URL in the Vercel project settings and redeploy.');
}

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
    const res = await fetch(`${getApiBaseUrl()}${endpoint}`, config);
    const contentType = res.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await res.json() : {};
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
  const res = await fetch(`${getApiBaseUrl()}${endpoint}`, {
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
