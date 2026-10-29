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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="modal-surface w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-surface-reveal motion-reduce:animate-none">
        {/* Header */}
        <div className="p-5 border-b border-indigo-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-violet-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Multi-Agent System Architecture</h3>
              <p className="text-xs text-slate-500">Autonomous Reasoning Pipeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Architecture Diagram */}
          <div className="bg-gradient-to-br from-sky-50 via-indigo-50 to-violet-50 p-6 rounded-2xl border border-indigo-100 shadow-inner flex flex-col items-center">
            {/* Top Node */}
            <div className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-800 shadow-xs">
              Candidate Assessment Input
            </div>

            <ArrowDown className="w-4 h-4 text-slate-400 my-2" />

            {/* Orchestrator */}
            <div className="w-full max-w-md p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Brain className="w-4 h-4 text-indigo-700" />
                <span className="text-xs font-bold text-indigo-900">Orchestrator Agent</span>
              </div>
              <p className="text-xs text-indigo-800 leading-relaxed">
                Coordinates data passing between agents & synthesizes holistic report
              </p>
            </div>

            <ArrowDown className="w-4 h-4 text-slate-400 my-2" />

            {/* Specialist Agents Grid */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 my-1">
              <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-sky-700" />
                  <span className="text-xs font-bold text-sky-900">01: Designer</span>
                </div>
                <p className="text-xs text-sky-800 leading-relaxed">
                  Generates calibrated cognitive questions
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Search className="w-3.5 h-3.5 text-blue-700" />
                  <span className="text-xs font-bold text-blue-900">02: Analyzer</span>
                </div>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Diagnoses reasoning & cites evidence
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Award className="w-3.5 h-3.5 text-amber-700" />
                  <span className="text-xs font-bold text-amber-900">03: Coach</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Personalized growth roadmap & drills
                </p>
              </div>
            </div>

            <ArrowDown className="w-4 h-4 text-slate-400 my-2" />

            {/* Final Output */}
            <div className="px-5 py-2.5 rounded-xl bg-blue-600 text-white border border-blue-700 text-xs font-bold shadow-xs">
              Final Cognitive Diagnostic Report
            </div>
          </div>

          {/* Highlights */}
          <div className="space-y-3 text-xs text-slate-600">
            <h4 className="font-bold text-slate-900 text-sm">Key Architectural Capabilities:</h4>
            <ul className="space-y-2 list-disc list-inside">
              <li>
                <strong className="text-slate-800">Multi-Page Step Flow:</strong> Dedicated screens for test setup, real-time agent execution, and the diagnostic report.
              </li>
              <li>
                <strong className="text-slate-800">Streaming Telemetry (SSE):</strong> Watch agent activities, thoughts, and outputs execute in real time.
              </li>
              <li>
                <strong className="text-slate-800">Evidence Guardrails:</strong> Strictly evaluates reasoning using evidence provided by the student, preventing false assumptions.
              </li>
              <li>
                <strong className="text-slate-800">Non-Clinical Ethics:</strong> Formative educational feedback focused on strategy without clinical diagnoses.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-indigo-100 bg-gradient-to-r from-indigo-50 to-cyan-50 flex items-center justify-between text-xs text-slate-600">
          <span>Powered by Groq high-speed inference</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
