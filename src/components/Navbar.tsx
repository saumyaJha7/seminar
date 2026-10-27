'use client';

import React from 'react';
import { Key, Network, ShieldCheck, Brain, ExternalLink } from 'lucide-react';

interface NavbarProps {
  hasGroqKey: boolean;
  onOpenApiKeyModal: () => void;
  onOpenArchitectureModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  hasGroqKey,
  onOpenApiKeyModal,
  onOpenArchitectureModal,
}) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-slate-900">
                CognitiveAssessment
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                Multi-Agent
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Student Diagnostic & Coaching System
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Blueprint button */}
          <button
            onClick={onOpenArchitectureModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition"
          >
            <Network className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Agent Architecture</span>
          </button>

          {/* API Key Status Pill */}
          <button
            onClick={onOpenApiKeyModal}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              hasGroqKey
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70'
                : 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100/70'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                hasGroqKey ? 'bg-emerald-500' : 'bg-orange-500'
              }`}
            />
            <span className="font-medium">
              {hasGroqKey ? 'Groq Connected' : 'Demo Mode'}
            </span>
            <Key className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
