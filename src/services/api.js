const configuredApiUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '');
const API_BASE_URL = configuredApiUrl || (import.meta.env.DEV ? 'http://localhost:5000/api' : '');

export const isApiConfigured = Boolean(API_BASE_URL);
const DEMO_LEADS_KEY = 'crm_demo_leads';
const INITIAL_DEMO_LEADS = [
  { id: 101, name: 'Ananya Krishnan', phone: '+91 98123 45671', email: 'ananya@example.com', budget: 35000000, preferredLocation: 'Bandra West', stage: 'Interested', status: 'Active', assigned_to_name: 'Amit Verma', created_at: '2026-09-22T10:00:00.000Z' },
  { id: 102, name: 'Rohan Mehta', phone: '+91 98123 45672', email: 'rohan@example.com', budget: 18000000, preferredLocation: 'Thane', stage: 'Follow-up', status: 'Active', assigned_to_name: 'Vikram Singh', created_at: '2026-09-23T09:30:00.000Z' },
  { id: 103, name: 'Priya Nair', phone: '+91 98123 45673', email: 'priya@example.com', budget: 42000000, preferredLocation: 'Worli', stage: 'Negotiation', status: 'Active', assigned_to_name: 'Amit Verma', created_at: '2026-09-24T08:15:00.000Z' },
];
const DEMO_USERS = [
  { id: 1, name: 'Rajesh Kumar', email: 'admin@democrm.com', role: 'Admin', is_active: 1 },
  { id: 3, name: 'Amit Verma', email: 'sales1@democrm.com', role: 'Sales_Exec', is_active: 1 },
  { id: 4, name: 'Vikram Singh', email: 'tele@democrm.com', role: 'Telecaller', is_active: 1 },
];

function getDemoLeads() {
  const stored = localStorage.getItem(DEMO_LEADS_KEY);
  if (stored) return JSON.parse(stored);
  saveDemoLeads(INITIAL_DEMO_LEADS);
  return INITIAL_DEMO_LEADS;
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

  const leadMatch = path.match(/^\/leads\/(\d+)$/);
  if (leadMatch && method === 'GET') {
    const lead = getDemoLeads().find((item) => item.id === Number(leadMatch[1]));
    if (!lead) throw new Error('Demo lead not found.');
    return { lead, activities: [{ id: 1, type: 'INGESTION', title: 'Lead added to demo CRM', description: 'Ready for a guided sales workflow.', created_at: lead.created_at, user_name: 'Demo Team' }], followups: [], siteVisits: [], negotiations: [], stages: ['New', 'Contact Attempted', 'Connected', 'Interested', 'Follow-up', 'Site Visit Scheduled', 'Site Visit Completed', 'Negotiation', 'Booking/Closed Won'], callOutcomes: ['Connected', 'Not Answered', 'Interested', 'Not Interested'] };
  }

  const stageMatch = path.match(/^\/leads\/(\d+)\/stage$/);
  if (stageMatch && method === 'PUT') {
    const leads = getDemoLeads().map((lead) => lead.id === Number(stageMatch[1]) ? { ...lead, stage: body.stage } : lead);
    saveDemoLeads(leads);
    return { success: true };
  }

  if (path === '/dashboard/summary') {
    const leads = getDemoLeads();
    return { metrics: { totalLeads: leads.length, activeLeads: leads.length, newLeads: leads.filter((lead) => lead.stage === 'New').length, wonLeads: 0, overdueFU: 1, todayFU: 2, todayVisits: 1, siteVisits: 1, activeNegs: 1, lostLeads: 0, unassigned: 0 }, funnel: { total: leads.length, contacted: leads.length, interested: 2, siteVisits: 1, negotiations: 1, closures: 0 }, bySource: [{ source_name: 'Website', count: 2 }, { source_name: 'Referral', count: 1 }], employeePerformance: [{ id: 3, name: 'Amit Verma', role: 'Sales Executive', total_assigned: 2, site_visits: 1, closures: 0 }, { id: 4, name: 'Vikram Singh', role: 'Telecaller', total_assigned: 1, site_visits: 0, closures: 0 }], recentActivity: [{ title: 'Follow-up scheduled', lead_name: 'Rohan Mehta', description: 'Discussed preferred floor plan', user_name: 'Vikram Singh', created_at: new Date().toISOString() }], todayFollowupsList: [{ id: 201, lead_id: 102, lead_name: 'Rohan Mehta', scheduled_at: new Date().toISOString(), action_type: 'Call' }] };
  }

  if (path === '/auth/users') return { users: DEMO_USERS };
  if (path === '/settings/projects') return { projects: [] };
  if (path === '/settings/lead-sources') return { sources: [] };
  if (path === '/followups') return { followups: [{ id: 201, lead_id: 102, lead_name: 'Rohan Mehta', lead_phone: '+91 98123 45672', scheduled_at: new Date().toISOString(), action_type: 'Call', remarks: 'Discuss financing options', user_name: 'Vikram Singh', status: 'Pending' }] };
  if (path === '/site-visits') return { siteVisits: [{ id: 301, lead_id: 101, lead_name: 'Ananya Krishnan', lead_phone: '+91 98123 45671', project_name: 'Demo Skyline Tower', scheduled_at: new Date().toISOString(), pickup_required: 1, status: 'Scheduled' }] };
  if (path === '/negotiations') return { negotiations: [{ id: 401, lead_id: 103, lead_name: 'Priya Nair', lead_phone: '+91 98123 45673', project_name: 'Demo Skyline Tower', unit_number: 'A-1204', quoted_amount: 42000000, latest_offer: 39500000, status: 'Active' }] };
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
