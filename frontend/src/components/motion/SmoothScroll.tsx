'use client';
import { ReactLenis, useLenis } from '@studio-freight/react-lenis';
import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function ScrollSync() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    // Sync Lenis scroll position with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // Use GSAP ticker for Lenis RAF — single unified loop
    const update = (time: number) => {
      lenis.raf(time * 1000); // GSAP ticker uses seconds
    };
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0); // Prevent frame skipping

    return () => {
      gsap.ticker.remove(update);
      lenis.off('scroll', ScrollTrigger.update);
    };
  }, [lenis]);

  return null;
}

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis 
      root 
      autoRaf={false}
      options={{ 
        lerp: 0.1,          // Snappy response (lower = smoother but laggier)
        duration: 1.0,       // Scroll duration
        smoothWheel: true,
        wheelMultiplier: 1,  // 1:1 wheel mapping — no acceleration
        touchMultiplier: 2,
      }}
    >
      <ScrollSync />
      {children}
    </ReactLenis>
  );
}