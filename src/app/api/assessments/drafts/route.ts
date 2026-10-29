import { NextResponse } from 'next/server';
import { consumeAssessmentCreationLimit, createQuestionGenerationAssessment } from '@/lib/assessment-store';
import { getGroqClient } from '@/lib/groq';
import { DEFAULT_QUESTION_COUNT, Difficulty, BLOOM_LEVELS } from '@/types/assessment';
import { parseQuestionGenerationConfig } from '@/lib/assessment-contracts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDifficulty(value: unknown): value is Difficulty {
  return value === 'beginner' || value === 'intermediate' || value === 'advanced';
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  if (
    !isRecord(body) ||
    typeof body.gradeLevel !== 'string' ||
    body.gradeLevel.trim().length === 0 ||
    body.gradeLevel.length > 80 ||
    !isDifficulty(body.difficulty) ||
    typeof body.focusArea !== 'string' ||
    body.focusArea.trim().length === 0 ||
    body.focusArea.length > 200
  ) {
    return NextResponse.json(
      { error: 'Enter valid assessment details, select 3–12 questions, and choose no more Bloom levels than questions.' },
      { status: 400 },
    );
  }

  const config = parseQuestionGenerationConfig(
    body.questionCount ?? DEFAULT_QUESTION_COUNT,
    body.targetBloomLevels ?? BLOOM_LEVELS,
  );
  if (!config) {
    return NextResponse.json(
      { error: 'Select 3–12 questions and no more Bloom levels than the question count.' },
      { status: 400 },
    );
  }

  try {
    const forwardedAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const rateLimit = consumeAssessmentCreationLimit(
      forwardedAddress && forwardedAddress.length <= 128 ? forwardedAddress : 'unknown',
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many assessments were started from this address. Please wait before trying again.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
      );
    }

    const assessment = createQuestionGenerationAssessment({
      studentName: '',
      gradeLevel: body.gradeLevel.trim(),
      difficulty: body.difficulty,
      focusArea: body.focusArea.trim(),
      questionCount: config.questionCount,
      targetBloomLevels: config.targetBloomLevels,
      mode: getGroqClient() ? 'groq' : 'demo',
    });
    return NextResponse.json(
      { assessmentId: assessment.id, status: assessment.status, mode: assessment.mode },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json({ error: 'Unable to initialize the question set or enforce its creation limit.' }, { status: 500 });
  }
}
