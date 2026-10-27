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
  Cpu,
} from 'lucide-react';
import { AgentId, AgentLogEntry, AgentStatus, FinalAssessmentReport } from '@/types/assessment';

interface AgentWorkingScreenProps {
  studentName: string;
  agentStatuses: Record<AgentId, AgentStatus>;
  agentExecutionTimes: Record<AgentId, number | undefined>;
  agentActivities: Record<AgentId, string | undefined>;
  logs: AgentLogEntry[];
  isEvaluating: boolean;
  report: FinalAssessmentReport | null;
  onInspectAgent: (agentId: AgentId) => void;
  onViewReport: () => void;
  onBackToSetup: () => void;
}

export const AgentWorkingScreen: React.FC<AgentWorkingScreenProps> = ({
  studentName,
  agentStatuses,
  agentExecutionTimes,
  agentActivities,
  logs,
  isEvaluating,
  report,
  onInspectAgent,
  onViewReport,
  onBackToSetup,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isEvaluating) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
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
          icon: <Brain className="w-7 h-7 text-violet-400" />,
          colorTheme: 'from-violet-500/20 via-purple-500/10 to-transparent',
          borderGlow: 'border-violet-500/40',
          dotColor: 'bg-violet-400',
          roleDesc: 'Sequencing handoffs and synthesizing holistic cognitive profile report.',
        };
      case 'designer':
        return {
          name: 'Agent 1: Assessment Designer',
          badge: 'Item Formulator',
          icon: <Sparkles className="w-7 h-7 text-cyan-400" />,
          colorTheme: 'from-cyan-500/20 via-teal-500/10 to-transparent',
          borderGlow: 'border-cyan-500/40',
          dotColor: 'bg-cyan-400',
          roleDesc: 'Calibrating 3 cognitive items (Deductive logic, sequences, problem solving).',
        };
      case 'analyzer':
        return {
          name: 'Agent 2: Cognitive Response Analyzer',
          badge: 'Evidence Diagnostician',
          icon: <Search className="w-7 h-7 text-indigo-400" />,
          colorTheme: 'from-indigo-500/20 via-blue-500/10 to-transparent',
          borderGlow: 'border-indigo-500/40',
          dotColor: 'bg-indigo-400',
          roleDesc: 'Comparing student answers against logical deductions and isolating cognitive errors.',
        };
      case 'coach':
        return {
          name: 'Agent 3: Feedback Coach',
          badge: 'Growth Architect',
          icon: <Award className="w-7 h-7 text-emerald-400" />,
          colorTheme: 'from-emerald-500/20 via-teal-500/10 to-transparent',
          borderGlow: 'border-emerald-500/40',
          dotColor: 'bg-emerald-400',
          roleDesc: 'Formulating constructive cognitive strengths and 3 personalized practice drills.',
        };
    }
  };

  const activeAgent = getAgentDetails(activeAgentId);
  const isAllComplete = Boolean(report && !isEvaluating);

  return (
    <div className="space-y-6">
      {/* 1. Active Agent Spotlight Hero */}
      <div
        className={`relative overflow-hidden rounded-3xl border glass-card p-6 sm:p-8 shadow-2xl transition-all duration-500 ${
          isAllComplete
            ? 'border-emerald-500/40 bg-gradient-to-r from-emerald-950/20 via-zinc-950 to-zinc-950'
            : `${activeAgent.borderGlow} bg-gradient-to-r ${activeAgent.colorTheme}`
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-5">
            {/* Glowing Agent Avatar */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-white/10 flex items-center justify-center shadow-xl">
                {isAllComplete ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                ) : (
                  activeAgent.icon
                )}
              </div>
              {isEvaluating && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-indigo-500" />
                </span>
              )}
            </div>

            {/* Active Details */}
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-zinc-300">
                  {isAllComplete ? 'Execution Finished' : 'Active Specialist'}
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  Candidate: <strong className="text-zinc-200">{studentName}</strong>
                </span>
              </div>

              <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                {isAllComplete
                  ? 'All 4 Agents Completed Successfully!'
                  : `${activeAgent.name} is working...`}
              </h2>

              <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl leading-relaxed">
                {isAllComplete
                  ? 'Orchestrator synthesized all dimensional analytics into the final Cognitive Assessment Report.'
                  : agentActivities[activeAgentId] || activeAgent.roleDesc}
              </p>
            </div>
          </div>

          {/* Right Status Actions */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-3 shrink-0">
            <div className="flex items-center gap-2.5 bg-zinc-950/80 border border-white/[0.08] px-3.5 py-2 rounded-xl font-mono text-xs text-zinc-400">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Elapsed: <strong className="text-white font-bold">{elapsedSeconds}s</strong></span>
            </div>

            {isAllComplete ? (
              <button
                onClick={onViewReport}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 transition active:scale-[0.98]"
              >
                <span>View Full Cognitive Report</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs font-mono text-indigo-300">
                <Activity className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>Streaming agent reasoning...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Agent Pipeline Stepper Cards */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold">
              Multi-Agent Orchestration Flow
            </h3>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline">
            Click any node to inspect prompt & JSON payload
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Agent 1 */}
          <div
            onClick={() => onInspectAgent('designer')}
            className={`cursor-pointer rounded-xl p-4 border transition-all duration-200 ${
              agentStatuses.designer === 'running'
                ? 'bg-cyan-950/30 border-cyan-400/80 shadow-lg shadow-cyan-500/10'
                : agentStatuses.designer === 'completed'
                ? 'bg-zinc-950/60 border-emerald-500/30 hover:border-emerald-500/60'
                : 'bg-zinc-950/40 border-white/[0.06] hover:border-white/[0.12]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-semibold">
                01 Designer
              </span>
              {agentStatuses.designer === 'completed' ? (
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Done
                </span>
              ) : agentStatuses.designer === 'running' ? (
                <span className="text-[11px] font-mono text-cyan-400 animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" /> Working
                </span>
              ) : (
                <span className="text-[11px] font-mono text-zinc-600">Standby</span>
              )}
            </div>
            <h4 className="text-xs font-semibold text-white">Item Formulation</h4>
            <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">
              Formulates calibrated reasoning items.
            </p>
            <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono">
              <span className="text-zinc-500">Groq API</span>
              <span className="text-indigo-400 flex items-center gap-1 font-medium">
                <Eye className="w-3 h-3" /> Inspect
              </span>
            </div>
          </div>

          {/* Agent 2 */}
          <div
            onClick={() => onInspectAgent('analyzer')}
            className={`cursor-pointer rounded-xl p-4 border transition-all duration-200 ${
              agentStatuses.analyzer === 'running'
                ? 'bg-indigo-950/30 border-indigo-400/80 shadow-lg shadow-indigo-500/10'
                : agentStatuses.analyzer === 'completed'
                ? 'bg-zinc-950/60 border-emerald-500/30 hover:border-emerald-500/60'
                : 'bg-zinc-950/40 border-white/[0.06] hover:border-white/[0.12]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold">
                02 Analyzer
              </span>
              {agentStatuses.analyzer === 'completed' ? (
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Done
                </span>
              ) : agentStatuses.analyzer === 'running' ? (
                <span className="text-[11px] font-mono text-indigo-400 animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" /> Working
                </span>
              ) : (
                <span className="text-[11px] font-mono text-zinc-600">Standby</span>
              )}
            </div>
            <h4 className="text-xs font-semibold text-white">Cognitive Diagnosis</h4>
            <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">
              Evaluates deductive logic & checks fallacies.
            </p>
            <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono">
              <span className="text-zinc-500">Groq API</span>
              <span className="text-indigo-400 flex items-center gap-1 font-medium">
                <Eye className="w-3 h-3" /> Inspect
              </span>
            </div>
          </div>

          {/* Agent 3 */}
          <div
            onClick={() => onInspectAgent('coach')}
            className={`cursor-pointer rounded-xl p-4 border transition-all duration-200 ${
              agentStatuses.coach === 'running'
                ? 'bg-emerald-950/30 border-emerald-400/80 shadow-lg shadow-emerald-500/10'
                : agentStatuses.coach === 'completed'
                ? 'bg-zinc-950/60 border-emerald-500/30 hover:border-emerald-500/60'
                : 'bg-zinc-950/40 border-white/[0.06] hover:border-white/[0.12]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold">
                03 Coach
              </span>
              {agentStatuses.coach === 'completed' ? (
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Done
                </span>
              ) : agentStatuses.coach === 'running' ? (
                <span className="text-[11px] font-mono text-emerald-400 animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Working
                </span>
              ) : (
                <span className="text-[11px] font-mono text-zinc-600">Standby</span>
              )}
            </div>
            <h4 className="text-xs font-semibold text-white">Coaching Roadmap</h4>
            <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">
              Builds strengths and 3 actionable drills.
            </p>
            <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono">
              <span className="text-zinc-500">Groq API</span>
              <span className="text-indigo-400 flex items-center gap-1 font-medium">
                <Eye className="w-3 h-3" /> Inspect
              </span>
            </div>
          </div>

          {/* Orchestrator */}
          <div
            onClick={() => onInspectAgent('orchestrator')}
            className={`cursor-pointer rounded-xl p-4 border transition-all duration-200 ${
              agentStatuses.orchestrator === 'running'
                ? 'bg-violet-950/30 border-violet-400/80 shadow-lg shadow-violet-500/10'
                : agentStatuses.orchestrator === 'completed'
                ? 'bg-zinc-950/60 border-emerald-500/30 hover:border-emerald-500/60'
                : 'bg-zinc-950/40 border-white/[0.06] hover:border-white/[0.12]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20 font-semibold">
                Orchestrator
              </span>
              {agentStatuses.orchestrator === 'completed' ? (
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Done
                </span>
              ) : agentStatuses.orchestrator === 'running' ? (
                <span className="text-[11px] font-mono text-violet-400 animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" /> Working
                </span>
              ) : (
                <span className="text-[11px] font-mono text-zinc-600">Standby</span>
              )}
            </div>
            <h4 className="text-xs font-semibold text-white">Synthesis Report</h4>
            <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">
              Holistic profile & strategic takeaways.
            </p>
            <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono">
              <span className="text-zinc-500">Groq API</span>
              <span className="text-indigo-400 flex items-center gap-1 font-medium">
                <Eye className="w-3 h-3" /> Inspect
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Live Thought Console Stream */}
      <div className="bg-zinc-950 border border-white/[0.08] rounded-2xl shadow-xl overflow-hidden font-mono text-xs">
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/80 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-zinc-200">Live Agent Thought Log Stream</span>
          </div>
          <span className="text-[11px] text-zinc-500 font-sans">
            Server-Sent Events (SSE)
          </span>
        </div>

        <div className="p-4 max-h-60 overflow-y-auto space-y-2 bg-zinc-950/95 scrollbar-thin">
          {logs.length === 0 ? (
            <div className="py-6 text-center text-zinc-600 font-sans text-xs">
              Waiting for stream connection...
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-2.5 hover:bg-zinc-900/50 p-1 rounded transition text-xs"
              >
                <span className="text-zinc-600 text-[10px] whitespace-nowrap pt-0.5">
                  {log.timestamp}
                </span>
                <span className="font-semibold text-indigo-400 whitespace-nowrap text-[11px]">
                  [{log.agentName}]:
                </span>
                <span className="text-zinc-300 font-sans flex-1 leading-relaxed text-xs">
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBackToSetup}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-white/[0.08] transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Back to Assessment Test</span>
        </button>

        {isAllComplete && (
          <button
            onClick={onViewReport}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 transition"
          >
            <span>Proceed to Report</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
