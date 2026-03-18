'use client';
import { useState } from 'react';
import { useWalletStore } from '../store/walletStore';
import api from '../lib/api';

export function useWallet() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setWallet, disconnect, address, isConnected } = useWalletStore();

  const connect = async () => {
    setLoading(true);
    setError(null);
    try {
      // Dynamic import to avoid SSR issues
      const freighter = await import('@stellar/freighter-api');

      const connected = await freighter.isConnected();
      if (!connected) {
        setError('Please install Freighter wallet extension');
        return;
      }

      const pubKey = await freighter.getPublicKey();
      const message = `StellarID authentication: ${Date.now()}`;

      // signBlob expects a base64-encoded blob
      const blob = btoa(message);
      const signature = await freighter.signBlob(blob);

      const { data } = await api.post('/auth/connect-wallet', {
        stellarAddress: pubKey,
        signature,
        message,
      });

      setWallet(pubKey, data.token);
    } catch (err: any) {
      setError(err.message || 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return { connect, disconnect, loading, error, address, isConnected };
}
