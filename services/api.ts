import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/config';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Interceptor: Add JWT token to Authorization header
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: Handle 401 errors (unauthorized)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const { logout } = useAuthStore.getState();
      await logout();
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authApi = {
  login: (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
};

// Barns APIs
export const barnApi = {
  getAll: () => api.get('/barns'),
  getOne: (id: number) => api.get(`/barns/${id}`),
  create: (data: any) => api.post('/barns', data),
  update: (id: number, data: any) => api.put(`/barns/${id}`, data),
};

// Devices APIs
export const deviceApi = {
  getBarnDevices: (barnId: number) => api.get(`/barns/${barnId}/devices`),
  control: (data: { deviceId: number; action: string }) => api.post(`/devices/${data.deviceId}/control`, { action: data.action }),
  getLogs: (deviceId: number) => api.get(`/devices/${deviceId}/logs`),
};

// Flocks APIs
export const flockApi = {
  getBarnFlocks: (barnId: number) => api.get(`/flocks/barn/${barnId}`),
  create: (data: any) => api.post('/flocks', data),
};

// Feed APIs
export const feedApi = {
  getCalculations: (barnId: number) => api.get(`/feed/calculations/${barnId}`),
  logFeed: (data: any) => api.post('/feed/log', data),
  calculate: (barnId: number) => api.get(`/barns/${barnId}/feed/calculate`),
  getToday: (barnId: number) => api.get(`/barns/${barnId}/feed/today`),
  getHistory: (barnId: number, days: number = 7) => api.get(`/barns/${barnId}/feed/history?days=${days}`),
};

// Schedules APIs
export const scheduleApi = {
  getBarnSchedules: (barnId: number) => api.get(`/barns/${barnId}/schedules`),
  getOne: (id: number) => api.get(`/schedules/${id}`),
  create: (data: any) => api.post('/schedules', data),
  update: (id: number, data: any) => api.patch(`/schedules/${id}`, data),
  remove: (id: number) => api.delete(`/schedules/${id}`),
};

// Environment APIs
export const environmentApi = {
  getLogs: (barnId: number) => api.get(`/environment/logs/${barnId}`),
};

// Alerts APIs
export const alertApi = {
  getAll: (barnId: number) => api.get(`/barns/${barnId}/alerts`),
  getUnreadCount: (barnId: number) => api.get(`/barns/${barnId}/alerts/unread-count`),
  markRead: (id: number) => api.patch(`/alerts/${id}/read`),
  markAllRead: (barnId: number) => api.patch(`/barns/${barnId}/alerts/read-all`),
};

// Notes APIs
export const noteApi = {
  getAll: () => api.get('/notes'),
  create: (data: any) => api.post('/notes', data),
  update: (id: number, data: any) => api.put(`/notes/${id}`, data),
};

// FarmAI APIs
export const farmAiApi = {
  getChatHistory: (barnId: number) => api.get(`/farm-ai/history/${barnId}`),
  sendMessage: (data: any) => api.post('/farm-ai/chat', data),
};

export default api;
