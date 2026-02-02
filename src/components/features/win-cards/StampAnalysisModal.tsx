'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SustainabilityAction, StampAnalysis, AICalculatedImpact } from '@/types';
import { X, Sparkles, Loader2, Leaf, TrendingUp, Lightbulb, Check, Edit3, ThumbsUp, ThumbsDown, Gauge } from 'lucide-react';
import { useObservability } from '@/hooks';

interface StampAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    userDescription: string;
    analysis?: StampAnalysis;
    aiCalculatedImpact?: AICalculatedImpact;
  }) => void;
  action: SustainabilityAction;
  dayLabel: string;
}

const DESCRIPTION_SUGGESTIONS = [
  "Describe in a comparative tone: 'I used to do X, but now I did Y'",
  "Simply mention the sustainable action you performed",
  "Share what made today's action special",
];

export function StampAnalysisModal({
  isOpen,
  onClose,
  onSave,
  action,
  dayLabel,
}: StampAnalysisModalProps) {
  const [userDescription, setUserDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<StampAnalysis | null>(null);
  const [calculatedImpact, setCalculatedImpact] = useState<AICalculatedImpact | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [traceId, setTraceId] = useState<string | null>(null);
  const [isEditingImpact, setIsEditingImpact] = useState(false);
  const [correctedImpact, setCorrectedImpact] = useState<{
    co2Kg: number;
    waterLiters: number;
    energyKwh: number;
  } | null>(null);
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);

  const { recordTrace, addFeedback, addCorrection } = useObservability();

  const handleAnalyze = async () => {
    if (!userDescription.trim()) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini/analyze-stamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionName: action.name,
          actionCategory: action.category,
          actionDescription: action.description,
          userDescription: userDescription.trim(),
          baseImpactMetrics: action.impactMetrics,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      setCalculatedImpact(data.calculatedImpact);

      // Record trace from API response
      if (data.trace) {
        recordTrace({
          id: data.trace.id,
          endpoint: data.trace.endpoint,
          model: data.trace.model,
          latencyMs: data.trace.latencyMs,
          status: data.trace.status,
          tokenUsage: data.trace.tokenUsage,
          confidence: data.trace.confidence,
          requestPayload: { actionName: action.name, userDescription: userDescription.trim() },
          responsePayload: { analysis: data.analysis, calculatedImpact: data.calculatedImpact },
        });
        setTraceId(data.trace.id);
      }
    } catch {
      setError('Failed to analyze your action. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFeedback = (rating: 'positive' | 'negative') => {
    setFeedback(rating);
    if (traceId) {
      addFeedback(traceId, rating);
    }
  };

  const handleStartCorrection = () => {
    if (calculatedImpact) {
      setCorrectedImpact({
        co2Kg: calculatedImpact.co2Kg,
        waterLiters: calculatedImpact.waterLiters,
        energyKwh: calculatedImpact.energyKwh,
      });
      setIsEditingImpact(true);
    }
  };

  const handleSaveCorrection = () => {
    if (correctedImpact && calculatedImpact && traceId) {
      // Record the correction in observability
      addCorrection(
        traceId,
        {
          co2Kg: calculatedImpact.co2Kg,
          waterLiters: calculatedImpact.waterLiters,
          energyKwh: calculatedImpact.energyKwh,
        },
        correctedImpact
      );

      // Update the calculated impact with corrected values
      setCalculatedImpact({
        ...calculatedImpact,
        co2Kg: correctedImpact.co2Kg,
        waterLiters: correctedImpact.waterLiters,
        energyKwh: correctedImpact.energyKwh,
        methodology: calculatedImpact.methodology + ' (User corrected)',
      });
    }
    setIsEditingImpact(false);
  };

  const handleSave = () => {
    onSave({
      userDescription: userDescription.trim(),
      analysis: analysis || undefined,
      aiCalculatedImpact: calculatedImpact || undefined,
    });
    handleClose();
  };

  const handleClose = () => {
    setUserDescription('');
    setAnalysis(null);
    setCalculatedImpact(null);
    setError(null);
    setTraceId(null);
    setIsEditingImpact(false);
    setCorrectedImpact(null);
    setFeedback(null);
    onClose();
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-emerald-400';
    if (score >= 6) return 'text-teal-400';
    if (score >= 4) return 'text-amber-400';
    return 'text-orange-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 8) return 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30';
    if (score >= 6) return 'from-teal-500/20 to-cyan-500/20 border-teal-500/30';
    if (score >= 4) return 'from-amber-500/20 to-yellow-500/20 border-amber-500/30';
    return 'from-orange-500/20 to-red-500/20 border-orange-500/30';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-xl md:max-h-[85vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-2xl">
                  {action.icon}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{action.name}</h2>
                  <p className="text-sm text-slate-400">{dayLabel}</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-full bg-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Description Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Describe your action
                </label>
                <textarea
                  value={userDescription}
                  onChange={(e) => setUserDescription(e.target.value)}
                  placeholder="e.g., I biked 5 miles to work today instead of driving..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                  disabled={isAnalyzing}
                />

                {/* Suggestions */}
                <div className="mt-3 space-y-1.5">
                  <p className="text-xs text-slate-500 font-medium">Suggestions:</p>
                  {DESCRIPTION_SUGGESTIONS.map((suggestion, index) => (
                    <p key={index} className="text-xs text-slate-400 flex items-start gap-1.5">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      {suggestion}
                    </p>
                  ))}
                </div>
              </div>

              {/* Analyze Button */}
              {!analysis && (
                <motion.button
                  onClick={handleAnalyze}
                  disabled={!userDescription.trim() || isAnalyzing}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 font-medium hover:from-emerald-500/30 hover:to-teal-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Analyze with AI
                    </>
                  )}
                </motion.button>
              )}

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* Analysis Results */}
              {analysis && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Sustainability Score */}
                  <div className={`p-4 rounded-xl bg-gradient-to-r ${getScoreBg(analysis.sustainabilityScore)} border`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-300">Sustainability Score</span>
                      <div className="flex items-center gap-2">
                        <TrendingUp className={`w-4 h-4 ${getScoreColor(analysis.sustainabilityScore)}`} />
                        <span className={`text-2xl font-bold ${getScoreColor(analysis.sustainabilityScore)}`}>
                          {analysis.sustainabilityScore}/10
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${analysis.sustainabilityScore * 10}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                      />
                    </div>
                  </div>

                  {/* AI Insight */}
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-medium text-emerald-400">AI Insight</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{analysis.aiInsight}</p>
                  </div>

                  {/* Comparison & Benefit */}
                  <div className="grid grid-cols-1 gap-3">
                    {analysis.comparisonSummary && (
                      <div className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/20">
                        <p className="text-sm text-teal-300">{analysis.comparisonSummary}</p>
                      </div>
                    )}
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs font-medium text-emerald-400">Environmental Benefit</span>
                      </div>
                      <p className="text-sm text-emerald-300">{analysis.environmentalBenefit}</p>
                    </div>
                  </div>

                  {/* Calculated Impact */}
                  {calculatedImpact && (
                    <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-slate-300">Adjusted Impact</span>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Gauge className="w-3 h-3" />
                            <span>{Math.round(calculatedImpact.confidence * 100)}% confident</span>
                          </div>
                          {!isEditingImpact && (
                            <button
                              onClick={handleStartCorrection}
                              className="p-1 rounded hover:bg-slate-700/50 transition-colors"
                              title="Correct these values"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-slate-400 hover:text-emerald-400" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Normal view */}
                      {!isEditingImpact && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🌿</span>
                            <div>
                              <p className="text-sm font-semibold text-emerald-400">
                                {calculatedImpact.co2Kg.toFixed(2)} kg
                              </p>
                              <p className="text-xs text-slate-500">CO2 saved</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">💧</span>
                            <div>
                              <p className="text-sm font-semibold text-cyan-400">
                                {Math.round(calculatedImpact.waterLiters)} L
                              </p>
                              <p className="text-xs text-slate-500">Water saved</p>
                            </div>
                          </div>
                          {calculatedImpact.energyKwh > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-lg">⚡</span>
                              <div>
                                <p className="text-sm font-semibold text-amber-400">
                                  {calculatedImpact.energyKwh.toFixed(2)} kWh
                                </p>
                                <p className="text-xs text-slate-500">Energy saved</p>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🌳</span>
                            <div>
                              <p className="text-sm font-semibold text-green-400">
                                {calculatedImpact.treesEquivalent.toFixed(3)}
                              </p>
                              <p className="text-xs text-slate-500">Trees equivalent</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Edit mode for human-in-the-loop validation */}
                      {isEditingImpact && correctedImpact && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-3"
                        >
                          <p className="text-xs text-amber-400 mb-2">
                            Correct the AI estimates if they don't match your actual impact:
                          </p>
                          <div className="grid grid-cols-1 gap-2">
                            <div className="flex items-center gap-3">
                              <span className="text-lg w-6">🌿</span>
                              <input
                                type="number"
                                step="0.1"
                                value={correctedImpact.co2Kg}
                                onChange={(e) =>
                                  setCorrectedImpact({
                                    ...correctedImpact,
                                    co2Kg: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white text-sm focus:border-emerald-500/50 focus:outline-none"
                              />
                              <span className="text-xs text-slate-500 w-16">kg CO2</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-lg w-6">💧</span>
                              <input
                                type="number"
                                step="1"
                                value={correctedImpact.waterLiters}
                                onChange={(e) =>
                                  setCorrectedImpact({
                                    ...correctedImpact,
                                    waterLiters: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white text-sm focus:border-emerald-500/50 focus:outline-none"
                              />
                              <span className="text-xs text-slate-500 w-16">L water</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-lg w-6">⚡</span>
                              <input
                                type="number"
                                step="0.1"
                                value={correctedImpact.energyKwh}
                                onChange={(e) =>
                                  setCorrectedImpact({
                                    ...correctedImpact,
                                    energyKwh: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white text-sm focus:border-emerald-500/50 focus:outline-none"
                              />
                              <span className="text-xs text-slate-500 w-16">kWh</span>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => setIsEditingImpact(false)}
                              className="flex-1 py-1.5 rounded-lg bg-slate-700/50 text-slate-300 text-sm hover:bg-slate-700 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveCorrection}
                              className="flex-1 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm hover:bg-emerald-500/30 transition-colors"
                            >
                              Save Correction
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {/* Feedback section for analysis quality */}
                      {!isEditingImpact && (
                        <div className="mt-3 pt-3 border-t border-slate-700/30 flex items-center justify-between">
                          <span className="text-xs text-slate-500">Was this analysis helpful?</span>
                          {feedback === null ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleFeedback('positive')}
                                className="p-1.5 rounded hover:bg-slate-700/50 transition-colors group"
                                title="Helpful"
                              >
                                <ThumbsUp className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
                              </button>
                              <button
                                onClick={() => handleFeedback('negative')}
                                className="p-1.5 rounded hover:bg-slate-700/50 transition-colors group"
                                title="Not helpful"
                              >
                                <ThumbsDown className="w-4 h-4 text-slate-500 group-hover:text-red-400" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs flex items-center gap-1">
                              {feedback === 'positive' ? (
                                <span className="text-emerald-400 flex items-center gap-1">
                                  <ThumbsUp className="w-3 h-3" /> Thanks for the feedback!
                                </span>
                              ) : (
                                <span className="text-slate-500 flex items-center gap-1">
                                  <ThumbsDown className="w-3 h-3" /> We'll improve
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Improvement Tips */}
                  {analysis.improvementTips && analysis.improvementTips.length > 0 && (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-medium text-amber-400">Tips to Improve</span>
                      </div>
                      <ul className="space-y-1.5">
                        {analysis.improvementTips.map((tip, index) => (
                          <li key={index} className="text-sm text-amber-200/80 flex items-start gap-2">
                            <span className="text-amber-500 mt-1">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-700/50 flex gap-3">
              <motion.button
                onClick={handleClose}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 rounded-xl bg-slate-700/50 text-slate-300 font-medium hover:bg-slate-700 transition-all"
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={handleSave}
                disabled={!userDescription.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Save & Stamp
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
