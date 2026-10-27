'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CognitiveReportView } from '@/components/CognitiveReportView';
import { useAssessment } from '@/context/AssessmentContext';
import { Award, Play } from 'lucide-react';

export default function ReportPage() {
  const router = useRouter();
  const { report, history, loadReportFromHistory, resetAssessment } = useAssessment();

  if (!report) {
    return (
      <div className="pro-card rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto my-12 border border-slate-200 shadow-sm space-y-4 animate-page-enter">
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
    <div className="space-y-6 animate-page-enter">
      <CognitiveReportView
        report={report}
        onNewAssessment={resetAssessment}
        history={history}
        onSelectHistory={loadReportFromHistory}
      />
    </div>
  );
}
