import { WinCard, SustainabilityAction, CoachNudge, CoachInsight } from '@/types';

// Reasoning chain types for the coach agent
interface ReasoningContext {
  currentDate: Date;
  dayOfWeek: number;
  isWeekend: boolean;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  season: 'spring' | 'summer' | 'fall' | 'winter';
}

interface HabitPattern {
  actionId: string;
  actionName: string;
  daysSinceLastStamp: number;
  averageFrequency: number; // stamps per week
  streakStatus: 'active' | 'at-risk' | 'broken';
  bestDays: number[]; // day indices (0-6) where user typically stamps
  completionRate: number; // percentage
}

// Get current reasoning context
export function getReasoningContext(): ReasoningContext {
  const now = new Date();
  const hour = now.getHours();
  const month = now.getMonth();

  let timeOfDay: 'morning' | 'afternoon' | 'evening';
  if (hour < 12) timeOfDay = 'morning';
  else if (hour < 17) timeOfDay = 'afternoon';
  else timeOfDay = 'evening';

  let season: 'spring' | 'summer' | 'fall' | 'winter';
  if (month >= 2 && month <= 4) season = 'spring';
  else if (month >= 5 && month <= 7) season = 'summer';
  else if (month >= 8 && month <= 10) season = 'fall';
  else season = 'winter';

  return {
    currentDate: now,
    dayOfWeek: now.getDay(),
    isWeekend: now.getDay() === 0 || now.getDay() === 6,
    timeOfDay,
    season,
  };
}

// Analyze habit patterns from win cards
export function analyzeHabitPatterns(
  winCards: WinCard[],
  actions: SustainabilityAction[]
): HabitPattern[] {
  const patterns: HabitPattern[] = [];

  for (const card of winCards) {
    const action = actions.find((a) => a.id === card.actionId);
    if (!action) continue;

    // Calculate days since last stamp
    const stampedDays = card.weeklyStamps
      .filter((s) => s.isStamped)
      .map((s) => new Date(s.date));

    const now = new Date();
    let daysSinceLastStamp = 7;
    if (stampedDays.length > 0) {
      const lastStamp = stampedDays.reduce((a, b) => (a > b ? a : b));
      daysSinceLastStamp = Math.floor(
        (now.getTime() - lastStamp.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    // Calculate average frequency and best days
    const stampedIndices = card.weeklyStamps
      .filter((s) => s.isStamped)
      .map((s) => s.dayIndex);

    const frequency = stampedIndices.length;
    const completionRate = (frequency / 7) * 100;

    // Determine streak status
    let streakStatus: 'active' | 'at-risk' | 'broken';
    if (card.streak > 0 && daysSinceLastStamp <= 1) {
      streakStatus = 'active';
    } else if (card.streak > 0 && daysSinceLastStamp <= 2) {
      streakStatus = 'at-risk';
    } else {
      streakStatus = 'broken';
    }

    // Find best days (most frequently stamped)
    const dayFrequency = [0, 0, 0, 0, 0, 0, 0];
    stampedIndices.forEach((idx) => {
      dayFrequency[idx]++;
    });
    const bestDays = dayFrequency
      .map((freq, idx) => ({ freq, idx }))
      .filter((d) => d.freq > 0)
      .sort((a, b) => b.freq - a.freq)
      .slice(0, 3)
      .map((d) => d.idx);

    patterns.push({
      actionId: card.actionId,
      actionName: action.name,
      daysSinceLastStamp,
      averageFrequency: frequency,
      streakStatus,
      bestDays,
      completionRate,
    });
  }

  return patterns;
}

// Generate coach nudges based on patterns and context
export function generateNudges(
  patterns: HabitPattern[],
  context: ReasoningContext,
  actions: SustainabilityAction[]
): CoachNudge[] {
  const nudges: CoachNudge[] = [];
  const now = new Date();

  // Reasoning chain 1: At-risk streaks
  patterns
    .filter((p) => p.streakStatus === 'at-risk')
    .forEach((pattern) => {
      const action = actions.find((a) => a.id === pattern.actionId);
      nudges.push({
        id: `nudge-${pattern.actionId}-streak-${Date.now()}`,
        type: 'reminder',
        title: `Don't lose your streak!`,
        message: `You haven't logged "${pattern.actionName}" in ${pattern.daysSinceLastStamp} days. Complete it today to keep your streak alive!`,
        actionId: pattern.actionId,
        priority: 'high',
        reasoning: `User hasn't logged "${pattern.actionName}" in ${pattern.daysSinceLastStamp} days + streak is at risk + still time today to complete = high priority reminder`,
        createdAt: now.toISOString(),
      });
    });

  // Reasoning chain 2: Time-appropriate suggestions
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
    context.dayOfWeek
  ];

  patterns.forEach((pattern) => {
    // Check if today is one of their best days
    if (pattern.bestDays.includes(context.dayOfWeek) && pattern.daysSinceLastStamp > 0) {
      nudges.push({
        id: `nudge-${pattern.actionId}-bestday-${Date.now()}`,
        type: 'suggestion',
        title: `Perfect day for ${pattern.actionName}`,
        message: `${dayName} is one of your most consistent days for this habit. You've got this!`,
        actionId: pattern.actionId,
        priority: 'medium',
        reasoning: `${dayName} is in user's best days for "${pattern.actionName}" + hasn't stamped today = timely suggestion`,
        createdAt: now.toISOString(),
      });
    }
  });

  // Reasoning chain 3: Seasonal recommendations
  const seasonalActions = getSeasonalRecommendations(context.season, actions, patterns);
  seasonalActions.forEach((rec) => {
    nudges.push({
      id: `nudge-seasonal-${rec.id}-${Date.now()}`,
      type: 'suggestion',
      title: `Great for ${context.season}!`,
      message: rec.message,
      actionId: rec.actionId,
      priority: 'low',
      reasoning: `Season is ${context.season} + action "${rec.name}" is particularly relevant = seasonal suggestion`,
      createdAt: now.toISOString(),
    });
  });

  // Reasoning chain 4: Weekend vs weekday patterns
  if (context.isWeekend) {
    const weekendFriendly = patterns.filter((p) =>
      p.bestDays.some((d) => d === 0 || d === 6)
    );
    if (weekendFriendly.length > 0 && weekendFriendly.some(p => p.daysSinceLastStamp > 0)) {
      const action = weekendFriendly[0];
      nudges.push({
        id: `nudge-weekend-${Date.now()}`,
        type: 'encouragement',
        title: 'Weekend sustainability',
        message: `Weekends are a great time to focus on "${action.actionName}". You typically do well with it on weekends!`,
        actionId: action.actionId,
        priority: 'low',
        reasoning: `It's weekend + user has good weekend habits for "${action.actionName}" = weekend encouragement`,
        createdAt: now.toISOString(),
      });
    }
  }

  // Reasoning chain 5: Time of day suggestions
  if (context.timeOfDay === 'morning') {
    const morningActions = ['Bike Commute', 'Public Transport', 'No Car Day'];
    const relevantPattern = patterns.find((p) =>
      morningActions.some((a) => p.actionName.toLowerCase().includes(a.toLowerCase()))
    );
    if (relevantPattern && relevantPattern.daysSinceLastStamp > 0 && !context.isWeekend) {
      nudges.push({
        id: `nudge-morning-commute-${Date.now()}`,
        type: 'reminder',
        title: 'Morning commute choice',
        message: `Good morning! Consider "${relevantPattern.actionName}" for your commute today. It's a great way to start the day sustainably.`,
        actionId: relevantPattern.actionId,
        priority: 'medium',
        reasoning: `Morning + weekday + user tracks commute actions + hasn't logged today = morning commute reminder`,
        createdAt: now.toISOString(),
      });
    }
  }

  // Reasoning chain 6: Celebration for consistent habits
  patterns
    .filter((p) => p.completionRate >= 70 && p.streakStatus === 'active')
    .forEach((pattern) => {
      nudges.push({
        id: `nudge-${pattern.actionId}-celebrate-${Date.now()}`,
        type: 'celebration',
        title: 'Amazing consistency!',
        message: `You've completed "${pattern.actionName}" ${Math.round(pattern.completionRate)}% of the time this week. That's incredible progress!`,
        actionId: pattern.actionId,
        priority: 'low',
        reasoning: `User has ${pattern.completionRate}% completion rate + active streak = celebration nudge`,
        createdAt: now.toISOString(),
      });
    });

  // Sort by priority and limit
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return nudges
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 5);
}

// Generate insights from patterns
export function generateInsights(
  patterns: HabitPattern[],
  context: ReasoningContext
): CoachInsight[] {
  const insights: CoachInsight[] = [];
  const now = new Date();

  // Insight 1: Overall consistency
  const avgCompletionRate =
    patterns.reduce((sum, p) => sum + p.completionRate, 0) / (patterns.length || 1);

  if (avgCompletionRate > 0) {
    insights.push({
      id: `insight-consistency-${Date.now()}`,
      type: 'pattern',
      title: 'Your consistency score',
      description:
        avgCompletionRate >= 50
          ? `You're completing ${Math.round(avgCompletionRate)}% of your sustainability goals on average. Keep up the great work!`
          : `You're completing ${Math.round(avgCompletionRate)}% of your goals. Small improvements each week add up to big impact!`,
      confidence: 0.9,
      dataPoints: patterns.map((p) => `${p.actionName}: ${Math.round(p.completionRate)}%`),
      createdAt: now.toISOString(),
    });
  }

  // Insight 2: Best performing habit
  const bestHabit = patterns.reduce(
    (best, p) => (p.completionRate > (best?.completionRate || 0) ? p : best),
    null as HabitPattern | null
  );

  if (bestHabit && bestHabit.completionRate > 0) {
    insights.push({
      id: `insight-best-${Date.now()}`,
      type: 'pattern',
      title: 'Your strongest habit',
      description: `"${bestHabit.actionName}" is your most consistent action at ${Math.round(bestHabit.completionRate)}%. This shows you have the discipline for sustainability!`,
      confidence: 0.85,
      dataPoints: [`Completion rate: ${Math.round(bestHabit.completionRate)}%`],
      createdAt: now.toISOString(),
    });
  }

  // Insight 3: Habit at risk prediction
  const atRiskHabits = patterns.filter(
    (p) => p.streakStatus === 'at-risk' || (p.averageFrequency > 0 && p.daysSinceLastStamp >= 3)
  );

  if (atRiskHabits.length > 0) {
    insights.push({
      id: `insight-atrisk-${Date.now()}`,
      type: 'prediction',
      title: 'Habits needing attention',
      description: `${atRiskHabits.length} of your habits haven't been logged recently. A quick check-in could help maintain your momentum.`,
      confidence: 0.75,
      dataPoints: atRiskHabits.map(
        (p) => `${p.actionName}: ${p.daysSinceLastStamp} days since last stamp`
      ),
      createdAt: now.toISOString(),
    });
  }

  // Insight 4: Day pattern recognition
  const dayFrequency = [0, 0, 0, 0, 0, 0, 0];
  patterns.forEach((p) => {
    p.bestDays.forEach((d) => {
      dayFrequency[d]++;
    });
  });
  const mostActiveDay = dayFrequency.indexOf(Math.max(...dayFrequency));
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (Math.max(...dayFrequency) > 0) {
    insights.push({
      id: `insight-daypattern-${Date.now()}`,
      type: 'pattern',
      title: 'Your most sustainable day',
      description: `${dayNames[mostActiveDay]} tends to be your most active day for sustainable actions. Schedule important habits on this day!`,
      confidence: 0.8,
      dataPoints: dayFrequency.map((f, i) => `${dayNames[i]}: ${f} habits active`),
      createdAt: now.toISOString(),
    });
  }

  return insights;
}

// Get seasonal recommendations
function getSeasonalRecommendations(
  season: string,
  actions: SustainabilityAction[],
  patterns: HabitPattern[]
): { id: string; name: string; actionId?: string; message: string }[] {
  const recommendations: { id: string; name: string; actionId?: string; message: string }[] = [];

  const seasonalTips: Record<string, { keywords: string[]; tips: string[] }> = {
    spring: {
      keywords: ['bike', 'local', 'produce', 'compost'],
      tips: [
        'Spring is perfect for starting a composting habit!',
        'Farmer\'s markets are opening up - great time for local produce.',
        'The weather is ideal for bike commuting.',
      ],
    },
    summer: {
      keywords: ['line dry', 'cold water', 'shorter shower', 'bike'],
      tips: [
        'Line drying clothes saves energy and they dry quickly in summer!',
        'Cold water washing is refreshing and eco-friendly.',
        'Shorter showers help conserve water during dry months.',
      ],
    },
    fall: {
      keywords: ['energy', 'local', 'produce', 'compost'],
      tips: [
        'Harvest season means abundant local produce options.',
        'Start collecting fallen leaves for composting.',
        'Time to focus on energy efficiency before winter.',
      ],
    },
    winter: {
      keywords: ['energy', 'unplugged', 'shorter shower'],
      tips: [
        'Focus on energy conservation during heating season.',
        'Unplugging devices is especially important with higher energy use.',
        'Shorter showers save both water and heating energy.',
      ],
    },
  };

  const tips = seasonalTips[season];
  if (!tips) return [];

  // Find matching actions
  const matchingActions = actions.filter((action) =>
    tips.keywords.some((keyword) =>
      action.name.toLowerCase().includes(keyword) ||
      action.description.toLowerCase().includes(keyword)
    )
  );

  // Only recommend actions user isn't already doing well
  matchingActions.forEach((action, index) => {
    const pattern = patterns.find((p) => p.actionId === action.id);
    if (!pattern || pattern.completionRate < 50) {
      recommendations.push({
        id: `seasonal-${action.id}`,
        name: action.name,
        actionId: action.id,
        message: tips.tips[index % tips.tips.length],
      });
    }
  });

  return recommendations.slice(0, 2);
}

// Main coach function - call this periodically
export function runCoachAgent(
  winCards: WinCard[],
  actions: SustainabilityAction[]
): { nudges: CoachNudge[]; insights: CoachInsight[] } {
  const context = getReasoningContext();
  const patterns = analyzeHabitPatterns(winCards, actions);
  const nudges = generateNudges(patterns, context, actions);
  const insights = generateInsights(patterns, context);

  return { nudges, insights };
}
