import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('medivault_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password, full_name) => api.post('/auth/register', { email, password, full_name }),
  me: () => api.get('/auth/me'),
};

export const profileAPI = {
  list: () => api.get('/profiles'),
  create: (data) => api.post('/profiles', data),
  get: (id) => api.get(`/profiles/${id}`),
  update: (id, data) => api.put(`/profiles/${id}`, data),
  delete: (id) => api.delete(`/profiles/${id}`),
};

export const documentAPI = {
  getByProfile: (profileId) => api.get(`/documents/profile/${profileId}`),
  upload: (profileId, file) => {
    const formData = new FormData();
    formData.append('profile_id', profileId);
    formData.append('file', file);
    return api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000, // 30 second client timeout guard
    });
  },
  delete: (id) => api.delete(`/documents/${id}`),
};


export const analyticsAPI = {
  getTrends: (profileId) => api.get(`/analytics/trends/${profileId}`),
  getTimeline: (profileId) => api.get(`/analytics/timeline/${profileId}`),
  askAIAssistant: (profileId, query) => api.post('/analytics/ai-assistant', { profile_id: profileId, query }),
};

export default api;

