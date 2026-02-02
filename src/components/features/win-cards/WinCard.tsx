'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { WinCard as WinCardType, SustainabilityAction } from '@/types';
import { Check, Flame, X } from 'lucide-react';
import { useState } from 'react';

interface WinCardProps {
  card: WinCardType;
  action: SustainabilityAction;
  onStampClick: (cardId: string, dayIndex: number) => void;
  todayIndex: number;
  onRemove?: (cardId: string) => void;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function WinCard({ card, action, onStampClick, todayIndex, onRemove }: WinCardProps) {
  const [pressedStamp, setPressedStamp] = useState<number | null>(null);
  const stampedCount = card.weeklyStamps.filter(s => s.isStamped).length;

  const handleStampPress = (dayIndex: number) => {
    if (dayIndex > todayIndex) return;
    setPressedStamp(dayIndex);
    setTimeout(() => setPressedStamp(null), 150);
    onStampClick(card.id, dayIndex);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4, boxShadow: '0 20px 40px -12px rgba(16, 185, 129, 0.25)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="relative group"
    >
      {/* Card Container */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-[2px]">
        {/* Animated border gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 opacity-50 blur-sm" />

        <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800/95 to-slate-900 overflow-hidden">
          {/* Texture overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Ambient glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl" />

          {/* Remove button */}
          {onRemove && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onRemove(card.id)}
              className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-slate-700/50 backdrop-blur-sm flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}

          {/* Content */}
          <div className="relative p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                {/* Icon container */}
                <motion.div
                  className="relative"
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-3xl backdrop-blur-sm border border-emerald-500/20">
                    {action.icon}
                  </div>
                  {/* Shine effect */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>

                <div>
                  <h3 className="font-bold text-lg text-white tracking-tight leading-tight">
                    {action.name}
                  </h3>
                  <p className="text-sm text-slate-400 mt-0.5 line-clamp-1">
                    {action.description}
                  </p>
                </div>
              </div>

              {/* Streak Badge */}
              <AnimatePresence mode="wait">
                {card.streak > 0 && (
                  <motion.div
                    key={card.streak}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    className="relative"
                  >
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                      <Flame className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-bold text-amber-300">{card.streak}</span>
                    </div>
                    {/* Glow */}
                    <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-md -z-10" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Weekly Stamps Grid */}
            <div className="flex items-center justify-between gap-2">
              {card.weeklyStamps.map((stamp, index) => {
                const isToday = index === todayIndex;
                const isFuture = index > todayIndex;
                const isPressed = pressedStamp === index;

                return (
                  <motion.button
                    key={stamp.date}
                    onClick={() => handleStampPress(index)}
                    disabled={isFuture}
                    className={`
                      relative flex flex-col items-center gap-1.5 flex-1
                      ${isFuture ? 'cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    whileHover={!isFuture ? { scale: 1.05 } : {}}
                    whileTap={!isFuture ? { scale: 0.92 } : {}}
                  >
                    {/* Day label */}
                    <span className={`
                      text-xs font-semibold tracking-wide
                      ${isToday ? 'text-emerald-400' : isFuture ? 'text-slate-600' : 'text-slate-500'}
                    `}>
                      {DAY_LABELS[index]}
                    </span>

                    {/* Stamp circle */}
                    <div className="relative">
                      {/* Today glow ring */}
                      {isToday && (
                        <motion.div
                          className="absolute -inset-1 rounded-full bg-emerald-500/30"
                          animate={{
                            scale: [1, 1.15, 1],
                            opacity: [0.5, 0.3, 0.5],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                        />
                      )}

                      <motion.div
                        animate={isPressed ? { scale: [1, 0.85, 1.1, 1] } : {}}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className={`
                          relative w-10 h-10 rounded-full flex items-center justify-center
                          transition-all duration-200
                          ${stamp.isStamped
                            ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30'
                            : isToday
                            ? 'bg-slate-700/80 border-2 border-emerald-500/50 hover:border-emerald-400'
                            : isFuture
                            ? 'bg-slate-800/50 border border-slate-700/50'
                            : 'bg-slate-700/60 border-2 border-slate-600/50 hover:border-emerald-500/50 hover:bg-slate-700'
                          }
                        `}
                      >
                        <AnimatePresence mode="wait">
                          {stamp.isStamped && (
                            <motion.div
                              initial={{ scale: 0, rotate: -90 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 90 }}
                              transition={{
                                type: 'spring',
                                stiffness: 500,
                                damping: 15
                              }}
                            >
                              <Check className="w-5 h-5 text-white stroke-[3]" />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Ink splatter effect on stamp */}
                        {stamp.isStamped && (
                          <div className="absolute inset-0 rounded-full overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-300/20 via-transparent to-teal-300/20" />
                          </div>
                        )}
                      </motion.div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="mt-5 relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 font-medium">Weekly Progress</span>
                <span className="text-xs font-bold text-emerald-400">{stampedCount}/7</span>
              </div>
              <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(stampedCount / 7) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                />
              </div>
            </div>

            {/* Impact teaser */}
            <div className="mt-4 flex items-center gap-4 pt-4 border-t border-slate-700/50">
              <div className="flex items-center gap-1.5">
                <span className="text-lg">🌿</span>
                <span className="text-xs text-slate-400">
                  <span className="text-emerald-400 font-semibold">{(action.impactMetrics.co2Kg * stampedCount).toFixed(1)}</span> kg CO₂
                </span>
              </div>
              {action.impactMetrics.waterLiters > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">💧</span>
                  <span className="text-xs text-slate-400">
                    <span className="text-cyan-400 font-semibold">{Math.round(action.impactMetrics.waterLiters * stampedCount)}</span> L
                  </span>
                </div>
              )}
              {action.impactMetrics.energyKwh > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">⚡</span>
                  <span className="text-xs text-slate-400">
                    <span className="text-amber-400 font-semibold">{(action.impactMetrics.energyKwh * stampedCount).toFixed(1)}</span> kWh
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
