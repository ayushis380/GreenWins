'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { CoachNudge, CoachInsight } from '@/types';
import { runCoachAgent } from '@/lib/coach';
import { useWinCards } from './useWinCards';

const COACH_STATE_KEY = 'greenwins_coach';

interface CoachState {
  nudges: CoachNudge[];
  insights: CoachInsight[];
  lastRunAt: string;
  dismissedNudgeIds: string[];
}

const INITIAL_STATE: CoachState = {
  nudges: [],
  insights: [],
  lastRunAt: '',
  dismissedNudgeIds: [],
};

export function useCoach() {
  const [state, setState] = useLocalStorage<CoachState>(COACH_STATE_KEY, INITIAL_STATE);
  const { winCards, actions } = useWinCards();
  const [isRunning, setIsRunning] = useState(false);

  // Run the coach agent
  const runCoach = useCallback(() => {
    if (winCards.length === 0) return;

    setIsRunning(true);

    try {
      const result = runCoachAgent(winCards, actions);

      setState((prev) => ({
        ...prev,
        nudges: result.nudges,
        insights: result.insights,
        lastRunAt: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Coach agent error:', error);
    } finally {
      setIsRunning(false);
    }
  }, [winCards, actions, setState]);

  // Auto-run coach when cards change (debounced)
  useEffect(() => {
    const now = new Date();
    const lastRun = state.lastRunAt ? new Date(state.lastRunAt) : null;

    // Run if never run, or if more than 1 hour since last run
    if (!lastRun || now.getTime() - lastRun.getTime() > 60 * 60 * 1000) {
      const timer = setTimeout(() => {
        runCoach();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [winCards.length, runCoach, state.lastRunAt]);

  // Dismiss a nudge
  const dismissNudge = useCallback(
    (nudgeId: string) => {
      setState((prev) => ({
        ...prev,
        nudges: prev.nudges.map((n) =>
          n.id === nudgeId ? { ...n, dismissedAt: new Date().toISOString() } : n
        ),
        dismissedNudgeIds: [...prev.dismissedNudgeIds, nudgeId],
      }));
    },
    [setState]
  );

  // Mark a nudge as acted on
  const actOnNudge = useCallback(
    (nudgeId: string) => {
      setState((prev) => ({
        ...prev,
        nudges: prev.nudges.map((n) =>
          n.id === nudgeId ? { ...n, actedOn: true, dismissedAt: new Date().toISOString() } : n
        ),
      }));
    },
    [setState]
  );

  // Get active (non-dismissed) nudges
  const activeNudges = useMemo(
    () =>
      state.nudges.filter(
        (n) => !n.dismissedAt && !state.dismissedNudgeIds.includes(n.id)
      ),
    [state.nudges, state.dismissedNudgeIds]
  );

  // Get high priority nudges for prominent display
  const highPriorityNudges = useMemo(
    () => activeNudges.filter((n) => n.priority === 'high'),
    [activeNudges]
  );

  // Clear all coach data
  const clearCoachData = useCallback(() => {
    setState(INITIAL_STATE);
  }, [setState]);

  return {
    nudges: activeNudges,
    highPriorityNudges,
    insights: state.insights,
    lastRunAt: state.lastRunAt,
    isRunning,
    runCoach,
    dismissNudge,
    actOnNudge,
    clearCoachData,
  };
}
