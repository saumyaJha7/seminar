import Groq from 'groq-sdk';

export function getGroqClient(apiKeyOverride?: string): Groq | null {
  const apiKey = apiKeyOverride || process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_groq_api_key_here') {
    return null;
  }
  return new Groq({ apiKey: apiKey.trim() });
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
  apiKeyOverride,
  model = DEFAULT_GROQ_MODEL,
}: {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  max_tokens?: number;
  apiKeyOverride?: string;
  model?: string;
}): Promise<string> {
  const groq = getGroqClient(apiKeyOverride);
  if (!groq) {
    throw new Error('GROQ_API_KEY_NOT_CONFIGURED');
  }

  const candidateModels = [model, ...FALLBACK_MODELS.filter((m) => m !== model)];
  let lastError: any = null;

  for (const candidateModel of candidateModels) {
    try {
      const response = await groq.chat.completions.create({
        model: candidateModel,
        messages,
        temperature,
        max_tokens,
      });

      return response.choices[0]?.message?.content || '';
    } catch (err: any) {
      lastError = err;
      // If error is 404 model not found, try next candidate model
      if (err?.status === 404 || err?.error?.code === 'model_not_found') {
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('All Groq model attempts failed');
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
