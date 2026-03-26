const API_BASE = 'http://localhost:3001/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  getStats: () => request('/stats'),
  getLeads: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/leads?${qs}`);
  },
  updateLead: (id, data) => request(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLead: (id) => request(`/leads/${id}`, { method: 'DELETE' }),
  scoreLeads: (weights) => request('/leads/score', { method: 'POST', body: JSON.stringify({ weights }) }),
  bulkStatus: (ids, status) => request('/leads/bulk-status', { method: 'POST', body: JSON.stringify({ ids, status }) }),
  importCsv: (csvText) => fetch(`${API_BASE}/import/csv`, { method: 'POST', body: csvText }),
  exportCsv: () => `${API_BASE}/export/csv`,
  getCampaigns: () => request('/campaigns'),
  createCampaign: (name, type) => request('/campaigns', { method: 'POST', body: JSON.stringify({ name, type }) }),
  getActivity: (leadId) => request(`/leads/${leadId}/activity`),

  // Priorities (Command Center)
  getPriorities: () => request('/priorities'),
  createPriority: (title, section) => request('/priorities', { method: 'POST', body: JSON.stringify({ title, section }) }),
  updatePriority: (id, data) => request(`/priorities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePriority: (id) => request(`/priorities/${id}`, { method: 'DELETE' }),
  movePriority: (id, section) => request(`/priorities/${id}/move`, { method: 'POST', body: JSON.stringify({ section }) }),
};
