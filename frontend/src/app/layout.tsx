import type { Metadata } from 'next';
import Link from 'next/link';
import '@fontsource/geist-sans/400.css';
import '@fontsource/geist-sans/500.css';
import '@fontsource/geist-sans/600.css';
import '@fontsource/geist-sans/700.css';
import './globals.css';

// Component Imports
import Providers from '../components/Providers';
import ConnectWallet from '../components/wallet/ConnectWallet';
import NavLinks from '../components/NavLinks';
import ToastProvider from '../components/ToastProvider';
import FeedbackWidget from '../components/feedback/FeedbackWidget';

// Motion Components (Client-side wrappers)
import PageTransition from '../components/motion/PageTransition';
import CinematicAtmosphere from '../components/motion/CinematicAtmosphere';
import CursorFollower from '../components/motion/CursorFollower';

export const metadata: Metadata = {
  title: 'StellarID | Protocol-Grade Identity',
  description: 'Futuristic decentralized identity infrastructure powered by Stellar.',
  keywords: ['identity', 'stellar', 'blockchain', 'zero-knowledge', 'privacy'],
  icons: {
    icon: [
      {
        url: '/logo.png?v=3',
        type: 'image/png',
      },
    ],
    shortcut: '/logo.png?v=3',
    apple: '/logo.png?v=3',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans bg-background text-foreground overflow-x-hidden">
        {/* Subtle ambient atmosphere */}
        <CinematicAtmosphere />
        
        {/* Custom cursor follower */}
        <CursorFollower />

        <Providers>
          <ToastProvider />
          <FeedbackWidget />
          
          <div className="relative flex flex-col min-h-screen">
            
            {/* --- PREMIUM NAVIGATION --- */}
            <header className="fixed top-0 left-0 right-0 z-[100]">
              <nav className="h-[72px] border-b bg-[hsl(260,87%,3%)]/80 backdrop-blur-md" style={{ borderColor: 'var(--border)' }}>
                <div className="max-w-[1440px] mx-auto px-8 h-full flex items-center justify-between">
                  <Link href="/" className="group flex items-center gap-2 outline-none">
                    <div className="relative overflow-hidden font-display font-bold text-xl tracking-tight">
                      <span className="block group-hover:-translate-y-full transition-transform duration-500" style={{ transitionTimingFunction: 'cubic-bezier(.23,1,.32,1)' }}>
                        Stellar<span className="gradient-text" style={{ backgroundImage: 'linear-gradient(to right, #6366f1, #a855f7)' }}>ID</span>
                      </span>
                      <span className="absolute inset-0 block translate-y-full group-hover:translate-y-0 transition-transform duration-500 gradient-text" style={{ transitionTimingFunction: 'cubic-bezier(.23,1,.32,1)', backgroundImage: 'linear-gradient(to right, #a855f7, #fcd34d)' }}>
                        StellarID
                      </span>
                    </div>
                  </Link>

                  <NavLinks />

                  <div className="flex items-center gap-4">
                    <ConnectWallet />
                  </div>
                </div>
              </nav>
            </header>

            {/* Page content */}
            <main className="flex-grow pt-[72px]">
              <PageTransition>
                {children}
              </PageTransition>
            </main>

            {/* --- EDITORIAL FOOTER --- */}
            <footer className="relative z-10 border-t py-16 mt-24" style={{ borderColor: 'var(--border)' }}>
              <div className="max-w-[1440px] mx-auto px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="space-y-3">
                  <div className="font-display font-bold text-lg tracking-tight opacity-30">StellarID</div>
                  <p className="text-[12px] text-muted max-w-xs">
                    The decentralised identity layer for the Stellar ecosystem.
                  </p>
                </div>
                
                <div className="flex flex-col md:items-end gap-4">
                  <div className="flex gap-8">
                    {['Protocol', 'Dashboard', 'Docs', 'GitHub'].map((item) => (
                      <Link 
                        key={item} 
                        href={item === 'GitHub' ? 'https://github.com' : `/${item.toLowerCase()}`} 
                        className="text-[11px] font-mono uppercase tracking-wider text-muted hover:text-accent-indigo transition-colors duration-300"
                      >
                        {item}
                      </Link>
                    ))}
                  </div>
                  <div className="text-[10px] font-mono text-muted/50 tracking-wider">
                    &copy; 2026 StellarID Protocol
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
