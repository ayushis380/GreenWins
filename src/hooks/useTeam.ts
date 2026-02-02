'use client';

import { useState, useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Team, TeamMember, TeamActivity } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const TEAM_KEY = 'greenwins_team';
const TEAM_ACTIVITY_KEY = 'greenwins_team_activity';

interface TeamState {
  currentTeam: Team | null;
  invitedTeams: string[]; // invite codes
}

const INITIAL_STATE: TeamState = {
  currentTeam: null,
  invitedTeams: [],
};

// Team emoji options
const TEAM_EMOJIS = ['🏠', '👨‍👩‍👧‍👦', '🌿', '🌍', '💚', '🌱', '🏡', '🤝', '✨', '🎯'];

export function useTeam() {
  const [state, setState] = useLocalStorage<TeamState>(TEAM_KEY, INITIAL_STATE);
  const [activities, setActivities] = useLocalStorage<TeamActivity[]>(TEAM_ACTIVITY_KEY, []);

  // Generate a unique invite code
  const generateInviteCode = useCallback(() => {
    return `GW-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }, []);

  // Create a new team
  const createTeam = useCallback(
    (name: string, description?: string, emoji?: string) => {
      const userId = uuidv4();
      const member: TeamMember = {
        id: userId,
        displayName: 'You',
        avatar: '👤',
        joinedAt: new Date().toISOString(),
        role: 'owner',
        weeklyImpact: { co2Kg: 0, waterLiters: 0, energyKwh: 0 },
        streak: 0,
      };

      const team: Team = {
        id: uuidv4(),
        name,
        description,
        emoji: emoji || TEAM_EMOJIS[Math.floor(Math.random() * TEAM_EMOJIS.length)],
        createdAt: new Date().toISOString(),
        createdBy: userId,
        members: [member],
        inviteCode: generateInviteCode(),
      };

      setState((prev) => ({
        ...prev,
        currentTeam: team,
      }));

      return team;
    },
    [setState, generateInviteCode]
  );

  // Join a team with invite code (simulated - in real app would be server-side)
  const joinTeam = useCallback(
    (inviteCode: string, displayName: string) => {
      // In a real app, this would validate the invite code server-side
      // For demo, we'll create a simulated team if the code looks valid
      if (!inviteCode.startsWith('GW-') || inviteCode.length < 9) {
        return { success: false, error: 'Invalid invite code' };
      }

      const userId = uuidv4();
      const member: TeamMember = {
        id: userId,
        displayName,
        avatar: '👤',
        joinedAt: new Date().toISOString(),
        role: 'member',
        weeklyImpact: { co2Kg: 0, waterLiters: 0, energyKwh: 0 },
        streak: 0,
      };

      // For demo, create a simulated team
      const team: Team = {
        id: uuidv4(),
        name: 'Joined Team',
        description: 'A team you joined',
        emoji: '🤝',
        createdAt: new Date().toISOString(),
        createdBy: 'demo-owner',
        members: [
          {
            id: 'demo-owner',
            displayName: 'Team Owner',
            avatar: '👑',
            joinedAt: new Date().toISOString(),
            role: 'owner',
            weeklyImpact: { co2Kg: 12.5, waterLiters: 450, energyKwh: 3.2 },
            streak: 5,
          },
          {
            id: 'demo-member',
            displayName: 'Other Member',
            avatar: '🌱',
            joinedAt: new Date().toISOString(),
            role: 'member',
            weeklyImpact: { co2Kg: 8.3, waterLiters: 280, energyKwh: 2.1 },
            streak: 3,
          },
          member,
        ],
        inviteCode,
      };

      setState((prev) => ({
        ...prev,
        currentTeam: team,
        invitedTeams: [...prev.invitedTeams, inviteCode],
      }));

      return { success: true, team };
    },
    [setState]
  );

  // Leave current team
  const leaveTeam = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentTeam: null,
    }));
    setActivities([]);
  }, [setState, setActivities]);

  // Update member impact (when user stamps an action)
  const updateMemberImpact = useCallback(
    (impact: { co2Kg: number; waterLiters: number; energyKwh: number }) => {
      if (!state.currentTeam) return;

      setState((prev) => {
        if (!prev.currentTeam) return prev;

        // Find the current user (last member added, or owner if created)
        const updatedMembers = prev.currentTeam.members.map((member, idx) => {
          // For demo, update the last member (the current user)
          if (idx === prev.currentTeam!.members.length - 1) {
            return {
              ...member,
              weeklyImpact: {
                co2Kg: member.weeklyImpact.co2Kg + impact.co2Kg,
                waterLiters: member.weeklyImpact.waterLiters + impact.waterLiters,
                energyKwh: member.weeklyImpact.energyKwh + impact.energyKwh,
              },
            };
          }
          return member;
        });

        return {
          ...prev,
          currentTeam: {
            ...prev.currentTeam,
            members: updatedMembers,
          },
        };
      });
    },
    [state.currentTeam, setState]
  );

  // Add activity to feed
  const addActivity = useCallback(
    (actionName: string, impact: { co2Kg: number; waterLiters: number; energyKwh: number }) => {
      if (!state.currentTeam) return;

      const activity: TeamActivity = {
        id: uuidv4(),
        teamId: state.currentTeam.id,
        memberId: 'current-user',
        memberName: 'You',
        actionName,
        impact,
        timestamp: new Date().toISOString(),
      };

      setActivities((prev) => [activity, ...prev].slice(0, 50));
      updateMemberImpact(impact);
    },
    [state.currentTeam, setActivities, updateMemberImpact]
  );

  // Set weekly goal
  const setWeeklyGoal = useCallback(
    (goal: { co2Kg: number; waterLiters: number; energyKwh: number }) => {
      if (!state.currentTeam) return;

      setState((prev) => {
        if (!prev.currentTeam) return prev;
        return {
          ...prev,
          currentTeam: {
            ...prev.currentTeam,
            weeklyGoal: goal,
          },
        };
      });
    },
    [state.currentTeam, setState]
  );

  // Calculate team totals
  const teamTotals = useMemo(() => {
    if (!state.currentTeam) return { co2Kg: 0, waterLiters: 0, energyKwh: 0 };

    return state.currentTeam.members.reduce(
      (totals, member) => ({
        co2Kg: totals.co2Kg + member.weeklyImpact.co2Kg,
        waterLiters: totals.waterLiters + member.weeklyImpact.waterLiters,
        energyKwh: totals.energyKwh + member.weeklyImpact.energyKwh,
      }),
      { co2Kg: 0, waterLiters: 0, energyKwh: 0 }
    );
  }, [state.currentTeam]);

  // Calculate goal progress
  const goalProgress = useMemo(() => {
    if (!state.currentTeam?.weeklyGoal) return null;

    const goal = state.currentTeam.weeklyGoal;
    return {
      co2Kg: goal.co2Kg > 0 ? (teamTotals.co2Kg / goal.co2Kg) * 100 : 0,
      waterLiters: goal.waterLiters > 0 ? (teamTotals.waterLiters / goal.waterLiters) * 100 : 0,
      energyKwh: goal.energyKwh > 0 ? (teamTotals.energyKwh / goal.energyKwh) * 100 : 0,
    };
  }, [state.currentTeam?.weeklyGoal, teamTotals]);

  // Get sorted leaderboard
  const memberLeaderboard = useMemo(() => {
    if (!state.currentTeam) return [];

    return [...state.currentTeam.members].sort(
      (a, b) => b.weeklyImpact.co2Kg - a.weeklyImpact.co2Kg
    );
  }, [state.currentTeam]);

  return {
    team: state.currentTeam,
    activities,
    teamTotals,
    goalProgress,
    memberLeaderboard,
    createTeam,
    joinTeam,
    leaveTeam,
    addActivity,
    setWeeklyGoal,
    TEAM_EMOJIS,
  };
}
