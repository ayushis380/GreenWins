'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldCheck, ShieldOff, Info, X } from 'lucide-react';
import { useStreakInsurance } from '@/hooks/useStreakInsurance';

interface StreakInsuranceProps {
  compact?: boolean;
}

export function StreakInsuranceBadge({ compact = false }: StreakInsuranceProps) {
  const { shields, maxShields, progressToNextShield, canEarnMore } = useStreakInsurance();
  const [showInfo, setShowInfo] = useState(false);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <Shield className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-medium text-purple-300">
          {shields}/{maxShields}
        </span>
      </div>
    );
  }

  return (
    <>
      <motion.div
        className="p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30"
        whileHover={{ scale: 1.01 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-purple-300">Streak Shields</h3>
                <button
                  onClick={() => setShowInfo(true)}
                  className="p-0.5 rounded hover:bg-purple-500/20"
                >
                  <Info className="w-3.5 h-3.5 text-purple-400/60" />
                </button>
              </div>
              <p className="text-xs text-slate-400">Protect your streaks on off days</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: maxShields }).map((_, idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                {idx < shields ? (
                  <ShieldCheck className="w-6 h-6 text-purple-400" />
                ) : (
                  <ShieldOff className="w-6 h-6 text-slate-600" />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Progress to next shield */}
        {canEarnMore && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Progress to next shield</span>
              <span>{progressToNextShield.percentage.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressToNextShield.percentage}%` }}
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInfo(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-4 right-4 top-1/2 -translate-y-1/2 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md bg-slate-800 rounded-2xl border border-slate-700 p-6 z-50"
            >
              <button
                onClick={() => setShowInfo(false)}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-700"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Shield className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Streak Shields</h3>
              </div>

              <div className="space-y-4 text-sm text-slate-300">
                <p>
                  <strong className="text-purple-300">Life happens!</strong> Streak Shields
                  protect your streaks when you can't complete an action on a given day.
                </p>

                <div className="p-3 rounded-lg bg-slate-700/50">
                  <h4 className="font-medium text-white mb-2">How it works:</h4>
                  <ul className="space-y-1.5 text-slate-400">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      Use a shield to protect any day this week
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      Your streak won't break for protected days
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      Maximum of {maxShields} shields at a time
                    </li>
                  </ul>
                </div>

                <div className="p-3 rounded-lg bg-slate-700/50">
                  <h4 className="font-medium text-white mb-2">Earning shields:</h4>
                  <ul className="space-y-1.5 text-slate-400">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-1">•</span>
                      Complete sustainable actions consistently
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-1">•</span>
                      Maintain streaks to earn bonus shields
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-1">•</span>
                      You start with 1 free shield!
                    </li>
                  </ul>
                </div>
              </div>

              <button
                onClick={() => setShowInfo(false)}
                className="w-full mt-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 transition-colors"
              >
                Got it!
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

interface UseShieldButtonProps {
  date: string;
  onUseShield?: (success: boolean, message: string) => void;
}

export function UseShieldButton({ date, onUseShield }: UseShieldButtonProps) {
  const { shields, useShield, isDateProtected } = useStreakInsurance();
  const [isUsing, setIsUsing] = useState(false);

  const protected_ = isDateProtected(date);

  const handleUseShield = () => {
    if (protected_ || shields <= 0) return;

    setIsUsing(true);
    const result = useShield(date);
    onUseShield?.(result.success, result.message);

    setTimeout(() => setIsUsing(false), 500);
  };

  if (protected_) {
    return (
      <div className="flex items-center gap-1 text-xs text-purple-400">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Protected</span>
      </div>
    );
  }

  return (
    <motion.button
      onClick={handleUseShield}
      disabled={shields <= 0 || isUsing}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
    >
      <Shield className="w-3.5 h-3.5" />
      <span>Use Shield</span>
    </motion.button>
  );
}
