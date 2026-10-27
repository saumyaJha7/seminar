'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Cpu, Clock } from 'lucide-react';
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
          model: 'openai/gpt-oss-120b',
          prompt: ORCHESTRATOR_SYSTEM_PROMPT,
          badgeColor: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
        };
      case 'designer':
        return {
          name: 'Agent 1: Assessment Designer',
          role: 'Reasoning Item Formulator',
          model: 'openai/gpt-oss-120b',
          prompt: DESIGNER_SYSTEM_PROMPT,
          badgeColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
        };
      case 'analyzer':
        return {
          name: 'Agent 2: Cognitive Response Analyzer',
          role: 'Evidence & Error Diagnostician',
          model: 'openai/gpt-oss-120b',
          prompt: ANALYZER_SYSTEM_PROMPT,
          badgeColor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
        };
      case 'coach':
        return {
          name: 'Agent 3: Feedback Coach',
          role: 'Growth Strategy Architect',
          model: 'openai/gpt-oss-120b',
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
          <div className="flex items-center justify-between pb-2 mb-2 text-xs text-zinc-400 border-b border-white/[0.06]">
            <span className="font-mono text-[11px]">System Instruction & Framing</span>
            <button
              onClick={() => copyToClipboard(config.prompt, 'prompt')}
              className="flex items-center gap-1 text-zinc-400 hover:text-white transition font-mono text-[11px]"
            >
              {copiedTab === 'prompt' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copiedTab === 'prompt' ? 'Copied' : 'Copy Prompt'}
            </button>
          </div>
          <pre className="font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed bg-zinc-950 p-4 rounded-xl border border-white/[0.06] max-h-[350px] overflow-y-auto">
            {config.prompt}
          </pre>
        </div>
      );
    }

    if (activeTab === 'input') {
      const inputStr = agentData?.input
        ? JSON.stringify(agentData.input, null, 2)
        : '// No runtime input passed to this node yet.';
      return (
        <div className="relative">
          <div className="flex items-center justify-between pb-2 mb-2 text-xs text-zinc-400 border-b border-white/[0.06]">
            <span className="font-mono text-[11px]">Input Payload</span>
            <button
              onClick={() => copyToClipboard(inputStr, 'input')}
              className="flex items-center gap-1 text-zinc-400 hover:text-white transition font-mono text-[11px]"
            >
              {copiedTab === 'input' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copiedTab === 'input' ? 'Copied' : 'Copy JSON'}
            </button>
          </div>
          <pre className="font-mono text-xs text-indigo-300 whitespace-pre-wrap leading-relaxed bg-zinc-950 p-4 rounded-xl border border-white/[0.06] max-h-[350px] overflow-y-auto">
            {inputStr}
          </pre>
        </div>
      );
    }

    if (activeTab === 'output') {
      const outputStr = agentData?.output
        ? JSON.stringify(agentData.output, null, 2)
        : '// No output emitted yet. Run assessment to view findings.';
      return (
        <div className="relative">
          <div className="flex items-center justify-between pb-2 mb-2 text-xs text-zinc-400 border-b border-white/[0.06]">
            <span className="font-mono text-[11px]">Structured Output Result</span>
            <button
              onClick={() => copyToClipboard(outputStr, 'output')}
              className="flex items-center gap-1 text-zinc-400 hover:text-white transition font-mono text-[11px]"
            >
              {copiedTab === 'output' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copiedTab === 'output' ? 'Copied' : 'Copy JSON'}
            </button>
          </div>
          <pre className="font-mono text-xs text-emerald-300 whitespace-pre-wrap leading-relaxed bg-zinc-950 p-4 rounded-xl border border-white/[0.06] max-h-[350px] overflow-y-auto">
            {outputStr}
          </pre>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.06] flex items-start justify-between bg-zinc-900/40">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md border font-semibold ${config.badgeColor}`}>
                Agent Inspector
              </span>
              <span className="text-xs text-zinc-400 flex items-center gap-1 font-mono">
                <Cpu className="w-3 h-3 text-zinc-500" />
                {config.model}
              </span>
              {agentData?.executionTimeMs !== undefined && (
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono font-semibold">
                  <Clock className="w-3 h-3" />
                  {agentData.executionTimeMs}ms
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-white">{config.name}</h2>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">{config.role}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-white/[0.06] bg-zinc-950/40">
          <button
            onClick={() => setActiveTab('prompt')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 font-mono ${
              activeTab === 'prompt'
                ? 'text-indigo-400 border-indigo-500 bg-zinc-900'
                : 'text-zinc-500 border-transparent hover:text-zinc-300'
            }`}
          >
            System Instruction
          </button>
          <button
            onClick={() => setActiveTab('input')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 font-mono ${
              activeTab === 'input'
                ? 'text-indigo-400 border-indigo-500 bg-zinc-900'
                : 'text-zinc-500 border-transparent hover:text-zinc-300'
            }`}
          >
            Runtime Inputs
          </button>
          <button
            onClick={() => setActiveTab('output')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 font-mono ${
              activeTab === 'output'
                ? 'text-indigo-400 border-indigo-500 bg-zinc-900'
                : 'text-zinc-500 border-transparent hover:text-zinc-300'
            }`}
          >
            Structured Output
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1">{renderContent()}</div>

        {/* Footer */}
        <div className="p-3 border-t border-white/[0.06] bg-zinc-900/40 flex items-center justify-between text-xs text-zinc-400 font-mono">
          <span>Groq high-speed LLM inference node</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
