import { ImpactMetrics } from './actions';
import { Badge } from './user';

export interface LeaderboardEntry {
  rank: number;
  oderId: string;
  displayName: string;
  avatar: string;
  totalImpact: ImpactMetrics;
  weeklyImpact: ImpactMetrics;
  streak: number;
  badges: Badge[];
  isCurrentUser: boolean;
}

export type LeaderboardCategory = 'impact' | 'streak' | 'consistency';
export type LeaderboardTimeframe = 'weekly' | 'monthly' | 'allTime';
