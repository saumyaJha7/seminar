'use client';

import React from 'react';
import { AssessmentWorkflow } from '@/components/AssessmentWorkflow';
import { useAssessment } from '@/context/AssessmentContext';
import { Sparkles, Info } from 'lucide-react';
import { getSimulatedQuestions } from '@/lib/agents/designer';

export default function HomePage() {
  const {
    questions,
    setQuestions,
    generateQuestions,
    startAssessment,
    isGeneratingQuestions,
    isEvaluating,
    hasServerGroqKey,
    clientGroqKey,
    setIsApiKeyModalOpen,
  } = useAssessment();

  const isGroqConnected = Boolean(hasServerGroqKey || clientGroqKey);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Step 1 • Student Assessment Setup
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Student Cognitive Assessment
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Configure reasoning items, provide student answers or select quick test presets, and launch the multi-agent assessment pipeline.
          </p>
        </div>

        {!isGroqConnected && (
          <div
            onClick={() => setIsApiKeyModalOpen(true)}
            className="cursor-pointer p-3.5 rounded-2xl bg-orange-50 border border-orange-200 text-orange-900 text-xs flex items-center gap-3 hover:bg-orange-100/70 transition shadow-xs shrink-0"
          >
            <Info className="w-4 h-4 text-orange-600 shrink-0" />
            <div>
              <p className="font-bold text-orange-900 text-xs">Demo Mode Active</p>
              <p className="text-[11px] text-orange-800">Click to configure your free Groq API key</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Workflow Form */}
      <AssessmentWorkflow
        questions={questions}
        onGenerateQuestions={generateQuestions}
        onSubmitAssessment={startAssessment}
        isGeneratingQuestions={isGeneratingQuestions}
        isEvaluating={isEvaluating}
        onReset={() => {
          setQuestions(getSimulatedQuestions('intermediate'));
        }}
      />
    </div>
  );
}
