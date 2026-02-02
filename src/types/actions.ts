export type ActionCategory =
  | 'transport'
  | 'food'
  | 'energy'
  | 'water'
  | 'waste'
  | 'other';

export interface ImpactMetrics {
  co2Kg: number;
  waterLiters: number;
  energyKwh: number;
  treesEquivalent: number;
}

export interface SustainabilityAction {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: ActionCategory;
  impactMetrics: ImpactMetrics;
  isCustom: boolean;
  createdAt: string;
}

export interface StampAnalysis {
  userDescription: string;
  aiInsight: string;
  sustainabilityScore: number; // 1-10
  comparisonSummary?: string;
  environmentalBenefit: string;
  improvementTips?: string[];
  analyzedAt: string;
}

export interface AICalculatedImpact extends ImpactMetrics {
  confidence: number;
  methodology: string;
}

export interface WeeklyStamp {
  dayIndex: number;
  date: string;
  isStamped: boolean;
  stampedAt?: string;
  impactCalculated?: ImpactMetrics;
  userDescription?: string;
  analysis?: StampAnalysis;
  aiCalculatedImpact?: AICalculatedImpact;
}

export interface WinCard {
  id: string;
  actionId: string;
  weeklyStamps: WeeklyStamp[];
  streak: number;
  longestStreak: number;
  totalCompletions: number;
  createdAt: string;
  lastUpdatedAt: string;
}

export interface AggregatedImpact {
  daily: ImpactMetrics;
  weekly: ImpactMetrics;
  monthly: ImpactMetrics;
  allTime: ImpactMetrics;
}

export interface ImpactEquivalencies {
  milesNotDriven: number;
  lightsOffHours: number;
  showersSkipped: number;
  phonesCharged: number;
  treesPlanted: number;
}
