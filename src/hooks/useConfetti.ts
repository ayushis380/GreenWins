'use client';

import { useCallback } from 'react';
import confetti from 'canvas-confetti';

export function useConfetti() {
  const fireConfetti = useCallback((options?: confetti.Options) => {
    if (typeof window === 'undefined') return;

    const defaults: confetti.Options = {
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#10B981', '#34D399', '#6EE7B7', '#FFD700', '#FFC107'],
      ...options,
    };

    confetti(defaults);
  }, []);

  const fireStampConfetti = useCallback((x: number, y: number) => {
    if (typeof window === 'undefined') return;

    const rect = { x: x / window.innerWidth, y: y / window.innerHeight };

    confetti({
      particleCount: 30,
      spread: 50,
      origin: rect,
      colors: ['#10B981', '#34D399', '#6EE7B7'],
      scalar: 0.8,
    });
  }, []);

  const fireCelebration = useCallback(() => {
    if (typeof window === 'undefined') return;

    const duration = 2000;
    const animationEnd = Date.now() + duration;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#10B981', '#FFD700', '#34D399'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#10B981', '#FFD700', '#34D399'],
      });
    }, 150);
  }, []);

  return { fireConfetti, fireStampConfetti, fireCelebration };
}
