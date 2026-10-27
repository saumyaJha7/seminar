'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { StepProgressBar, AppScreen } from '@/components/StepProgressBar';
import { AssessmentWorkflow } from '@/components/AssessmentWorkflow';
import { AgentWorkingScreen } from '@/components/AgentWorkingScreen';
import { CognitiveReportView } from '@/components/CognitiveReportView';
import { AgentInspectorModal } from '@/components/AgentInspectorModal';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import { ArchitectureModal } from '@/components/ArchitectureModal';
import { AgentId, AgentLogEntry, AgentStatus, FinalAssessmentReport, Question, StudentAnswer } from '@/types/assessment';
import { getSimulatedQuestions } from '@/lib/agents/designer';
import { Sparkles, Info } from 'lucide-react';

export default function Home() {
  // Navigation Screen State
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('setup');

  // App Config & Credentials
  const [hasServerGroqKey, setHasServerGroqKey] = useState<boolean>(false);
  const [clientGroqKey, setClientGroqKey] = useState<string>('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState<boolean>(false);
  const [inspectingAgentId, setInspectingAgentId] = useState<AgentId | null>(null);

  // Student details state
  const [activeStudentName, setActiveStudentName] = useState<string>('Alex Mercer');

  // Agent Pipeline States
  const [agentStatuses, setAgentStatuses] = useState<Record<AgentId, AgentStatus>>({
    orchestrator: 'idle',
    designer: 'idle',
    analyzer: 'idle',
    coach: 'idle',
  });
  const [agentExecutionTimes, setAgentExecutionTimes] = useState<Record<AgentId, number | undefined>>({
    orchestrator: undefined,
    designer: undefined,
    analyzer: undefined,
    coach: undefined,
  });
  const [agentActivities, setAgentActivities] = useState<Record<AgentId, string | undefined>>({
    orchestrator: 'Ready to coordinate multi-agent workflow',
    designer: 'Reasoning question generator on standby',
    analyzer: 'Awaiting student answers for cognitive diagnosis',
    coach: 'Awaiting analyzer findings for coaching roadmap',
  });
  const [agentPayloads, setAgentPayloads] = useState<Record<AgentId, { input?: any; output?: any; executionTimeMs?: number }>>({
    orchestrator: {},
    designer: {},
    analyzer: {},
    coach: {},
  });

  // Assessment & Logs
  const [logs, setLogs] = useState<AgentLogEntry[]>([]);
  const [questions, setQuestions] = useState<Question[]>(getSimulatedQuestions('intermediate'));
  const [report, setReport] = useState<FinalAssessmentReport | null>(null);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  // Check server config on mount
  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        setHasServerGroqKey(data.hasGroqKey);
      })
      .catch(() => {});

    // Check localStorage for client-stored key
    const storedKey = localStorage.getItem('user_groq_api_key');
    if (storedKey) {
      setClientGroqKey(storedKey);
    }
  }, []);

  const handleSaveApiKey = (key: string) => {
    setClientGroqKey(key);
    if (key) {
      localStorage.setItem('user_groq_api_key', key);
    } else {
      localStorage.removeItem('user_groq_api_key');
    }
  };

  const activeGroqKey = clientGroqKey || undefined;
  const isGroqConnected = Boolean(hasServerGroqKey || clientGroqKey);

  // Generate Questions via Agent 1
  const handleGenerateQuestions = async (params: {
    gradeLevel: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    focusArea: string;
  }) => {
    setIsGeneratingQuestions(true);
    setAgentStatuses((prev) => ({ ...prev, designer: 'running' }));
    setAgentActivities((prev) => ({ ...prev, designer: 'Formulating 3 reasoning questions...' }));

    const startTimestamp = Date.now();

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (activeGroqKey) {
        headers['x-groq-api-key'] = activeGroqKey;
      }

      const res = await fetch('/api/assessment/generate-questions', {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });

      const data = await res.json();
      const elapsed = Date.now() - startTimestamp;

      if (data.success && data.questions) {
        setQuestions(data.questions);
        setAgentStatuses((prev) => ({ ...prev, designer: 'completed' }));
        setAgentExecutionTimes((prev) => ({ ...prev, designer: data.executionTimeMs || elapsed }));
        setAgentActivities((prev) => ({ ...prev, designer: `Created 3 questions in ${data.executionTimeMs || elapsed}ms` }));

        setAgentPayloads((prev) => ({
          ...prev,
          designer: {
            input: params,
            output: { questions: data.questions },
            executionTimeMs: data.executionTimeMs || elapsed,
          },
        }));

        setLogs((prev) => [
          ...prev,
          {
            id: `log-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            agentId: 'designer',
            agentName: 'Agent 1: Assessment Designer',
            level: 'success',
            message: `Generated 3 reasoning items for level: ${params.gradeLevel} (${params.difficulty}).`,
          },
        ]);
      } else {
        throw new Error(data.error || 'Failed to generate questions');
      }
    } catch {
      setAgentStatuses((prev) => ({ ...prev, designer: 'error' }));
      setAgentActivities((prev) => ({ ...prev, designer: 'Question generation error' }));
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Run full assessment pipeline via SSE stream and navigate to 'working' screen
  const handleSubmitAssessment = async (params: {
    studentName: string;
    gradeLevel: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    questions: Question[];
    studentAnswers: StudentAnswer[];
  }) => {
    setActiveStudentName(params.studentName);
    setIsEvaluating(true);
    setReport(null);
    setLogs([]);

    // Immediately switch to the dedicated Agent Working Screen!
    setCurrentScreen('working');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Reset status
    setAgentStatuses({
      orchestrator: 'running',
      designer: 'completed',
      analyzer: 'waiting',
      coach: 'waiting',
    });
    setAgentActivities({
      orchestrator: 'Coordinating multi-agent workflow...',
      designer: 'Questions ready',
      analyzer: 'Queued to diagnose answers',
      coach: 'Queued to generate coaching plan',
    });

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (activeGroqKey) {
        headers['x-groq-api-key'] = activeGroqKey;
      }

      const res = await fetch('/api/assessment/stream', {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });

      if (!res.ok || !res.body) {
        throw new Error('Failed to initiate agent stream');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const rawEvent of events) {
          if (!rawEvent.trim()) continue;

          const lines = rawEvent.split('\n');
          let eventName = '';
          let dataStr = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventName = line.substring(7).trim();
            } else if (line.startsWith('data: ')) {
              dataStr = line.substring(6).trim();
            }
          }

          if (eventName && dataStr) {
            try {
              const data = JSON.parse(dataStr);

              if (eventName === 'status') {
                setAgentStatuses((prev) => ({ ...prev, [data.agentId]: data.status }));
                if (data.status === 'running') {
                  setAgentActivities((prev) => ({ ...prev, [data.agentId]: 'Executing LLM inference...' }));
                } else if (data.status === 'completed') {
                  setAgentActivities((prev) => ({ ...prev, [data.agentId]: 'Finished task successfully' }));
                }
              } else if (eventName === 'log') {
                setLogs((prev) => [...prev, data]);
              } else if (eventName === 'complete') {
                const finalReport: FinalAssessmentReport = data;
                setReport(finalReport);
                setAgentStatuses({
                  orchestrator: 'completed',
                  designer: 'completed',
                  analyzer: 'completed',
                  coach: 'completed',
                });
                setAgentActivities({
                  orchestrator: 'Report synthesized and ready',
                  designer: '3 items calibrated',
                  analyzer: `Analyzed (Score: ${finalReport.overallScore})`,
                  coach: 'Personalized practice plan generated',
                });

                // Populate inspector payloads
                setAgentPayloads({
                  orchestrator: {
                    input: { studentName: params.studentName, questionsCount: params.questions.length },
                    output: finalReport.orchestratorSynthesis,
                  },
                  designer: {
                    output: finalReport.designerOutput,
                  },
                  analyzer: {
                    input: { questions: params.questions, studentAnswers: params.studentAnswers },
                    output: finalReport.analyzerOutput,
                  },
                  coach: {
                    input: finalReport.analyzerOutput,
                    output: finalReport.coachOutput,
                  },
                });
              } else if (eventName === 'error') {
                setLogs((prev) => [
                  ...prev,
                  {
                    id: `log-${Date.now()}`,
                    timestamp: new Date().toLocaleTimeString(),
                    agentId: 'orchestrator',
                    agentName: 'Orchestrator Agent',
                    level: 'error',
                    message: data.message,
                  },
                ]);
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    } catch (err: any) {
      setLogs((prev) => [
        ...prev,
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          agentId: 'orchestrator',
          agentName: 'Orchestrator Agent',
          level: 'error',
          message: err?.message || 'Error occurred during assessment',
        },
      ]);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleResetToSetup = () => {
    setCurrentScreen('setup');
    setReport(null);
    setAgentStatuses({
      orchestrator: 'idle',
      designer: 'idle',
      analyzer: 'idle',
      coach: 'idle',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-white relative">
      {/* Ambient background glow and grid */}
      <div className="fixed inset-0 ambient-glow pointer-events-none z-0" />
      <div className="fixed inset-0 bg-grid-pattern opacity-30 pointer-events-none z-0" />

      {/* Top Navbar */}
      <Navbar
        hasGroqKey={isGroqConnected}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onOpenArchitectureModal={() => setIsArchitectureModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 relative z-10">
        {/* Step Navigation Bar */}
        <StepProgressBar
          currentScreen={currentScreen}
          onNavigate={(screen) => {
            setCurrentScreen(screen);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          hasReport={Boolean(report)}
          isProcessing={isEvaluating}
        />

        {/* SCREEN 1: Assessment Setup & Question Input */}
        {currentScreen === 'setup' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header intro */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300 mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  Screen 1: Assessment Input & Configuration
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Student Cognitive Assessment
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                  Configure student reasoning questions, input answers or select quick presets, and press Enter to launch the multi-agent assessment pipeline.
                </p>
              </div>

              {!isGroqConnected && (
                <div
                  onClick={() => setIsApiKeyModalOpen(true)}
                  className="cursor-pointer p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-3 hover:bg-amber-900/30 transition shadow-lg"
                >
                  <Info className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-300">Simulation Mode</p>
                    <p className="text-[11px] text-amber-400/80">Add GROQ_API_KEY for live Groq LLM inference</p>
                  </div>
                </div>
              )}
            </div>

            <AssessmentWorkflow
              questions={questions}
              onGenerateQuestions={handleGenerateQuestions}
              onSubmitAssessment={handleSubmitAssessment}
              isGeneratingQuestions={isGeneratingQuestions}
              isEvaluating={isEvaluating}
              onReset={() => {
                setQuestions(getSimulatedQuestions('intermediate'));
              }}
            />
          </div>
        )}

        {/* SCREEN 2: Multi-Agent Working Screen */}
        {currentScreen === 'working' && (
          <AgentWorkingScreen
            studentName={activeStudentName}
            agentStatuses={agentStatuses}
            agentExecutionTimes={agentExecutionTimes}
            agentActivities={agentActivities}
            logs={logs}
            isEvaluating={isEvaluating}
            report={report}
            onInspectAgent={(id) => setInspectingAgentId(id)}
            onViewReport={() => {
              setCurrentScreen('report');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onBackToSetup={() => {
              setCurrentScreen('setup');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* SCREEN 3: Comprehensive Final Cognitive Report */}
        {currentScreen === 'report' && report && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <CognitiveReportView
              report={report}
              onNewAssessment={handleResetToSetup}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      <AgentInspectorModal
        agentId={inspectingAgentId}
        onClose={() => setInspectingAgentId(null)}
        agentData={inspectingAgentId ? agentPayloads[inspectingAgentId] : undefined}
      />

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={clientGroqKey}
        onSaveApiKey={handleSaveApiKey}
        hasEnvKey={hasServerGroqKey}
      />

      <ArchitectureModal
        isOpen={isArchitectureModalOpen}
        onClose={() => setIsArchitectureModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-5 text-center text-xs text-slate-500">
        <p>CogniAgents • Multi-Agent Cognitive Assessment System • Next.js & Groq</p>
      </footer>
    </div>
  );
}
