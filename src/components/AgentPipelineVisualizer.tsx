'use client';

import React from 'react';
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
  Cpu,
  Layers,
} from 'lucide-react';
import { AgentId, AgentStatus } from '@/types/assessment';

interface AgentCardData {
  id: AgentId;
  title: string;
  role: string;
  model: string;
  description: string;
  status: AgentStatus;
  executionTimeMs?: number;
  currentActivity?: string;
  badgeText: string;
  colorScheme: {
    bg: string;
    border: string;
    glow: string;
    icon: string;
    badge: string;
  };
}

interface AgentPipelineVisualizerProps {
  agentStatuses: Record<AgentId, AgentStatus>;
  agentExecutionTimes: Record<AgentId, number | undefined>;
  agentActivities: Record<AgentId, string | undefined>;
  activeAgentId?: AgentId | null;
  onInspectAgent: (agentId: AgentId) => void;
}

export const AgentPipelineVisualizer: React.FC<AgentPipelineVisualizerProps> = ({
  agentStatuses,
  agentExecutionTimes,
  agentActivities,
  activeAgentId,
  onInspectAgent,
}) => {
  const agents: AgentCardData[] = [
    {
      id: 'orchestrator',
      title: 'Orchestrator Agent',
      role: 'System Coordinator & Report Synthesizer',
      model: 'llama-3.3-70b-versatile',
      description: 'Coordinates workflow, manages data pipelines between agents, and synthesizes final cognitive profile.',
      status: agentStatuses.orchestrator || 'idle',
      executionTimeMs: agentExecutionTimes.orchestrator,
      currentActivity: agentActivities.orchestrator || 'Awaiting evaluation trigger',
      badgeText: 'Orchestrator',
      colorScheme: {
        bg: 'from-violet-950/40 to-slate-900/60',
        border: 'border-violet-500/30',
        glow: 'shadow-violet-500/10',
        icon: 'text-violet-400',
        badge: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
      },
    },
    {
      id: 'designer',
      title: 'Agent 1: Assessment Designer',
      role: 'Reasoning Item Generator',
      model: 'llama-3.3-70b-versatile',
      description: 'Designs 3 calibrated cognitive items: Logical Reasoning, Pattern Recognition, and Problem-Solving.',
      status: agentStatuses.designer || 'idle',
      executionTimeMs: agentExecutionTimes.designer,
      currentActivity: agentActivities.designer || 'Ready to formulate questions',
      badgeText: 'Item Design',
      colorScheme: {
        bg: 'from-cyan-950/40 to-slate-900/60',
        border: 'border-cyan-500/30',
        glow: 'shadow-cyan-500/10',
        icon: 'text-cyan-400',
        badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
      },
    },
    {
      id: 'analyzer',
      title: 'Agent 2: Cognitive Analyzer',
      role: 'Reasoning & Error Diagnostician',
      model: 'llama-3.3-70b-versatile',
      description: 'Evaluates answers against expected logic, diagnosing cognitive flaws and evidence-based strengths.',
      status: agentStatuses.analyzer || 'idle',
      executionTimeMs: agentExecutionTimes.analyzer,
      currentActivity: agentActivities.analyzer || 'Waiting for student responses',
      badgeText: 'Diagnosis',
      colorScheme: {
        bg: 'from-indigo-950/40 to-slate-900/60',
        border: 'border-indigo-500/30',
        glow: 'shadow-indigo-500/10',
        icon: 'text-indigo-400',
        badge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
      },
    },
    {
      id: 'coach',
      title: 'Agent 3: Feedback Coach',
      role: 'Growth & Strategy Architect',
      model: 'llama-3.3-70b-versatile',
      description: 'Generates non-clinical strengths, targeted improvements, and 3 actionable practice exercises.',
      status: agentStatuses.coach || 'idle',
      executionTimeMs: agentExecutionTimes.coach,
      currentActivity: agentActivities.coach || 'Waiting for cognitive analysis',
      badgeText: 'Coaching',
      colorScheme: {
        bg: 'from-emerald-950/40 to-slate-900/60',
        border: 'border-emerald-500/30',
        glow: 'shadow-emerald-500/10',
        icon: 'text-emerald-400',
        badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      },
    },
  ];

  const getAgentIcon = (id: AgentId) => {
    switch (id) {
      case 'orchestrator':
        return <Brain className="w-5 h-5 text-violet-400" />;
      case 'designer':
        return <Sparkles className="w-5 h-5 text-cyan-400" />;
      case 'analyzer':
        return <Search className="w-5 h-5 text-indigo-400" />;
      case 'coach':
        return <Award className="w-5 h-5 text-emerald-400" />;
    }
  };

  const getStatusBadge = (status: AgentStatus) => {
    switch (status) {
      case 'running':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
            Active
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Done
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            Error
          </span>
        );
      case 'waiting':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <Clock className="w-3 h-3 text-amber-400" />
            Waiting
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            Standby
          </span>
        );
    }
  };

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur-sm shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-semibold text-white">Live Multi-Agent Pipeline</h2>
          <span className="text-xs text-slate-400 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 font-mono">
            4 Coordinated Agents
          </span>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span>Click any agent node to inspect prompts & raw outputs</span>
        </div>
      </div>

      {/* Grid of Agent Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative">
        {agents.map((agent, index) => {
          const isRunning = agent.status === 'running';
          const isCompleted = agent.status === 'completed';

          return (
            <div
              key={agent.id}
              onClick={() => onInspectAgent(agent.id)}
              className={`group cursor-pointer relative flex flex-col justify-between rounded-xl p-4 border transition-all duration-300 bg-gradient-to-b ${
                agent.colorScheme.bg
              } ${
                isRunning
                  ? 'border-indigo-400 shadow-lg shadow-indigo-500/20 scale-[1.02] ring-2 ring-indigo-500/30'
                  : isCompleted
                  ? 'border-emerald-500/40 hover:border-emerald-400/80'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Top Row: Icon + Status */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 group-hover:scale-105 transition-transform">
                      {getAgentIcon(agent.id)}
                    </div>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${agent.colorScheme.badge}`}>
                      {agent.badgeText}
                    </span>
                  </div>
                  {getStatusBadge(agent.status)}
                </div>

                {/* Title & Role */}
                <h3 className="font-semibold text-sm text-white group-hover:text-indigo-300 transition-colors">
                  {agent.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">{agent.role}</p>

                {/* Description */}
                <p className="text-xs text-slate-400/90 mt-2 line-clamp-2 leading-relaxed">
                  {agent.description}
                </p>
              </div>

              {/* Bottom Activity / Status */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col gap-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-slate-500" />
                    Groq
                  </span>
                  {agent.executionTimeMs !== undefined && (
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                      <Clock className="w-3 h-3" />
                      {agent.executionTimeMs}ms
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400 truncate max-w-[170px]" title={agent.currentActivity}>
                    {agent.currentActivity}
                  </span>
                  <span className="text-[11px] font-medium text-indigo-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="w-3 h-3" />
                    Inspect
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Workflow Step Pipeline Flow Bar */}
      <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between overflow-x-auto text-xs text-slate-400 py-1">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="font-semibold text-slate-300">Data Flow:</span>
          <span className="text-violet-400 font-medium">Orchestrator Initialized</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-cyan-400 font-medium">Agent 1 Formulates Items</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-indigo-400 font-medium">Agent 2 Diagnoses Responses</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-emerald-400 font-medium">Agent 3 Builds Coaching Plan</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-violet-400 font-medium">Final Report Synthesized</span>
        </div>
      </div>
    </div>
  );
};
