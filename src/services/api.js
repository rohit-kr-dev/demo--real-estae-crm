import { workflow } from './workflow';
export const isApiConfigured = false;
export const getAuthToken = () => localStorage.getItem('crm_token');
export const setAuthToken = token => token ? localStorage.setItem('crm_token', token) : localStorage.removeItem('crm_token');
export function getCurrentUser() { try { return JSON.parse(localStorage.getItem('crm_user') || 'null'); } catch { return null; } }
export const setCurrentUser = user => user ? localStorage.setItem('crm_user', JSON.stringify(user)) : localStorage.removeItem('crm_user');
export async function apiRequest(endpoint, method = 'GET', body = {}) { return workflow(endpoint, method, body || {}, getCurrentUser()); }
export async function downloadCsv(endpoint, filename = 'leads_export.csv') {
  const { leads } = await apiRequest(endpoint.replace('/export', ''));
  const fields = ['id', 'name', 'phone', 'email', 'stage', 'assigned_user_name', 'budget'];
  const escape = value => '"' + String(value ?? '').replace(/^[=+@-]/, "'$&").replaceAll('"', '""') + '"';
  const blob = new Blob(['\uFEFF' + [fields.join(','), ...leads.map(l => fields.map(f => escape(l[f])).join(','))].join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
