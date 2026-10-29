import { NextRequest, NextResponse } from 'next/server';
import { consumeAssessmentCreationLimit, createSubmittedAssessment } from '@/lib/assessment-store';
import {
  parseQuestionGenerationConfig,
  AssessmentOutputValidationError,
  validateGeneratedQuestions,
} from '@/lib/assessment-contracts';
import { getGroqClient } from '@/lib/groq';
import { Difficulty, StudentAnswer } from '@/types/assessment';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDifficulty(value: unknown): value is Difficulty {
  return value === 'beginner' || value === 'intermediate' || value === 'advanced';
}

function parseAnswers(value: unknown, questionIds: Set<string>): StudentAnswer[] | null {
  if (!Array.isArray(value) || value.length !== questionIds.size) return null;

  const seen = new Set<string>();
  const answers: StudentAnswer[] = [];
  for (const item of value) {
    if (
      !isRecord(item) ||
      typeof item.questionId !== 'string' ||
      !questionIds.has(item.questionId) ||
      seen.has(item.questionId) ||
      typeof item.answer !== 'string' ||
      item.answer.length > 4000 ||
      (item.reasoning !== undefined &&
        (typeof item.reasoning !== 'string' || item.reasoning.length > 4000))
    ) {
      return null;
    }

    seen.add(item.questionId);
    answers.push({
      questionId: item.questionId,
      answer: item.answer.trim(),
      reasoning: typeof item.reasoning === 'string' ? item.reasoning.trim() : '',
    });
  }

  return answers;
}

export async function POST(request: NextRequest) {
  const idempotencyKey = request.headers.get('idempotency-key');
  if (!idempotencyKey || idempotencyKey.length > 120) {
    return NextResponse.json({ error: 'A valid submission key is required.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: 'Assessment details are required.' }, { status: 400 });
  }

  const { studentName, gradeLevel, difficulty, focusArea } = body;
  if (
    typeof studentName !== 'string' ||
    studentName.trim().length === 0 ||
    studentName.trim().length > 100 ||
    typeof gradeLevel !== 'string' ||
    gradeLevel.trim().length === 0 ||
    gradeLevel.length > 80 ||
    !isDifficulty(difficulty) ||
    typeof focusArea !== 'string' ||
    focusArea.trim().length === 0 ||
    focusArea.length > 200
  ) {
    return NextResponse.json({ error: 'Enter valid student and assessment details.' }, { status: 400 });
  }

  const config = parseQuestionGenerationConfig(body.questionCount, body.targetBloomLevels);
  if (!config) {
    return NextResponse.json({ error: 'The question count and selected Bloom levels are invalid.' }, { status: 400 });
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

    const questions = validateGeneratedQuestions(
      { questions: body.questions },
      difficulty,
      focusArea.trim(),
      config,
    );
    const answers = parseAnswers(body.studentAnswers, new Set(questions.map((question) => question.id)));
    if (!answers) {
      return NextResponse.json(
        { error: 'Provide one valid answer for each assessment question.' },
        { status: 400 },
      );
    }

    const assessment = createSubmittedAssessment(
      {
        studentName: studentName.trim(),
        gradeLevel: gradeLevel.trim(),
        difficulty,
        focusArea: focusArea.trim(),
        questionCount: config.questionCount,
        targetBloomLevels: config.targetBloomLevels,
        questions,
        answers,
        mode: getGroqClient() ? 'groq' : 'demo',
      },
      idempotencyKey,
    );

    return NextResponse.json(
      { assessmentId: assessment.id, status: assessment.status, mode: assessment.mode },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    if (error instanceof AssessmentOutputValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Unable to enforce the creation limit or save this assessment.' }, { status: 500 });
  }
}
