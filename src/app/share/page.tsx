'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWinCards } from '@/hooks';
import { Download, Share2, Copy, Check, Leaf, Droplets, Zap, TreePine, Sparkles } from 'lucide-react';
import { calculateEquivalencies } from '@/lib/constants';
import html2canvas from 'html2canvas';

type CardTemplate = 'weekly' | 'impact' | 'streak';
type ColorScheme = 'emerald' | 'ocean' | 'sunset' | 'forest';

const COLOR_SCHEMES: Record<ColorScheme, { from: string; to: string; accent: string }> = {
  emerald: { from: 'from-emerald-600', to: 'to-teal-700', accent: 'text-emerald-300' },
  ocean: { from: 'from-blue-600', to: 'to-cyan-700', accent: 'text-cyan-300' },
  sunset: { from: 'from-orange-500', to: 'to-rose-600', accent: 'text-amber-300' },
  forest: { from: 'from-green-700', to: 'to-emerald-900', accent: 'text-green-300' },
};

export default function SharePage() {
  const [template, setTemplate] = useState<CardTemplate>('weekly');
  const [colorScheme, setColorScheme] = useState<ColorScheme>('emerald');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const { winCards, getWeeklyImpact, getTotalImpact, isLoaded } = useWinCards();

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  const weeklyImpact = getWeeklyImpact();
  const totalImpact = getTotalImpact();
  const equivalencies = calculateEquivalencies(
    totalImpact.co2Kg,
    totalImpact.waterLiters,
    totalImpact.energyKwh
  );
  const maxStreak = Math.max(...winCards.map(c => c.streak), 0);
  const weeklyCompletions = winCards.reduce(
    (sum, c) => sum + c.weeklyStamps.filter(s => s.isStamped).length,
    0
  );
  const totalCompletions = winCards.reduce((sum, c) => sum + c.totalCompletions, 0);

  const colors = COLOR_SCHEMES[colorScheme];

  const downloadCard = useCallback(async () => {
    if (!cardRef.current) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `greenwins-${template}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to generate image:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [template]);

  const shareCard = useCallback(async () => {
    if (!cardRef.current || !navigator.share) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        logging: false,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], 'greenwins-achievement.png', { type: 'image/png' });

        await navigator.share({
          title: 'My GreenWins Achievement',
          text: `I've saved ${totalImpact.co2Kg.toFixed(1)}kg of CO₂ with GreenWins! 🌱`,
          files: [file],
        });
      });
    } catch (error) {
      console.error('Failed to share:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [totalImpact.co2Kg]);

  const copyStats = useCallback(() => {
    const text = `🌱 My GreenWins Impact:
🍃 ${totalImpact.co2Kg.toFixed(1)}kg CO₂ saved
💧 ${Math.round(totalImpact.waterLiters)}L water saved
⚡ ${totalImpact.energyKwh.toFixed(1)}kWh energy saved
🔥 ${maxStreak} day streak

Track your sustainability at greenwins.app`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [totalImpact, maxStreak]);

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
          Share Your <span className="text-gradient">Impact</span>
        </h1>
        <p className="text-slate-400">Generate beautiful achievement cards to share with friends</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card Preview */}
        <div>
          <div className="sticky top-24">
            <h2 className="text-lg font-semibold text-white mb-4">Preview</h2>

            {/* Shareable Card */}
            <div
              ref={cardRef}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colors.from} ${colors.to} p-6 aspect-[4/3]`}
            >
              {/* Pattern overlay */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />

              {/* Content */}
              <div className="relative h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <Leaf className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-white text-lg">GreenWins</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span className={`text-sm font-medium ${colors.accent}`}>
                      {template === 'weekly' ? 'Weekly Wins' : template === 'impact' ? 'Total Impact' : 'Streak Master'}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex-1 flex flex-col justify-center">
                  {template === 'weekly' && (
                    <div className="text-center">
                      <p className={`text-sm ${colors.accent} mb-2`}>This Week</p>
                      <p className="text-5xl font-bold text-white mb-2">{weeklyCompletions}</p>
                      <p className="text-white/80">sustainable actions completed</p>
                      <div className="mt-6 flex justify-center gap-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-white">{weeklyImpact.co2Kg.toFixed(1)}</p>
                          <p className="text-xs text-white/60">kg CO₂</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-white">{Math.round(weeklyImpact.waterLiters)}</p>
                          <p className="text-xs text-white/60">L water</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-white">{maxStreak}</p>
                          <p className="text-xs text-white/60">day streak</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {template === 'impact' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
                        <Leaf className="w-8 h-8 text-white/80 mx-auto mb-2" />
                        <p className="text-3xl font-bold text-white">{totalImpact.co2Kg.toFixed(1)}</p>
                        <p className="text-xs text-white/60">kg CO₂ saved</p>
                      </div>
                      <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
                        <Droplets className="w-8 h-8 text-white/80 mx-auto mb-2" />
                        <p className="text-3xl font-bold text-white">{Math.round(totalImpact.waterLiters)}</p>
                        <p className="text-xs text-white/60">L water saved</p>
                      </div>
                      <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
                        <Zap className="w-8 h-8 text-white/80 mx-auto mb-2" />
                        <p className="text-3xl font-bold text-white">{totalImpact.energyKwh.toFixed(1)}</p>
                        <p className="text-xs text-white/60">kWh energy saved</p>
                      </div>
                      <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
                        <TreePine className="w-8 h-8 text-white/80 mx-auto mb-2" />
                        <p className="text-3xl font-bold text-white">{equivalencies.treesPlanted}</p>
                        <p className="text-xs text-white/60">trees equivalent</p>
                      </div>
                    </div>
                  )}

                  {template === 'streak' && (
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                        <span className="text-5xl">🔥</span>
                      </div>
                      <p className="text-6xl font-bold text-white mb-2">{maxStreak}</p>
                      <p className="text-xl text-white/80">Day Streak</p>
                      <p className={`text-sm ${colors.accent} mt-4`}>
                        {totalCompletions} total actions completed
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="text-center text-white/50 text-xs">
                  greenwins.app • {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4">
              <motion.button
                onClick={downloadCard}
                disabled={isGenerating}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-400 transition-colors disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
                Download
              </motion.button>

              {canShare && (
                <motion.button
                  onClick={shareCard}
                  disabled={isGenerating}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600 transition-colors disabled:opacity-50"
                >
                  <Share2 className="w-5 h-5" />
                  Share
                </motion.button>
              )}

              <motion.button
                onClick={copyStats}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600 transition-colors"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Customization Options */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Customize</h2>

          {/* Template Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-3">Template</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'weekly', label: 'Weekly', icon: '📅' },
                { id: 'impact', label: 'Impact', icon: '🌍' },
                { id: 'streak', label: 'Streak', icon: '🔥' },
              ].map((t) => (
                <motion.button
                  key={t.id}
                  onClick={() => setTemplate(t.id as CardTemplate)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    p-4 rounded-xl text-center transition-all
                    ${template === t.id
                      ? 'bg-emerald-500/20 border-2 border-emerald-500'
                      : 'bg-slate-800/50 border-2 border-slate-700/50 hover:border-slate-600'
                    }
                  `}
                >
                  <span className="text-2xl mb-2 block">{t.icon}</span>
                  <span className={`text-sm font-medium ${template === t.id ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {t.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Color Scheme */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-3">Color Scheme</label>
            <div className="flex gap-3">
              {(Object.keys(COLOR_SCHEMES) as ColorScheme[]).map((scheme) => {
                const schemeColors = COLOR_SCHEMES[scheme];
                return (
                  <motion.button
                    key={scheme}
                    onClick={() => setColorScheme(scheme)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      w-12 h-12 rounded-xl bg-gradient-to-br ${schemeColors.from} ${schemeColors.to}
                      ${colorScheme === scheme ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}
                    `}
                  />
                );
              })}
            </div>
          </div>

          {/* Stats Preview */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <h3 className="text-sm font-medium text-slate-300 mb-3">Your Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Total CO₂ Saved</span>
                <span className="text-white font-medium">{totalImpact.co2Kg.toFixed(1)} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Water Saved</span>
                <span className="text-white font-medium">{Math.round(totalImpact.waterLiters)} L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Energy Saved</span>
                <span className="text-white font-medium">{totalImpact.energyKwh.toFixed(1)} kWh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Streak</span>
                <span className="text-white font-medium">{maxStreak} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">This Week</span>
                <span className="text-white font-medium">{weeklyCompletions} actions</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Actions</span>
                <span className="text-white font-medium">{totalCompletions} actions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
