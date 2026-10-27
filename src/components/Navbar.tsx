'use client';

import React from 'react';
import { Key, Network, ShieldCheck, Zap, Sparkles } from 'lucide-react';

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
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#090a0f]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-xl blur-xs opacity-70 group-hover:opacity-100 transition duration-300" />
            <div className="relative w-9 h-9 rounded-xl bg-zinc-950 flex items-center justify-center border border-white/10">
              <Zap className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-white font-mono">
                COGNIX
              </span>
              <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                MULTI-AGENT v2
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block font-normal">
              Autonomous Student Cognitive Diagnostics
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Architecture Blueprint button */}
          <button
            onClick={onOpenArchitectureModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/[0.08] transition shadow-xs"
          >
            <Network className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden sm:inline">Blueprint</span>
          </button>

          {/* API Key Status Pill */}
          <button
            onClick={onOpenApiKeyModal}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 shadow-xs ${
              hasGroqKey
                ? 'bg-emerald-950/30 text-emerald-300 border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-950/50'
                : 'bg-amber-950/30 text-amber-300 border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-950/50'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                hasGroqKey ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400'
              }`}
            />
            <span className="font-mono text-[11px]">
              {hasGroqKey ? 'Groq • gpt-oss-120b' : 'Simulation Mode'}
            </span>
            <Key className="w-3 h-3 text-zinc-400 ml-0.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
