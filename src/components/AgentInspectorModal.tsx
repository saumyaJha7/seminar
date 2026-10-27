'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Cpu, Clock, Layers, Sparkles } from 'lucide-react';
import { AgentId } from '@/types/assessment';
import { DESIGNER_SYSTEM_PROMPT } from '@/lib/agents/designer';
import { ANALYZER_SYSTEM_PROMPT } from '@/lib/agents/analyzer';
import { COACH_SYSTEM_PROMPT } from '@/lib/agents/coach';
import { ORCHESTRATOR_SYSTEM_PROMPT } from '@/lib/agents/orchestrator';

interface AgentInspectorModalProps {
  agentId: AgentId | null;
  onClose: () => void;
  agentData?: {
    input?: any;
    output?: any;
    executionTimeMs?: number;
    status?: string;
  };
}

export const AgentInspectorModal: React.FC<AgentInspectorModalProps> = ({
  agentId,
  onClose,
  agentData,
}) => {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'prompt' | 'input' | 'output'>('prompt');

  if (!agentId) return null;

  const getAgentConfig = (id: AgentId) => {
    switch (id) {
      case 'orchestrator':
        return {
          name: 'Orchestrator Agent',
          role: 'Workflow Manager & Synthesis Engine',
          model: 'llama-3.3-70b-versatile',
          prompt: ORCHESTRATOR_SYSTEM_PROMPT,
          badgeColor: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
        };
      case 'designer':
        return {
          name: 'Agent 1: Assessment Designer',
          role: 'Reasoning Item Formulator',
          model: 'llama-3.3-70b-versatile',
          prompt: DESIGNER_SYSTEM_PROMPT,
          badgeColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
        };
      case 'analyzer':
        return {
          name: 'Agent 2: Cognitive Response Analyzer',
          role: 'Evidence & Error Diagnostician',
          model: 'llama-3.3-70b-versatile',
          prompt: ANALYZER_SYSTEM_PROMPT,
          badgeColor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
        };
      case 'coach':
        return {
          name: 'Agent 3: Feedback Coach',
          role: 'Growth Strategy Architect',
          model: 'llama-3.3-70b-versatile',
          prompt: COACH_SYSTEM_PROMPT,
          badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
        };
    }
  };

  const config = getAgentConfig(agentId);

  const copyToClipboard = (text: string, tabName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tabName);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const renderContent = () => {
    if (activeTab === 'prompt') {
      return (
        <div className="relative">
          <div className="flex items-center justify-between pb-2 mb-2 text-xs text-slate-400 border-b border-slate-800">
            <span>System Instruction & Framing</span>
            <button
              onClick={() => copyToClipboard(config.prompt, 'prompt')}
              className="flex items-center gap-1 text-slate-400 hover:text-white transition"
            >
              {copiedTab === 'prompt' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copiedTab === 'prompt' ? 'Copied' : 'Copy Prompt'}
            </button>
          </div>
          <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800/80 max-h-[350px] overflow-y-auto">
            {config.prompt}
          </pre>
        </div>
      );
    }

    if (activeTab === 'input') {
      const inputStr = agentData?.input
        ? JSON.stringify(agentData.input, null, 2)
        : '// No input dispatched to this agent yet. Run the assessment to inspect runtime inputs.';
      return (
        <div className="relative">
          <div className="flex items-center justify-between pb-2 mb-2 text-xs text-slate-400 border-b border-slate-800">
            <span>Dispatched Input Payload</span>
            <button
              onClick={() => copyToClipboard(inputStr, 'input')}
              className="flex items-center gap-1 text-slate-400 hover:text-white transition"
            >
              {copiedTab === 'input' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copiedTab === 'input' ? 'Copied' : 'Copy Input JSON'}
            </button>
          </div>
          <pre className="font-mono text-xs text-indigo-300 whitespace-pre-wrap leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800/80 max-h-[350px] overflow-y-auto">
            {inputStr}
          </pre>
        </div>
      );
    }

    if (activeTab === 'output') {
      const outputStr = agentData?.output
        ? JSON.stringify(agentData.output, null, 2)
        : '// No output emitted yet. Run the assessment to view structured agent findings.';
      return (
        <div className="relative">
          <div className="flex items-center justify-between pb-2 mb-2 text-xs text-slate-400 border-b border-slate-800">
            <span>Structured Output Result</span>
            <button
              onClick={() => copyToClipboard(outputStr, 'output')}
              className="flex items-center gap-1 text-slate-400 hover:text-white transition"
            >
              {copiedTab === 'output' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copiedTab === 'output' ? 'Copied' : 'Copy Output JSON'}
            </button>
          </div>
          <pre className="font-mono text-xs text-emerald-300 whitespace-pre-wrap leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800/80 max-h-[350px] overflow-y-auto">
            {outputStr}
          </pre>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${config.badgeColor}`}>
                Agent Inspector
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                <Cpu className="w-3 h-3 text-slate-500" />
                {config.model}
              </span>
              {agentData?.executionTimeMs !== undefined && (
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  {agentData.executionTimeMs}ms
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-white">{config.name}</h2>
            <p className="text-xs text-slate-400">{config.role}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('prompt')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 ${
              activeTab === 'prompt'
                ? 'text-indigo-400 border-indigo-500 bg-slate-900'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            System Instruction
          </button>
          <button
            onClick={() => setActiveTab('input')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 ${
              activeTab === 'input'
                ? 'text-indigo-400 border-indigo-500 bg-slate-900'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Runtime Inputs
          </button>
          <button
            onClick={() => setActiveTab('output')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 ${
              activeTab === 'output'
                ? 'text-indigo-400 border-indigo-500 bg-slate-900'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Structured Output
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1">{renderContent()}</div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>Shared Groq credential orchestration model</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
