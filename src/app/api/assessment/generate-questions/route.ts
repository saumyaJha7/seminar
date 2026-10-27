import { NextRequest, NextResponse } from 'next/server';
import { runAssessmentDesigner } from '@/lib/agents/designer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const apiKeyOverride = req.headers.get('x-groq-api-key') || undefined;

    const result = await runAssessmentDesigner(
      {
        gradeLevel: body.gradeLevel,
        difficulty: body.difficulty,
        focusArea: body.focusArea,
      },
      apiKeyOverride
    );

    return NextResponse.json({
      success: true,
      questions: result.questions,
      executionTimeMs: result.executionTimeMs,
      rawPrompt: result.rawPrompt,
      rawResponse: result.rawResponse,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to generate assessment questions',
      },
      { status: 500 }
    );
  }
}
