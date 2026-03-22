import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WalletState {
  address: string | null;
  token: string | null;
  isConnected: boolean;
  setWallet: (address: string, token: string) => void;
  setToken: (token: string) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      address: null,
      token: null,
      isConnected: false,
      setWallet: (address, token) =>
        set({ address, token, isConnected: true }),
      setToken: (token) =>
        set({ token }),
      disconnect: () =>
        set({ address: null, token: null, isConnected: false }),
    }),
    { name: 'stellar-id-wallet' }
  )
);
