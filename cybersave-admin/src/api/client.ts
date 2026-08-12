import axios from 'axios';
import { useAdminStore } from '../store/adminStore';

const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

export const adminClient = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

adminClient.interceptors.request.use((config) => {
  const token = useAdminStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
    // Pass operator details to downstreams for tracking
    const user = useAdminStore.getState().user;
    if (user) {
      config.headers['x-user-name'] = user.name;
    }
  }
  return config;
});

adminClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAdminStore.getState().clearAuth();
      const isLoginPage = window.location.pathname === '/login';
      const isLoginRequest = error.config?.url?.includes('/auth/operator/login');
      if (!isLoginPage && !isLoginRequest) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
