import { NextResponse } from 'next/server';
import { deleteAssessment, getAssessment } from '@/lib/assessment-store';

type RouteContext = {
  params: Promise<{ assessmentId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { assessmentId } = await context.params;

  try {
    const assessment = getAssessment(assessmentId);
    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found.' }, { status: 404 });
    }

    return NextResponse.json(
      {
        assessment: {
          id: assessment.id,
          status: assessment.status,
          pauseRequested: assessment.pauseRequested,
          mode: assessment.mode,
          createdAt: assessment.createdAt,
          updatedAt: assessment.updatedAt,
          studentName: assessment.studentName,
          gradeLevel: assessment.gradeLevel,
          difficulty: assessment.difficulty,
          focusArea: assessment.focusArea,
          questionCount: assessment.questionCount,
          targetBloomLevels: assessment.targetBloomLevels,
          questions: assessment.questions,
          answers: assessment.answers,
          evaluations: assessment.evaluations,
          events: assessment.events,
          report: assessment.report,
          failureStage: assessment.failureStage,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json({ error: 'Unable to load assessment status.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { assessmentId } = await context.params;

  try {
    if (!deleteAssessment(assessmentId)) {
      return NextResponse.json({ error: 'Assessment not found.' }, { status: 404 });
    }
    return new Response(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: 'Unable to delete assessment data.' }, { status: 500 });
  }
}
