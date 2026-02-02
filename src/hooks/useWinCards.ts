'use client';

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { WinCard, WeeklyStamp, SustainabilityAction, ImpactMetrics, StampAnalysis, AICalculatedImpact } from '@/types';
import { STORAGE_KEYS, getStorageItem, setStorageItem } from '@/lib/storage/localStorage';
import { PREDEFINED_ACTIONS } from '@/lib/constants';

function getWeekDates(): string[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
}

function getTodayIndex(): number {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1; // Convert Sunday=0 to index 6
}

function createEmptyWeeklyStamps(): WeeklyStamp[] {
  const dates = getWeekDates();
  return dates.map((date, index) => ({
    dayIndex: index,
    date,
    isStamped: false,
  }));
}

export function useWinCards() {
  const [winCards, setWinCards] = useState<WinCard[]>([]);
  const [actions, setActions] = useState<SustainabilityAction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data on mount
  useEffect(() => {
    const savedCards = getStorageItem<WinCard[]>(STORAGE_KEYS.WIN_CARDS, []);
    const savedActions = getStorageItem<SustainabilityAction[]>(STORAGE_KEYS.ACTIONS, PREDEFINED_ACTIONS);

    // Check if we need to reset weekly stamps (new week)
    const currentWeekDates = getWeekDates();
    const updatedCards = savedCards.map(card => {
      if (card.weeklyStamps.length === 0 || card.weeklyStamps[0].date !== currentWeekDates[0]) {
        return {
          ...card,
          weeklyStamps: createEmptyWeeklyStamps(),
        };
      }
      return card;
    });

    setWinCards(updatedCards);
    setActions(savedActions);
    setIsLoaded(true);
  }, []);

  // Save cards whenever they change
  useEffect(() => {
    if (isLoaded) {
      setStorageItem(STORAGE_KEYS.WIN_CARDS, winCards);
    }
  }, [winCards, isLoaded]);

  // Save actions whenever they change
  useEffect(() => {
    if (isLoaded) {
      setStorageItem(STORAGE_KEYS.ACTIONS, actions);
    }
  }, [actions, isLoaded]);

  const addWinCard = useCallback((actionId: string) => {
    const existingCard = winCards.find(card => card.actionId === actionId);
    if (existingCard) return existingCard;

    const newCard: WinCard = {
      id: uuidv4(),
      actionId,
      weeklyStamps: createEmptyWeeklyStamps(),
      streak: 0,
      longestStreak: 0,
      totalCompletions: 0,
      createdAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
    };

    setWinCards(prev => [...prev, newCard]);
    return newCard;
  }, [winCards]);

  const removeWinCard = useCallback((cardId: string) => {
    setWinCards(prev => prev.filter(card => card.id !== cardId));
  }, []);

  interface StampOptions {
    impact?: ImpactMetrics;
    userDescription?: string;
    analysis?: StampAnalysis;
    aiCalculatedImpact?: AICalculatedImpact;
  }

  const toggleStamp = useCallback((cardId: string, dayIndex: number, options?: StampOptions) => {
    const todayIndex = getTodayIndex();

    // Can only stamp today or past days
    if (dayIndex > todayIndex) return null;

    setWinCards(prev => prev.map(card => {
      if (card.id !== cardId) return card;

      const newStamps = [...card.weeklyStamps];
      const currentStamp = newStamps[dayIndex];
      const wasStamped = currentStamp.isStamped;

      newStamps[dayIndex] = {
        ...currentStamp,
        isStamped: !wasStamped,
        stampedAt: !wasStamped ? new Date().toISOString() : undefined,
        impactCalculated: !wasStamped ? options?.impact : undefined,
        userDescription: !wasStamped ? options?.userDescription : undefined,
        analysis: !wasStamped ? options?.analysis : undefined,
        aiCalculatedImpact: !wasStamped ? options?.aiCalculatedImpact : undefined,
      };

      // Calculate new streak
      let streak = 0;
      for (let i = todayIndex; i >= 0; i--) {
        if (newStamps[i].isStamped) {
          streak++;
        } else {
          break;
        }
      }

      const totalCompletions = card.totalCompletions + (wasStamped ? -1 : 1);

      return {
        ...card,
        weeklyStamps: newStamps,
        streak,
        longestStreak: Math.max(card.longestStreak, streak),
        totalCompletions: Math.max(0, totalCompletions),
        lastUpdatedAt: new Date().toISOString(),
      };
    }));

    const card = winCards.find(c => c.id === cardId);
    const wasStamped = card?.weeklyStamps[dayIndex]?.isStamped;
    return !wasStamped; // Return whether it was stamped (true) or unstamped (false)
  }, [winCards]);

  const updateStampAnalysis = useCallback((
    cardId: string,
    dayIndex: number,
    userDescription: string,
    analysis: StampAnalysis,
    aiCalculatedImpact?: AICalculatedImpact
  ) => {
    setWinCards(prev => prev.map(card => {
      if (card.id !== cardId) return card;

      const newStamps = [...card.weeklyStamps];
      newStamps[dayIndex] = {
        ...newStamps[dayIndex],
        userDescription,
        analysis,
        aiCalculatedImpact,
      };

      return {
        ...card,
        weeklyStamps: newStamps,
        lastUpdatedAt: new Date().toISOString(),
      };
    }));
  }, []);

  const addCustomAction = useCallback((action: Omit<SustainabilityAction, 'id' | 'createdAt' | 'isCustom'>) => {
    const newAction: SustainabilityAction = {
      ...action,
      id: uuidv4(),
      isCustom: true,
      createdAt: new Date().toISOString(),
    };
    setActions(prev => [...prev, newAction]);
    return newAction;
  }, []);

  const getActionById = useCallback((actionId: string) => {
    return actions.find(action => action.id === actionId);
  }, [actions]);

  const getWeeklyImpact = useCallback((): ImpactMetrics => {
    let co2Kg = 0;
    let waterLiters = 0;
    let energyKwh = 0;
    let treesEquivalent = 0;

    winCards.forEach(card => {
      const action = getActionById(card.actionId);
      if (!action) return;

      card.weeklyStamps.forEach(stamp => {
        if (stamp.isStamped) {
          co2Kg += action.impactMetrics.co2Kg;
          waterLiters += action.impactMetrics.waterLiters;
          energyKwh += action.impactMetrics.energyKwh;
          treesEquivalent += action.impactMetrics.treesEquivalent;
        }
      });
    });

    return { co2Kg, waterLiters, energyKwh, treesEquivalent };
  }, [winCards, getActionById]);

  const getTotalImpact = useCallback((): ImpactMetrics => {
    let co2Kg = 0;
    let waterLiters = 0;
    let energyKwh = 0;
    let treesEquivalent = 0;

    winCards.forEach(card => {
      const action = getActionById(card.actionId);
      if (!action) return;

      co2Kg += action.impactMetrics.co2Kg * card.totalCompletions;
      waterLiters += action.impactMetrics.waterLiters * card.totalCompletions;
      energyKwh += action.impactMetrics.energyKwh * card.totalCompletions;
      treesEquivalent += action.impactMetrics.treesEquivalent * card.totalCompletions;
    });

    return { co2Kg, waterLiters, energyKwh, treesEquivalent };
  }, [winCards, getActionById]);

  const getTodayIndex = useCallback(() => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1;
  }, []);

  return {
    winCards,
    actions,
    isLoaded,
    addWinCard,
    removeWinCard,
    toggleStamp,
    updateStampAnalysis,
    addCustomAction,
    getActionById,
    getWeeklyImpact,
    getTotalImpact,
    getTodayIndex,
    getWeekDates,
  };
}
