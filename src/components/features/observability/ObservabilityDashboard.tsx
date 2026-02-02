'use client';

import { motion } from 'framer-motion';
import {
  Activity,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Zap,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { useObservability } from '@/hooks';
import { LLMMetrics } from '@/types';

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  color: string;
}

function MetricCard({ icon, label, value, subtext, color }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
        <span className="text-slate-400 text-sm">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {subtext && <div className="text-xs text-slate-500 mt-1">{subtext}</div>}
    </motion.div>
  );
}

interface EndpointRowProps {
  endpoint: string;
  stats: LLMMetrics['byEndpoint'][string];
}

function EndpointRow({ endpoint, stats }: EndpointRowProps) {
  const endpointLabels: Record<string, string> = {
    chat: 'GreenGuide Chat',
    'analyze-stamp': 'Stamp Analysis',
    'calculate-impact': 'Impact Calculator',
    'parse-voice': 'Voice Parser',
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-700/50 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="text-slate-300">{endpointLabels[endpoint] || endpoint}</span>
      </div>
      <div className="flex items-center gap-6 text-sm">
        <div className="text-center">
          <div className="text-slate-400">{stats.calls}</div>
          <div className="text-xs text-slate-500">calls</div>
        </div>
        <div className="text-center">
          <div className="text-slate-400">{Math.round(stats.avgLatencyMs)}ms</div>
          <div className="text-xs text-slate-500">avg</div>
        </div>
        <div className="text-center">
          <div className={stats.successRate >= 95 ? 'text-emerald-400' : 'text-amber-400'}>
            {stats.successRate.toFixed(0)}%
          </div>
          <div className="text-xs text-slate-500">success</div>
        </div>
        <div className="text-center min-w-[60px]">
          {stats.helpfulnessScore > 0 ? (
            <>
              <div className="text-slate-400">{stats.helpfulnessScore.toFixed(0)}%</div>
              <div className="text-xs text-slate-500">helpful</div>
            </>
          ) : (
            <div className="text-xs text-slate-500">No feedback</div>
          )}
        </div>
      </div>
    </div>
  );
}

interface CalibrationBarProps {
  bucket: string;
  predicted: number;
  actual: number;
  samples: number;
}

function CalibrationBar({ bucket, predicted, actual, samples }: CalibrationBarProps) {
  const diff = actual - predicted;
  const isCalibrated = Math.abs(diff) < 10;

  return (
    <div className="flex items-center gap-4 py-2">
      <div className="w-20 text-sm text-slate-400">{bucket}</div>
      <div className="flex-1">
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden relative">
          <div
            className="h-full bg-emerald-500/50 absolute"
            style={{ width: `${predicted}%` }}
          />
          <div
            className={`h-full ${isCalibrated ? 'bg-emerald-400' : 'bg-amber-400'} absolute`}
            style={{ width: `${actual}%` }}
          />
        </div>
      </div>
      <div className="w-20 text-right">
        <span className={`text-sm ${isCalibrated ? 'text-emerald-400' : 'text-amber-400'}`}>
          {actual.toFixed(0)}%
        </span>
        <span className="text-xs text-slate-500 ml-1">({samples})</span>
      </div>
    </div>
  );
}

export function ObservabilityDashboard() {
  const { metrics, traces, lastUpdated, clearData } = useObservability();

  const successRate =
    metrics.totalCalls > 0
      ? ((metrics.successfulCalls / metrics.totalCalls) * 100).toFixed(1)
      : '0';

  const feedbackCount = metrics.positiveFeedback + metrics.negativeFeedback;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            AI Observability
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Monitor GreenGuide AI performance and user satisfaction
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Last updated</div>
          <div className="text-sm text-slate-400">
            {new Date(lastUpdated).toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<Zap className="w-5 h-5 text-yellow-400" />}
          label="Total API Calls"
          value={metrics.totalCalls}
          subtext={`${metrics.successfulCalls} successful`}
          color="bg-yellow-500/10"
        />
        <MetricCard
          icon={<Clock className="w-5 h-5 text-blue-400" />}
          label="Avg Latency"
          value={`${Math.round(metrics.averageLatencyMs)}ms`}
          subtext={`P95: ${Math.round(metrics.p95LatencyMs)}ms`}
          color="bg-blue-500/10"
        />
        <MetricCard
          icon={<ThumbsUp className="w-5 h-5 text-emerald-400" />}
          label="Helpfulness"
          value={`${metrics.helpfulnessScore.toFixed(0)}%`}
          subtext={`${feedbackCount} ratings`}
          color="bg-emerald-500/10"
        />
        <MetricCard
          icon={<Target className="w-5 h-5 text-purple-400" />}
          label="AI Accuracy"
          value={`${metrics.averageAccuracy.toFixed(0)}%`}
          subtext={`${metrics.totalCorrections} corrections`}
          color="bg-purple-500/10"
        />
      </div>

      {/* Status Breakdown */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-4">Response Status</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300">{metrics.successfulCalls} Success</span>
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-amber-400" />
            <span className="text-slate-300">{metrics.fallbackCalls} Fallback</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-slate-300">{metrics.errorCalls} Error</span>
          </div>
        </div>
        <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden flex">
          {metrics.totalCalls > 0 && (
            <>
              <div
                className="h-full bg-emerald-500"
                style={{
                  width: `${(metrics.successfulCalls / metrics.totalCalls) * 100}%`,
                }}
              />
              <div
                className="h-full bg-amber-500"
                style={{
                  width: `${(metrics.fallbackCalls / metrics.totalCalls) * 100}%`,
                }}
              />
              <div
                className="h-full bg-red-500"
                style={{
                  width: `${(metrics.errorCalls / metrics.totalCalls) * 100}%`,
                }}
              />
            </>
          )}
        </div>
        <div className="text-right mt-2 text-sm text-slate-400">
          {successRate}% success rate
        </div>
      </div>

      {/* Endpoint Breakdown */}
      {Object.keys(metrics.byEndpoint).length > 0 && (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">By Endpoint</h3>
          {Object.entries(metrics.byEndpoint).map(([endpoint, stats]) => (
            <EndpointRow key={endpoint} endpoint={endpoint} stats={stats} />
          ))}
        </div>
      )}

      {/* Confidence Calibration */}
      {metrics.confidenceCalibration.some((c) => c.sampleCount > 0) && (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-2">Confidence Calibration</h3>
          <p className="text-sm text-slate-400 mb-4">
            How well AI confidence matches actual performance
          </p>
          {metrics.confidenceCalibration
            .filter((c) => c.sampleCount > 0)
            .map((cal) => (
              <CalibrationBar
                key={cal.bucket}
                bucket={cal.bucket}
                predicted={cal.predictedAccuracy}
                actual={cal.actualAccuracy}
                samples={cal.sampleCount}
              />
            ))}
          <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500/50 rounded" />
              <span>Predicted</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-400 rounded" />
              <span>Actual</span>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Summary */}
      {feedbackCount > 0 && (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">User Feedback</h3>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-emerald-500/10">
                <ThumbsUp className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {metrics.positiveFeedback}
                </div>
                <div className="text-sm text-slate-400">Helpful</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-red-500/10">
                <ThumbsDown className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {metrics.negativeFeedback}
                </div>
                <div className="text-sm text-slate-400">Not helpful</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {traces.length > 0 && (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">Recent API Calls</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {traces.slice(0, 10).map((trace) => (
              <div
                key={trace.id}
                className="flex items-center justify-between py-2 px-3 bg-slate-900/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      trace.status === 'success'
                        ? 'bg-emerald-400'
                        : trace.status === 'fallback'
                        ? 'bg-amber-400'
                        : 'bg-red-400'
                    }`}
                  />
                  <span className="text-slate-300 text-sm">{trace.endpoint}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-400">{trace.latencyMs}ms</span>
                  {trace.confidence && (
                    <span className="text-slate-500">
                      {(trace.confidence * 100).toFixed(0)}% conf
                    </span>
                  )}
                  {trace.feedback?.rating && (
                    <span>
                      {trace.feedback.rating === 'positive' ? (
                        <ThumbsUp className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <ThumbsDown className="w-4 h-4 text-red-400" />
                      )}
                    </span>
                  )}
                  <span className="text-slate-500 text-xs">
                    {new Date(trace.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Token Usage */}
      {metrics.totalTokensUsed > 0 && (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Token Usage</h3>
              <p className="text-sm text-slate-400">Total tokens consumed</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {metrics.totalTokensUsed.toLocaleString()}
              </div>
              <div className="text-sm text-slate-400">tokens</div>
            </div>
          </div>
        </div>
      )}

      {/* Clear Data Button */}
      <div className="flex justify-end">
        <button
          onClick={clearData}
          className="text-sm text-slate-500 hover:text-slate-400 transition-colors"
        >
          Clear observability data
        </button>
      </div>
    </div>
  );
}
