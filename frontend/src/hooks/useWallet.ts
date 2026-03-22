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
      let freighter;
      try {
        freighter = await import('@stellar/freighter-api');
      } catch (importErr: any) {
        // Silently handle import errors (MetaMask inpage.js might throw)
        console.debug('Wallet import notice:', importErr?.message);
        setError('Please install Freighter wallet extension');
        return;
      }

      // Wrap wallet detection in try-catch to handle MetaMask interference
      let connected = false;
      try {
        connected = await freighter.isConnected();
      } catch (detectErr: any) {
        // Ignore MetaMask detection errors
        console.debug('Wallet detection notice (ignored):', detectErr?.message);
        connected = false;
      }

      if (!connected) {
        setError('Please install Freighter wallet extension');
        return;
      }

      let pubKey = '';

      if (typeof freighter.requestAccess === 'function') {
        try {
          const accessResult: any = await freighter.requestAccess();
          if (typeof accessResult === 'string') {
            pubKey = accessResult;
          } else {
            pubKey = accessResult?.publicKey || accessResult?.public_key || accessResult?.address || '';
          }
        } catch (accessErr: any) {
          // Handle access request errors gracefully
          if (!accessErr?.message?.includes('user rejected')) {
            console.debug('Access request notice:', accessErr?.message);
          }
        }
      }

      if (!pubKey && typeof freighter.isAllowed === 'function' && typeof freighter.setAllowed === 'function') {
        try {
          const allowed = await freighter.isAllowed();
          if (!allowed) {
            await freighter.setAllowed();
          }
        } catch (permErr: any) {
          // Ignore permission-related errors
          console.debug('Permission notice:', permErr?.message);
        }
      }

      if (!pubKey) {
        try {
          const publicKeyResult: any = await freighter.getPublicKey();
          pubKey = typeof publicKeyResult === 'string'
            ? publicKeyResult
            : publicKeyResult?.publicKey || publicKeyResult?.public_key || publicKeyResult?.address || '';
        } catch (keyErr: any) {
          console.debug('Key retrieval notice:', keyErr?.message);
        }
      }

      if (!pubKey) {
        throw new Error('Unable to read wallet public key. Please allow this site in Freighter and unlock wallet.');
      }

      const message = `StellarID authentication: ${Date.now()}`;

      // signBlob expects a base64-encoded blob
      const blob = btoa(message);
      let signatureResult: any;
      try {
        signatureResult = await freighter.signBlob(blob, { accountToSign: pubKey });
      } catch (signErr: any) {
        throw new Error(`Signature failed: ${signErr?.message || 'Unknown error'}`);
      }

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
          setError('Network Error: backend API unreachable. Start backend on :5555 and verify NEXT_PUBLIC_API_URL.');
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
