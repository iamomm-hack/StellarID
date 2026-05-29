'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Protocol', href: '/how-it-works' },
  { label: 'Use Cases', href: '/use-cases' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Docs', href: '/docs', target: '_blank', rel: 'noopener noreferrer' },
];

export default function NavLinks() {
  const pathname = usePathname();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      {/* --- DESKTOP NAV --- */}
      <nav 
        className="hidden lg:flex items-center gap-1 px-2 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.02]"
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {navItems.map((item, idx) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              target={item.target}
              rel={item.rel}
              onMouseEnter={() => setHoveredIdx(idx)}
              className={`relative px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.15em] transition-colors duration-300 z-10 ${
                active ? 'text-foreground' : 'text-muted hover:text-foreground/70'
              }`}
            >
              {/* Hover pill */}
              {hoveredIdx === idx && (
                <motion.div
                  layoutId="nav-hover"
                  className="absolute inset-0 z-[-1] rounded-full bg-white/[0.05]"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}
              
              {/* Active indicator */}
              {active && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 z-[-1] rounded-full bg-white/[0.08] border border-white/[0.08]"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}

              {item.label}

              {/* Active dot */}
              {active && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-accent-indigo" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* --- MOBILE TRIGGER --- */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.02]"
      >
        {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {/* --- MOBILE MENU --- */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-[300px] border-l border-white/[0.06] z-[101] lg:hidden p-8 flex flex-col"
              style={{ background: 'hsl(var(--background))' }}
            >
              <div className="flex flex-col gap-6 mt-16">
                {navItems.map((item, i) => {
                  const active = isActive(item.href);
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 + 0.15 }}
                    >
                      <Link
                        href={item.href}
                        target={item.target}
                        rel={item.rel}
                        onClick={() => setMobileOpen(false)}
                        className={`text-xl font-bold uppercase tracking-tight transition-colors duration-300 flex items-center gap-3 ${
                          active ? 'text-foreground' : 'text-muted hover:text-foreground/70'
                        }`}
                      >
                        {active && <span className="w-2 h-2 rounded-full bg-accent-indigo" />}
                        {item.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-auto pt-8 border-t border-white/[0.06]">
                <p className="text-[10px] font-mono text-muted">StellarID Protocol v3.0</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}