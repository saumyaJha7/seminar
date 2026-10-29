import Groq from 'groq-sdk';

const GROQ_REQUEST_TIMEOUT_MS = 45_000;
const GROQ_MAX_RETRIES = 1;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isModelNotFoundError(error: unknown): boolean {
  if (!isRecord(error)) return false;
  return error.status === 404 ||
    (isRecord(error.error) && error.error.code === 'model_not_found');
}

export function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_groq_api_key_here') {
    return null;
  }
  return new Groq({
    apiKey: apiKey.trim(),
    timeout: GROQ_REQUEST_TIMEOUT_MS,
    maxRetries: GROQ_MAX_RETRIES,
  });
}

export const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

const FALLBACK_MODELS = [
  'openai/gpt-oss-120b',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-20b',
  'llama-3.3-70b-versatile',
];

export async function callGroqChat({
  messages,
  temperature = 0.4,
  max_tokens = 2048,
  model = DEFAULT_GROQ_MODEL,
}: {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  max_tokens?: number;
  model?: string;
}): Promise<string> {
  const groq = getGroqClient();
  if (!groq) {
    throw new Error('GROQ_API_KEY_NOT_CONFIGURED');
  }

  const candidateModels = [model, ...FALLBACK_MODELS.filter((m) => m !== model)];
  let lastError: unknown = null;

  for (const candidateModel of candidateModels) {
    try {
      const response = await groq.chat.completions.create({
        model: candidateModel,
        messages,
        temperature,
        max_tokens,
      });

      return response.choices[0]?.message?.content || '';
    } catch (err: unknown) {
      lastError = err;
      if (isModelNotFoundError(err)) {
        continue;
      }
      throw err;
    }
  }

  throw lastError ?? new Error('All Groq model attempts failed');
}

/**
 * Robust JSON parser from LLM response (handles markdown fences and trailing text)
 */
export function extractJSONFromLLMResponse<T>(content: string): T {
  try {
    return JSON.parse(content.trim()) as T;
  } catch {
    // Try regex extraction of ```json ... ```
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1].trim()) as T;
      } catch {
        // Continue
      }
    }

    // Try finding outer bounds of JSON object or array
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(content.substring(firstBrace, lastBrace + 1)) as T;
      } catch {
        // Continue
      }
    }

    throw new Error(`Failed to parse structured JSON from LLM response: ${content.substring(0, 200)}...`);
  }
}
