import { ImpactMetrics } from './actions';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    suggestedActions?: string[];
    impactHighlights?: ImpactMetrics;
    mood?: 'encouraging' | 'celebrating' | 'advisory';
  };
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: string;
  lastMessageAt: string;
}
