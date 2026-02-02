import { Opik } from 'opik';

let opikClient: Opik | null = null;

export function getOpikClient(): Opik | null {
  if (!opikClient) {
    const apiKey = process.env.OPIK_API_KEY;

    if (!apiKey || apiKey === 'your_opik_api_key_here') {
      console.warn('OPIK_API_KEY not configured - tracing disabled');
      return null;
    }

    opikClient = new Opik({
      apiKey,
      projectName: process.env.OPIK_PROJECT_NAME || 'greenwins',
    });
  }

  return opikClient;
}

// Trace a Gemini API call
export async function traceGeminiCall<T>(
  name: string,
  metadata: {
    endpoint: string;
    model: string;
    input?: Record<string, unknown>;
  },
  fn: () => Promise<T>
): Promise<{ result: T; traceId?: string; latencyMs: number }> {
  const startTime = Date.now();
  const client = getOpikClient();

  if (!client) {
    // No Opik configured, just run the function
    const result = await fn();
    return { result, latencyMs: Date.now() - startTime };
  }

  // Create a trace
  const trace = client.trace({
    name,
    input: metadata.input,
    metadata: {
      endpoint: metadata.endpoint,
      model: metadata.model,
      timestamp: new Date().toISOString(),
    },
  });

  try {
    const result = await fn();
    const latencyMs = Date.now() - startTime;

    // Update the trace with output and end it
    trace.update({
      output: typeof result === 'object' && result !== null
        ? result as Record<string, unknown>
        : { result: String(result) },
      metadata: {
        endpoint: metadata.endpoint,
        model: metadata.model,
        latencyMs,
        status: 'success',
      },
    });
    trace.end();

    return { result, traceId: trace.data.id, latencyMs };
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    // Update the trace with error and end it
    trace.update({
      output: { error: error instanceof Error ? error.message : 'Unknown error' },
      metadata: {
        endpoint: metadata.endpoint,
        model: metadata.model,
        latencyMs,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    trace.end();

    throw error;
  }
}

// Create a span within a trace for sub-operations
export function createSpan(
  traceName: string,
  spanName: string,
  input?: Record<string, unknown>
) {
  const client = getOpikClient();

  if (!client) {
    return {
      end: () => {},
      id: null,
    };
  }

  const trace = client.trace({
    name: traceName,
    input,
  });

  const span = trace.span({
    name: spanName,
    input,
  });

  return {
    end: (output?: Record<string, unknown>, metadata?: Record<string, unknown>) => {
      span.update({ output, metadata });
      span.end();
      trace.update({ output, metadata });
      trace.end();
    },
    id: trace.data.id,
  };
}

// Log feedback for a trace (for human-in-the-loop validation)
export async function logFeedback(
  traceId: string,
  score: number,
  comment?: string
) {
  const client = getOpikClient();

  if (!client || !traceId) return;

  try {
    // Create a trace reference and add score
    const trace = client.trace({
      name: 'Feedback',
      input: { traceId, score, comment },
    });
    trace.score({
      name: 'user_feedback',
      value: score,
      reason: comment,
    });
    trace.end();
  } catch (error) {
    console.error('Failed to log Opik feedback:', error);
  }
}

// Flush any pending traces (call before process exit)
export async function flushOpik() {
  const client = getOpikClient();
  if (client) {
    await client.flush();
  }
}
