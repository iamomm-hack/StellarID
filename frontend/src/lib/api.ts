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
  getMe: () => api.get('/issuers/me'),
  getAnalytics: () => api.get('/issuers/me/analytics'),
  register: (data: any) => api.post('/issuers/register', data),
  requestDomainVerification: (id: string, domain: string) =>
    api.post(`/issuers/${id}/request-domain-verification`, { domain }),
  confirmDomainVerification: (id: string) =>
    api.post(`/issuers/${id}/confirm-domain-verification`),
  requestEmailVerification: (id: string, email: string) =>
    api.post(`/issuers/${id}/request-email-verification`, { email }),
  confirmEmailVerification: (id: string, token: string) =>
    api.post(`/issuers/${id}/confirm-email-verification`, { token }),
  endorse: (id: string) =>
    api.post(`/issuers/${id}/endorse`),
  getEndorsements: (id: string) =>
    api.get(`/issuers/${id}/endorsements`),
  getPublicProfile: (id: string) =>
    api.get(`/issuers/${id}/public`),
};

export const adminApi = {
  verifyOfficial: (id: string) =>
    api.post(`/admin/issuers/${id}/verify-official`),
  revokeVerification: (id: string, reason: string) =>
    api.post(`/admin/issuers/${id}/revoke-verification`, { reason }),
  getIssuers: () =>
    api.get('/admin/issuers'),
  mockUpgrade: (id: string, tier: 'free' | 'pro' | 'enterprise') =>
    api.post(`/admin/issuers/${id}/mock-upgrade`, { tier }),
};

export const verifyApi = {
  verify: (data: any, apiKey: string) =>
    api.post('/verify', data, { headers: { 'X-API-Key': apiKey } }),
};

export const profileApi = {
  getCardData: (wallet: string) => api.get(`/profile/${wallet}/card-data`),
  getCredentials: (wallet: string) => api.get(`/profile/${wallet}/credentials`),
  getShareUrls: (wallet: string) => api.get(`/profile/${wallet}/share-url`),
  generateBio: (format?: string) => api.post('/profile/generate-bio', { format }),
};

export const reputationApi = {
  getReputation: (wallet: string) => api.get(`/reputation/${wallet}`),
  recalculate: (wallet: string) => api.post(`/reputation/${wallet}/recalculate`),
  getLeaderboard: (filter = 'global', limit = 100) => api.get(`/reputation/leaderboard?filter=${filter}&limit=${limit}`),
  getHistory: (wallet: string) => api.get(`/reputation/${wallet}/history`),
  getDiscordTokenData: (token: string) => api.get(`/reputation/discord/token/${token}`),
  linkDiscord: (data: { token: string; stellar_address: string; signature: string; message: string }) =>
    api.post('/reputation/discord/link', data),
  getDiscordUser: (discordId: string) => api.get(`/reputation/discord/user/${discordId}`),
};

export const developerApi = {
  createKey: (data: { name: string; permissions?: string[] }) => api.post('/developer/keys', data),
  listKeys: () => api.get('/developer/keys'),
  revokeKey: (id: string) => api.delete(`/developer/keys/${id}`),
  getUsageStats: () => api.get('/developer/usage/stats'),
};

export const billingApi = {
  getStatus: () => api.get('/billing/status'),
  createCheckoutSession: (tier: 'pro' | 'enterprise') => api.post('/billing/checkout-session', { tier }),
  createPortalSession: () => api.post('/billing/portal-session'),
  mockUpgrade: (tier: 'free' | 'pro' | 'enterprise') => api.post('/billing/mock-upgrade', { tier }),
  prepareStellarPayment: (tier: 'pro' | 'enterprise', senderAddress: string, paymentToken?: string) =>
    api.post('/billing/prepare-stellar-payment', { tier, senderAddress, paymentToken }),
  submitStellarPayment: (signedXdr: string, tier: 'pro' | 'enterprise') =>
    api.post('/billing/submit-stellar-payment', { signedXdr, tier }),
  cancelSubscription: () => api.post('/billing/cancel'),
};

