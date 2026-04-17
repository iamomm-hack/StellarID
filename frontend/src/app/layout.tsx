import type { Metadata } from 'next';
import { Space_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import Providers from '../components/Providers';
import ConnectWallet from '../components/wallet/ConnectWallet';
import NavLinks from '../components/NavLinks';
import ToastProvider from '../components/ToastProvider';

const spaceMono = Space_Mono({ subsets: ['latin'], weight: ['400', '700'] });

export const metadata: Metadata = {
  title: 'StellarID - Decentralized Identity Verification',
  description:
    'Prove who you are. Reveal nothing. Decentralized identity verification powered by Stellar blockchain and zero-knowledge proofs.',
  keywords: ['identity', 'verification', 'stellar', 'blockchain', 'zero-knowledge', 'privacy'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Unbounded font for display headings */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Unbounded:wght@300;600;900&display=swap"
          rel="stylesheet"
        />
        {/* Suppress wallet extension errors */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const originalError = console.error;
                const originalWarn = console.warn;
                
                console.error = function(...args) {
                  const errorStr = String(args[0] || '');
                  if (
                    errorStr.includes('ethereum') ||
                    errorStr.includes('Cannot assign to read only property') ||
                    errorStr.includes('Cannot redefine property') ||
                    errorStr.includes('MetaMask') ||
                    errorStr.includes('solana') ||
                    errorStr.includes('pageProvider') ||
                    errorStr.includes('evmAsk')
                  ) {
                    return;
                  }
                  return originalError.apply(console, args);
                };
                
                console.warn = function(...args) {
                  const warnStr = String(args[0] || '');
                  if (
                    warnStr.includes('ethereum') ||
                    warnStr.includes('solana') ||
                    warnStr.includes('wallet')
                  ) {
                    return;
                  }
                  return originalWarn.apply(console, args);
                };
                
                window.addEventListener('unhandledrejection', (event) => {
                  const reason = String(event.reason || '');
                  if (
                    reason.includes('MetaMask') ||
                    reason.includes('Failed to connect') ||
                    reason.includes('extension not found') ||
                    reason.includes('ethereum')
                  ) {
                    event.preventDefault();
                  }
                });
              })();
            `,
          }}
        />
      </head>
      <body className={`${spaceMono.className} antialiased`}>
        <Providers>
          <ToastProvider />
          {/* Navigation - Brutalist Edge */}
          <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#222]"
               style={{ background: 'rgba(5,5,5,0.92)', backdropFilter: 'blur(8px)' }}>
            <div className="max-w-[1400px] mx-auto px-6">
              <div className="flex items-center justify-between h-[72px]">
                <Link href="/" className="group" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="relative inline-block" style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: '1.3rem', letterSpacing: '-0.05em' }}>
                    STELLAR<span style={{ color: 'var(--color-accent)' }}>ID</span>
                    <div className="absolute bottom-0 left-0 w-full h-[3px]" style={{ background: 'var(--color-accent)' }} />
                  </div>
                </Link>

                <NavLinks />

                <div className="flex items-center gap-3">
                  <ConnectWallet />
                </div>
              </div>
            </div>
          </nav>

          {/* Scrolling Marquee Ticker */}
          <div className="marquee-strip fixed top-[72px] left-0 right-0 z-40">
            <div className="marquee-track">
              <div className="marquee-text">
                <span>NFT CREDENTIALS</span><i className="dot" />
                <span>PRIVACY-FIRST</span><i className="dot" />
                <span>VERIFY ONCE</span><i className="dot" />
                <span>PROVE EVERYWHERE</span><i className="dot" />
                <span>PROTOCOL V2.0 LIVE</span><i className="dot" />
                <span>DECENTRALIZED IDENTITY</span><i className="dot" />
                <span>ZERO-KNOWLEDGE PROOFS</span><i className="dot" />
                <span>STELLAR BLOCKCHAIN</span><i className="dot" />
                <span>NFT CREDENTIALS</span><i className="dot" />
                <span>PRIVACY-FIRST</span><i className="dot" />
                <span>VERIFY ONCE</span><i className="dot" />
                <span>PROVE EVERYWHERE</span><i className="dot" />
              </div>
              <div className="marquee-text" aria-hidden="true">
                <span>NFT CREDENTIALS</span><i className="dot" />
                <span>PRIVACY-FIRST</span><i className="dot" />
                <span>VERIFY ONCE</span><i className="dot" />
                <span>PROVE EVERYWHERE</span><i className="dot" />
                <span>PROTOCOL V2.0 LIVE</span><i className="dot" />
                <span>DECENTRALIZED IDENTITY</span><i className="dot" />
                <span>ZERO-KNOWLEDGE PROOFS</span><i className="dot" />
                <span>STELLAR BLOCKCHAIN</span><i className="dot" />
                <span>NFT CREDENTIALS</span><i className="dot" />
                <span>PRIVACY-FIRST</span><i className="dot" />
                <span>VERIFY ONCE</span><i className="dot" />
                <span>PROVE EVERYWHERE</span><i className="dot" />
              </div>
            </div>
          </div>

          {/* Main content - account for nav (72px) + ticker (~28px) */}
          <main className="pt-[100px]">{children}</main>

          {/* Footer */}
          <footer className="border-t border-[#222] py-8 mt-16 text-center"
                  style={{ fontSize: '0.75rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
            &copy; 2026 - STELLARID || BUILT ON STELLAR // ZERO KNOWLEDGE
          </footer>
        </Providers>
      </body>
    </html>
  );
}
