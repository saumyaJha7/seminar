import { NextResponse } from 'next/server';
import { DEFAULT_GROQ_MODEL } from '@/lib/groq';

export async function GET() {
  const apiKey = process.env.GROQ_API_KEY;
  const isConfigured = Boolean(apiKey && apiKey.trim() !== '' && apiKey !== 'your_groq_api_key_here');

  return NextResponse.json({
    hasGroqKey: isConfigured,
    model: DEFAULT_GROQ_MODEL,
    message: isConfigured
      ? 'Live Groq API inference enabled.'
      : 'Demo Simulation mode active. Add GROQ_API_KEY in .env for live Groq LLM inference.',
  });
}
