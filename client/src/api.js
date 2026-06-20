const BASE = '/api';

async function request(method, path, body) {
  const token = localStorage.getItem('jwt');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// Named object — used by new components (Stats, AdminDashboard, CalendarSync, etc.)
export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  delete: (path) => request('DELETE', path),
};

// Legacy named exports — used by TaskList, TaskCard, TaskModal, Sidebar
export const getTasks = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request('GET', `/tasks${qs ? '?' + qs : ''}`);
};
export const createTask = (data) => request('POST', '/tasks', data);
export const updateTask = (id, data) => request('PUT', `/tasks/${id}`, data);
export const deleteTask = (id) => request('DELETE', `/tasks/${id}`);

export const getCategories = () => request('GET', '/categories');
export const createCategory = (data) => request('POST', '/categories', data);
export const deleteCategory = (id) => request('DELETE', `/categories/${id}`);