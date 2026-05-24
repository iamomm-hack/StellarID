'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          background: '#141414',
          color: '#f5f5f0',
          border: '1px solid rgba(255,255,255,0.06)',
          borderLeft: '4px solid #FF6A00',
          borderRadius: '16px',
          fontSize: '13px',
          padding: '12px 16px',
          fontFamily: '"Space Mono", monospace',
          letterSpacing: '0.02em',
        },
        success: {
          iconTheme: { primary: '#FF6A00', secondary: '#0a0a0a' },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: '#0a0a0a' },
        },
      }}
    />
  );
}
