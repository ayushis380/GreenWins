'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sun, Cloud, Leaf, Snowflake, Lightbulb } from 'lucide-react';
import { Season, SeasonalRecommendation } from '@/types';

// Get current season based on date and hemisphere
function getCurrentSeason(): Season {
  const month = new Date().getMonth();
  // Northern hemisphere seasons
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

// Seasonal data
const SEASONAL_DATA: Record<Season, {
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
  borderColor: string;
  greeting: string;
  tips: SeasonalRecommendation[];
}> = {
  spring: {
    icon: <Leaf className="w-5 h-5" />,
    color: 'text-green-400',
    bgGradient: 'from-green-500/10 to-emerald-500/10',
    borderColor: 'border-green-500/30',
    greeting: 'Spring is here!',
    tips: [
      {
        id: 'spring-1',
        season: 'spring',
        title: 'Start Composting',
        description: 'Spring is the perfect time to start a compost bin for your garden waste and kitchen scraps.',
        actionSuggestions: ['Composted', 'Local Produce'],
        tips: ['Layer green and brown materials', 'Turn your compost weekly', 'Keep it moist but not wet'],
        relevanceScore: 0.9,
      },
      {
        id: 'spring-2',
        season: 'spring',
        title: 'Bike Season Begins',
        description: 'Warmer weather makes it ideal for cycling to work or for errands.',
        actionSuggestions: ['Bike Commute', 'No Car Day'],
        tips: ['Check your bike tune-up', 'Plan your route ahead', 'Start with shorter distances'],
        relevanceScore: 0.85,
      },
      {
        id: 'spring-3',
        season: 'spring',
        title: "Farmer's Markets Opening",
        description: 'Local produce is starting to become available. Support local farmers!',
        actionSuggestions: ['Local Produce', 'Reusable Bag'],
        tips: ['Bring reusable bags', 'Shop early for best selection', 'Ask farmers about their practices'],
        relevanceScore: 0.8,
      },
    ],
  },
  summer: {
    icon: <Sun className="w-5 h-5" />,
    color: 'text-amber-400',
    bgGradient: 'from-amber-500/10 to-yellow-500/10',
    borderColor: 'border-amber-500/30',
    greeting: 'Summer sustainability!',
    tips: [
      {
        id: 'summer-1',
        season: 'summer',
        title: 'Line Dry Your Clothes',
        description: 'Take advantage of the sun and wind to dry your laundry naturally.',
        actionSuggestions: ['Line Dry Clothes', 'Unplugged Devices'],
        tips: ['Clothes dry fastest midday', 'Turn dark items inside out', 'Use the UV to naturally bleach whites'],
        relevanceScore: 0.95,
      },
      {
        id: 'summer-2',
        season: 'summer',
        title: 'Cold Water Washing',
        description: 'Save energy by washing clothes in cold water - they clean just as well!',
        actionSuggestions: ['Cold Water Wash'],
        tips: ['Use cold-water detergent', 'Pre-treat stains', 'Full loads only'],
        relevanceScore: 0.9,
      },
      {
        id: 'summer-3',
        season: 'summer',
        title: 'Shorter Showers',
        description: 'Conserve water during potentially dry months with quicker showers.',
        actionSuggestions: ['Shorter Shower'],
        tips: ['Set a 5-minute timer', 'Turn off water while soaping', 'Consider a low-flow showerhead'],
        relevanceScore: 0.85,
      },
    ],
  },
  fall: {
    icon: <Cloud className="w-5 h-5" />,
    color: 'text-orange-400',
    bgGradient: 'from-orange-500/10 to-red-500/10',
    borderColor: 'border-orange-500/30',
    greeting: 'Fall into sustainability!',
    tips: [
      {
        id: 'fall-1',
        season: 'fall',
        title: 'Harvest Season',
        description: 'Fall brings abundant local produce. Stock up and preserve for winter!',
        actionSuggestions: ['Local Produce', 'Meatless Meal'],
        tips: ['Visit apple orchards and pumpkin patches', 'Learn to can or freeze produce', 'Try seasonal recipes'],
        relevanceScore: 0.9,
      },
      {
        id: 'fall-2',
        season: 'fall',
        title: 'Leaf Composting',
        description: 'Turn fallen leaves into rich compost instead of sending to landfill.',
        actionSuggestions: ['Composted'],
        tips: ['Shred leaves first for faster decomposition', 'Mix with green materials', 'Layer in your garden beds'],
        relevanceScore: 0.85,
      },
      {
        id: 'fall-3',
        season: 'fall',
        title: 'Energy Audit Time',
        description: 'Before winter, check your home for drafts and energy inefficiencies.',
        actionSuggestions: ['Unplugged Devices'],
        tips: ['Check window seals', 'Add weatherstripping', 'Clean heating vents'],
        relevanceScore: 0.8,
      },
    ],
  },
  winter: {
    icon: <Snowflake className="w-5 h-5" />,
    color: 'text-cyan-400',
    bgGradient: 'from-cyan-500/10 to-blue-500/10',
    borderColor: 'border-cyan-500/30',
    greeting: 'Winter eco-tips!',
    tips: [
      {
        id: 'winter-1',
        season: 'winter',
        title: 'Heating Efficiency',
        description: 'Lower your thermostat by just 1-2 degrees and wear a sweater instead.',
        actionSuggestions: ['Unplugged Devices'],
        tips: ['Use a programmable thermostat', 'Close curtains at night', 'Open curtains on sunny days'],
        relevanceScore: 0.95,
      },
      {
        id: 'winter-2',
        season: 'winter',
        title: 'Unplug Holiday Lights',
        description: 'Remember to unplug decorations when not in use to save energy.',
        actionSuggestions: ['Unplugged Devices'],
        tips: ['Use LED lights', 'Put on timers', 'Unplug during day'],
        relevanceScore: 0.85,
      },
      {
        id: 'winter-3',
        season: 'winter',
        title: 'Shorter Hot Showers',
        description: 'Hot showers are tempting in winter but use lots of energy. Keep them brief!',
        actionSuggestions: ['Shorter Shower'],
        tips: ['Set a timer', 'Turn water off while soaping', 'Appreciate the warm towel after!'],
        relevanceScore: 0.8,
      },
    ],
  },
};

interface SeasonalTipsProps {
  compact?: boolean;
}

export function SeasonalTips({ compact = false }: SeasonalTipsProps) {
  const season = useMemo(() => getCurrentSeason(), []);
  const data = SEASONAL_DATA[season];

  if (compact) {
    const topTip = data.tips[0];
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-3 rounded-xl bg-gradient-to-r ${data.bgGradient} border ${data.borderColor}`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-slate-800/50 ${data.color}`}>
            {data.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${data.color}`}>{topTip.title}</p>
            <p className="text-xs text-slate-400 truncate">{topTip.description}</p>
          </div>
          <Lightbulb className="w-4 h-4 text-slate-500" />
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-slate-800/50 ${data.color}`}>
          {data.icon}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">{data.greeting}</h2>
          <p className="text-xs text-slate-500">
            Seasonal sustainability tips for {season}
          </p>
        </div>
      </div>

      {/* Tips */}
      <div className="space-y-3">
        {data.tips.map((tip, index) => (
          <motion.div
            key={tip.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-xl bg-gradient-to-r ${data.bgGradient} border ${data.borderColor}`}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className={`font-medium ${data.color}`}>{tip.title}</h3>
              <span className="text-xs text-slate-500">
                {Math.round(tip.relevanceScore * 100)}% relevant
              </span>
            </div>
            <p className="text-sm text-slate-300 mb-3">{tip.description}</p>

            {/* Quick tips */}
            <div className="space-y-1">
              {tip.tips.slice(0, 2).map((t, idx) => (
                <p key={idx} className="text-xs text-slate-400 flex items-start gap-2">
                  <span className={data.color}>•</span>
                  {t}
                </p>
              ))}
            </div>

            {/* Suggested actions */}
            <div className="mt-3 flex flex-wrap gap-2">
              {tip.actionSuggestions.map((action) => (
                <span
                  key={action}
                  className="text-xs px-2 py-1 rounded-full bg-slate-800/50 text-slate-300"
                >
                  {action}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
