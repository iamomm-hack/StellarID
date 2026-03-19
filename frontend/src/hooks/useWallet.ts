'use client';
import { useState } from 'react';
import axios from 'axios';
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

      let pubKey = '';

      if (typeof freighter.requestAccess === 'function') {
        const accessResult: any = await freighter.requestAccess();
        if (typeof accessResult === 'string') {
          pubKey = accessResult;
        } else {
          pubKey = accessResult?.publicKey || accessResult?.public_key || accessResult?.address || '';
        }
      }

      if (!pubKey && typeof freighter.isAllowed === 'function' && typeof freighter.setAllowed === 'function') {
        const allowed = await freighter.isAllowed();
        if (!allowed) {
          await freighter.setAllowed();
        }
      }

      if (!pubKey) {
        const publicKeyResult: any = await freighter.getPublicKey();
        pubKey = typeof publicKeyResult === 'string'
          ? publicKeyResult
          : publicKeyResult?.publicKey || publicKeyResult?.public_key || publicKeyResult?.address || '';
      }

      if (!pubKey) {
        throw new Error('Unable to read wallet public key. Please allow this site in Freighter and unlock wallet.');
      }

      const message = `StellarID authentication: ${Date.now()}`;

      // signBlob expects a base64-encoded blob
      const blob = btoa(message);
      const signatureResult: any = await freighter.signBlob(blob, { accountToSign: pubKey });

      if (signatureResult?.error) {
        throw new Error(signatureResult.error);
      }

      const signature = typeof signatureResult === 'string'
        ? signatureResult
        : signatureResult?.signature || signatureResult?.signedXDR || signatureResult;

      if (!signature) {
        throw new Error('Signature was not returned by wallet');
      }

      const { data } = await api.post('/auth/connect-wallet', {
        stellarAddress: pubKey,
        signature,
        message,
      });

      setWallet(pubKey, data.token);
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          setError('Network Error: backend API unreachable. Start backend on :4000 and verify NEXT_PUBLIC_API_URL.');
        } else {
          setError(err.response.data?.error || `Connection failed (${err.response.status})`);
        }
      } else {
        setError(err.message || 'Connection failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return { connect, disconnect, loading, error, address, isConnected };
}
