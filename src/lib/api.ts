let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
if (!/\/api\/?$/.test(API_URL)) {
  API_URL = API_URL.replace(/\/$/, '') + '/api';
}

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
    let message = 'API request failed';
    try {
      const text = await response.text();
      if (text) {
        try {
          const json = JSON.parse(text);
          message = json.error || message;
        } catch {
          message = `${response.status} ${response.statusText}: ${text}`;
        }
      } else {
        message = `${response.status} ${response.statusText}`;
      }
    } catch {
      message = `${response.status} ${response.statusText}`;
    }
    throw new Error(message);
  }

  return response.json();
};

export const auth = {
  register: (data: { email: string; password: string; full_name: string; phone?: string; role?: string }) =>
    apiCall('/auth/register', { method: 'POST', body: data }),
  login: (data: { email: string; password: string }) =>
    apiCall('/auth/login', { method: 'POST', body: data }),
  requestReset: (data: { email: string }) =>
    apiCall('/auth/request-reset', { method: 'POST', body: data }),
  resetPassword: (data: { token: string; new_password: string }) =>
    apiCall('/auth/reset', { method: 'POST', body: data }),
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
  edit: (id: string, data: any) => apiCall(`/incidents/${id}`, { method: 'PUT', body: data }),
  remove: (id: string) => apiCall(`/incidents/${id}`, { method: 'DELETE' }),
};

export const categories = {
  list: () => apiCall('/categories'),
};
