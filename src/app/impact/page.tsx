'use client';

import { motion } from 'framer-motion';
import { useWinCards } from '@/hooks';
import { TreePine, Droplets, Zap, Leaf, TrendingUp, Award, Calendar } from 'lucide-react';
import { calculateEquivalencies } from '@/lib/constants';

// Simple tree SVG component
function Tree({ delay = 0, scale = 1 }: { delay?: number; scale?: number }) {
  return (
    <motion.svg
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale, opacity: 1 }}
      transition={{ delay, type: 'spring', stiffness: 200 }}
      width="40"
      height="60"
      viewBox="0 0 40 60"
      className="inline-block"
    >
      {/* Trunk */}
      <rect x="16" y="40" width="8" height="20" fill="#8B5A2B" rx="1" />
      {/* Tree layers */}
      <motion.path
        d="M20 5 L35 25 L28 25 L38 40 L2 40 L12 25 L5 25 Z"
        fill="#10B981"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay + 0.2, duration: 0.5 }}
      />
      <motion.path
        d="M20 0 L32 18 L26 18 L34 32 L6 32 L14 18 L8 18 Z"
        fill="#34D399"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay + 0.3, duration: 0.5 }}
      />
    </motion.svg>
  );
}

// Animated counter component
function AnimatedCounter({ value, suffix = '', prefix = '' }: { value: number; suffix?: string; prefix?: string }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="tabular-nums"
    >
      {prefix}{value.toLocaleString()}{suffix}
    </motion.span>
  );
}

export default function ImpactPage() {
  const { winCards, getWeeklyImpact, getTotalImpact, getActionById, isLoaded } = useWinCards();

  const weeklyImpact = getWeeklyImpact();
  const totalImpact = getTotalImpact();
  const equivalencies = calculateEquivalencies(
    totalImpact.co2Kg,
    totalImpact.waterLiters,
    totalImpact.energyKwh
  );

  // Calculate how many trees to show (1 tree per 5kg CO2)
  const treeCount = Math.min(Math.floor(totalImpact.co2Kg / 5) + 1, 20);

  // Calculate action breakdown
  const actionBreakdown = winCards.map(card => {
    const action = getActionById(card.actionId);
    const completions = card.weeklyStamps.filter(s => s.isStamped).length;
    return {
      name: action?.name || 'Unknown',
      icon: action?.icon || '🌱',
      completions,
      co2: (action?.impactMetrics.co2Kg || 0) * completions,
    };
  }).filter(a => a.completions > 0).sort((a, b) => b.co2 - a.co2);

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
          Your <span className="text-gradient">Impact</span>
        </h1>
        <p className="text-slate-400">
          Watch your positive environmental contribution grow
        </p>
      </motion.div>

      {/* Forest Visualization */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative mb-8 p-6 rounded-2xl bg-gradient-to-b from-slate-800/50 to-slate-900/50 border border-slate-700/50 overflow-hidden"
      >
        {/* Sky gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/20 via-emerald-900/10 to-transparent" />

        {/* Sun/Moon */}
        <div className="absolute top-4 right-8 w-12 h-12 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 blur-sm opacity-60" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <TreePine className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Your Growing Forest</h2>
          </div>

          {/* Trees */}
          <div className="min-h-[180px] flex items-end justify-center gap-2 flex-wrap py-4">
            {totalImpact.co2Kg > 0 ? (
              Array.from({ length: treeCount }).map((_, i) => (
                <Tree
                  key={i}
                  delay={i * 0.1}
                  scale={0.8 + Math.random() * 0.4}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-6xl mb-4"
                >
                  🌱
                </motion.div>
                <p className="text-slate-400">Start stamping actions to grow your forest!</p>
              </div>
            )}
          </div>

          {/* Ground */}
          <div className="h-4 bg-gradient-to-t from-amber-900/30 to-transparent rounded-b-xl" />

          {/* Stats overlay */}
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <TreePine className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">
                <span className="text-emerald-400 font-bold">{treeCount}</span> tree{treeCount !== 1 ? 's' : ''} growing
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-green-400" />
              <span className="text-slate-300">
                <span className="text-green-400 font-bold">{equivalencies.treesPlanted}</span> trees worth of CO₂
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Impact Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            icon: Leaf,
            label: 'CO₂ Saved',
            value: totalImpact.co2Kg.toFixed(1),
            unit: 'kg',
            weekly: weeklyImpact.co2Kg.toFixed(1),
            color: 'emerald',
            gradient: 'from-emerald-500 to-teal-500',
          },
          {
            icon: Droplets,
            label: 'Water Saved',
            value: Math.round(totalImpact.waterLiters),
            unit: 'L',
            weekly: Math.round(weeklyImpact.waterLiters),
            color: 'cyan',
            gradient: 'from-cyan-500 to-blue-500',
          },
          {
            icon: Zap,
            label: 'Energy Saved',
            value: totalImpact.energyKwh.toFixed(1),
            unit: 'kWh',
            weekly: weeklyImpact.energyKwh.toFixed(1),
            color: 'amber',
            gradient: 'from-amber-500 to-orange-500',
          },
          {
            icon: TrendingUp,
            label: 'Total Actions',
            value: winCards.reduce((sum, c) => sum + c.totalCompletions, 0),
            unit: '',
            weekly: winCards.reduce((sum, c) => sum + c.weeklyStamps.filter(s => s.isStamped).length, 0),
            color: 'purple',
            gradient: 'from-purple-500 to-pink-500',
          },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              <div className="relative overflow-hidden rounded-2xl bg-slate-800/50 border border-slate-700/50 p-5">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5`} />

                <div className="relative">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>

                  <p className="text-xs text-slate-400 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-white">
                    <AnimatedCounter value={Number(stat.value)} suffix={stat.unit ? ` ${stat.unit}` : ''} />
                  </p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {stat.weekly} {stat.unit} this week
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Equivalencies */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          What Your Impact Means
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { emoji: '🚗', value: equivalencies.milesNotDriven, label: 'miles not driven' },
            { emoji: '📱', value: equivalencies.phonesCharged, label: 'phones charged' },
            { emoji: '🚿', value: equivalencies.showersSkipped, label: 'showers worth' },
            { emoji: '💡', value: equivalencies.lightsOffHours, label: 'light-hours saved' },
          ].map((eq) => (
            <div key={eq.label} className="text-center">
              <span className="text-3xl">{eq.emoji}</span>
              <p className="text-2xl font-bold text-white mt-2">{eq.value.toLocaleString()}</p>
              <p className="text-xs text-slate-400">{eq.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Action Breakdown */}
      {actionBreakdown.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">This Week&apos;s Breakdown</h3>
          <div className="space-y-3">
            {actionBreakdown.map((action, index) => {
              const maxCO2 = Math.max(...actionBreakdown.map(a => a.co2));
              const percentage = maxCO2 > 0 ? (action.co2 / maxCO2) * 100 : 0;

              return (
                <motion.div
                  key={action.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <span className="text-2xl w-10">{action.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">{action.name}</span>
                      <span className="text-xs text-slate-400">{action.completions}x this week</span>
                    </div>
                    <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                      />
                    </div>
                    <p className="text-xs text-emerald-400 mt-1">{action.co2.toFixed(1)} kg CO₂ saved</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
