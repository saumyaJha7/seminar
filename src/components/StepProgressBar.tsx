'use client';

import React from 'react';
import { FileEdit, Cpu, Award, Check, Sparkles } from 'lucide-react';

export type AppScreen = 'setup' | 'working' | 'report';

interface StepProgressBarProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  hasReport: boolean;
  isProcessing: boolean;
}

export const StepProgressBar: React.FC<StepProgressBarProps> = ({
  currentScreen,
  onNavigate,
  hasReport,
  isProcessing,
}) => {
  const steps: {
    id: AppScreen;
    number: string;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    isAvailable: boolean;
  }[] = [
    {
      id: 'setup',
      number: '01',
      title: 'Assessment Input',
      subtitle: 'Cognitive items & answers',
      icon: <FileEdit className="w-3.5 h-3.5" />,
      isAvailable: true,
    },
    {
      id: 'working',
      number: '02',
      title: 'Neural Pipeline',
      subtitle: 'Live agents executing',
      icon: isProcessing ? (
        <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-400" />
      ) : (
        <Cpu className="w-3.5 h-3.5" />
      ),
      isAvailable: isProcessing || hasReport,
    },
    {
      id: 'report',
      number: '03',
      title: 'Diagnostic Report',
      subtitle: 'Synthesized intelligence',
      icon: <Award className="w-3.5 h-3.5" />,
      isAvailable: hasReport,
    },
  ];

  return (
    <div className="w-full bg-zinc-950/60 p-1.5 rounded-2xl border border-white/[0.07] backdrop-blur-xl shadow-xl">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
        {steps.map((step) => {
          const isActive = currentScreen === step.id;
          const isDone =
            (step.id === 'setup' && (currentScreen === 'working' || currentScreen === 'report')) ||
            (step.id === 'working' && currentScreen === 'report');

          return (
            <button
              key={step.id}
              disabled={!step.isAvailable}
              onClick={() => onNavigate(step.id)}
              className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all duration-300 ${
                isActive
                  ? 'bg-zinc-900 border border-white/[0.12] shadow-lg shadow-black/40 text-white'
                  : isDone
                  ? 'bg-zinc-950/40 hover:bg-zinc-900/40 border border-transparent text-zinc-400 hover:text-zinc-200 cursor-pointer'
                  : step.isAvailable
                  ? 'bg-zinc-950/20 hover:bg-zinc-900/30 border border-transparent text-zinc-500 hover:text-zinc-300 cursor-pointer'
                  : 'opacity-40 text-zinc-600 border border-transparent cursor-not-allowed'
              }`}
            >
              {/* Step indicator badge */}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.5)]'
                    : isDone
                    ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/30'
                    : 'bg-zinc-900 text-zinc-500 border border-white/[0.06]'
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : step.number}
              </div>

              {/* Title & subtitle */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-semibold truncate ${
                      isActive ? 'text-white' : isDone ? 'text-zinc-200' : 'text-zinc-400'
                    }`}
                  >
                    {step.title}
                  </span>
                  {isActive && isProcessing && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-zinc-500 truncate font-mono">
                  {step.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
