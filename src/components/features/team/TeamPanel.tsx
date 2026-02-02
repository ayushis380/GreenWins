'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Copy,
  Check,
  LogOut,
  Trophy,
  Target,
  Activity,
  Crown,
  UserPlus,
} from 'lucide-react';
import { useTeam } from '@/hooks';

export function TeamPanel() {
  const {
    team,
    activities,
    teamTotals,
    goalProgress,
    memberLeaderboard,
    createTeam,
    joinTeam,
    leaveTeam,
    setWeeklyGoal,
    TEAM_EMOJIS,
  } = useTeam();

  const [mode, setMode] = useState<'view' | 'create' | 'join'>('view');
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🏠');
  const [inviteCode, setInviteCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [copied, setCopied] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalValues, setGoalValues] = useState({ co2Kg: 50, waterLiters: 2000, energyKwh: 10 });

  const handleCreateTeam = () => {
    if (!teamName.trim()) return;
    createTeam(teamName.trim(), teamDescription.trim() || undefined, selectedEmoji);
    setMode('view');
    setTeamName('');
    setTeamDescription('');
  };

  const handleJoinTeam = () => {
    if (!inviteCode.trim() || !displayName.trim()) return;
    const result = joinTeam(inviteCode.trim(), displayName.trim());
    if (result.success) {
      setMode('view');
      setInviteCode('');
      setDisplayName('');
    }
  };

  const handleCopyInvite = () => {
    if (team?.inviteCode) {
      navigator.clipboard.writeText(team.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSetGoal = () => {
    setWeeklyGoal(goalValues);
    setShowGoalModal(false);
  };

  // No team - show create/join options
  if (!team) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Household / Team</h2>
            <p className="text-xs text-slate-500">Track impact together</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'view' && (
            <motion.div
              key="options"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <p className="text-sm text-slate-400 mb-4">
                Create a household or team to track your collective sustainability impact!
              </p>
              <motion.button
                onClick={() => setMode('create')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 text-left group hover:from-emerald-500/20 hover:to-teal-500/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-emerald-300">Create a Team</h3>
                    <p className="text-xs text-slate-400">Start a new household or friend group</p>
                  </div>
                </div>
              </motion.button>

              <motion.button
                onClick={() => setMode('join')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-left group hover:bg-slate-800 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-700/50 text-slate-400">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-300">Join a Team</h3>
                    <p className="text-xs text-slate-500">Enter an invite code</p>
                  </div>
                </div>
              </motion.button>
            </motion.div>
          )}

          {mode === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Team Name
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g., The Smith Family"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Choose an Emoji
                </label>
                <div className="flex flex-wrap gap-2">
                  {TEAM_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                        selectedEmoji === emoji
                          ? 'bg-emerald-500/20 border-2 border-emerald-500'
                          : 'bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  placeholder="Our family's sustainability journey..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setMode('view')}
                  className="flex-1 py-3 rounded-xl bg-slate-700/50 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={handleCreateTeam}
                  disabled={!teamName.trim()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium disabled:opacity-50 hover:from-emerald-400 hover:to-teal-400 transition-all"
                >
                  Create Team
                </motion.button>
              </div>
            </motion.div>
          )}

          {mode === 'join' && (
            <motion.div
              key="join"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Your Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g., Alex"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Invite Code
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="e.g., GW-ABC123"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none font-mono"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setMode('view')}
                  className="flex-1 py-3 rounded-xl bg-slate-700/50 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={handleJoinTeam}
                  disabled={!inviteCode.trim() || !displayName.trim()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium disabled:opacity-50 hover:from-blue-400 hover:to-purple-400 transition-all"
                >
                  Join Team
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Has team - show team view
  return (
    <div className="space-y-4">
      {/* Team Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-2xl">
            {team.emoji}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{team.name}</h2>
            <p className="text-xs text-slate-400">{team.members.length} members</p>
          </div>
        </div>
        <button
          onClick={leaveTeam}
          className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-red-400 transition-colors"
          title="Leave team"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Invite Code */}
      <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">Invite Code</p>
            <p className="font-mono text-emerald-400">{team.inviteCode}</p>
          </div>
          <button
            onClick={handleCopyInvite}
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* Team Impact */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30">
        <h3 className="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4" />
          Team Weekly Impact
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{teamTotals.co2Kg.toFixed(1)}</p>
            <p className="text-xs text-slate-400">kg CO2</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{Math.round(teamTotals.waterLiters)}</p>
            <p className="text-xs text-slate-400">L water</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{teamTotals.energyKwh.toFixed(1)}</p>
            <p className="text-xs text-slate-400">kWh</p>
          </div>
        </div>
      </div>

      {/* Goal Progress */}
      {team.weeklyGoal ? (
        <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Weekly Goal Progress
            </h3>
            <button
              onClick={() => setShowGoalModal(true)}
              className="text-xs text-slate-500 hover:text-slate-400"
            >
              Edit
            </button>
          </div>
          {goalProgress && (
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>CO2</span>
                  <span>{Math.min(100, goalProgress.co2Kg).toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, goalProgress.co2Kg)}%` }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Water</span>
                  <span>{Math.min(100, goalProgress.waterLiters).toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, goalProgress.waterLiters)}%` }}
                    className="h-full bg-cyan-500 rounded-full"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Energy</span>
                  <span>{Math.min(100, goalProgress.energyKwh).toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, goalProgress.energyKwh)}%` }}
                    className="h-full bg-amber-500 rounded-full"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <motion.button
          onClick={() => setShowGoalModal(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full p-3 rounded-xl border border-dashed border-slate-600 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400 transition-colors flex items-center justify-center gap-2"
        >
          <Target className="w-4 h-4" />
          Set Weekly Goal
        </motion.button>
      )}

      {/* Member Leaderboard */}
      <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
        <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          Member Leaderboard
        </h3>
        <div className="space-y-2">
          {memberLeaderboard.map((member, idx) => (
            <div
              key={member.id}
              className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/30"
            >
              <div className="w-6 text-center">
                {idx === 0 ? (
                  <Crown className="w-4 h-4 text-amber-400 mx-auto" />
                ) : (
                  <span className="text-xs text-slate-500">#{idx + 1}</span>
                )}
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm">
                {member.avatar}
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-300">{member.displayName}</p>
                <p className="text-xs text-slate-500">
                  {member.weeklyImpact.co2Kg.toFixed(1)} kg CO2
                </p>
              </div>
              {member.streak > 0 && (
                <span className="text-xs text-amber-400">🔥 {member.streak}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      {activities.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
          <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Recent Activity
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {activities.slice(0, 5).map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-2 text-xs text-slate-400"
              >
                <span className="text-emerald-400">{activity.memberName}</span>
                <span>completed</span>
                <span className="text-slate-300">{activity.actionName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goal Modal */}
      <AnimatePresence>
        {showGoalModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGoalModal(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-4 right-4 top-1/2 -translate-y-1/2 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md bg-slate-800 rounded-2xl border border-slate-700 p-6 z-50"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Set Weekly Goal</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">CO2 (kg)</label>
                  <input
                    type="number"
                    value={goalValues.co2Kg}
                    onChange={(e) =>
                      setGoalValues({ ...goalValues, co2Kg: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Water (L)</label>
                  <input
                    type="number"
                    value={goalValues.waterLiters}
                    onChange={(e) =>
                      setGoalValues({
                        ...goalValues,
                        waterLiters: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Energy (kWh)</label>
                  <input
                    type="number"
                    value={goalValues.energyKwh}
                    onChange={(e) =>
                      setGoalValues({
                        ...goalValues,
                        energyKwh: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowGoalModal(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSetGoal}
                  className="flex-1 py-2 rounded-lg bg-emerald-500 text-white"
                >
                  Set Goal
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
