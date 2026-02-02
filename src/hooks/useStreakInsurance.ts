'use client';

import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { StreakInsurance } from '@/types';

const STREAK_INSURANCE_KEY = 'greenwins_streak_insurance';

const INITIAL_STATE: StreakInsurance = {
  shields: 1, // Start with 1 free shield
  maxShields: 3,
  usedThisWeek: false,
  totalEarned: 1,
  totalUsed: 0,
  protectedDates: [],
};

// Points needed to earn a shield
const POINTS_PER_SHIELD = 50;

export function useStreakInsurance() {
  const [state, setState] = useLocalStorage<StreakInsurance>(STREAK_INSURANCE_KEY, INITIAL_STATE);

  // Check if a date was protected by a shield
  const isDateProtected = useCallback(
    (date: string) => {
      return state.protectedDates.includes(date);
    },
    [state.protectedDates]
  );

  // Use a shield to protect a streak
  const useShield = useCallback(
    (date: string): { success: boolean; message: string } => {
      if (state.shields <= 0) {
        return { success: false, message: 'No shields available. Earn more by completing actions!' };
      }

      if (state.protectedDates.includes(date)) {
        return { success: false, message: 'This date is already protected.' };
      }

      // Get current week start
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const targetDate = new Date(date);
      const isCurrentWeek = targetDate >= weekStart;

      if (!isCurrentWeek) {
        return { success: false, message: 'Can only protect dates in the current week.' };
      }

      setState((prev) => ({
        ...prev,
        shields: prev.shields - 1,
        usedThisWeek: true,
        totalUsed: prev.totalUsed + 1,
        protectedDates: [...prev.protectedDates, date],
      }));

      return { success: true, message: 'Shield activated! Your streak is protected for this day.' };
    },
    [state.shields, state.protectedDates, setState]
  );

  // Award points toward earning a shield (called when user completes actions)
  const awardPoints = useCallback(
    (points: number) => {
      setState((prev) => {
        // Calculate new shield if enough points
        const currentPoints = (prev.totalEarned * POINTS_PER_SHIELD) % POINTS_PER_SHIELD;
        const newTotalPoints = currentPoints + points;
        const newShieldsEarned = Math.floor(newTotalPoints / POINTS_PER_SHIELD);

        if (newShieldsEarned > 0 && prev.shields < prev.maxShields) {
          return {
            ...prev,
            shields: Math.min(prev.maxShields, prev.shields + newShieldsEarned),
            totalEarned: prev.totalEarned + newShieldsEarned,
            lastEarnedAt: new Date().toISOString(),
          };
        }

        return prev;
      });
    },
    [setState]
  );

  // Reset weekly usage (called at start of new week)
  const resetWeeklyUsage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      usedThisWeek: false,
      protectedDates: [], // Clear old protected dates
    }));
  }, [setState]);

  // Calculate progress toward next shield
  const progressToNextShield = useMemo(() => {
    const currentPoints = (state.totalEarned * POINTS_PER_SHIELD) % POINTS_PER_SHIELD;
    // Estimate based on usage patterns
    return {
      current: currentPoints,
      needed: POINTS_PER_SHIELD,
      percentage: (currentPoints / POINTS_PER_SHIELD) * 100,
    };
  }, [state.totalEarned]);

  // Check if can earn more shields
  const canEarnMore = useMemo(() => {
    return state.shields < state.maxShields;
  }, [state.shields, state.maxShields]);

  return {
    shields: state.shields,
    maxShields: state.maxShields,
    usedThisWeek: state.usedThisWeek,
    totalUsed: state.totalUsed,
    protectedDates: state.protectedDates,
    progressToNextShield,
    canEarnMore,
    useShield,
    awardPoints,
    resetWeeklyUsage,
    isDateProtected,
  };
}
