import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '../components/Providers';
import ConnectWallet from '../components/wallet/ConnectWallet';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'StellarID — Decentralized Identity Verification',
  description:
    'Prove who you are. Reveal nothing. Decentralized identity verification powered by Stellar blockchain and zero-knowledge proofs.',
  keywords: ['identity', 'verification', 'stellar', 'blockchain', 'zero-knowledge', 'privacy'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950 text-white antialiased`}>
        <Providers>
          {/* Navigation */}
          <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5">
            <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-xl" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <a href="/" className="flex items-center gap-2.5 group">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600
                                  flex items-center justify-center shadow-lg shadow-indigo-500/20
                                  group-hover:shadow-indigo-500/40 transition-shadow">
                    <svg
                      className="w-5 h-5 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <span className="font-bold text-lg tracking-tight">
                    Stellar<span className="text-indigo-400">ID</span>
                  </span>
                </a>

                <div className="hidden md:flex items-center gap-8">
                  <a href="/#how-it-works" className="text-sm text-white/50 hover:text-white transition-colors">
                    How it works
                  </a>
                  <a href="/#use-cases" className="text-sm text-white/50 hover:text-white transition-colors">
                    Use Cases
                  </a>
                  <a href="/dashboard" className="text-sm text-white/50 hover:text-white transition-colors">
                    Dashboard
                  </a>
                </div>

                <ConnectWallet />
              </div>
            </div>
          </nav>

          {/* Main content */}
          <main className="pt-16">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
