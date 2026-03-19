import type { Metadata } from 'next';
import { Sora } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import Providers from '../components/Providers';
import ConnectWallet from '../components/wallet/ConnectWallet';

const sora = Sora({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'StellarID — Decentralized Identity Verification',
  description:
    'Prove who you are. Reveal nothing. Decentralized identity verification powered by Stellar blockchain and zero-knowledge proofs.',
  keywords: ['identity', 'verification', 'stellar', 'blockchain', 'zero-knowledge', 'privacy'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${sora.className} bg-gray-950 text-white antialiased`}>
        <Providers>
          {/* Navigation */}
          <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5">
            <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-xl" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <Link href="/" className="flex items-center gap-2.5 group">
                  <div className="w-8 h-8 rounded-full bg-white text-black
                                  flex items-center justify-center shadow-lg
                                  group-hover:shadow-white/25 transition-shadow font-black text-sm">
                    S
                  </div>
                  <span className="font-bold text-lg tracking-tight">
                    Stellar<span className="text-[#ff6a2e]">ID</span>
                  </span>
                </Link>

                <div className="hidden md:flex items-center gap-8">
                  <Link href="/" className="text-sm text-white/50 hover:text-white transition-colors">
                    Home
                  </Link>
                  <a href="/#use-cases" className="text-sm text-white/50 hover:text-white transition-colors">
                    Review
                  </a>
                  <Link href="/dashboard" className="text-sm text-white/50 hover:text-white transition-colors">
                    Dashboard
                  </Link>
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
