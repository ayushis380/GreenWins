export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: string;
  category: 'streak' | 'impact' | 'consistency' | 'special';
}

export interface UserPreferences {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  theme: 'light' | 'dark' | 'auto';
}

export interface UserProfile {
  id: string;
  displayName: string;
  avatar: string;
  joinDate: string;
  level: number;
  xp: number;
  badges: Badge[];
  preferences: UserPreferences;
}
