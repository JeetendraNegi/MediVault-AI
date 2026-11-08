import axios from 'axios';
import { CONFIG } from '../config';

const api = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

let userToken = null;

export const setAuthToken = (token) => {
  userToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', {
      email,
      password
    });
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

export const profileAPI = {
  getProfiles: async () => {
    const response = await api.get('/profiles');
    return response.data;
  },
  createProfile: async (profileData) => {
    const response = await api.post('/profiles', profileData);
    return response.data;
  },
  updateProfile: async (profileId, profileData) => {
    const response = await api.put(`/profiles/${profileId}`, profileData);
    return response.data;
  },
  deleteProfile: async (profileId) => {
    const response = await api.delete(`/profiles/${profileId}`);
    return response.data;
  }
};

export const documentAPI = {
  getDocuments: async (profileId) => {
    const response = await api.get(`/documents/profile/${profileId}`);
    return response.data;
  },
  uploadDocument: async (profileId, fileUri, fileName, mimeType) => {
    const formData = new FormData();
    formData.append('profile_id', profileId);
    formData.append('file', {
      uri: fileUri,
      name: fileName || 'health_report.pdf',
      type: mimeType || 'application/pdf'
    });

    const headers = {};
    if (userToken) {
      headers['Authorization'] = `Bearer ${userToken}`;
    }

    const res = await fetch(`${CONFIG.API_BASE_URL}/documents/upload`, {
      method: 'POST',
      headers: headers,
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || 'Upload failed');
    }

    return await res.json();
  },
  deleteDocument: async (documentId) => {
    const response = await api.delete(`/documents/${documentId}`);
    return response.data;
  }
};

export const analyticsAPI = {
  getTrends: async (profileId) => {
    const response = await api.get(`/analytics/trends/${profileId}`);
    return response.data;
  },
  getTimeline: async (profileId) => {
    const response = await api.get(`/analytics/timeline/${profileId}`);
    return response.data;
  },
  askAIAssistant: async (profileId, query) => {
    const response = await api.post('/analytics/ai-assistant', {
      profile_id: profileId,
      query: query
    });
    return response.data;
  }
};

export default api;
