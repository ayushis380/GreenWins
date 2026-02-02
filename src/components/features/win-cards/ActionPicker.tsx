'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SustainabilityAction, ActionCategory } from '@/types';
import { PREDEFINED_ACTIONS, CATEGORY_INFO, ACTION_ICONS } from '@/lib/constants';
import { X, Plus, Check, Sparkles } from 'lucide-react';

interface ActionPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (actionId: string) => void;
  onCreateCustom: (action: Omit<SustainabilityAction, 'id' | 'createdAt' | 'isCustom'>) => void;
  existingActionIds: string[];
}

const CATEGORIES: { id: ActionCategory | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '🌍' },
  { id: 'transport', label: 'Transport', icon: '🚗' },
  { id: 'food', label: 'Food', icon: '🥗' },
  { id: 'energy', label: 'Energy', icon: '⚡' },
  { id: 'water', label: 'Water', icon: '💧' },
  { id: 'waste', label: 'Waste', icon: '♻️' },
];

export function ActionPicker({
  isOpen,
  onClose,
  onSelectAction,
  onCreateCustom,
  existingActionIds,
}: ActionPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<ActionCategory | 'all'>('all');
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customAction, setCustomAction] = useState({
    name: '',
    description: '',
    icon: '🌱',
    category: 'other' as ActionCategory,
    impactMetrics: { co2Kg: 1, waterLiters: 0, energyKwh: 0, treesEquivalent: 0.05 },
  });

  const filteredActions = PREDEFINED_ACTIONS.filter(
    (action) =>
      (selectedCategory === 'all' || action.category === selectedCategory) &&
      !existingActionIds.includes(action.id)
  );

  const handleCreateCustom = () => {
    if (!customAction.name.trim()) return;
    onCreateCustom(customAction);
    onClose();
    setIsCreatingCustom(false);
    setCustomAction({
      name: '',
      description: '',
      icon: '🌱',
      category: 'other',
      impactMetrics: { co2Kg: 1, waterLiters: 0, energyKwh: 0, treesEquivalent: 0.05 },
    });
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
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl md:max-h-[85vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {isCreatingCustom ? 'Create Custom Action' : 'Add New Action'}
                  </h2>
                  <p className="text-sm text-slate-400">
                    {isCreatingCustom
                      ? 'Define your own sustainability habit'
                      : 'Choose a habit to track'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!isCreatingCustom ? (
              <>
                {/* Category Filter */}
                <div className="flex items-center gap-2 p-4 border-b border-slate-700/50 overflow-x-auto">
                  {CATEGORIES.map((cat) => (
                    <motion.button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                        ${selectedCategory === cat.id
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-700/30 text-slate-400 border border-transparent hover:bg-slate-700/50 hover:text-slate-300'
                        }
                      `}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Actions Grid */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredActions.map((action) => {
                      const catInfo = CATEGORY_INFO[action.category];
                      return (
                        <motion.button
                          key={action.id}
                          onClick={() => {
                            onSelectAction(action.id);
                            onClose();
                          }}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className="group relative p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/50 hover:bg-slate-800 transition-all text-left"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700/50 to-slate-800/50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                              {action.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white truncate">{action.name}</h3>
                              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                                {action.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${catInfo.bgColor} ${catInfo.color}`}>
                                  {catInfo.label}
                                </span>
                                <span className="text-xs text-emerald-400">
                                  {action.impactMetrics.co2Kg} kg CO₂
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {filteredActions.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-slate-400">No actions available in this category</p>
                      <p className="text-sm text-slate-500 mt-1">Try another category or create a custom action</p>
                    </div>
                  )}
                </div>

                {/* Create Custom Button */}
                <div className="p-4 border-t border-slate-700/50">
                  <motion.button
                    onClick={() => setIsCreatingCustom(true)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 text-emerald-400 font-medium hover:from-emerald-500/20 hover:to-teal-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Create Custom Action
                  </motion.button>
                </div>
              </>
            ) : (
              /* Custom Action Form */
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Icon Picker */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {ACTION_ICONS.map((icon) => (
                      <motion.button
                        key={icon}
                        onClick={() => setCustomAction({ ...customAction, icon })}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className={`
                          w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all
                          ${customAction.icon === icon
                            ? 'bg-emerald-500/20 border-2 border-emerald-500'
                            : 'bg-slate-700/50 border border-slate-600/50 hover:border-emerald-500/50'
                          }
                        `}
                      >
                        {icon}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Name Input */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Action Name</label>
                  <input
                    type="text"
                    value={customAction.name}
                    onChange={(e) => setCustomAction({ ...customAction, name: e.target.value })}
                    placeholder="e.g., Walked to Work"
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>

                {/* Description Input */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                  <textarea
                    value={customAction.description}
                    onChange={(e) => setCustomAction({ ...customAction, description: e.target.value })}
                    placeholder="Brief description of your action"
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                  />
                </div>

                {/* Category Select */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                      <motion.button
                        key={cat.id}
                        onClick={() => setCustomAction({ ...customAction, category: cat.id as ActionCategory })}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`
                          flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                          ${customAction.category === cat.id
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-700/30 text-slate-400 border border-transparent hover:bg-slate-700/50'
                          }
                        `}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Impact Metrics */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Estimated Impact (per action)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">CO₂ Saved (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={customAction.impactMetrics.co2Kg}
                        onChange={(e) =>
                          setCustomAction({
                            ...customAction,
                            impactMetrics: { ...customAction.impactMetrics, co2Kg: parseFloat(e.target.value) || 0 },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-white focus:border-emerald-500/50 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Water Saved (L)</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={customAction.impactMetrics.waterLiters}
                        onChange={(e) =>
                          setCustomAction({
                            ...customAction,
                            impactMetrics: { ...customAction.impactMetrics, waterLiters: parseFloat(e.target.value) || 0 },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-white focus:border-emerald-500/50 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <motion.button
                    onClick={() => setIsCreatingCustom(false)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3 rounded-xl bg-slate-700/50 text-slate-300 font-medium hover:bg-slate-700 transition-all"
                  >
                    Back
                  </motion.button>
                  <motion.button
                    onClick={handleCreateCustom}
                    disabled={!customAction.name.trim()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Create Action
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
