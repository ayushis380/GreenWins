import { Opik, OpikSpanType } from 'opik';

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

// Mermaid graph definition for the stamp analysis agent flow
const STAMP_ANALYSIS_GRAPH = `graph TD;
  U[User Input]-->V[Validate Request];
  V-->P[Build Prompt];
  P-->L[Gemini LLM Call];
  L-->PA[Parse Response];
  PA-->VAL[Validate Metrics];
  VAL-->|Valid|R[Return Result];
  VAL-->|Invalid|ADJ[Adjust Metrics];
  ADJ-->R;`;

const COACH_AGENT_GRAPH = `graph TD;
  D[Load Win Cards]-->A[Analyze Patterns];
  A-->L[Generate Nudges];
  L-->I[Generate Insights];
  I-->R[Return Coach Result];`;

const CHAT_AGENT_GRAPH = `graph TD;
  U[User Message]-->C[Build Context];
  C-->L[Gemini LLM Call];
  L-->P[Parse Response];
  P-->R[Return Reply];`;

const CUSTOM_ACTION_GRAPH = `graph TD;
  U[User Input]-->V[Validate Request];
  V-->P[Build Prompt];
  P-->L[Gemini LLM Call];
  L-->PA[Parse Response];
  PA-->VAL[Validate Metrics];
  VAL-->|Valid|R[Return Result];
  VAL-->|Invalid|ADJ[Adjust Metrics];
  ADJ-->R;`;

// Graph definitions keyed by agent/endpoint name
const AGENT_GRAPHS: Record<string, string> = {
  'analyze-stamp': STAMP_ANALYSIS_GRAPH,
  'coach': COACH_AGENT_GRAPH,
  'chat': CHAT_AGENT_GRAPH,
  'analyze-custom-action': CUSTOM_ACTION_GRAPH,
};

/**
 * Extract text output from Gemini response for tracing.
 * Handles the GenerateContentResult object structure.
 */
function extractGeminiOutput(result: unknown): Record<string, unknown> {
  if (!result || typeof result !== 'object') {
    return { result: String(result) };
  }

  const geminiResult = result as {
    response?: {
      text?: () => string;
      usageMetadata?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
        totalTokenCount?: number;
      };
    };
  };

  // Check if this is a Gemini GenerateContentResult
  if (geminiResult.response && typeof geminiResult.response.text === 'function') {
    try {
      const text = geminiResult.response.text();
      const usage = geminiResult.response.usageMetadata;
      return {
        text,
        tokenUsage: usage ? {
          inputTokens: usage.promptTokenCount || 0,
          outputTokens: usage.candidatesTokenCount || 0,
          totalTokens: usage.totalTokenCount || 0,
        } : undefined,
      };
    } catch {
      // If text() fails, fall through to default
    }
  }

  // For other object types, try to return as-is if serializable
  try {
    // Test if it's JSON serializable
    JSON.stringify(result);
    return result as Record<string, unknown>;
  } catch {
    return { result: '[Object - not serializable]' };
  }
}

// Trace a Gemini API call with nested spans and agent graph
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
    const result = await fn();
    return { result, latencyMs: Date.now() - startTime };
  }

  // Create parent trace with agent graph definition
  const graphDef = AGENT_GRAPHS[metadata.endpoint];
  const trace = client.trace({
    name,
    input: metadata.input,
    metadata: {
      endpoint: metadata.endpoint,
      model: metadata.model,
      timestamp: new Date().toISOString(),
      ...(graphDef && {
        _opik_graph_definition: {
          format: 'mermaid',
          data: graphDef,
        },
      }),
    },
  });

  try {
    // Span: LLM call
    const llmSpan = trace.span({
      name: `${metadata.model} - ${metadata.endpoint}`,
      type: OpikSpanType.Llm,
      input: metadata.input,
      metadata: { model: metadata.model },
    });

    const result = await fn();
    const latencyMs = Date.now() - startTime;

    // Extract the actual output from Gemini response
    const output = extractGeminiOutput(result);

    // End the LLM span with extracted output
    llmSpan.update({
      output,
      metadata: { latencyMs, status: 'success' },
    });
    llmSpan.end();

    // End the parent trace
    trace.update({
      output,
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

/**
 * Trace a multi-step agent flow with nested spans and agent graph.
 *
 * Usage:
 *   const agent = traceAgentFlow('Stamp Analysis', 'analyze-stamp', { ... });
 *   const validateSpan = agent.span('Validate Input', 'tool');
 *   // ... do work
 *   validateSpan.end({ valid: true });
 *   const llmSpan = agent.span('Gemini Call', 'llm');
 *   // ... call LLM
 *   llmSpan.end({ response: '...' });
 *   agent.end({ finalResult });
 */
export function traceAgentFlow(
  name: string,
  endpoint: string,
  input?: Record<string, unknown>
) {
  const client = getOpikClient();

  if (!client) {
    return {
      span: () => ({ end: () => {} }),
      end: () => {},
      score: () => {},
      id: null,
    };
  }

  const graphDef = AGENT_GRAPHS[endpoint];
  const trace = client.trace({
    name,
    input,
    metadata: {
      endpoint,
      timestamp: new Date().toISOString(),
      ...(graphDef && {
        _opik_graph_definition: {
          format: 'mermaid',
          data: graphDef,
        },
      }),
    },
  });

  return {
    span(spanName: string, type: 'llm' | 'tool' | 'general' = 'general') {
      const spanTypeMap = { llm: OpikSpanType.Llm, tool: OpikSpanType.Tool, general: OpikSpanType.General };
      const span = trace.span({
        name: spanName,
        type: spanTypeMap[type],
        input,
      });

      return {
        end(output?: Record<string, unknown>, metadata?: Record<string, unknown>) {
          span.update({ output, metadata });
          span.end();
        },
      };
    },

    end(output?: Record<string, unknown>, metadata?: Record<string, unknown>) {
      trace.update({ output, metadata });
      trace.end();
    },

    score(name: string, value: number, reason?: string) {
      trace.score({ name, value, reason });
    },

    id: trace.data.id,
  };
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
