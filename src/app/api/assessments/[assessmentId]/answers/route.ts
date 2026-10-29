import { NextResponse } from 'next/server';
import { getAssessment, saveAssessmentAnswers } from '@/lib/assessment-store';
import { Difficulty, StudentAnswer } from '@/types/assessment';

type RouteContext = {
  params: Promise<{ assessmentId: string }>;
};

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

export async function POST(request: Request, context: RouteContext) {
  const { assessmentId } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  if (
    !isRecord(body) ||
    typeof body.studentName !== 'string' ||
    body.studentName.trim().length === 0 ||
    body.studentName.trim().length > 100 ||
    typeof body.gradeLevel !== 'string' ||
    body.gradeLevel.trim().length === 0 ||
    body.gradeLevel.length > 80 ||
    !isDifficulty(body.difficulty) ||
    typeof body.focusArea !== 'string' ||
    body.focusArea.trim().length === 0 ||
    body.focusArea.length > 200
  ) {
    return NextResponse.json({ error: 'Enter valid student and assessment details.' }, { status: 400 });
  }

  try {
    const current = getAssessment(assessmentId);
    if (!current) {
      return NextResponse.json({ error: 'Assessment not found.' }, { status: 404 });
    }
    const ids = new Set(current.questions.map((question) => question.id));
    const answers = parseAnswers(body.studentAnswers, ids);
    if (!answers) {
      return NextResponse.json({ error: 'Provide one valid answer for each assessment question.' }, { status: 400 });
    }

    const assessment = saveAssessmentAnswers(
      assessmentId,
      body.studentName.trim(),
      body.gradeLevel.trim(),
      body.difficulty,
      body.focusArea.trim(),
      answers,
    );
    return NextResponse.json(
      { assessmentId: assessment.id, status: assessment.status },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json({ error: 'Unable to save assessment answers.' }, { status: 500 });
  }
}
