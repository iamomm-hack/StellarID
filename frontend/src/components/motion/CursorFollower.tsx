'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CursorFollower() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [isTextInput, setIsTextInput] = useState(false);

  // Position of the mouse
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Smooth springs for the outer cursor follower
  const springConfig = { stiffness: 220, damping: 24, mass: 0.6 };
  const outerX = useSpring(mouseX, springConfig);
  const outerY = useSpring(mouseY, springConfig);

  useEffect(() => {
    // Avoid running on mobile/touch screens
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const isInteractive = target.closest(
        'a, button, input[type="button"], input[type="submit"], select, option, [role="button"], .btn-stellar, .btn-stellar-ghost, .interactive-card'
      );
      const isText = target.closest(
        'input[type="text"], input[type="email"], input[type="password"], textarea, [contenteditable="true"]'
      );

      setIsHovered(!!isInteractive);
      setIsTextInput(!!isText);
    };

    const handleMouseDown = () => setIsClicked(true);
    const handleMouseUp = () => setIsClicked(false);
    const handleMouseLeaveWindow = () => setIsVisible(false);
    const handleMouseEnterWindow = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeaveWindow);
    document.addEventListener('mouseenter', handleMouseEnterWindow);

    // Apply cursor-none class to body
    document.body.classList.add('custom-cursor-active');

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeaveWindow);
      document.removeEventListener('mouseenter', handleMouseEnterWindow);
      document.body.classList.remove('custom-cursor-active');
    };
  }, [isVisible, mouseX, mouseY]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[99999]" style={{ contain: 'layout' }}>
      {/* Outer Follower */}
      <motion.div
        style={{
          x: outerX,
          y: outerY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          scale: isClicked ? 0.8 : isHovered ? 1.6 : 1,
          width: isTextInput ? 4 : 32,
          height: isTextInput ? 24 : 32,
          borderRadius: isTextInput ? '2px' : '50%',
          backgroundColor: isTextInput
            ? 'rgba(255, 255, 255, 0.1)'
            : isHovered
            ? 'rgba(99, 102, 241, 0.08)'
            : 'rgba(99, 102, 241, 0.03)',
          borderColor: isTextInput
            ? 'rgba(255, 255, 255, 0.4)'
            : isHovered
            ? 'rgba(168, 85, 247, 0.8)'
            : 'rgba(99, 102, 241, 0.4)',
          borderWidth: isTextInput ? '0px' : '1px',
          boxShadow: isHovered
            ? '0 0 16px rgba(168, 85, 247, 0.4)'
            : '0 0 0px rgba(99, 102, 241, 0)',
        }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="fixed top-0 left-0 border rounded-full pointer-events-none"
      />

      {/* Inner Dot / I-Beam */}
      {!isTextInput ? (
        <motion.div
          style={{
            x: mouseX,
            y: mouseY,
            translateX: '-50%',
            translateY: '-50%',
          }}
          animate={{
            scale: isHovered ? 1.3 : 1,
            backgroundColor: isHovered ? '#a855f7' : '#6366f1',
          }}
          className="fixed top-0 left-0 w-2 h-2 rounded-full pointer-events-none shadow-[0_0_8px_rgba(99,102,241,0.8)]"
        />
      ) : (
        <motion.div
          style={{
            x: mouseX,
            y: mouseY,
            translateX: '-50%',
            translateY: '-50%',
          }}
          className="fixed top-0 left-0 w-[2px] h-[16px] bg-white pointer-events-none shadow-[0_0_6px_rgba(255,255,255,0.8)]"
        />
      )}
    </div>
  );
}
