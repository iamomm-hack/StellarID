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
  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Use Cases', href: '/#use-cases' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Docs', href: '/#how-it-works' },
  ];

  return (
    <html lang="en" className="dark">
      <body className={`${sora.className} bg-[#08001a] text-white antialiased`}>
        <Providers>
          {/* Navigation */}
          <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0a0020]/80 backdrop-blur-xl">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#7c3aed] via-[#00e676] to-[#7c3aed]" />
            <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-[72px]">
                <Link href="/" className="flex items-center gap-2.5 group shrink-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#00e676]
                                  flex items-center justify-center text-sm font-black text-white shadow-lg shadow-purple-500/20">
                    S
                  </div>
                  <span className="font-bold text-base tracking-tight text-white">
                    Stellar<span className="text-[#00e676]">ID</span>
                  </span>
                </Link>

                <div className="hidden lg:flex items-center gap-1">
                  {navItems.map((item, idx) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${idx === 0
                        ? 'bg-white/10 text-white'
                        : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                <div className="flex items-center gap-2.5">
                  <ConnectWallet />
                  <button
                    aria-label="Notifications"
                    className="hidden sm:inline-flex w-8 h-8 items-center justify-center rounded-lg border border-white/15 text-white/50 hover:text-white hover:border-white/30 transition-colors"
                  >
                    ◦
                  </button>
                  <button
                    aria-label="Theme"
                    className="hidden sm:inline-flex w-8 h-8 items-center justify-center rounded-lg border border-white/15 text-white/50 hover:text-white hover:border-white/30 transition-colors"
                  >
                    ◐
                  </button>
                </div>
              </div>
            </div>
          </nav>

          {/* Main content */}
          <main className="pt-[72px]">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
