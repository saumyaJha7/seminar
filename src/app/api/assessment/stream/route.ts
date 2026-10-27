import { NextRequest } from 'next/server';
import { runFullAssessmentPipeline } from '@/lib/agents/orchestrator';
import { AgentLogEntry } from '@/types/assessment';


export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const apiKeyOverride = req.headers.get('x-groq-api-key') || undefined;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: any) => {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      try {
        sendEvent('status', { agentId: 'orchestrator', status: 'running' });

        const onLog = (entry: AgentLogEntry) => {
          sendEvent('log', entry);

          // Update agent statuses based on logs
          if (entry.agentId === 'designer' && entry.level === 'action') {
            sendEvent('status', { agentId: 'designer', status: 'running' });
          } else if (entry.agentId === 'designer' && entry.level === 'success') {
            sendEvent('status', { agentId: 'designer', status: 'completed' });
          } else if (entry.agentId === 'analyzer' && (entry.level === 'thought' || entry.level === 'action')) {
            sendEvent('status', { agentId: 'analyzer', status: 'running' });
          } else if (entry.agentId === 'analyzer' && entry.level === 'success') {
            sendEvent('status', { agentId: 'analyzer', status: 'completed' });
          } else if (entry.agentId === 'coach' && entry.level === 'action') {
            sendEvent('status', { agentId: 'coach', status: 'running' });
          } else if (entry.agentId === 'coach' && entry.level === 'success') {
            sendEvent('status', { agentId: 'coach', status: 'completed' });
          }
        };

        const finalReport = await runFullAssessmentPipeline({
          studentName: body.studentName || 'Alex Mercer',
          gradeLevel: body.gradeLevel || 'High School',
          difficulty: body.difficulty || 'intermediate',
          focusArea: body.focusArea,
          preExistingQuestions: body.questions,
          studentAnswers: body.studentAnswers || [],
          apiKeyOverride,
          onLog,
        });

        sendEvent('status', { agentId: 'orchestrator', status: 'completed' });
        sendEvent('complete', finalReport);
      } catch (err: any) {
        sendEvent('error', {
          message: err?.message || 'Error occurred during multi-agent assessment execution',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
