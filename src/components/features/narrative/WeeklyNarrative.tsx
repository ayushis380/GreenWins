'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Sparkles,
  Star,
  Target,
  Share2,
  RefreshCw,
  Loader2,
  CheckCircle,
  X,
} from 'lucide-react';
import { useWinCards, useObservability } from '@/hooks';
import { WeeklyNarrative as WeeklyNarrativeType } from '@/types';

interface NarrativeContent {
  headline: string;
  story: string;
  highlights: string[];
  encouragement: string;
  nextWeekGoal?: string;
}

export function WeeklyNarrative() {
  const { winCards, actions, getWeeklyImpact, getActionById } = useWinCards();
  const { recordTrace } = useObservability();

  const [narrative, setNarrative] = useState<NarrativeContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const weeklyImpact = getWeeklyImpact();

  // Calculate stats for the narrative
  const calculateStats = useCallback(() => {
    let totalStamps = 0;
    let longestStreak = 0;
    const actionCounts: Record<string, number> = {};

    winCards.forEach((card) => {
      const stampCount = card.weeklyStamps.filter((s) => s.isStamped).length;
      totalStamps += stampCount;
      longestStreak = Math.max(longestStreak, card.streak);

      const action = getActionById(card.actionId);
      if (action && stampCount > 0) {
        actionCounts[action.name] = (actionCounts[action.name] || 0) + stampCount;
      }
    });

    const actionBreakdown = Object.entries(actionCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const topAction = actionBreakdown.length > 0 ? actionBreakdown[0].name : 'None';

    return {
      totalStamps,
      uniqueActions: Object.keys(actionCounts).length,
      longestStreak,
      topAction,
      co2Saved: weeklyImpact.co2Kg,
      waterSaved: weeklyImpact.waterLiters,
      energySaved: weeklyImpact.energyKwh,
      actionBreakdown,
    };
  }, [winCards, getActionById, weeklyImpact]);

  const generateNarrative = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const stats = calculateStats();

    if (stats.totalStamps === 0) {
      setError('No actions logged this week yet. Start stamping to generate your story!');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/gemini/weekly-narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats }),
      });

      const data = await response.json();

      if (data.trace) {
        recordTrace({
          id: data.trace.id,
          endpoint: data.trace.endpoint,
          model: data.trace.model,
          latencyMs: data.trace.latencyMs,
          status: data.trace.status,
          tokenUsage: data.trace.tokenUsage,
          confidence: data.trace.confidence,
          requestPayload: { stats },
          responsePayload: data.narrative,
        });
      }

      if (data.narrative) {
        setNarrative(data.narrative);
      } else {
        setError('Failed to generate narrative. Please try again.');
      }
    } catch {
      setError('Failed to generate narrative. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [calculateStats, recordTrace]);

  const stats = calculateStats();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
            <BookOpen className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Your Weekly Story</h2>
            <p className="text-xs text-slate-500">AI-generated narrative of your journey</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="p-3 rounded-lg bg-slate-800/50 text-center">
          <p className="text-lg font-bold text-emerald-400">{stats.totalStamps}</p>
          <p className="text-xs text-slate-500">Actions</p>
        </div>
        <div className="p-3 rounded-lg bg-slate-800/50 text-center">
          <p className="text-lg font-bold text-cyan-400">{stats.co2Saved.toFixed(1)}</p>
          <p className="text-xs text-slate-500">kg CO2</p>
        </div>
        <div className="p-3 rounded-lg bg-slate-800/50 text-center">
          <p className="text-lg font-bold text-amber-400">{stats.longestStreak}</p>
          <p className="text-xs text-slate-500">Day Streak</p>
        </div>
        <div className="p-3 rounded-lg bg-slate-800/50 text-center">
          <p className="text-lg font-bold text-purple-400">{stats.uniqueActions}</p>
          <p className="text-xs text-slate-500">Habits</p>
        </div>
      </div>

      {/* Narrative Content or Generate Button */}
      {!narrative && !isLoading && (
        <motion.button
          onClick={generateNarrative}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={stats.totalStamps === 0}
          className="w-full p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 hover:from-amber-500/20 hover:to-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-center gap-2 text-amber-400">
            <Sparkles className="w-5 h-5" />
            <span className="font-medium">Generate My Weekly Story</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {stats.totalStamps > 0
              ? 'Let AI create a personalized narrative of your sustainability journey'
              : 'Log some actions first to generate your story'}
          </p>
        </motion.button>
      )}

      {/* Loading State */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-6 rounded-xl bg-slate-800/30 border border-slate-700/30 text-center"
        >
          <Loader2 className="w-8 h-8 text-amber-400 mx-auto mb-3 animate-spin" />
          <p className="text-slate-300">Crafting your story...</p>
          <p className="text-xs text-slate-500 mt-1">Analyzing your week's achievements</p>
        </motion.div>
      )}

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Narrative Display */}
      {narrative && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Headline */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30">
            <h3 className="text-xl font-bold text-amber-300 text-center">
              {narrative.headline}
            </h3>
          </div>

          {/* Story */}
          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
            <p className="text-slate-300 leading-relaxed italic">"{narrative.story}"</p>
          </div>

          {/* Highlights */}
          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
            <h4 className="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4" />
              Week Highlights
            </h4>
            <ul className="space-y-2">
              {narrative.highlights.map((highlight, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  {highlight}
                </li>
              ))}
            </ul>
          </div>

          {/* Encouragement */}
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
            <p className="text-purple-300 text-sm">{narrative.encouragement}</p>
          </div>

          {/* Next Week Goal */}
          {narrative.nextWeekGoal && (
            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
              <div className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-400">Suggested goal:</span>
                <span className="text-cyan-300">{narrative.nextWeekGoal}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <motion.button
              onClick={generateNarrative}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-3 rounded-xl bg-slate-700/50 text-slate-300 flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </motion.button>
            <motion.button
              onClick={() => setShowShareModal(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white flex items-center justify-center gap-2 hover:from-emerald-400 hover:to-teal-400 transition-all"
            >
              <Share2 className="w-4 h-4" />
              Share Story
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && narrative && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-4 right-4 top-1/2 -translate-y-1/2 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 z-50"
            >
              <button
                onClick={() => setShowShareModal(false)}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-700"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>

              {/* Share Card Preview */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-900/50 to-teal-900/50 border border-emerald-500/30 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🌱</span>
                  <span className="text-xs text-emerald-400 font-medium">GreenWins Weekly</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{narrative.headline}</h3>
                <p className="text-sm text-slate-300 mb-3">{narrative.story}</p>
                <div className="flex gap-4 text-xs">
                  <span className="text-emerald-400">🌿 {stats.co2Saved.toFixed(1)}kg CO2</span>
                  <span className="text-cyan-400">💧 {Math.round(stats.waterSaved)}L</span>
                  <span className="text-amber-400">🔥 {stats.longestStreak} day streak</span>
                </div>
              </div>

              <p className="text-sm text-slate-400 mb-4 text-center">
                Share your sustainability story!
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const text = `${narrative.headline}\n\n${narrative.story}\n\n🌿 ${stats.co2Saved.toFixed(1)}kg CO2 saved\n💧 ${Math.round(stats.waterSaved)}L water saved\n🔥 ${stats.longestStreak} day streak\n\n#GreenWins #Sustainability`;
                    navigator.clipboard.writeText(text);
                    setShowShareModal(false);
                  }}
                  className="flex-1 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm"
                >
                  Copy Text
                </button>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 py-2 rounded-lg bg-emerald-500 text-white text-sm"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
