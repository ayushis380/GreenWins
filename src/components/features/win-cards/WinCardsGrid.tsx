'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { WinCard as WinCardType, SustainabilityAction } from '@/types';
import { WinCard } from './WinCard';
import { Plus, Sparkles } from 'lucide-react';

interface WinCardsGridProps {
  cards: WinCardType[];
  actions: SustainabilityAction[];
  onStampClick: (cardId: string, dayIndex: number) => void;
  onAddCard: () => void;
  onRemoveCard: (cardId: string) => void;
  todayIndex: number;
  getActionById: (id: string) => SustainabilityAction | undefined;
}

export function WinCardsGrid({
  cards,
  onStampClick,
  onAddCard,
  onRemoveCard,
  todayIndex,
  getActionById,
}: WinCardsGridProps) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <AnimatePresence mode="popLayout">
          {cards.map((card, index) => {
            const action = getActionById(card.actionId);
            if (!action) return null;

            return (
              <motion.div
                key={card.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
              >
                <WinCard
                  card={card}
                  action={action}
                  onStampClick={onStampClick}
                  todayIndex={todayIndex}
                  onRemove={onRemoveCard}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Add New Card Button */}
        <motion.button
          onClick={onAddCard}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          className="group relative min-h-[260px] rounded-2xl border-2 border-dashed border-slate-700 hover:border-emerald-500/50 bg-slate-900/50 hover:bg-slate-800/50 transition-all duration-300 flex flex-col items-center justify-center gap-4 p-6"
        >
          {/* Hover glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

          <motion.div
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform"
            whileHover={{ rotate: 90 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Plus className="w-8 h-8 text-emerald-400" />
          </motion.div>

          <div className="text-center">
            <p className="font-semibold text-slate-300 group-hover:text-white transition-colors">
              Add New Action
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Track another sustainable habit
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-4 h-4 text-emerald-500/50" />
            <span>12 presets available</span>
          </div>
        </motion.button>
      </div>
    </div>
  );
}
