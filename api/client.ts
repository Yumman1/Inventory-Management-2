/**
 * API client for ScentVault backend.
 * All UI features are backed by these endpoints.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function fetchApi<T>(
  path: string,
  opts?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts?.headers },
    ...opts
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// --- Master Data ---
export const api = {
  suppliers: {
    list: () => fetchApi<any[]>('/suppliers'),
    create: (body: any) => fetchApi<any>('/suppliers', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => fetchApi<any>(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => fetchApi<void>(`/suppliers/${id}`, { method: 'DELETE' })
  },
  customers: {
    list: () => fetchApi<any[]>('/customers'),
    create: (body: any) => fetchApi<any>('/customers', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => fetchApi<any>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => fetchApi<void>(`/customers/${id}`, { method: 'DELETE' })
  },
  packingTypes: {
    list: () => fetchApi<any[]>('/packing-types'),
    create: (body: any) => fetchApi<any>('/packing-types', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => fetchApi<any>(`/packing-types/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => fetchApi<void>(`/packing-types/${id}`, { method: 'DELETE' })
  },
  locations: {
    list: () => fetchApi<any[]>('/locations'),
    main: () => fetchApi<any[]>('/locations/main'),
    sub: (mainId: string) => fetchApi<any[]>(`/locations/sub/${mainId}`),
    create: (body: any) => fetchApi<any>('/locations', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => fetchApi<any>(`/locations/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => fetchApi<void>(`/locations/${id}`, { method: 'DELETE' })
  },
  perfumes: {
    list: () => fetchApi<any[]>('/perfumes'),
    create: (body: any) => fetchApi<any>('/perfumes', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => fetchApi<any>(`/perfumes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => fetchApi<void>(`/perfumes/${id}`, { method: 'DELETE' })
  },
  olfactiveNotes: {
    list: () => fetchApi<string[]>('/olfactive-notes'),
    add: (name: string) => fetchApi<string[]>('/olfactive-notes', { method: 'POST', body: JSON.stringify({ name }) }),
    update: (oldName: string, newName: string) =>
      fetchApi<string[]>('/olfactive-notes', { method: 'PUT', body: JSON.stringify({ oldName, newName }) }),
    delete: (name: string) => fetchApi<string[]>(`/olfactive-notes/${encodeURIComponent(name)}`, { method: 'DELETE' })
  },

  // Transactions
  gateIn: {
    list: () => fetchApi<any[]>('/gate-in'),
    create: (body: any) => fetchApi<any>('/gate-in', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => fetchApi<any>(`/gate-in/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => fetchApi<void>(`/gate-in/${id}`, { method: 'DELETE' })
  },
  gateOut: {
    list: () => fetchApi<any[]>('/gate-out'),
    create: (body: any) => fetchApi<any>('/gate-out', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => fetchApi<any>(`/gate-out/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => fetchApi<void>(`/gate-out/${id}`, { method: 'DELETE' })
  },
  transfers: {
    list: () => fetchApi<any[]>('/transfers'),
    create: (body: any) => fetchApi<any>('/transfers', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => fetchApi<any>(`/transfers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => fetchApi<void>(`/transfers/${id}`, { method: 'DELETE' })
  },

  // Users
  users: {
    list: () => fetchApi<any[]>('/users'),
    current: () => fetchApi<any>('/users/current'),
    create: (body: any) => fetchApi<any>('/users', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => fetchApi<any>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => fetchApi<void>(`/users/${id}`, { method: 'DELETE' }),
    setCurrent: (user: any) => fetchApi<any>('/users/current', { method: 'POST', body: JSON.stringify(user) })
  },

  // Stock & Reports
  batchStock: (perfumeId: string, mainLocId: string, subLocId?: string, excludeLogId?: string) => {
    const params = new URLSearchParams({ perfumeId, mainLocId });
    if (subLocId) params.set('subLocId', subLocId);
    if (excludeLogId) params.set('excludeLogId', excludeLogId);
    return fetchApi<{ batch: string; weight: number }[]>(`/batch-stock?${params}`);
  },
  stockBreakdown: (perfumeId: string) => fetchApi<any[]>(`/stock-breakdown/${perfumeId}`),
  movementHistory: (perfumeId: string) => fetchApi<any[]>(`/movement-history/${perfumeId}`),
  reportsInventory: (params?: Record<string, string>) => {
    const q = params ? new URLSearchParams(params) : '';
    return fetchApi<any[]>(`/reports/inventory${q ? '?' + q : ''}`);
  },

  // Database
  database: {
    export: () => fetchApi<any>('/database/export'),
    import: (data: any) => fetchApi<{ success: boolean }>('/database/import', { method: 'POST', body: JSON.stringify(data) }),
    reset: () => fetchApi<{ success: boolean }>('/database/reset', { method: 'POST' })
  },

  // Full sync (single call to load everything)
  data: () => fetchApi<any>('/data'),

  // Auth
  auth: {
    login: (email: string, password: string) =>
      fetchApi<any>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    signup: (email: string, password: string, name: string) =>
      fetchApi<any>('/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, name }) }),
    logout: () => fetchApi<void>('/auth/logout', { method: 'POST' })
  }
};
