'use client';

import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  Search,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  ArrowRight,
  Terminal,
  Activity,
  Layers,
  RotateCcw,
} from 'lucide-react';
import {
  AgentId,
  AgentLogEntry,
  AgentStatus,
  AssessmentProgressEvent,
  AssessmentLifecycleStatus,
  AssessmentMode,
  FinalAssessmentReport,
} from '@/types/assessment';

interface AgentWorkingScreenProps {
  studentName: string;
  agentStatuses: Record<AgentId, AgentStatus>;
  agentExecutionTimes: Record<AgentId, number | undefined>;
  agentActivities: Record<AgentId, string | undefined>;
  logs: AgentLogEntry[];
  isEvaluating: boolean;
  report: FinalAssessmentReport | null;
  assessmentId: string | null;
  assessmentMode: AssessmentMode | null;
  assessmentStatus: AssessmentLifecycleStatus | null;
  requestError: string | null;
  progressEvents: AssessmentProgressEvent[];
  onInspectAgent: (agentId: AgentId) => void;
  onViewReport: () => void;
  onBackToSetup: () => void;
  onRetry: () => void;
  onRefreshStatus: () => Promise<void>;
}

export const AgentWorkingScreen: React.FC<AgentWorkingScreenProps> = ({
  studentName,
  agentStatuses,
  agentExecutionTimes,
  agentActivities,
  logs,
  isEvaluating,
  report,
  assessmentId,
  assessmentMode,
  assessmentStatus,
  requestError,
  progressEvents,
  onInspectAgent,
  onViewReport,
  onBackToSetup,
  onRetry,
  onRefreshStatus,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [clockTimestamp, setClockTimestamp] = useState(0);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isEvaluating) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
        setClockTimestamp(Date.now());
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isEvaluating]);

  const getActiveAgentId = (): AgentId => {
    if (agentStatuses.coach === 'running') return 'coach';
    if (agentStatuses.analyzer === 'running') return 'analyzer';
    if (agentStatuses.designer === 'running') return 'designer';
    return 'orchestrator';
  };

  const activeAgentId = getActiveAgentId();

  const getAgentDetails = (id: AgentId) => {
    switch (id) {
      case 'orchestrator':
        return {
          name: 'Orchestrator Agent',
          badge: 'Pipeline Director',
          icon: <Brain className="w-8 h-8 text-indigo-600" />,
          colorTheme: 'bg-indigo-50 border-indigo-200 text-indigo-900',
          roleDesc: 'Coordinating agent handoffs and synthesizing the composite cognitive profile.',
        };
      case 'designer':
        return {
          name: 'Agent 1: Assessment Designer',
          badge: 'Item Formulator',
          icon: <Sparkles className="w-8 h-8 text-sky-600" />,
          colorTheme: 'bg-sky-50 border-sky-200 text-sky-900',
          roleDesc: 'Calibrating reasoning items across deductive logic, sequences, and problem solving.',
        };
      case 'analyzer':
        return {
          name: 'Agent 2: Cognitive Response Analyzer',
          badge: 'Evidence Diagnostician',
          icon: <Search className="w-8 h-8 text-blue-600" />,
          colorTheme: 'bg-blue-50 border-blue-200 text-blue-900',
          roleDesc: 'Comparing student answers against expected deduction rules and isolating cognitive errors.',
        };
      case 'coach':
        return {
          name: 'Agent 3: Feedback Coach',
          badge: 'Growth Architect',
          icon: <Award className="w-8 h-8 text-amber-600" />,
          colorTheme: 'bg-amber-50 border-amber-200 text-amber-900',
          roleDesc: 'Synthesizing strengths, growth opportunities, and 3 actionable practice exercises.',
        };
    }
  };

  const activeAgent = getAgentDetails(activeAgentId);
  const isAllComplete = Boolean(report && assessmentStatus === 'completed' && !isEvaluating);
  const hasFailed = assessmentStatus === 'failed';
  const flowColors = {
    sky: { active: 'border-sky-400 bg-sky-50 ring-sky-200', label: 'bg-sky-100 text-sky-800 border-sky-200', text: 'text-sky-700' },
    slate: { active: 'border-slate-400 bg-slate-50 ring-slate-200', label: 'bg-slate-100 text-slate-800 border-slate-200', text: 'text-slate-700' },
    blue: { active: 'border-blue-400 bg-blue-50 ring-blue-200', label: 'bg-blue-100 text-blue-800 border-blue-200', text: 'text-blue-700' },
    amber: { active: 'border-amber-400 bg-amber-50 ring-amber-200', label: 'bg-amber-100 text-amber-800 border-amber-200', text: 'text-amber-700' },
    indigo: { active: 'border-indigo-400 bg-indigo-50 ring-indigo-200', label: 'bg-indigo-100 text-indigo-800 border-indigo-200', text: 'text-indigo-700' },
  } as const;
  const synthesisStarted = logs.some(
    (log) =>
      log.agentId === 'orchestrator' &&
      log.level === 'action' &&
      log.message.startsWith('Synthesizing'),
  );
  const flowSteps: Array<{
    id: AgentId | null;
    label: string;
    title: string;
    input: string;
    process: string;
    output: string;
    destination: string;
    color: keyof typeof flowColors;
    status: AgentStatus;
  }> = [
    {
      id: 'designer' as const,
      label: 'Agent 1 · Designer',
      title: 'Create question set',
      input: 'Grade, focus area, difficulty & Bloom targets',
      process: 'Builds calibrated questions, expected answers and rubrics.',
      output: 'Questions + scoring rubrics',
      destination: 'Student',
      color: 'sky',
      status: agentStatuses.designer,
    },
    {
      id: null,
      label: 'Student',
      title: 'Submit responses',
      input: 'Questions + scoring rubrics',
      process: 'Student answers each question and can explain their reasoning.',
      output: 'Answers + reasoning',
      destination: 'Analyzer',
      color: 'slate',
      status: 'completed' as const,
    },
    {
      id: 'analyzer' as const,
      label: 'Agent 2 · Analyzer',
      title: 'Evaluate evidence',
      input: 'Questions, rubrics, answers & reasoning',
      process: 'Scores each response and checks evidence against its rubric.',
      output: 'Scores + evidence + growth areas',
      destination: 'Coach + Orchestrator',
      color: 'blue',
      status: agentStatuses.analyzer,
    },
    {
      id: 'coach' as const,
      label: 'Agent 3 · Coach',
      title: 'Build practice plan',
      input: 'Validated scores, strengths & gaps',
      process: 'Turns findings into constructive feedback and targeted practice.',
      output: 'Strengths + practice suggestions',
      destination: 'Orchestrator',
      color: 'amber',
      status: agentStatuses.coach,
    },
    {
      id: 'orchestrator' as const,
      label: 'Orchestrator',
      title: 'Synthesize final report',
      input: 'Analyzer findings + coaching plan',
      process: 'Combines agent outputs into a clear assessment summary.',
      output: 'Cognitive summary + recommendations',
      destination: 'Final report',
      color: 'indigo',
      status: isAllComplete
        ? 'completed' as const
        : hasFailed
          ? 'error' as const
          : synthesisStarted
            ? 'running' as const
            : 'waiting' as const,
    },
  ];
  const latestActiveEvent = [...progressEvents].reverse().find(
    (event) => event.status === 'in_progress' && ['evaluation', 'report'].includes(event.stage),
  );
  const activeEventElapsed = latestActiveEvent
    ? Math.max(0, Math.floor((clockTimestamp - new Date(latestActiveEvent.timestamp).getTime()) / 1000))
    : elapsedSeconds;
  const isSlowProcessing = isEvaluating && activeEventElapsed >= 30;
  const providerLabel = assessmentMode === 'demo' ? 'Demo Mode' : 'Groq API';
  const lifecycleLabel: Record<AssessmentLifecycleStatus, string> = {
    queued: 'Queued',
    generating_questions: 'Generating questions',
    awaiting_answers: 'Awaiting answers',
    evaluating: 'Evaluating responses',
    generating_report: 'Building report',
    completed: 'Completed',
    failed: 'Failed',
  };
  const refreshStatus = async () => {
    setIsRefreshingStatus(true);
    try {
      await onRefreshStatus();
    } finally {
      setIsRefreshingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Active Agent Spotlight Hero Card */}
      <div
        className={`pro-card rounded-2xl p-6 sm:p-8 transition-all duration-300 motion-reduce:transition-none shadow-sm ${
          isAllComplete
            ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-emerald-300'
            : 'bg-gradient-to-r from-blue-50/80 via-sky-50/50 to-white border-blue-200'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            {/* Active Avatar Icon */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                {isAllComplete ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                ) : (
                  activeAgent.icon
                )}
              </div>
              {isEvaluating && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-600" />
                </span>
              )}
            </div>

            {/* Active Details */}
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-xs">
                  {isAllComplete ? 'Pipeline Completed' : hasFailed ? 'Processing Failed' : lifecycleLabel[assessmentStatus ?? 'queued']}
                </span>
                {assessmentMode === 'demo' && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-800">
                    Demo Mode
                  </span>
                )}
                <span className="text-xs text-slate-600 font-medium">
                  Candidate: <strong className="text-slate-900">{studentName}</strong>
                </span>
                {assessmentId && (
                  <span className="text-[11px] text-slate-500 font-mono" title="Assessment ID">
                    ID: {assessmentId}
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {isAllComplete
                  ? 'All 4 Agents Completed Execution!'
                  : hasFailed
                    ? 'Assessment could not be completed'
                    : `${activeAgent.name} is working...`}
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
                {isAllComplete
                  ? 'Orchestrator synthesized all dimensional analytics into the final Cognitive Assessment Report.'
                  : hasFailed
                    ? requestError || 'Your saved answers are available for a safe retry.'
                    : agentActivities[activeAgentId] || activeAgent.roleDesc}
              </p>
            </div>
          </div>

          {/* Right Timer & Status Action */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 shadow-xs">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Elapsed: <strong className="text-slate-900">{activeEventElapsed}s</strong></span>
            </div>

            {isSlowProcessing && (
              <div role="status" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950">
                <div>
                  <p className="font-semibold">Processing is taking longer than usual.</p>
                  <p className="mt-1 text-amber-800">The server has not reported completion yet. Your saved answers are retained; you can safely refresh the saved status.</p>
                </div>
                <button
                  type="button"
                  onClick={refreshStatus}
                  disabled={isRefreshingStatus}
                  className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-2 font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-60"
                >
                  {isRefreshingStatus ? 'Refreshing status…' : 'Refresh saved status'}
                </button>
              </div>
            )}

            {isAllComplete ? (
              <button
                onClick={onViewReport}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition active:scale-[0.98]"
              >
                <span>View Full Cognitive Report</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : hasFailed ? (
              <button
                onClick={onRetry}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retry saved assessment
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs font-medium text-blue-700">
                <Activity className="w-3.5 h-3.5 animate-spin motion-reduce:animate-none text-blue-600" />
                <span>Running multi-agent inference...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {hasFailed && requestError && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{requestError}</span>
        </div>
      )}

      <section className="pro-card rounded-2xl p-6 shadow-xs" aria-labelledby="assessment-timeline-title">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3 mb-4">
          <div>
            <h3 id="assessment-timeline-title" className="text-sm font-bold text-slate-900">
              Assessment Activity
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Updates are saved by the server and restored when this page is refreshed.
            </p>
          </div>
          {assessmentId && <span className="font-mono text-[11px] text-slate-500">ID {assessmentId}</span>}
        </div>
        {progressEvents.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-500">Waiting for the first saved progress event.</p>
        ) : (
          <ol className="space-y-3">
            {progressEvents.slice(-12).map((event) => (
              <li key={event.id} className="flex items-start gap-3">
                {event.status === 'completed' ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                ) : event.status === 'failed' ? (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                ) : event.status === 'in_progress' ? (
                  <Activity className="mt-0.5 h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none text-blue-600" />
                ) : (
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-800">{event.message}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    <span className="capitalize">{event.stage.replaceAll('_', ' ')}</span>
                    {' · '}
                    {new Date(event.timestamp).toLocaleTimeString()}
                    {' · '}
                    <span className="capitalize">{event.status.replaceAll('_', ' ')}</span>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* 2. Sequential Agent Pipeline Cards */}
      <div className="pro-card rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Multi-Agent Orchestration Sequence
            </h3>
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Click any agent to inspect prompts & JSON outputs
          </span>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-2">
          {flowSteps.map((step, index) => {
            const isRunning = step.status === 'running';
            const isCompleted = step.status === 'completed';
            const inspectAgentId = step.id;
            const runtimeLabel = inspectAgentId && agentExecutionTimes[inspectAgentId]
              ? `${providerLabel} · ${agentExecutionTimes[inspectAgentId]} ms`
              : providerLabel;
            const statusLabel = step.id === null
              ? 'Submitted'
              : isRunning
                ? 'Active'
                : isCompleted
                  ? 'Done'
                  : step.status === 'error'
                    ? 'Error'
                    : 'Waiting';
            const colors = flowColors[step.color];
            const card = (
              <div
                className={`h-full rounded-xl border p-3 ${
                  isRunning
                    ? `${colors.active} ring-2`
                    : isCompleted
                      ? 'border-slate-300 bg-slate-50/80'
                      : 'border-slate-200 bg-white'
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${colors.label}`}>
                    {step.label}
                  </span>
                  <span className={`shrink-0 text-[11px] font-semibold ${
                    isRunning ? colors.text : isCompleted ? 'text-emerald-700' : step.status === 'error' ? 'text-rose-700' : 'text-slate-400'
                  }`}>
                    {statusLabel}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900">{step.title}</h4>
                <dl className="mt-3 space-y-2 text-[11px] leading-snug">
                  <div>
                    <dt className="font-semibold uppercase tracking-wide text-slate-400">Input</dt>
                    <dd className="mt-0.5 text-slate-600">{step.input}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-wide text-slate-400">Work</dt>
                    <dd className="mt-0.5 text-slate-600">{step.process}</dd>
                  </div>
                  <div className="border-t border-slate-200 pt-2">
                    <dt className="font-semibold uppercase tracking-wide text-slate-400">Output → {step.destination}</dt>
                    <dd className="mt-0.5 font-medium text-slate-800">{step.output}</dd>
                  </div>
                </dl>
                {inspectAgentId && (
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-200 pt-2">
                    <span className="text-[10px] text-slate-500">{runtimeLabel}</span>
                    <button
                      type="button"
                      onClick={() => onInspectAgent(inspectAgentId)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900"
                    >
                      <Eye className="h-3 w-3" /> Inspect payload
                    </button>
                  </div>
                )}
              </div>
            );

            return (
              <React.Fragment key={step.label}>
                <div className="min-w-0 flex-1">
                  {card}
                </div>
                {index < flowSteps.length - 1 && (
                  <div className="flex shrink-0 items-center justify-center gap-1 text-slate-400 lg:flex-col">
                    <ArrowRight className="h-4 w-4 rotate-90 lg:rotate-0" aria-hidden="true" />
                    <span className="text-[9px] font-semibold uppercase tracking-wide">handoff</span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 3. Live Thought Console Stream */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden text-xs">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-200">Live Agent Execution Console</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Real-Time Server-Sent Events (SSE)
          </span>
        </div>

        <div className="p-4 max-h-60 overflow-y-auto space-y-2 bg-slate-900/90 font-mono">
          {logs.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs">
              Waiting for stream connection...
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-2.5 hover:bg-slate-800/60 p-1 rounded transition text-xs"
              >
                <span className="text-slate-500 text-[11px] whitespace-nowrap pt-0.5">
                  {log.timestamp}
                </span>
                <span className="font-semibold text-blue-400 whitespace-nowrap text-xs">
                  [{log.agentName}]:
                </span>
                <span className="text-slate-200 flex-1 leading-relaxed text-xs">
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBackToSetup}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Back to Assessment Input</span>
        </button>

        {isAllComplete && (
          <button
            onClick={onViewReport}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition"
          >
            <span>Proceed to Full Report</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
