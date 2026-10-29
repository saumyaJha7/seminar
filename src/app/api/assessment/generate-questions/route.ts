import { NextRequest, NextResponse } from 'next/server';
import { runAssessmentDesigner } from '@/lib/agents/designer';
import { getAssessment, saveGeneratedQuestions, updateAssessmentStatus } from '@/lib/assessment-store';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ success: false, error: 'Assessment parameters are required.' }, { status: 400 });
  }

  const { assessmentId } = body;
  if (typeof assessmentId !== 'string' || assessmentId.trim().length === 0) {
    return NextResponse.json({ success: false, error: 'A valid assessment ID is required.' }, { status: 400 });
  }

  let assessment = getAssessment(assessmentId);
  if (!assessment) {
    return NextResponse.json({ success: false, error: 'Assessment draft not found.' }, { status: 404 });
  }
  if (assessment.status === 'failed' && assessment.failureStage === 'questions') {
    updateAssessmentStatus(assessment.id, 'generating_questions', 'questions', 'Retrying question generation.');
    assessment = getAssessment(assessment.id);
  }
  if (!assessment || assessment.status !== 'generating_questions') {
    return NextResponse.json({ success: false, error: 'This assessment is not waiting for question generation.' }, { status: 409 });
  }

  try {
    const result = await runAssessmentDesigner({
      gradeLevel: assessment.gradeLevel,
      difficulty: assessment.difficulty,
      focusArea: assessment.focusArea,
      questionCount: assessment.questionCount,
      targetBloomLevels: assessment.targetBloomLevels,
    });
    const savedAssessment = saveGeneratedQuestions(assessment.id, result.questions);

    return NextResponse.json(
      {
        success: true,
        assessmentId: savedAssessment.id,
        status: savedAssessment.status,
        mode: savedAssessment.mode,
        questions: savedAssessment.questions,
        executionTimeMs: result.executionTimeMs,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    const latest = getAssessment(assessment.id);
    if (latest && latest.status === 'generating_questions') {
      updateAssessmentStatus(
        assessment.id,
        'failed',
        'questions',
        'Question generation failed; the saved draft can be retried.',
      );
    }
    return NextResponse.json(
      { success: false, error: 'Question generation failed. Please retry.' },
      { status: 502 },
    );
  }
}
