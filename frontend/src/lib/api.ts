import axios from 'axios';
import { useWalletStore } from '../store/walletStore';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
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

export default api;

export const credentialsApi = {
  getAll: () => api.get('/credentials'),
  request: (data: any) => api.post('/credentials/request', data),
  generateProofRequest: (id: string, data: any) =>
    api.post(`/credentials/${id}/generate-proof`, data),
};

export const issuersApi = {
  getAll: () => api.get('/issuers'),
};

export const verifyApi = {
  verify: (data: any, apiKey: string) =>
    api.post('/verify', data, { headers: { 'X-API-Key': apiKey } }),
};
