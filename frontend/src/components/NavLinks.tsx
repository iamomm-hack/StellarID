'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Protocol', href: '/how-it-works' },
  { label: 'Use Cases', href: '/use-cases' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Docs', href: '/docs' },
];

export default function NavLinks() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      {/* Desktop Nav */}
      <div className="hidden lg:flex items-center gap-6">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`nav-link-edge ${isActive(item.href) ? 'active' : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* Mobile Hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden w-9 h-9 flex items-center justify-center border border-[#333] text-[var(--color-text-muted)] hover:text-white hover:border-[var(--color-accent)] transition-colors"
        aria-label="Menu"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Menu */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed top-[72px] left-0 right-0 z-50 lg:hidden border-b border-[#222] p-4"
               style={{ background: 'rgba(5,5,5,0.97)' }}>
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-4 py-3 text-sm font-semibold uppercase tracking-wider transition-colors ${
                    isActive(item.href)
                      ? 'text-white border-l-4 border-[var(--color-accent)] pl-3'
                      : 'text-[var(--color-text-muted)] hover:text-white hover:pl-5'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
