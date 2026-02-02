'use client';

import { motion } from 'framer-motion';
import { ImpactMetrics } from '@/types';
import { TreePine, Droplets, Zap, Leaf } from 'lucide-react';
import { calculateEquivalencies } from '@/lib/constants';

interface ImpactSummaryProps {
  weeklyImpact: ImpactMetrics;
  totalImpact: ImpactMetrics;
}

export function ImpactSummary({ weeklyImpact, totalImpact }: ImpactSummaryProps) {
  const equivalencies = calculateEquivalencies(
    totalImpact.co2Kg,
    totalImpact.waterLiters,
    totalImpact.energyKwh
  );

  const stats = [
    {
      icon: Leaf,
      label: 'CO₂ Saved',
      weeklyValue: weeklyImpact.co2Kg.toFixed(1),
      totalValue: totalImpact.co2Kg.toFixed(1),
      unit: 'kg',
      color: 'emerald',
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      icon: Droplets,
      label: 'Water Saved',
      weeklyValue: Math.round(weeklyImpact.waterLiters).toString(),
      totalValue: Math.round(totalImpact.waterLiters).toString(),
      unit: 'L',
      color: 'cyan',
      gradient: 'from-cyan-500 to-blue-500',
    },
    {
      icon: Zap,
      label: 'Energy Saved',
      weeklyValue: weeklyImpact.energyKwh.toFixed(1),
      totalValue: totalImpact.energyKwh.toFixed(1),
      unit: 'kWh',
      color: 'amber',
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      icon: TreePine,
      label: 'Trees Worth',
      weeklyValue: weeklyImpact.treesEquivalent.toFixed(2),
      totalValue: equivalencies.treesPlanted.toFixed(2),
      unit: 'trees',
      color: 'green',
      gradient: 'from-green-500 to-emerald-500',
    },
  ];

  return (
    <div className="w-full">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              <div className="relative overflow-hidden rounded-2xl bg-slate-800/50 border border-slate-700/50 p-4 hover:border-slate-600/50 transition-colors">
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />

                <div className="relative">
                  {/* Icon and Label */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.gradient} bg-opacity-20 flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-medium text-slate-400">{stat.label}</span>
                  </div>

                  {/* Values */}
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                      <motion.span
                        key={stat.weeklyValue}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        className="text-2xl font-bold text-white"
                      >
                        {stat.weeklyValue}
                      </motion.span>
                      <span className="text-sm text-slate-400">{stat.unit}</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {stat.totalValue} {stat.unit} total
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Fun Equivalency */}
      {totalImpact.co2Kg > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20"
        >
          <p className="text-sm text-slate-300 text-center">
            <span className="text-emerald-400 font-semibold">Amazing!</span> That&apos;s like{' '}
            <span className="text-white font-semibold">{equivalencies.milesNotDriven} miles</span> not driven, or{' '}
            <span className="text-white font-semibold">{equivalencies.phonesCharged.toLocaleString()}</span> phone charges worth of energy saved!
          </p>
        </motion.div>
      )}
    </div>
  );
}
