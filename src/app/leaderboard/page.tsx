'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWinCards } from '@/hooks';
import { Trophy, Medal, Flame, TrendingUp, Crown, Star } from 'lucide-react';

type Category = 'impact' | 'streak' | 'consistency';
type Timeframe = 'weekly' | 'allTime';

// Generate simulated community members
const FAKE_NAMES = [
  'EcoWarrior', 'GreenThumb', 'PlanetSaver', 'NatureLover', 'EarthGuardian',
  'LeafyDreamer', 'SustainableLife', 'GreenHeart', 'EcoChampion', 'TreeHugger',
  'OceanMind', 'SolarSpirit', 'WindWalker', 'RainDancer', 'EarthChild',
  'GreenVibes', 'EcoPath', 'NatureWay', 'CleanAir', 'PureWater',
];

const AVATARS = ['🌱', '🌿', '🌳', '🌲', '🍀', '🌻', '🌸', '🦋', '🐝', '🦊', '🐳', '🌊', '☀️', '🌙', '⭐'];

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  score: number;
  isCurrentUser: boolean;
  streak?: number;
  badges: number;
}

function generateLeaderboard(
  userScore: number,
  category: Category,
  count: number = 15
): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = [];

  // Generate scores around the user's score with some randomness
  const scores = Array.from({ length: count - 1 }, () => {
    const variance = userScore * 0.5;
    return Math.max(0, userScore + (Math.random() - 0.5) * variance * 2);
  });

  // Add some high achievers
  scores.push(userScore * 1.8);
  scores.push(userScore * 1.5);
  scores.push(userScore * 1.3);

  // Sort and add user
  scores.push(userScore);
  scores.sort((a, b) => b - a);

  const userIndex = scores.indexOf(userScore);

  scores.forEach((score, index) => {
    const isUser = index === userIndex;
    entries.push({
      rank: index + 1,
      name: isUser ? 'You' : FAKE_NAMES[index % FAKE_NAMES.length] + (index >= FAKE_NAMES.length ? index : ''),
      avatar: isUser ? '🌟' : AVATARS[index % AVATARS.length],
      score: Math.round(score * 10) / 10,
      isCurrentUser: isUser,
      streak: category === 'streak' ? Math.floor(score) : Math.floor(Math.random() * 14) + 1,
      badges: Math.floor(Math.random() * 8) + 1,
    });
  });

  return entries.slice(0, count);
}

export default function LeaderboardPage() {
  const [category, setCategory] = useState<Category>('impact');
  const [timeframe, setTimeframe] = useState<Timeframe>('weekly');
  const { winCards, getWeeklyImpact, getTotalImpact, isLoaded } = useWinCards();

  const weeklyImpact = getWeeklyImpact();
  const totalImpact = getTotalImpact();
  const maxStreak = Math.max(...winCards.map(c => c.streak), 0);
  const weeklyCompletions = winCards.reduce(
    (sum, c) => sum + c.weeklyStamps.filter(s => s.isStamped).length,
    0
  );

  const userScore = useMemo(() => {
    switch (category) {
      case 'impact':
        return timeframe === 'weekly' ? weeklyImpact.co2Kg : totalImpact.co2Kg;
      case 'streak':
        return maxStreak;
      case 'consistency':
        return weeklyCompletions;
      default:
        return 0;
    }
  }, [category, timeframe, weeklyImpact.co2Kg, totalImpact.co2Kg, maxStreak, weeklyCompletions]);

  const leaderboard = useMemo(() => generateLeaderboard(userScore, category), [userScore, category]);

  const userRank = leaderboard.find(e => e.isCurrentUser)?.rank || 0;

  const categories = [
    { id: 'impact' as Category, label: 'Impact', icon: TrendingUp, description: 'CO₂ saved' },
    { id: 'streak' as Category, label: 'Streak', icon: Flame, description: 'Consecutive days' },
    { id: 'consistency' as Category, label: 'Consistency', icon: Star, description: 'Weekly completions' },
  ];

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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
          <span className="text-gradient">Leaderboard</span>
        </h1>
        <p className="text-slate-400">See how you compare with the community</p>
      </motion.div>

      {/* User's Rank Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-3xl">
              🌟
            </div>
            <div>
              <p className="text-slate-400 text-sm">Your Rank</p>
              <p className="text-4xl font-bold text-white">#{userRank}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-sm">Score</p>
            <p className="text-2xl font-bold text-emerald-400">
              {userScore.toFixed(1)}
              <span className="text-sm text-slate-400 ml-1">
                {category === 'impact' ? 'kg' : category === 'streak' ? 'days' : 'actions'}
              </span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <motion.button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                  ${category === cat.id
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800/50 text-slate-400 border border-transparent hover:bg-slate-700/50'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </motion.button>
            );
          })}
        </div>

        {/* Timeframe Toggle */}
        {category === 'impact' && (
          <div className="flex gap-2 sm:ml-auto">
            {(['weekly', 'allTime'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                  ${timeframe === tf
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                  }
                `}
              >
                {tf === 'weekly' ? 'This Week' : 'All Time'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
        {/* Top 3 Podium */}
        <div className="p-6 bg-gradient-to-b from-slate-700/30 to-transparent">
          <div className="flex items-end justify-center gap-4">
            {/* 2nd Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-slate-700/50 border-2 border-slate-500 flex items-center justify-center text-2xl">
                {leaderboard[1]?.avatar}
              </div>
              <p className="text-sm font-medium text-white truncate max-w-[80px]">{leaderboard[1]?.name}</p>
              <p className="text-xs text-slate-400">{leaderboard[1]?.score}</p>
              <div className="mt-2 w-16 h-16 rounded-t-lg bg-gradient-to-t from-slate-600 to-slate-500 flex items-center justify-center">
                <Medal className="w-6 h-6 text-slate-300" />
              </div>
            </motion.div>

            {/* 1st Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center -mb-4"
            >
              <Crown className="w-6 h-6 text-amber-400 mx-auto mb-1" />
              <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-amber-300 flex items-center justify-center text-3xl">
                {leaderboard[0]?.avatar}
              </div>
              <p className="text-sm font-bold text-white truncate max-w-[100px]">{leaderboard[0]?.name}</p>
              <p className="text-xs text-amber-400">{leaderboard[0]?.score}</p>
              <div className="mt-2 w-20 h-24 rounded-t-lg bg-gradient-to-t from-amber-600 to-amber-500 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-amber-200" />
              </div>
            </motion.div>

            {/* 3rd Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-slate-700/50 border-2 border-amber-700 flex items-center justify-center text-2xl">
                {leaderboard[2]?.avatar}
              </div>
              <p className="text-sm font-medium text-white truncate max-w-[80px]">{leaderboard[2]?.name}</p>
              <p className="text-xs text-slate-400">{leaderboard[2]?.score}</p>
              <div className="mt-2 w-16 h-12 rounded-t-lg bg-gradient-to-t from-amber-800 to-amber-700 flex items-center justify-center">
                <Medal className="w-5 h-5 text-amber-500" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Rest of Rankings */}
        <div className="divide-y divide-slate-700/50">
          <AnimatePresence>
            {leaderboard.slice(3).map((entry, index) => (
              <motion.div
                key={entry.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                className={`
                  flex items-center gap-4 px-6 py-4 transition-colors
                  ${entry.isCurrentUser ? 'bg-emerald-500/10' : 'hover:bg-slate-700/30'}
                `}
              >
                <span className="w-8 text-center font-bold text-slate-400">
                  #{entry.rank}
                </span>
                <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center text-xl">
                  {entry.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${entry.isCurrentUser ? 'text-emerald-400' : 'text-white'}`}>
                    {entry.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Flame className="w-3 h-3 text-orange-400" />
                    {entry.streak} day streak
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${entry.isCurrentUser ? 'text-emerald-400' : 'text-white'}`}>
                    {entry.score}
                  </p>
                  <p className="text-xs text-slate-500">
                    {category === 'impact' ? 'kg CO₂' : category === 'streak' ? 'days' : 'actions'}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-center text-xs text-slate-500 mt-4">
        *Community rankings are simulated for demo purposes
      </p>
    </div>
  );
}
