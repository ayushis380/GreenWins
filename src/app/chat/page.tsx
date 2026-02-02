'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, Sparkles, Leaf, User, ThumbsUp, ThumbsDown, Gauge } from 'lucide-react';
import { useWinCards, useSpeechRecognition, useObservability } from '@/hooks';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  traceId?: string;
  confidence?: number;
  feedback?: 'positive' | 'negative' | null;
}

const SUGGESTED_PROMPTS = [
  "What sustainable action should I try next?",
  "How much impact have I made?",
  "Tips for reducing my carbon footprint",
  "Fun facts about sustainability",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { winCards, actions, getWeeklyImpact, getTotalImpact, getActionById } = useWinCards();
  const { isListening, transcript, isSupported, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  const { recordTrace, addFeedback } = useObservability();

  const weeklyImpact = getWeeklyImpact();
  const totalImpact = getTotalImpact();

  // Build user context for the AI
  const userContext = {
    actions: winCards.map(card => {
      const action = getActionById(card.actionId);
      return { name: action?.name || '', category: action?.category || '' };
    }),
    weeklyCompletions: winCards.reduce((sum, card) =>
      sum + card.weeklyStamps.filter(s => s.isStamped).length, 0
    ),
    currentStreak: Math.max(...winCards.map(card => card.streak), 0),
    totalCO2: totalImpact.co2Kg,
    totalWater: totalImpact.waterLiters,
    totalEnergy: totalImpact.energyKwh,
    level: 1,
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle voice transcript
  useEffect(() => {
    if (transcript && !isListening) {
      setInput(transcript);
      resetTranscript();
    }
  }, [transcript, isListening, resetTranscript]);

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          userContext,
        }),
      });

      const data = await response.json();

      // Record trace from API response
      if (data.trace) {
        recordTrace({
          id: data.trace.id,
          endpoint: data.trace.endpoint,
          model: data.trace.model,
          latencyMs: data.trace.latencyMs,
          status: data.trace.status,
          tokenUsage: data.trace.tokenUsage,
          confidence: data.trace.confidence,
          errorMessage: data.trace.errorMessage,
          requestPayload: { message: messageText },
          responsePayload: { content: data.message },
        });
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: data.timestamp,
        traceId: data.trace?.id,
        confidence: data.trace?.confidence,
        feedback: null,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment! 🌱",
        timestamp: new Date().toISOString(),
        feedback: null,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, userContext, recordTrace]);

  // Handle feedback on messages
  const handleFeedback = useCallback((messageId: string, traceId: string | undefined, rating: 'positive' | 'negative') => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, feedback: rating } : msg
    ));

    if (traceId) {
      addFeedback(traceId, rating);
    }
  }, [addFeedback]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">GreenGuide</h1>
            <p className="text-sm text-slate-400">Your sustainability advisor</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Hi there! I&apos;m GreenGuide 🌱</h2>
            <p className="text-slate-400 max-w-md mx-auto mb-8">
              I&apos;m here to help you on your sustainability journey. Ask me for tips,
              track your impact, or discover new eco-friendly habits!
            </p>

            {/* Suggested Prompts */}
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <motion.button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 text-sm text-slate-300 hover:border-emerald-500/50 hover:text-white transition-colors"
                >
                  {prompt}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <Leaf className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className="flex flex-col max-w-[80%]">
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-emerald-500 text-white rounded-br-md'
                        : 'bg-slate-800/80 text-slate-100 rounded-bl-md border border-slate-700/50'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {/* Confidence badge and feedback buttons for assistant messages */}
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mt-1.5 ml-1">
                      {/* Confidence indicator */}
                      {message.confidence !== undefined && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Gauge className="w-3 h-3" />
                          <span>{(message.confidence * 100).toFixed(0)}% confident</span>
                        </div>
                      )}
                      {/* Feedback buttons */}
                      {message.feedback === null && (
                        <div className="flex items-center gap-1 ml-auto">
                          <button
                            onClick={() => handleFeedback(message.id, message.traceId, 'positive')}
                            className="p-1 rounded hover:bg-slate-700/50 transition-colors group"
                            title="Helpful"
                          >
                            <ThumbsUp className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400" />
                          </button>
                          <button
                            onClick={() => handleFeedback(message.id, message.traceId, 'negative')}
                            className="p-1 rounded hover:bg-slate-700/50 transition-colors group"
                            title="Not helpful"
                          >
                            <ThumbsDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-red-400" />
                          </button>
                        </div>
                      )}
                      {/* Show feedback given */}
                      {message.feedback !== null && (
                        <div className="flex items-center gap-1 ml-auto text-xs">
                          {message.feedback === 'positive' ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <ThumbsUp className="w-3 h-3" /> Thanks!
                            </span>
                          ) : (
                            <span className="text-slate-500 flex items-center gap-1">
                              <ThumbsDown className="w-3 h-3" /> Noted
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-slate-800/80 border border-slate-700/50">
              <div className="flex gap-1">
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                  className="w-2 h-2 rounded-full bg-emerald-400"
                />
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  className="w-2 h-2 rounded-full bg-emerald-400"
                />
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  className="w-2 h-2 rounded-full bg-emerald-400"
                />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex gap-3">
          {/* Voice Input Button */}
          {isSupported && (
            <motion.button
              type="button"
              onClick={isListening ? stopListening : startListening}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                isListening
                  ? 'bg-red-500/20 border border-red-500/50 text-red-400'
                  : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600'
              }`}
            >
              {isListening ? (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <MicOff className="w-5 h-5" />
                </motion.div>
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </motion.button>
          )}

          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? 'Listening...' : 'Ask me anything about sustainability...'}
              rows={1}
              className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>

          {/* Send Button */}
          <motion.button
            type="submit"
            disabled={!input.trim() || isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:from-emerald-400 hover:to-teal-400 transition-all"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </form>

        {isListening && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-emerald-400 mt-2 text-center"
          >
            🎤 Listening... Speak now
          </motion.p>
        )}
      </div>
    </div>
  );
}
