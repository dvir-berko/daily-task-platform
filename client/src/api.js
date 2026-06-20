const BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(BASE + url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

// Tasks
export const getTasks = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(`/tasks${q ? '?' + q : ''}`);
};
export const getStats = () => request('/tasks/stats');
export const createTask = (data) => request('/tasks', { method: 'POST', body: JSON.stringify(data) });
export const updateTask = (id, data) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTask = (id) => request(`/tasks/${id}`, { method: 'DELETE' });

// Categories
export const getCategories = () => request('/categories');
export const createCategory = (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) });
export const deleteCategory = (id) => request(`/categories/${id}`, { method: 'DELETE' });

// Settings
export const getSettings = () => request('/settings');
export const updateSettings = (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) });
export const testWhatsApp = () => request('/settings/test-whatsapp', { method: 'POST' });
