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
  ChevronRight,
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

  // Timer while evaluating
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isEvaluating) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isEvaluating]);

  // Determine currently active agent
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
          badge: 'Pipeline Coordinator & Synthesis Engine',
          icon: <Brain className="w-8 h-8 text-violet-400" />,
          colorScheme: 'from-violet-600 via-purple-600 to-indigo-600',
          bgGlow: 'bg-violet-500/10 border-violet-500/30',
          pulseColor: 'bg-violet-400',
          description:
            'Managing agent handoffs, input-output orchestration, and synthesizing the final student cognitive profile.',
        };
      case 'designer':
        return {
          name: 'Agent 1: Assessment Designer',
          badge: 'Reasoning Item Formulator',
          icon: <Sparkles className="w-8 h-8 text-cyan-400" />,
          colorScheme: 'from-cyan-600 via-teal-600 to-blue-600',
          bgGlow: 'bg-cyan-500/10 border-cyan-500/30',
          pulseColor: 'bg-cyan-400',
          description:
            'Formulating and calibrating 3 reasoning items: Logical Deductions, Numerical Patterns, and Practical Problem Solving.',
        };
      case 'analyzer':
        return {
          name: 'Agent 2: Cognitive Response Analyzer',
          badge: 'Evidence & Error Diagnostician',
          icon: <Search className="w-8 h-8 text-indigo-400" />,
          colorScheme: 'from-indigo-600 via-blue-600 to-violet-600',
          bgGlow: 'bg-indigo-500/10 border-indigo-500/30',
          pulseColor: 'bg-indigo-400',
          description:
            'Comparing student answers against expected deductions, diagnosing cognitive flaws, and identifying evidence-based strengths.',
        };
      case 'coach':
        return {
          name: 'Agent 3: Feedback Coach',
          badge: 'Growth Strategy Architect',
          icon: <Award className="w-8 h-8 text-emerald-400" />,
          colorScheme: 'from-emerald-600 via-teal-600 to-green-600',
          bgGlow: 'bg-emerald-500/10 border-emerald-500/30',
          pulseColor: 'bg-emerald-400',
          description:
            'Formulating non-clinical, constructive feedback points and 3 targeted practice modules with concrete puzzle exercises.',
        };
    }
  };

  const activeAgent = getAgentDetails(activeAgentId);
  const isAllComplete = Boolean(report && !isEvaluating);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* 1. Large Hero Spotlight: "This Agent Is Working Right Now" */}
      <div
        className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 backdrop-blur-md shadow-2xl transition-all duration-500 ${
          isAllComplete
            ? 'bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/40'
            : `bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 ${activeAgent.bgGlow}`
        }`}
      >
        {/* Decorative backdrop glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            {/* Animated Agent Icon with Pulse Rings */}
            <div className="relative">
              <div
                className={`w-20 h-20 rounded-2xl bg-gradient-to-tr ${activeAgent.colorScheme} p-[2px] shadow-xl ${
                  isEvaluating ? 'animate-pulse' : ''
                }`}
              >
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  {isAllComplete ? (
                    <CheckCircle2 className="w-9 h-9 text-emerald-400" />
                  ) : (
                    activeAgent.icon
                  )}
                </div>
              </div>
              {isEvaluating && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500" />
                </span>
              )}
            </div>

            {/* Active Agent Info */}
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {isAllComplete ? 'Pipeline Completed' : 'Agent In Action'}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Target: {studentName}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {isAllComplete
                  ? 'All 4 Agents Successfully Executed!'
                  : `${activeAgent.name} is working...`}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
                {isAllComplete
                  ? 'The Orchestrator Agent has synthesized all outputs into the final Student Cognitive Assessment Report.'
                  : agentActivities[activeAgentId] || activeAgent.description}
              </p>
            </div>
          </div>

          {/* Right Timer & Status Box */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-3 shrink-0">
            <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-xl font-mono text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Elapsed:
              </span>
              <span className="text-white font-bold text-sm">{elapsedSeconds}s</span>
            </div>

            {isAllComplete ? (
              <button
                onClick={onViewReport}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 transition animate-bounce"
              >
                <span>View Full Cognitive Report</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs text-indigo-300">
                <Activity className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Processing multi-agent pipeline...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Step-by-Step Multi-Agent Execution Pipeline Cards */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-semibold text-white">Agent Handoff Sequence</h3>
          </div>
          <span className="text-xs text-slate-400">
            Click any agent card to inspect its exact LLM prompt & structured JSON
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Agent 1 */}
          <div
            onClick={() => onInspectAgent('designer')}
            className={`cursor-pointer rounded-xl p-4 border transition-all ${
              agentStatuses.designer === 'running'
                ? 'bg-cyan-950/40 border-cyan-400 ring-2 ring-cyan-500/40 shadow-lg shadow-cyan-500/20'
                : agentStatuses.designer === 'completed'
                ? 'bg-slate-950/70 border-emerald-500/40'
                : 'bg-slate-950/40 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                Agent 1: Designer
              </span>
              {agentStatuses.designer === 'completed' ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Done
                </span>
              ) : agentStatuses.designer === 'running' ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" /> Active
                </span>
              ) : (
                <span className="text-[11px] text-slate-500">Standby</span>
              )}
            </div>
            <h4 className="text-sm font-semibold text-white">3 Reasoning Items</h4>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              Calibrated Logical, Pattern, and Problem-Solving questions.
            </p>
            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-mono">Groq API</span>
              <span className="text-indigo-400 flex items-center gap-1 font-medium">
                <Eye className="w-3 h-3" /> Inspect
              </span>
            </div>
          </div>

          {/* Agent 2 */}
          <div
            onClick={() => onInspectAgent('analyzer')}
            className={`cursor-pointer rounded-xl p-4 border transition-all ${
              agentStatuses.analyzer === 'running'
                ? 'bg-indigo-950/40 border-indigo-400 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-500/20'
                : agentStatuses.analyzer === 'completed'
                ? 'bg-slate-950/70 border-emerald-500/40'
                : 'bg-slate-950/40 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Agent 2: Analyzer
              </span>
              {agentStatuses.analyzer === 'completed' ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Done
                </span>
              ) : agentStatuses.analyzer === 'running' ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" /> Active
                </span>
              ) : (
                <span className="text-[11px] text-slate-500">Standby</span>
              )}
            </div>
            <h4 className="text-sm font-semibold text-white">Cognitive Diagnosis</h4>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              Evaluates deductive logic, checks errors, and cites evidence.
            </p>
            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-mono">Groq API</span>
              <span className="text-indigo-400 flex items-center gap-1 font-medium">
                <Eye className="w-3 h-3" /> Inspect
              </span>
            </div>
          </div>

          {/* Agent 3 */}
          <div
            onClick={() => onInspectAgent('coach')}
            className={`cursor-pointer rounded-xl p-4 border transition-all ${
              agentStatuses.coach === 'running'
                ? 'bg-emerald-950/40 border-emerald-400 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/20'
                : agentStatuses.coach === 'completed'
                ? 'bg-slate-950/70 border-emerald-500/40'
                : 'bg-slate-950/40 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Agent 3: Coach
              </span>
              {agentStatuses.coach === 'completed' ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Done
                </span>
              ) : agentStatuses.coach === 'running' ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Active
                </span>
              ) : (
                <span className="text-[11px] text-slate-500">Standby</span>
              )}
            </div>
            <h4 className="text-sm font-semibold text-white">Coaching Roadmap</h4>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              Formulates strengths, growth points, and 3 practice drills.
            </p>
            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-mono">Groq API</span>
              <span className="text-indigo-400 flex items-center gap-1 font-medium">
                <Eye className="w-3 h-3" /> Inspect
              </span>
            </div>
          </div>

          {/* Orchestrator */}
          <div
            onClick={() => onInspectAgent('orchestrator')}
            className={`cursor-pointer rounded-xl p-4 border transition-all ${
              agentStatuses.orchestrator === 'running'
                ? 'bg-violet-950/40 border-violet-400 ring-2 ring-violet-500/40 shadow-lg shadow-violet-500/20'
                : agentStatuses.orchestrator === 'completed'
                ? 'bg-slate-950/70 border-emerald-500/40'
                : 'bg-slate-950/40 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
                Orchestrator
              </span>
              {agentStatuses.orchestrator === 'completed' ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Done
                </span>
              ) : agentStatuses.orchestrator === 'running' ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-violet-400 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" /> Active
                </span>
              ) : (
                <span className="text-[11px] text-slate-500">Standby</span>
              )}
            </div>
            <h4 className="text-sm font-semibold text-white">Synthesis Report</h4>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              Aggregates metrics and determines cognitive archetype.
            </p>
            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-mono">Groq API</span>
              <span className="text-indigo-400 flex items-center gap-1 font-medium">
                <Eye className="w-3 h-3" /> Inspect
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Live Thought Console Stream */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-xl overflow-hidden font-mono text-xs">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-200">
              Live Agent Execution Stream
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-sans">
            Auto-streaming real-time agent thoughts
          </span>
        </div>

        <div className="p-4 max-h-64 overflow-y-auto space-y-2 bg-slate-950/95">
          {logs.length === 0 ? (
            <div className="py-6 text-center text-slate-500 font-sans">
              Waiting for stream connection...
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-2.5 hover:bg-slate-900/40 p-1 rounded transition text-xs"
              >
                <span className="text-slate-500 text-[10px] whitespace-nowrap pt-0.5">
                  {log.timestamp}
                </span>
                <span className="font-semibold text-indigo-400 whitespace-nowrap">
                  [{log.agentName}]:
                </span>
                <span className="text-slate-300 font-sans flex-1">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom Navigation Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBackToSetup}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Back to Assessment Test Form</span>
        </button>

        {isAllComplete && (
          <button
            onClick={onViewReport}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition"
          >
            <span>Proceed to Cognitive Report</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
