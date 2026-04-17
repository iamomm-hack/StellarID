'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          background: '#121212',
          color: '#e0e0e0',
          border: '1px solid #333',
          borderLeft: '4px solid #ff3c00',
          borderRadius: '0',
          fontSize: '14px',
          padding: '12px 16px',
          fontFamily: '"Space Mono", monospace',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.05em',
        },
        success: {
          iconTheme: { primary: '#d4ff00', secondary: '#050505' },
        },
        error: {
          iconTheme: { primary: '#ff3c00', secondary: '#050505' },
        },
      }}
    />
  );
}
