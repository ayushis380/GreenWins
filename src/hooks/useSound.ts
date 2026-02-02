'use client';

import { useCallback, useRef } from 'react';

type SoundType = 'stamp' | 'unstamp' | 'levelup' | 'achievement';

// Using simple audio synthesis since we don't have audio files
const playTone = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
  if (typeof window === 'undefined') return;

  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    console.log('Audio not available');
  }
};

export function useSound() {
  const isEnabled = useRef(true);

  const playSound = useCallback((type: SoundType) => {
    if (!isEnabled.current) return;

    switch (type) {
      case 'stamp':
        // Satisfying "pop" sound
        playTone(800, 0.1, 'sine');
        setTimeout(() => playTone(1200, 0.1, 'sine'), 50);
        break;
      case 'unstamp':
        // Softer descending tone
        playTone(600, 0.1, 'sine');
        break;
      case 'levelup':
        // Ascending celebratory tones
        playTone(523, 0.15, 'sine');
        setTimeout(() => playTone(659, 0.15, 'sine'), 100);
        setTimeout(() => playTone(784, 0.15, 'sine'), 200);
        setTimeout(() => playTone(1047, 0.3, 'sine'), 300);
        break;
      case 'achievement':
        // Fanfare-like sequence
        playTone(659, 0.1, 'triangle');
        setTimeout(() => playTone(784, 0.1, 'triangle'), 80);
        setTimeout(() => playTone(1047, 0.2, 'triangle'), 160);
        break;
    }
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    isEnabled.current = enabled;
  }, []);

  return { playSound, setEnabled };
}
