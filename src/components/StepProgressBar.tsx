'use client';

import React from 'react';
import { FileEdit, Cpu, Award, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';

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
    label: string;
    stepNumber: number;
    description: string;
    icon: React.ReactNode;
    isAvailable: boolean;
  }[] = [
    {
      id: 'setup',
      label: '1. Assessment Input',
      stepNumber: 1,
      description: 'Questions & student response input',
      icon: <FileEdit className="w-4 h-4" />,
      isAvailable: true,
    },
    {
      id: 'working',
      label: '2. Multi-Agent Processing',
      stepNumber: 2,
      description: 'Live orchestrator & specialist agents working',
      icon: isProcessing ? (
        <Sparkles className="w-4 h-4 animate-spin text-indigo-400" />
      ) : (
        <Cpu className="w-4 h-4" />
      ),
      isAvailable: isProcessing || hasReport,
    },
    {
      id: 'report',
      label: '3. Cognitive Report',
      stepNumber: 3,
      description: 'Synthesized diagnostic assessment',
      icon: <Award className="w-4 h-4" />,
      isAvailable: hasReport,
    },
  ];

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-4 backdrop-blur-md shadow-xl mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {steps.map((step, idx) => {
          const isActive = currentScreen === step.id;
          const isDone =
            (step.id === 'setup' && (currentScreen === 'working' || currentScreen === 'report')) ||
            (step.id === 'working' && currentScreen === 'report');

          return (
            <button
              key={step.id}
              disabled={!step.isAvailable}
              onClick={() => onNavigate(step.id)}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-300 ${
                isActive
                  ? 'bg-indigo-950/50 border-indigo-500 shadow-md shadow-indigo-500/20 ring-1 ring-indigo-500/40'
                  : isDone
                  ? 'bg-slate-950/60 border-emerald-500/30 hover:border-emerald-500/60 cursor-pointer'
                  : step.isAvailable
                  ? 'bg-slate-950/40 border-slate-800 hover:border-slate-700 cursor-pointer'
                  : 'bg-slate-950/20 border-slate-900 text-slate-600 opacity-60 cursor-not-allowed'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-400'
                    : isDone
                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : step.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4
                    className={`text-xs font-bold truncate ${
                      isActive ? 'text-white' : isDone ? 'text-emerald-300' : 'text-slate-300'
                    }`}
                  >
                    {step.label}
                  </h4>
                  {isActive && isProcessing && (
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {step.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
