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
      number: '1',
      title: 'Assessment Input',
      subtitle: 'Questions & candidate answers',
      icon: <FileEdit className="w-3.5 h-3.5" />,
      isAvailable: true,
    },
    {
      id: 'working',
      number: '2',
      title: 'Agent Pipeline',
      subtitle: 'Live reasoning & diagnostics',
      icon: isProcessing ? (
        <Sparkles className="w-3.5 h-3.5 animate-spin text-blue-600" />
      ) : (
        <Cpu className="w-3.5 h-3.5" />
      ),
      isAvailable: isProcessing || hasReport,
    },
    {
      id: 'report',
      number: '3',
      title: 'Diagnostic Report',
      subtitle: 'Cognitive profile & coaching',
      icon: <Award className="w-3.5 h-3.5" />,
      isAvailable: hasReport,
    },
  ];

  return (
    <div className="step-progress-shell w-full p-2 rounded-2xl border border-indigo-100/80 shadow-md shadow-indigo-950/5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-100/90 to-indigo-50 border border-blue-300 shadow-sm shadow-blue-900/10 text-blue-950'
                  : isDone
                  ? 'bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-100 text-slate-700 cursor-pointer shadow-xs hover:shadow-sm'
                  : step.isAvailable
                  ? 'bg-violet-50/60 hover:bg-violet-100/80 border border-violet-100 text-slate-600 cursor-pointer'
                  : 'bg-slate-50/50 border border-slate-100 text-slate-400 opacity-60 cursor-not-allowed'
              }`}
            >
              {/* Number icon badge */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition ${
                  isActive
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-sm shadow-blue-900/20'
                    : isDone
                    ? 'bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {isDone ? <Check className="w-4 h-4 stroke-[2.5]" /> : step.number}
              </div>

              {/* Title & subtitle */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-semibold truncate ${
                      isActive ? 'text-blue-900' : isDone ? 'text-slate-800' : 'text-slate-700'
                    }`}
                  >
                    {step.title}
                  </span>
                  {isActive && isProcessing && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 truncate">
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
