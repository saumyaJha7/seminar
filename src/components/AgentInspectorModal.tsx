'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Cpu, Clock } from 'lucide-react';
import { AgentId } from '@/types/assessment';

interface AgentInspectorModalProps {
  agentId: AgentId | null;
  onClose: () => void;
  agentData?: {
    input?: unknown;
    output?: unknown;
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
  const [activeTab, setActiveTab] = useState<'role' | 'input' | 'output'>('role');

  if (!agentId) return null;

  const getAgentConfig = (id: AgentId) => {
    switch (id) {
      case 'orchestrator':
        return {
          name: 'Orchestrator Agent',
          role: 'Workflow Manager & Synthesis Engine',
          model: 'openai/gpt-oss-120b',
          description: 'Coordinates assessment stages and combines validated results into a report.',
          badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        };
      case 'designer':
        return {
          name: 'Agent 1: Assessment Designer',
          role: 'Reasoning Item Formulator',
          model: 'openai/gpt-oss-120b',
          description: 'Creates reasoning questions and assigns each question a Bloom level and evaluation rubric.',
          badgeColor: 'bg-sky-50 text-sky-800 border-sky-200',
        };
      case 'analyzer':
        return {
          name: 'Agent 2: Cognitive Response Analyzer',
          role: 'Evidence & Error Diagnostician',
          model: 'openai/gpt-oss-120b',
          description: 'Evaluates submitted answers against the rubric and cites only evidence in the student response.',
          badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
        };
      case 'coach':
        return {
          name: 'Agent 3: Feedback Coach',
          role: 'Growth Strategy Architect',
          model: 'openai/gpt-oss-120b',
          description: 'Turns observed response evidence into non-clinical feedback and practice suggestions.',
          badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
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
    if (activeTab === 'role') {
      return (
        <div className="relative">
          <div className="flex items-center justify-between pb-2 mb-2 text-xs text-slate-500 border-b border-slate-200">
            <span>Public Agent Responsibility</span>
          </div>
          <pre className="font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed bg-slate-900 p-4 rounded-xl border border-slate-800 max-h-[350px] overflow-y-auto">
            {config.description}
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
          <div className="flex items-center justify-between pb-2 mb-2 text-xs text-slate-500 border-b border-slate-200">
            <span>Input Payload</span>
            <button
              onClick={() => copyToClipboard(inputStr, 'input')}
              className="flex items-center gap-1 text-blue-700 hover:text-blue-900 transition font-semibold"
            >
              {copiedTab === 'input' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copiedTab === 'input' ? 'Copied' : 'Copy JSON'}
            </button>
          </div>
          <pre className="font-mono text-xs text-sky-300 whitespace-pre-wrap leading-relaxed bg-slate-900 p-4 rounded-xl border border-slate-800 max-h-[350px] overflow-y-auto">
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
          <div className="flex items-center justify-between pb-2 mb-2 text-xs text-slate-500 border-b border-slate-200">
            <span>Structured Output Result</span>
            <button
              onClick={() => copyToClipboard(outputStr, 'output')}
              className="flex items-center gap-1 text-blue-700 hover:text-blue-900 transition font-semibold"
            >
              {copiedTab === 'output' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copiedTab === 'output' ? 'Copied' : 'Copy JSON'}
            </button>
          </div>
          <pre className="font-mono text-xs text-emerald-400 whitespace-pre-wrap leading-relaxed bg-slate-900 p-4 rounded-xl border border-slate-800 max-h-[350px] overflow-y-auto">
            {outputStr}
          </pre>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${config.badgeColor}`}>
                Agent Inspector
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-slate-400" />
                {config.model}
              </span>
              {agentData?.executionTimeMs !== undefined && (
                <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {agentData.executionTimeMs}ms
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-900">{config.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{config.role}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 bg-white">
          <button
            onClick={() => setActiveTab('role')}
            className={`px-3 py-2 text-xs font-bold transition border-b-2 ${
              activeTab === 'role'
                ? 'text-blue-700 border-blue-600'
                : 'text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            Agent Role
          </button>
          <button
            onClick={() => setActiveTab('input')}
            className={`px-3 py-2 text-xs font-bold transition border-b-2 ${
              activeTab === 'input'
                ? 'text-blue-700 border-blue-600'
                : 'text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            Runtime Inputs
          </button>
          <button
            onClick={() => setActiveTab('output')}
            className={`px-3 py-2 text-xs font-bold transition border-b-2 ${
              activeTab === 'output'
                ? 'text-blue-700 border-blue-600'
                : 'text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            Structured Output
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">{renderContent()}</div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Groq inference execution node</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
