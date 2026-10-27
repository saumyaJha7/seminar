'use client';

import React from 'react';
import { X, Network, Brain, Sparkles, Search, Award, ArrowDown } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between bg-zinc-900/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Multi-Agent Blueprint</h3>
              <p className="text-[11px] text-zinc-400 font-mono">From n8n workflow to autonomous UI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Architecture Diagram */}
          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/[0.06] flex flex-col items-center">
            {/* Top Node */}
            <div className="px-4 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs font-semibold text-zinc-200 shadow-md font-mono">
              Student Assessment Request
            </div>

            <ArrowDown className="w-4 h-4 text-zinc-600 my-2" />

            {/* Orchestrator */}
            <div className="w-full max-w-md p-3.5 rounded-xl bg-violet-950/20 border border-violet-500/30 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Brain className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-bold text-violet-200">Orchestrator Agent</span>
              </div>
              <p className="text-[11px] text-violet-300/80 leading-relaxed font-mono">
                Coordinates workflow handoffs & synthesizes final cognitive profile
              </p>
            </div>

            <ArrowDown className="w-4 h-4 text-zinc-600 my-2" />

            {/* Specialist Agents Grid */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 my-1">
              <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs font-bold text-cyan-200">01: Designer</span>
                </div>
                <p className="text-[10px] text-cyan-300/80 leading-relaxed font-mono">
                  Generates calibrated reasoning items
                </p>
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Search className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-200">02: Analyzer</span>
                </div>
                <p className="text-[10px] text-indigo-300/80 leading-relaxed font-mono">
                  Diagnoses logic & cites evidence
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-200">03: Coach</span>
                </div>
                <p className="text-[10px] text-emerald-300/80 leading-relaxed font-mono">
                  Personalized growth drills
                </p>
              </div>
            </div>

            <ArrowDown className="w-4 h-4 text-zinc-600 my-2" />

            {/* Final Output */}
            <div className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-950/60 to-violet-950/60 border border-indigo-500/30 text-xs font-semibold text-white shadow-lg font-mono">
              Final Cognitive Assessment Report
            </div>
          </div>

          {/* Highlights */}
          <div className="space-y-3 text-xs text-zinc-300">
            <h4 className="font-semibold text-white">Architectural Highlights:</h4>
            <ul className="space-y-2 text-zinc-400 list-disc list-inside">
              <li>
                <strong className="text-zinc-200">Multi-Page Execution Flow:</strong> Dedicated interactive screens for input, live agent execution, and the final report.
              </li>
              <li>
                <strong className="text-zinc-200">Real-Time Streaming Pipeline (SSE):</strong> Watch each agent activate, think, and stream output traces live.
              </li>
              <li>
                <strong className="text-zinc-200">Full Node Inspection:</strong> Inspect exact system instructions, prompts, and structured JSON outputs for every agent.
              </li>
              <li>
                <strong className="text-zinc-200">Evidence Guardrails:</strong> Adheres strictly to cognitive coaching best practices without making clinical claims.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.06] bg-zinc-900/40 flex items-center justify-between text-xs text-zinc-400 font-mono">
          <span>Shared Groq credential model</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
