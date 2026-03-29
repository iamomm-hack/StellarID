import axios from 'axios';
import { useWalletStore } from '../store/walletStore';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555/api/v1',
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = useWalletStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined') {
      const { token, disconnect } = useWalletStore.getState();
      
      // Auto-logout on 401 (invalid/expired token)
      if (error.response?.status === 401 && token) {
        console.warn('[Auth] Token invalid/expired - logging out automatically');
        disconnect();
        // Redirect to home if not already there
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
        return Promise.reject(error);
      }
      
      console.error('[API Error]', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.response?.data?.error || error.response?.data?.message || error.message,
        url: error.config?.url,
        method: error.config?.method,
        tokenPresent: !!token,
        baseURL: error.config?.baseURL,
      });
    }
    return Promise.reject(error);
  }
);

export default api;

export const credentialsApi = {
  getAll: () => api.get('/credentials'),
  request: (data: any) => api.post('/credentials/request', data),
  generateProofRequest: (id: string, data: any) =>
    api.post(`/credentials/${id}/generate-proof`, data),
  delete: (id: string) => api.delete(`/credentials/${id}`),
};

export const issuersApi = {
  getAll: () => api.get('/issuers'),
};

export const verifyApi = {
  verify: (data: any, apiKey: string) =>
    api.post('/verify', data, { headers: { 'X-API-Key': apiKey } }),
};
