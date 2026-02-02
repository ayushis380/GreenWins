'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Bell,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  PartyPopper,
  X,
  ChevronRight,
  Lightbulb,
  RefreshCw,
} from 'lucide-react';
import { useCoach } from '@/hooks';
import { CoachNudge, CoachInsight } from '@/types';
import Link from 'next/link';

interface NudgeCardProps {
  nudge: CoachNudge;
  onDismiss: () => void;
  onAct?: () => void;
}

function NudgeCard({ nudge, onDismiss, onAct }: NudgeCardProps) {
  const getIcon = () => {
    switch (nudge.type) {
      case 'reminder':
        return <Bell className="w-5 h-5" />;
      case 'suggestion':
        return <Lightbulb className="w-5 h-5" />;
      case 'encouragement':
        return <Sparkles className="w-5 h-5" />;
      case 'celebration':
        return <PartyPopper className="w-5 h-5" />;
    }
  };

  const getColors = () => {
    switch (nudge.priority) {
      case 'high':
        return {
          bg: 'from-amber-500/10 to-orange-500/10',
          border: 'border-amber-500/30',
          icon: 'text-amber-400 bg-amber-500/20',
          title: 'text-amber-300',
        };
      case 'medium':
        return {
          bg: 'from-emerald-500/10 to-teal-500/10',
          border: 'border-emerald-500/30',
          icon: 'text-emerald-400 bg-emerald-500/20',
          title: 'text-emerald-300',
        };
      default:
        return {
          bg: 'from-slate-500/10 to-slate-600/10',
          border: 'border-slate-500/30',
          icon: 'text-slate-400 bg-slate-500/20',
          title: 'text-slate-300',
        };
    }
  };

  const colors = getColors();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      className={`p-4 rounded-xl bg-gradient-to-r ${colors.bg} border ${colors.border} relative group`}
    >
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-slate-700/50 transition-all"
      >
        <X className="w-4 h-4 text-slate-400" />
      </button>

      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${colors.icon}`}>{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium ${colors.title} mb-1`}>{nudge.title}</h4>
          <p className="text-sm text-slate-400 leading-relaxed">{nudge.message}</p>

          {/* Reasoning chain (collapsible on hover) */}
          <div className="mt-2 text-xs text-slate-500 italic">
            <Brain className="w-3 h-3 inline mr-1" />
            {nudge.reasoning}
          </div>

          {nudge.actionId && onAct && (
            <motion.button
              onClick={onAct}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-3 flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Take action <ChevronRight className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface InsightCardProps {
  insight: CoachInsight;
}

function InsightCard({ insight }: InsightCardProps) {
  const getIcon = () => {
    switch (insight.type) {
      case 'pattern':
        return <TrendingUp className="w-5 h-5" />;
      case 'prediction':
        return <AlertTriangle className="w-5 h-5" />;
      case 'recommendation':
        return <Lightbulb className="w-5 h-5" />;
    }
  };

  const getColors = () => {
    switch (insight.type) {
      case 'pattern':
        return 'text-teal-400 bg-teal-500/20';
      case 'prediction':
        return 'text-purple-400 bg-purple-500/20';
      case 'recommendation':
        return 'text-amber-400 bg-amber-500/20';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30"
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${getColors()}`}>{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium text-slate-200">{insight.title}</h4>
            <span className="text-xs text-slate-500">
              {Math.round(insight.confidence * 100)}% confident
            </span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">{insight.description}</p>

          {insight.dataPoints.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {insight.dataPoints.slice(0, 3).map((point, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400"
                >
                  {point}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function CoachPanel() {
  const { nudges, insights, isRunning, runCoach, dismissNudge, actOnNudge, lastRunAt } =
    useCoach();

  if (nudges.length === 0 && insights.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700/30 text-center">
        <Brain className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-slate-300 mb-2">Coach is analyzing...</h3>
        <p className="text-sm text-slate-500 mb-4">
          Start tracking your sustainable actions and the AI coach will provide personalized
          insights and nudges.
        </p>
        <motion.button
          onClick={runCoach}
          disabled={isRunning}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Run Analysis'
          )}
        </motion.button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
            <Brain className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">AI Coach</h2>
            <p className="text-xs text-slate-500">
              {lastRunAt
                ? `Last analyzed ${new Date(lastRunAt).toLocaleTimeString()}`
                : 'Analyzing your habits...'}
            </p>
          </div>
        </div>
        <motion.button
          onClick={runCoach}
          disabled={isRunning}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors disabled:opacity-50"
          title="Refresh analysis"
        >
          <RefreshCw className={`w-4 h-4 text-slate-400 ${isRunning ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>

      {/* Nudges Section */}
      {nudges.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Smart Nudges
          </h3>
          <AnimatePresence>
            {nudges.map((nudge) => (
              <NudgeCard
                key={nudge.id}
                nudge={nudge}
                onDismiss={() => dismissNudge(nudge.id)}
                onAct={nudge.actionId ? () => actOnNudge(nudge.id) : undefined}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Insights Section */}
      {insights.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Insights
          </h3>
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}

      {/* Link to full observability */}
      <Link
        href="/observability"
        className="block text-center text-sm text-slate-500 hover:text-slate-400 transition-colors"
      >
        View full AI analytics →
      </Link>
    </div>
  );
}

// Compact version for sidebar/home
export function CoachNudgeBanner() {
  const { highPriorityNudges, dismissNudge, actOnNudge } = useCoach();

  if (highPriorityNudges.length === 0) return null;

  const nudge = highPriorityNudges[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30"
    >
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-lg bg-amber-500/20">
          <Brain className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-amber-300 font-medium truncate">{nudge.title}</p>
          <p className="text-xs text-slate-400 truncate">{nudge.message}</p>
        </div>
        <div className="flex items-center gap-1">
          {nudge.actionId && (
            <button
              onClick={() => actOnNudge(nudge.id)}
              className="p-1.5 rounded-lg hover:bg-slate-700/50 text-emerald-400"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => dismissNudge(nudge.id)}
            className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
