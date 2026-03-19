'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          background: 'rgba(15, 5, 40, 0.95)',
          color: '#fff',
          border: '1px solid rgba(124, 58, 237, 0.25)',
          backdropFilter: 'blur(12px)',
          borderRadius: '12px',
          fontSize: '14px',
          padding: '12px 16px',
        },
        success: {
          iconTheme: { primary: '#00e676', secondary: '#0a0020' },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: '#0a0020' },
        },
      }}
    />
  );
}
