'use client';

import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { LLMTrace, LLMMetrics, ObservabilityState } from '@/types';

const OBSERVABILITY_KEY = 'greenwins_observability';
const MAX_TRACES = 500;

const EMPTY_METRICS: LLMMetrics = {
  totalCalls: 0,
  successfulCalls: 0,
  errorCalls: 0,
  fallbackCalls: 0,
  averageLatencyMs: 0,
  p50LatencyMs: 0,
  p95LatencyMs: 0,
  totalTokensUsed: 0,
  positiveFeedback: 0,
  negativeFeedback: 0,
  helpfulnessScore: 0,
  totalCorrections: 0,
  averageAccuracy: 100,
  confidenceCalibration: [],
  byEndpoint: {},
  dailyStats: [],
};

const INITIAL_STATE: ObservabilityState = {
  traces: [],
  metrics: EMPTY_METRICS,
  lastUpdated: new Date().toISOString(),
};

export function useObservability() {
  const [state, setState] = useLocalStorage<ObservabilityState>(
    OBSERVABILITY_KEY,
    INITIAL_STATE
  );

  // Record a new trace from API response
  const recordTrace = useCallback(
    (traceData: {
      id: string;
      endpoint: string;
      model: string;
      latencyMs: number;
      status: 'success' | 'error' | 'fallback';
      tokenUsage?: { inputTokens: number; outputTokens: number; totalTokens: number };
      confidence?: number;
      errorMessage?: string;
      requestPayload?: Record<string, unknown>;
      responsePayload?: Record<string, unknown>;
    }) => {
      const trace: LLMTrace = {
        id: traceData.id,
        timestamp: new Date().toISOString(),
        endpoint: traceData.endpoint,
        model: traceData.model,
        requestPayload: traceData.requestPayload || {},
        responsePayload: traceData.responsePayload || {},
        latencyMs: traceData.latencyMs,
        status: traceData.status,
        tokenUsage: traceData.tokenUsage,
        confidence: traceData.confidence,
        errorMessage: traceData.errorMessage,
      };

      setState((prev) => {
        const traces = [trace, ...prev.traces].slice(0, MAX_TRACES);
        const metrics = calculateMetrics(traces);
        return { traces, metrics, lastUpdated: new Date().toISOString() };
      });

      return trace.id;
    },
    [setState]
  );

  // Add feedback to a trace
  const addFeedback = useCallback(
    (traceId: string, rating: 'positive' | 'negative', comment?: string) => {
      setState((prev) => {
        const traces = prev.traces.map((trace) =>
          trace.id === traceId
            ? {
                ...trace,
                feedback: {
                  rating,
                  comment,
                  feedbackAt: new Date().toISOString(),
                },
              }
            : trace
        );
        const metrics = calculateMetrics(traces);
        return { traces, metrics, lastUpdated: new Date().toISOString() };
      });
    },
    [setState]
  );

  // Add user correction for impact validation
  const addCorrection = useCallback(
    (
      traceId: string,
      originalValue: Record<string, number>,
      correctedValue: Record<string, number>
    ) => {
      setState((prev) => {
        const traces = prev.traces.map((trace) =>
          trace.id === traceId
            ? {
                ...trace,
                userCorrection: {
                  originalValue,
                  correctedValue,
                  correctedAt: new Date().toISOString(),
                },
              }
            : trace
        );
        const metrics = calculateMetrics(traces);
        return { traces, metrics, lastUpdated: new Date().toISOString() };
      });
    },
    [setState]
  );

  // Get traces by endpoint
  const getTracesByEndpoint = useCallback(
    (endpoint: string, limit = 50) => {
      return state.traces.filter((t) => t.endpoint === endpoint).slice(0, limit);
    },
    [state.traces]
  );

  // Get recent traces awaiting feedback
  const tracesAwaitingFeedback = useMemo(
    () => state.traces.filter((t) => !t.feedback?.rating).slice(0, 10),
    [state.traces]
  );

  // Clear all observability data
  const clearData = useCallback(() => {
    setState(INITIAL_STATE);
  }, [setState]);

  return {
    traces: state.traces,
    metrics: state.metrics,
    lastUpdated: state.lastUpdated,
    recordTrace,
    addFeedback,
    addCorrection,
    getTracesByEndpoint,
    tracesAwaitingFeedback,
    clearData,
  };
}

// Helper function to calculate metrics
function calculateMetrics(traces: LLMTrace[]): LLMMetrics {
  if (traces.length === 0) return EMPTY_METRICS;

  // Basic counts
  const totalCalls = traces.length;
  const successfulCalls = traces.filter((t) => t.status === 'success').length;
  const errorCalls = traces.filter((t) => t.status === 'error').length;
  const fallbackCalls = traces.filter((t) => t.status === 'fallback').length;

  // Latency calculations
  const latencies = traces.map((t) => t.latencyMs).sort((a, b) => a - b);
  const averageLatencyMs = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const p50LatencyMs = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95LatencyMs = latencies[Math.floor(latencies.length * 0.95)] || 0;

  // Token usage
  const totalTokensUsed = traces.reduce(
    (sum, t) => sum + (t.tokenUsage?.totalTokens || 0),
    0
  );

  // Feedback metrics
  const tracesWithFeedback = traces.filter((t) => t.feedback?.rating);
  const positiveFeedback = tracesWithFeedback.filter(
    (t) => t.feedback?.rating === 'positive'
  ).length;
  const negativeFeedback = tracesWithFeedback.filter(
    (t) => t.feedback?.rating === 'negative'
  ).length;
  const helpfulnessScore =
    tracesWithFeedback.length > 0
      ? (positiveFeedback / tracesWithFeedback.length) * 100
      : 0;

  // Accuracy metrics from corrections
  const tracesWithCorrections = traces.filter((t) => t.userCorrection);
  const totalCorrections = tracesWithCorrections.length;

  let averageAccuracy = 100;
  if (totalCorrections > 0) {
    const accuracies = tracesWithCorrections.map((t) => {
      const original = t.userCorrection!.originalValue;
      const corrected = t.userCorrection!.correctedValue;

      const keys = Object.keys(original);
      if (keys.length === 0) return 100;

      const totalAccuracy = keys.reduce((sum, key) => {
        const orig = original[key] || 0;
        const corr = corrected[key] || 0;
        if (corr === 0) return sum + (orig === 0 ? 100 : 0);
        const accuracy = Math.max(0, 100 - Math.abs((orig - corr) / corr) * 100);
        return sum + accuracy;
      }, 0);

      return totalAccuracy / keys.length;
    });

    averageAccuracy = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
  }

  // Confidence calibration
  const confidenceCalibration = calculateConfidenceCalibration(traces);

  // By endpoint breakdown
  const byEndpoint: LLMMetrics['byEndpoint'] = {};
  const endpointGroups = new Map<string, LLMTrace[]>();

  traces.forEach((trace) => {
    const existing = endpointGroups.get(trace.endpoint) || [];
    endpointGroups.set(trace.endpoint, [...existing, trace]);
  });

  endpointGroups.forEach((endpointTraces, endpoint) => {
    const epFeedback = endpointTraces.filter((t) => t.feedback?.rating);
    const epPositive = epFeedback.filter((t) => t.feedback?.rating === 'positive').length;

    byEndpoint[endpoint] = {
      calls: endpointTraces.length,
      avgLatencyMs:
        endpointTraces.reduce((sum, t) => sum + t.latencyMs, 0) / endpointTraces.length,
      successRate:
        (endpointTraces.filter((t) => t.status === 'success').length /
          endpointTraces.length) *
        100,
      helpfulnessScore: epFeedback.length > 0 ? (epPositive / epFeedback.length) * 100 : 0,
    };
  });

  // Daily stats (last 30 days)
  const dailyStats = calculateDailyStats(traces);

  return {
    totalCalls,
    successfulCalls,
    errorCalls,
    fallbackCalls,
    averageLatencyMs,
    p50LatencyMs,
    p95LatencyMs,
    totalTokensUsed,
    positiveFeedback,
    negativeFeedback,
    helpfulnessScore,
    totalCorrections,
    averageAccuracy,
    confidenceCalibration,
    byEndpoint,
    dailyStats,
  };
}

function calculateConfidenceCalibration(
  traces: LLMTrace[]
): LLMMetrics['confidenceCalibration'] {
  const buckets: { [key: string]: { predicted: number[]; actual: boolean[] } } = {
    '0-50%': { predicted: [], actual: [] },
    '50-60%': { predicted: [], actual: [] },
    '60-70%': { predicted: [], actual: [] },
    '70-80%': { predicted: [], actual: [] },
    '80-90%': { predicted: [], actual: [] },
    '90-100%': { predicted: [], actual: [] },
  };

  traces.forEach((trace) => {
    if (trace.confidence === undefined || !trace.feedback?.rating) return;

    const confidence = trace.confidence * 100;
    const wasCorrect = trace.feedback.rating === 'positive';

    let bucket: string;
    if (confidence < 50) bucket = '0-50%';
    else if (confidence < 60) bucket = '50-60%';
    else if (confidence < 70) bucket = '60-70%';
    else if (confidence < 80) bucket = '70-80%';
    else if (confidence < 90) bucket = '80-90%';
    else bucket = '90-100%';

    buckets[bucket].predicted.push(confidence);
    buckets[bucket].actual.push(wasCorrect);
  });

  return Object.entries(buckets).map(([bucket, data]) => ({
    bucket,
    predictedAccuracy:
      data.predicted.length > 0
        ? data.predicted.reduce((a, b) => a + b, 0) / data.predicted.length
        : 0,
    actualAccuracy:
      data.actual.length > 0
        ? (data.actual.filter(Boolean).length / data.actual.length) * 100
        : 0,
    sampleCount: data.actual.length,
  }));
}

function calculateDailyStats(traces: LLMTrace[]): LLMMetrics['dailyStats'] {
  const dailyMap = new Map<string, LLMTrace[]>();

  traces.forEach((trace) => {
    const date = trace.timestamp.split('T')[0];
    const existing = dailyMap.get(date) || [];
    dailyMap.set(date, [...existing, trace]);
  });

  const stats: LLMMetrics['dailyStats'] = [];
  const sortedDates = Array.from(dailyMap.keys()).sort().slice(-30);

  sortedDates.forEach((date) => {
    const dayTraces = dailyMap.get(date) || [];
    const dayFeedback = dayTraces.filter((t) => t.feedback?.rating);
    const dayPositive = dayFeedback.filter(
      (t) => t.feedback?.rating === 'positive'
    ).length;

    stats.push({
      date,
      calls: dayTraces.length,
      avgLatencyMs:
        dayTraces.length > 0
          ? dayTraces.reduce((sum, t) => sum + t.latencyMs, 0) / dayTraces.length
          : 0,
      helpfulnessScore:
        dayFeedback.length > 0 ? (dayPositive / dayFeedback.length) * 100 : 0,
    });
  });

  return stats;
}
