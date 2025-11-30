const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

export const apiCall = async (endpoint: string, options: RequestOptions = {}) => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
};

export const auth = {
  register: (data: { email: string; password: string; full_name: string; phone?: string; role?: string }) =>
    apiCall('/auth/register', { method: 'POST', body: data }),
  login: (data: { email: string; password: string }) =>
    apiCall('/auth/login', { method: 'POST', body: data }),
};

export const profiles = {
  getMe: () => apiCall('/profiles/me'),
  get: (id: string) => apiCall(`/profiles/${id}`),
};

export const incidents = {
  list: () => apiCall('/incidents'),
  get: (id: string) => apiCall(`/incidents/${id}`),
  create: (data: any) => apiCall('/incidents', { method: 'POST', body: data }),
  update: (id: string, data: any) => apiCall(`/incidents/${id}`, { method: 'PATCH', body: data }),
};

export const categories = {
  list: () => apiCall('/categories'),
};
