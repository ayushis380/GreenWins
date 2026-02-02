// LLM Observability Types for tracking AI performance

export interface LLMTrace {
  id: string;
  timestamp: string;
  endpoint: string; // e.g., 'chat', 'analyze-stamp', 'calculate-impact'
  model: string;

  // Request details
  requestPayload: {
    prompt?: string;
    message?: string;
    context?: Record<string, unknown>;
  };

  // Response details
  responsePayload: {
    content?: string;
    structured?: Record<string, unknown>;
  };

  // Performance metrics
  latencyMs: number;
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };

  // Quality signals
  status: 'success' | 'error' | 'fallback';
  errorMessage?: string;
  confidence?: number;

  // User feedback (added later)
  feedback?: {
    rating: 'positive' | 'negative' | null;
    comment?: string;
    feedbackAt?: string;
  };

  // For impact validation
  userCorrection?: {
    originalValue: Record<string, number>;
    correctedValue: Record<string, number>;
    correctedAt: string;
  };
}

export interface LLMMetrics {
  totalCalls: number;
  successfulCalls: number;
  errorCalls: number;
  fallbackCalls: number;

  averageLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;

  totalTokensUsed: number;

  // Feedback metrics
  positiveFeedback: number;
  negativeFeedback: number;
  helpfulnessScore: number; // percentage

  // Accuracy metrics (from corrections)
  totalCorrections: number;
  averageAccuracy: number;

  // Confidence calibration
  confidenceCalibration: {
    bucket: string; // e.g., '70-80%'
    predictedAccuracy: number;
    actualAccuracy: number;
    sampleCount: number;
  }[];

  // By endpoint breakdown
  byEndpoint: {
    [endpoint: string]: {
      calls: number;
      avgLatencyMs: number;
      successRate: number;
      helpfulnessScore: number;
    };
  };

  // Time series for charts
  dailyStats: {
    date: string;
    calls: number;
    avgLatencyMs: number;
    helpfulnessScore: number;
  }[];
}

export interface ObservabilityState {
  traces: LLMTrace[];
  metrics: LLMMetrics;
  lastUpdated: string;
}

// Coach Agent Types
export interface CoachNudge {
  id: string;
  type: 'reminder' | 'encouragement' | 'suggestion' | 'celebration';
  title: string;
  message: string;
  actionId?: string;
  priority: 'low' | 'medium' | 'high';
  reasoning: string; // Chain of thought explanation
  createdAt: string;
  dismissedAt?: string;
  actedOn?: boolean;
}

export interface CoachInsight {
  id: string;
  type: 'pattern' | 'prediction' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  dataPoints: string[];
  createdAt: string;
}

// Household/Team Types
export interface Team {
  id: string;
  name: string;
  description?: string;
  emoji: string;
  createdAt: string;
  createdBy: string;
  members: TeamMember[];
  weeklyGoal?: {
    co2Kg: number;
    waterLiters: number;
    energyKwh: number;
  };
  inviteCode: string;
}

export interface TeamMember {
  id: string;
  displayName: string;
  avatar: string;
  joinedAt: string;
  role: 'owner' | 'admin' | 'member';
  weeklyImpact: {
    co2Kg: number;
    waterLiters: number;
    energyKwh: number;
  };
  streak: number;
}

export interface TeamActivity {
  id: string;
  teamId: string;
  memberId: string;
  memberName: string;
  actionName: string;
  impact: {
    co2Kg: number;
    waterLiters: number;
    energyKwh: number;
  };
  timestamp: string;
}

// Streak Insurance Types
export interface StreakInsurance {
  shields: number; // Available streak shields
  maxShields: number;
  usedThisWeek: boolean;
  lastEarnedAt?: string;
  totalEarned: number;
  totalUsed: number;
  protectedDates: string[]; // Dates where shield was used
}

// Weekly Narrative Types
export interface WeeklyNarrative {
  id: string;
  weekStart: string;
  weekEnd: string;
  generatedAt: string;

  // Summary stats
  stats: {
    totalStamps: number;
    uniqueActions: number;
    longestStreak: number;
    topAction: string;
    co2Saved: number;
    waterSaved: number;
    energySaved: number;
  };

  // AI-generated content
  narrative: {
    headline: string;
    story: string;
    highlights: string[];
    encouragement: string;
    nextWeekGoal?: string;
  };

  // Shareable card data
  shareCard?: {
    imageUrl?: string;
    generatedAt?: string;
  };
}

// Seasonal Recommendations
export type Season = 'spring' | 'summer' | 'fall' | 'winter';

export interface SeasonalRecommendation {
  id: string;
  season: Season;
  title: string;
  description: string;
  actionSuggestions: string[];
  tips: string[];
  relevanceScore: number;
}
