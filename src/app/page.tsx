'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useWinCards, useSound, useConfetti, useStreakInsurance } from '@/hooks';
import { WinCardsGrid, ActionPicker, StampAnalysisModal } from '@/components/features/win-cards';
import { ImpactSummary } from '@/components/features/impact';
import { CoachNudgeBanner, CoachPanel } from '@/components/features/coach';
import { TeamPanel } from '@/components/features/team';
import { StreakInsuranceBadge } from '@/components/features/streak';
import { WeeklyNarrative } from '@/components/features/narrative';
import { SeasonalTips } from '@/components/features/seasonal';
import { Sparkles, Calendar, Brain, Users, BookOpen, Leaf } from 'lucide-react';
import { StampAnalysis, AICalculatedImpact, SustainabilityAction } from '@/types';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface AnalysisModalState {
  isOpen: boolean;
  cardId: string | null;
  dayIndex: number | null;
  action: SustainabilityAction | null;
}

export default function HomePage() {
  const {
    winCards,
    actions,
    isLoaded,
    addWinCard,
    removeWinCard,
    toggleStamp,
    addCustomAction,
    getActionById,
    getWeeklyImpact,
    getTotalImpact,
    getTodayIndex,
  } = useWinCards();

  const { playSound } = useSound();
  const { fireStampConfetti } = useConfetti();
  const { awardPoints } = useStreakInsurance();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'cards' | 'coach' | 'team' | 'story'>('cards');
  const [analysisModalState, setAnalysisModalState] = useState<AnalysisModalState>({
    isOpen: false,
    cardId: null,
    dayIndex: null,
    action: null,
  });

  const todayIndex = getTodayIndex();
  const todayName = DAYS_OF_WEEK[todayIndex];

  const handleStampClick = useCallback(
    (cardId: string, dayIndex: number) => {
      const card = winCards.find((c) => c.id === cardId);
      if (!card) return;

      const stamp = card.weeklyStamps[dayIndex];
      const action = getActionById(card.actionId);

      // If already stamped, just toggle off
      if (stamp?.isStamped) {
        toggleStamp(cardId, dayIndex);
        playSound('unstamp');
        return;
      }

      // If not stamped, open the analysis modal
      if (action) {
        setAnalysisModalState({
          isOpen: true,
          cardId,
          dayIndex,
          action,
        });
      }
    },
    [winCards, getActionById, toggleStamp, playSound]
  );

  const handleAnalysisModalSave = useCallback(
    (data: {
      userDescription: string;
      analysis?: StampAnalysis;
      aiCalculatedImpact?: AICalculatedImpact;
    }) => {
      const { cardId, dayIndex } = analysisModalState;
      if (cardId === null || dayIndex === null) return;

      const wasStamped = toggleStamp(cardId, dayIndex, {
        userDescription: data.userDescription,
        analysis: data.analysis,
        aiCalculatedImpact: data.aiCalculatedImpact,
        impact: data.aiCalculatedImpact,
      });

      if (wasStamped) {
        playSound('stamp');
        fireStampConfetti(window.innerWidth / 2, window.innerHeight / 2);
        // Award points toward streak insurance shields
        awardPoints(10);
      }

      setAnalysisModalState({
        isOpen: false,
        cardId: null,
        dayIndex: null,
        action: null,
      });
    },
    [analysisModalState, toggleStamp, playSound, fireStampConfetti, awardPoints]
  );

  const handleAnalysisModalClose = useCallback(() => {
    setAnalysisModalState({
      isOpen: false,
      cardId: null,
      dayIndex: null,
      action: null,
    });
  }, []);

  const handleAddCard = useCallback(
    (actionId: string) => {
      addWinCard(actionId);
      playSound('achievement');
    },
    [addWinCard, playSound]
  );

  const handleRemoveCard = useCallback(
    (cardId: string) => {
      removeWinCard(cardId);
    },
    [removeWinCard]
  );

  const weeklyImpact = getWeeklyImpact();
  const totalImpact = getTotalImpact();
  const existingActionIds = winCards.map((card) => card.actionId);

  if (!isLoaded) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Your <span className="text-gradient">Green Wins</span>
            </h1>
            <div className="flex items-center gap-2 text-slate-400">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">
                Happy <span className="text-emerald-400 font-medium">{todayName}</span>! Stamp your wins for today.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StreakInsuranceBadge compact />
            {winCards.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-300">
                  <span className="font-bold">{winCards.length}</span> tracked
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Coach Nudge Banner */}
        <CoachNudgeBanner />

        {/* Impact Summary */}
        {winCards.length > 0 && (
          <div className="mt-4">
            <ImpactSummary weeklyImpact={weeklyImpact} totalImpact={totalImpact} />
          </div>
        )}
      </motion.div>

      {/* Feature Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'cards', label: 'Win Cards', icon: Leaf },
          { id: 'coach', label: 'AI Coach', icon: Brain },
          { id: 'team', label: 'Team', icon: Users },
          { id: 'story', label: 'My Story', icon: BookOpen },
        ].map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'cards' && (
        <>
          {/* Win Cards Grid */}
          {winCards.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                <span className="text-5xl">🌱</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Start Your Green Journey</h2>
              <p className="text-slate-400 max-w-md mx-auto mb-6">
                Add your first sustainability action and begin tracking your positive impact on the planet.
              </p>
              <motion.button
                onClick={() => setIsPickerOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-shadow"
              >
                Add Your First Action
              </motion.button>
            </motion.div>
          ) : (
            <WinCardsGrid
              cards={winCards}
              actions={actions}
              onStampClick={handleStampClick}
              onAddCard={() => setIsPickerOpen(true)}
              onRemoveCard={handleRemoveCard}
              todayIndex={todayIndex}
              getActionById={getActionById}
            />
          )}

          {/* Seasonal Tips - shown below cards */}
          {winCards.length > 0 && (
            <div className="mt-8">
              <SeasonalTips compact />
            </div>
          )}
        </>
      )}

      {activeTab === 'coach' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <CoachPanel />
          <SeasonalTips />
        </motion.div>
      )}

      {activeTab === 'team' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <TeamPanel />
        </motion.div>
      )}

      {activeTab === 'story' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <WeeklyNarrative />
          <StreakInsuranceBadge />
        </motion.div>
      )}

      {/* Action Picker Modal */}
      <ActionPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelectAction={handleAddCard}
        onCreateCustom={(action) => {
          const newAction = addCustomAction(action);
          addWinCard(newAction.id);
          playSound('achievement');
        }}
        existingActionIds={existingActionIds}
      />

      {/* Stamp Analysis Modal */}
      {analysisModalState.action && (
        <StampAnalysisModal
          isOpen={analysisModalState.isOpen}
          onClose={handleAnalysisModalClose}
          onSave={handleAnalysisModalSave}
          action={analysisModalState.action}
          dayLabel={analysisModalState.dayIndex !== null ? DAYS_OF_WEEK[analysisModalState.dayIndex] : ''}
        />
      )}
    </div>
  );
}
