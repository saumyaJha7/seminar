'use client';

import React from 'react';
import { Cpu, Key, Sparkles, Network, ExternalLink, ShieldCheck, HelpCircle } from 'lucide-react';

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
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-fuchsia-500 p-[2px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Cpu className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">CogniAgents</h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Multi-Agent
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Student Cognitive Assessment System
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Architecture modal button */}
          <button
            onClick={onOpenArchitectureModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
          >
            <Network className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden md:inline">Architecture</span>
          </button>

          {/* API Key Status Pill */}
          <button
            onClick={onOpenApiKeyModal}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              hasGroqKey
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/40'
                : 'bg-amber-950/40 text-amber-300 border-amber-500/30 hover:bg-amber-900/40'
            }`}
            title={hasGroqKey ? 'Live Groq API Key Connected' : 'Running in Simulation/Demo Mode (Click to add Groq Key)'}
          >
            <Key className="w-3.5 h-3.5" />
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  hasGroqKey ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="hidden sm:inline">
                {hasGroqKey ? 'Groq Live (llama-3.3)' : 'Simulation Mode'}
              </span>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
