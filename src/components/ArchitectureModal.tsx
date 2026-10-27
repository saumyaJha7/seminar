'use client';

import React from 'react';
import { X, Network, Brain, Sparkles, Search, Award, ArrowDown, ExternalLink } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Multi-Agent System Architecture</h3>
              <p className="text-xs text-slate-400">n8n Workflow to Production-Grade Custom UI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Architecture Diagram */}
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex flex-col items-center">
            {/* Top Node */}
            <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 shadow-md">
              User Input / Student Assessment Request
            </div>

            <ArrowDown className="w-4 h-4 text-slate-500 my-2" />

            {/* Orchestrator */}
            <div className="w-full max-w-md p-3.5 rounded-xl bg-violet-950/40 border border-violet-500/40 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Brain className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-bold text-violet-200">Orchestrator Agent</span>
              </div>
              <p className="text-[11px] text-violet-300/80">
                Sequences agents, manages state passing, and synthesizes final cognitive profile
              </p>
            </div>

            <ArrowDown className="w-4 h-4 text-slate-500 my-2" />

            {/* Specialist Agents Grid */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 my-1">
              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs font-bold text-cyan-200">Agent 1: Designer</span>
                </div>
                <p className="text-[10px] text-cyan-300/80 leading-relaxed">
                  Generates 3 calibrated reasoning items (Logic, Patterns, Problem Solving)
                </p>
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Search className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-200">Agent 2: Analyzer</span>
                </div>
                <p className="text-[10px] text-indigo-300/80 leading-relaxed">
                  Evaluates answers vs expected logic, extracts evidence-based strengths & error patterns
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-200">Agent 3: Coach</span>
                </div>
                <p className="text-[10px] text-emerald-300/80 leading-relaxed">
                  Builds constructive growth points & 3 actionable practice exercises
                </p>
              </div>
            </div>

            <ArrowDown className="w-4 h-4 text-slate-500 my-2" />

            {/* Final Output */}
            <div className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-900/60 to-violet-900/60 border border-indigo-500/40 text-xs font-bold text-white shadow-lg">
              Final Student Cognitive Assessment Report
            </div>
          </div>

          {/* Highlights */}
          <div className="space-y-3 text-xs text-slate-300">
            <h4 className="font-semibold text-white">System Enhancements Over Basic n8n Form:</h4>
            <ul className="space-y-2 list-disc list-inside text-slate-400">
              <li>
                <strong className="text-slate-200">Real-Time Streaming Pipeline (SSE):</strong> See each agent activate, think, and emit execution logs live.
              </li>
              <li>
                <strong className="text-slate-200">Full Inspection Node Modal:</strong> Click any agent card to inspect its exact system prompt, inputs, and structured JSON output.
              </li>
              <li>
                <strong className="text-slate-200">Dual Flow:</strong> Take an interactive 3-question cognitive test directly or use quick-fill student presets with 1 click.
              </li>
              <li>
                <strong className="text-slate-200">Ethical Non-Clinical Guardrails:</strong> Adheres strictly to cognitive coaching best practices without making clinical claims.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">Powered by Groq High-Speed LLM Inference</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
