const configuredApiUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '');
const API_BASE_URL = configuredApiUrl || (import.meta.env.DEV ? 'http://localhost:5000/api' : '');

export const isApiConfigured = Boolean(API_BASE_URL);
const DEMO_LEADS_KEY = 'crm_demo_leads';

function getDemoLeads() {
  const stored = localStorage.getItem(DEMO_LEADS_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveDemoLeads(leads) {
  localStorage.setItem(DEMO_LEADS_KEY, JSON.stringify(leads));
}

function demoApiRequest(endpoint, method, body) {
  const [path, queryString = ''] = endpoint.split('?');
  const params = new URLSearchParams(queryString);

  if (path === '/leads' && method === 'POST') {
    const leads = getDemoLeads();
    const duplicate = leads.some((lead) => lead.phone === body.phone);
    if (duplicate) return { isDuplicate: true };
    const lead = {
      id: Date.now(),
      ...body,
      stage: 'New',
      status: 'Active',
      assigned_to_name: 'Demo Team',
      created_at: new Date().toISOString(),
    };
    saveDemoLeads([lead, ...leads]);
    return { isDuplicate: false, lead };
  }

  if (path === '/leads' && method === 'GET') {
    const search = (params.get('search') || '').toLowerCase();
    const leads = getDemoLeads().filter((lead) =>
      !search || [lead.name, lead.phone, lead.email].some((value) => String(value || '').toLowerCase().includes(search))
    );
    return { leads, total: leads.length, page: 1, totalPages: 1 };
  }

  if (path === '/dashboard/summary') {
    const leads = getDemoLeads();
    return { metrics: { totalLeads: leads.length, activeLeads: leads.length, newLeads: leads.length, wonLeads: 0, overdueFU: 0, todayFU: 0, todayVisits: 0, siteVisits: 0, activeNegs: 0, lostLeads: 0, unassigned: leads.length }, funnel: { total: leads.length }, bySource: [], employeePerformance: [], recentActivity: [], todayFollowupsList: [] };
  }

  if (path === '/auth/users') return { users: [] };
  if (path === '/settings/projects') return { projects: [] };
  if (path === '/settings/lead-sources') return { sources: [] };
  if (path === '/followups') return { followups: [] };
  if (path === '/site-visits') return { siteVisits: [] };
  if (path === '/negotiations') return { negotiations: [] };
  if (path === '/notifications') return { notifications: [], unreadCount: 0 };
  return { success: true };
}

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
  if (!isApiConfigured) return demoApiRequest(endpoint, method, body);

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
