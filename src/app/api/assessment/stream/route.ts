import { NextResponse } from 'next/server';
import { runFullAssessmentPipeline } from '@/lib/agents/orchestrator';
import {
  appendAssessmentEvent,
  getAssessment,
  saveAssessmentReport,
  updateAssessmentStatus,
} from '@/lib/assessment-store';
import { AgentLogEntry, AgentStatus } from '@/types/assessment';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function statusFromLog(entry: AgentLogEntry): AgentStatus {
  if (entry.level === 'success') return 'completed';
  if (entry.level === 'error') return 'error';
  if (entry.level === 'warn') return 'waiting';
  return 'running';
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  if (!isRecord(body) || typeof body.assessmentId !== 'string') {
    return NextResponse.json({ error: 'An assessment ID is required.' }, { status: 400 });
  }

  let assessment = getAssessment(body.assessmentId);
  if (!assessment) {
    return NextResponse.json({ error: 'Assessment not found.' }, { status: 404 });
  }

  if (assessment.status === 'completed' && assessment.report) {
    return new Response(createCompletionStream(assessment.report), {
      headers: streamHeaders(),
    });
  }

  if (assessment.status === 'failed') {
    updateAssessmentStatus(assessment.id, 'queued', 'retry', 'A retry was requested; saved answers will be evaluated again.');
    assessment = getAssessment(assessment.id);
  }

  if (!assessment || assessment.status !== 'queued') {
    return NextResponse.json(
      { error: 'This assessment is already processing or is not ready to run.' },
      { status: 409 },
    );
  }

  updateAssessmentStatus(assessment.id, 'evaluating', 'evaluation', 'Saved responses are being evaluated against their rubrics.');

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let stage = 'evaluation';
      const sendEvent = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      sendEvent('status', { agentId: 'orchestrator', status: 'running' });
      appendAssessmentEvent(assessment.id, {
        stage: 'orchestrator',
        status: 'in_progress',
        message: 'Orchestration started for the saved assessment.',
        agentId: 'orchestrator',
      });

      try {
        const finalReport = await runFullAssessmentPipeline({
          studentName: assessment.studentName,
          gradeLevel: assessment.gradeLevel,
          difficulty: assessment.difficulty,
          focusArea: assessment.focusArea,
          preExistingQuestions: assessment.questions,
          studentAnswers: assessment.answers,
          assessmentId: assessment.id,
          onLog: (entry: AgentLogEntry) => {
            if (
              entry.agentId === 'orchestrator' &&
              entry.level === 'action' &&
              entry.message.startsWith('Synthesizing')
            ) {
              stage = 'report';
              const latest = getAssessment(assessment.id);
              if (latest?.status === 'evaluating') {
                updateAssessmentStatus(
                  assessment.id,
                  'generating_report',
                  'report',
                  'Building the cognitive profile and recommendations.',
                );
              }
            }

            const agentStatus = statusFromLog(entry);
            sendEvent('log', entry);
            sendEvent('status', { agentId: entry.agentId, status: agentStatus });
            appendAssessmentEvent(assessment.id, {
              stage: entry.agentId,
              status: agentStatus === 'completed' ? 'completed' : agentStatus === 'error' ? 'failed' : 'in_progress',
              message: entry.message,
              agentId: entry.agentId,
            });
          },
        });

        const latest = getAssessment(assessment.id);
        if (latest?.status === 'evaluating') {
          updateAssessmentStatus(
            assessment.id,
            'generating_report',
            'report',
            'The validated analysis is ready; saving the final report.',
          );
        }
        saveAssessmentReport(assessment.id, finalReport, finalReport.analyzerOutput.evaluations);

        sendEvent('status', { agentId: 'orchestrator', status: 'completed' });
        sendEvent('complete', finalReport);
      } catch {
        const latest = getAssessment(assessment.id);
        if (latest && latest.status !== 'completed' && latest.status !== 'failed') {
          updateAssessmentStatus(
            assessment.id,
            'failed',
            stage,
            `Assessment processing failed during ${stage}. Saved responses are available for a safe retry.`,
          );
        }
        sendEvent('error', {
          message: `Assessment processing failed during ${stage}. Your saved responses are available for a safe retry.`,
          stage,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: streamHeaders() });
}

function createCompletionStream(report: unknown): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`event: status\ndata: ${JSON.stringify({ agentId: 'orchestrator', status: 'completed' })}\n\n`));
      controller.enqueue(encoder.encode(`event: complete\ndata: ${JSON.stringify(report)}\n\n`));
      controller.close();
    },
  });
}

function streamHeaders(): HeadersInit {
  return {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  };
}
