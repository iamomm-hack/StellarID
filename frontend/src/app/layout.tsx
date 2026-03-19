import type { Metadata } from 'next';
import { Sora } from 'next/font/google';
import Link from 'next/link';
import Image from 'next/image';
import './globals.css';
import Providers from '../components/Providers';
import ConnectWallet from '../components/wallet/ConnectWallet';
import NavLinks from '../components/NavLinks';
import ToastProvider from '../components/ToastProvider';

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
      <body className={`${sora.className} bg-[#08001a] text-white antialiased`}>
        <Providers>
          <ToastProvider />
          {/* Navigation */}
          <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0a0020]/80 backdrop-blur-xl">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#7c3aed] via-[#00e676] to-[#7c3aed]" />
            <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-[72px]">
                <Link href="/" className="flex items-center gap-2.5 group shrink-0">
                  <Image
                    src="/logo.png"
                    alt="StellarID"
                    width={36}
                    height={36}
                    className="rounded-full shadow-lg shadow-purple-500/20"
                  />
                  <span className="font-bold text-base tracking-tight text-white">
                    Stellar<span className="text-[#00e676]">ID</span>
                  </span>
                </Link>

                <NavLinks />

                <div className="flex items-center gap-2.5">
                  <ConnectWallet />
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
