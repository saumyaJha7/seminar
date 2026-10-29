import { NextResponse } from 'next/server';
import { requestAssessmentPause } from '@/lib/assessment-store';

type RouteContext = {
  params: Promise<{ assessmentId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { assessmentId } = await context.params;
  const result = requestAssessmentPause(assessmentId);

  if (result === 'not_found') {
    return NextResponse.json({ error: 'Assessment not found.' }, { status: 404 });
  }
  if (result === 'not_running') {
    return NextResponse.json({ error: 'This assessment is not currently running or has reached its final report stage.' }, { status: 409 });
  }

  return NextResponse.json(
    { status: result === 'paused' ? 'paused' : 'pause_requested' },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
