'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CognitiveReportView } from '@/components/CognitiveReportView';
import { useAssessment } from '@/context/AssessmentContext';
import { Award, Play } from 'lucide-react';

export default function ReportPage() {
  const router = useRouter();
  const { report, history, loadReportFromHistory, resetAssessment, isRestoringSession } = useAssessment();

  if (!report && isRestoringSession) {
    return (
      <div aria-busy="true" aria-label="Loading saved assessment report" className="space-y-6">
        <div className="pro-card rounded-2xl border-t-4 border-t-blue-600 p-6 sm:p-8 space-y-5">
          <div className="h-5 w-48 rounded bg-slate-200 animate-pulse motion-reduce:animate-none" />
          <div className="h-8 w-64 max-w-full rounded bg-slate-200 animate-pulse motion-reduce:animate-none" />
          <div className="h-4 w-80 max-w-full rounded bg-slate-100 animate-pulse motion-reduce:animate-none" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[0, 1].map((card) => (
            <div key={card} className="pro-card rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="h-5 w-40 rounded bg-slate-200 animate-pulse motion-reduce:animate-none" />
              <div className="h-48 rounded-xl bg-slate-100 animate-pulse motion-reduce:animate-none" />
              <div className="h-4 w-full rounded bg-slate-100 animate-pulse motion-reduce:animate-none" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="pro-card rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto my-12 border border-slate-200 shadow-sm space-y-4 animate-page-enter motion-reduce:animate-none">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 mx-auto flex items-center justify-center">
          <Award className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">No Diagnostic Report Yet</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Please run a cognitive assessment test to have the Orchestrator, Response Analyzer, and Feedback Coach synthesize a comprehensive report.
        </p>
        <div className="pt-2">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition active:scale-[0.98]"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Go to Assessment Test Setup</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-page-enter motion-reduce:animate-none">
      <CognitiveReportView
        report={report}
        onNewAssessment={resetAssessment}
        history={history}
        onSelectHistory={loadReportFromHistory}
      />
    </div>
  );
}
