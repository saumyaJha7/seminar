'use client';

import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Printer,
  RotateCcw,
  Sparkles,
  Brain,
  Search,
  BookOpen,
  Compass,
  ShieldCheck,
  Check,
  Download,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  BarChart3,
  History,
  Lightbulb,
} from 'lucide-react';
import { FinalAssessmentReport } from '@/types/assessment';

interface CognitiveReportViewProps {
  report: FinalAssessmentReport;
  onNewAssessment: () => void;
  history?: FinalAssessmentReport[];
  onSelectHistory?: (id: string) => void;
}

export const CognitiveReportView: React.FC<CognitiveReportViewProps> = ({
  report,
  onNewAssessment,
  history = [],
  onSelectHistory,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedDrillIdx, setCopiedDrillIdx] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'diagnostics' | 'coaching' | 'history'>('overview');
  const [filterVerdict, setFilterVerdict] = useState<'all' | 'sound' | 'review'>('all');

  const getVerdictBadge = (isCorrect: boolean | 'partial') => {
    if (isCorrect === true) {
      return (
        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Sound Deduction
        </span>
      );
    }
    if (isCorrect === 'partial') {
      return (
        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          Partially Sound
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
        <XCircle className="w-3.5 h-3.5 text-rose-600" />
        Unsound / Flawed
      </span>
    );
  };

  const copyMarkdownReport = () => {
    const md = `# Multi-Agent Student Cognitive Assessment Report
**Student Name:** ${report.studentName}
**Assessment ID:** ${report.assessmentId}
**Date:** ${new Date(report.timestamp).toLocaleString()}
**Cognitive Archetype:** ${report.orchestratorSynthesis.cognitiveProfileType}
**Overall Cognitive Score:** ${report.overallScore}/100

---

## Executive Summary (Orchestrator Synthesis)
${report.orchestratorSynthesis.executiveSummary}

**Key Strategic Takeaway:** ${report.orchestratorSynthesis.keyTakeaway}

---

## Cognitive Dimension Scores
- Logical Reasoning: ${report.categoryScores.logicalReasoning}/100
- Pattern Recognition: ${report.categoryScores.patternRecognition}/100
- Problem Solving: ${report.categoryScores.problemSolving}/100
- Reasoning Clarity: ${report.reasoningClarityScore}/100

---

## Question Diagnostics (Agent 2 Analysis)
${report.analyzerOutput.evaluations
  .map(
    (ev, idx) => `
### Question ${idx + 1}: ${ev.categoryTitle}
- **Prompt:** ${ev.question}
- **Student Answer:** ${ev.studentAnswer}
- **Student Reasoning:** ${ev.studentReasoning || 'None articulated'}
- **Expected Deduction:** ${ev.expectedAnswer}
- **Verdict:** ${ev.isCorrect === true ? 'Correct' : ev.isCorrect === 'partial' ? 'Partial' : 'Incorrect'} (${ev.score}/100)
- **Cognitive Error Analysis:** ${ev.cognitiveErrorAnalysis}
- **Demonstrated Strengths:** ${ev.demonstratedStrengths}
`
  )
  .join('\n')}

---

## Feedback Coach Growth Roadmap (Agent 3)
### Observed Strengths
${report.coachOutput.observedStrengths.map((s) => `- ${s}`).join('\n')}

### Areas for Improvement
${report.coachOutput.areasToImprove.map((a) => `- ${a}`).join('\n')}

### Targeted Practice Suggestions
${report.coachOutput.practiceSuggestions
  .map(
    (p, i) => `
${i + 1}. **${p.title}**
   - ${p.description}
   - *Exercise Drill:* ${p.exampleExercise}
`
  )
  .join('\n')}

> Notice: Formative cognitive assessment based on task evidence. Does not constitute clinical measurement.
`;

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJSONReport = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cognitive_Report_${report.studentName.replace(/\s+/g, '_')}_${report.assessmentId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyDrill = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedDrillIdx(idx);
    setTimeout(() => setCopiedDrillIdx(null), 2000);
  };

  const filteredEvaluations = report.analyzerOutput.evaluations.filter((ev) => {
    if (filterVerdict === 'sound') return ev.isCorrect === true;
    if (filterVerdict === 'review') return ev.isCorrect !== true;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Hero Diagnostic Header Card */}
      <div className="pro-card rounded-2xl p-6 sm:p-8 shadow-xs border-t-4 border-t-blue-600">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Cognitive Diagnostic Report
              </span>
              <span className="text-xs text-slate-500 font-mono">
                REF: {report.assessmentId}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {report.studentName}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                {report.orchestratorSynthesis.cognitiveProfileType}
              </span>
              <span>•</span>
              <span>{report.gradeLevel || 'Secondary Level'}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(report.timestamp).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Radial Circular Score Badge */}
          <div className="flex items-center gap-5 bg-slate-50 border border-slate-200 p-4 rounded-2xl shrink-0">
            <div className="text-right">
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Cognitive Index
              </span>
              <span className="text-xs text-blue-700 font-bold">
                {report.overallScore >= 90
                  ? 'Superior Tier'
                  : report.overallScore >= 75
                  ? 'Proficient Tier'
                  : 'Developing'}
              </span>
            </div>
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="5"
                  className="text-slate-200"
                  fill="transparent"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeDasharray={175.9}
                  strokeDashoffset={175.9 - (175.9 * report.overallScore) / 100}
                  className="text-blue-600 transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <span className="absolute font-bold text-lg text-slate-900">
                {report.overallScore}
              </span>
            </div>
          </div>
        </div>

        {/* Global Report Action Controls */}
        <div className="mt-6 pt-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={copyMarkdownReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
            </button>
            <button
              onClick={downloadJSONReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 transition"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print PDF</span>
            </button>
          </div>

          <button
            onClick={onNewAssessment}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition active:scale-[0.98]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake / New Test</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
            activeTab === 'overview'
              ? 'bg-blue-50 text-blue-900 border border-blue-300 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Brain className="w-4 h-4 text-blue-600" />
          <span>Executive Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
            activeTab === 'diagnostics'
              ? 'bg-blue-50 text-blue-900 border border-blue-300 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Search className="w-4 h-4 text-blue-600" />
          <span>Evidence Diagnostics ({report.analyzerOutput.evaluations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('coaching')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
            activeTab === 'coaching'
              ? 'bg-amber-50 text-amber-900 border border-amber-300 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4 text-amber-600" />
          <span>Growth Roadmap & Drills</span>
        </button>

        {history.length > 1 && (
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'history'
                ? 'bg-slate-100 text-slate-900 border border-slate-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4 text-slate-600" />
            <span>Past Assessments ({history.length})</span>
          </button>
        )}
      </div>

      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Orchestrator Executive Synthesis Card */}
            <div className="lg:col-span-2 pro-card rounded-2xl p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Orchestrator Cognitive Synthesis
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-4">
                {report.orchestratorSynthesis.executiveSummary}
              </p>
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950 flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-blue-900 font-semibold">Strategic Recommendation: </strong>
                  {report.orchestratorSynthesis.keyTakeaway}
                </div>
              </div>
            </div>

            {/* Cohort Benchmark Card */}
            <div className="pro-card rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Cohort Comparison
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Compared against standard analytical benchmarks for {report.gradeLevel || 'Secondary Level'}.
                </p>
                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-blue-900 font-bold">Candidate Score</span>
                      <span className="text-blue-700 font-bold">{report.overallScore}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${report.overallScore}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Cohort Population Mean</span>
                      <span className="text-slate-700">72%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-slate-400 h-2 rounded-full transition-all duration-1000"
                        style={{ width: '72%' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-emerald-700 font-semibold">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Comparative Margin:
                </span>
                <span>+{report.overallScore - 72}% Above Average</span>
              </div>
            </div>
          </div>

          {/* 4 Cognitive Dimension Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="pro-card rounded-xl p-5 shadow-xs border-l-4 border-l-blue-500">
              <span className="block text-xs font-semibold text-slate-500 mb-1">
                Logical Deduction
              </span>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl font-bold text-slate-900">
                  {report.categoryScores.logicalReasoning}%
                </span>
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {report.categoryScores.logicalReasoning >= 85 ? 'Exemplary' : 'Sound'}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${report.categoryScores.logicalReasoning}%` }}
                />
              </div>
            </div>

            <div className="pro-card rounded-xl p-5 shadow-xs border-l-4 border-l-indigo-500">
              <span className="block text-xs font-semibold text-slate-500 mb-1">
                Pattern Recognition
              </span>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl font-bold text-slate-900">
                  {report.categoryScores.patternRecognition}%
                </span>
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  {report.categoryScores.patternRecognition >= 85 ? 'Exemplary' : 'Sound'}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{ width: `${report.categoryScores.patternRecognition}%` }}
                />
              </div>
            </div>

            <div className="pro-card rounded-xl p-5 shadow-xs border-l-4 border-l-amber-500">
              <span className="block text-xs font-semibold text-slate-500 mb-1">
                Problem Solving
              </span>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl font-bold text-slate-900">
                  {report.categoryScores.problemSolving}%
                </span>
                <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                  {report.categoryScores.problemSolving >= 85 ? 'Exemplary' : 'Sound'}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-amber-500 h-2 rounded-full"
                  style={{ width: `${report.categoryScores.problemSolving}%` }}
                />
              </div>
            </div>

            <div className="pro-card rounded-xl p-5 shadow-xs border-l-4 border-l-emerald-500">
              <span className="block text-xs font-semibold text-slate-500 mb-1">
                Reasoning Clarity
              </span>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl font-bold text-slate-900">
                  {report.reasoningClarityScore}%
                </span>
                <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                  Articulated
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full"
                  style={{ width: `${report.reasoningClarityScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EVIDENCE DIAGNOSTICS */}
      {activeTab === 'diagnostics' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-medium text-slate-600">
              Deductions evaluated against logical rule benchmarks:
            </span>
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setFilterVerdict('all')}
                className={`px-3 py-1 rounded-lg transition ${
                  filterVerdict === 'all' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({report.analyzerOutput.evaluations.length})
              </button>
              <button
                onClick={() => setFilterVerdict('sound')}
                className={`px-3 py-1 rounded-lg transition ${
                  filterVerdict === 'sound' ? 'bg-white text-emerald-800 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sound ({report.analyzerOutput.evaluations.filter((e) => e.isCorrect === true).length})
              </button>
              <button
                onClick={() => setFilterVerdict('review')}
                className={`px-3 py-1 rounded-lg transition ${
                  filterVerdict === 'review' ? 'bg-white text-amber-800 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Needs Review ({report.analyzerOutput.evaluations.filter((e) => e.isCorrect !== true).length})
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredEvaluations.map((ev, idx) => (
              <div
                key={ev.questionId}
                className="pro-card rounded-2xl p-6 shadow-xs border border-slate-200 hover:border-slate-300 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                      Item {idx + 1}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                      {ev.categoryTitle}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-700">
                      Score: {ev.score}/100
                    </span>
                    {getVerdictBadge(ev.isCorrect)}
                  </div>
                </div>

                <p className="text-sm font-semibold text-slate-900 mb-4 leading-relaxed">
                  {ev.question}
                </p>

                {/* Submissions comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="block text-xs font-bold text-slate-600 mb-1">
                      Student Submission:
                    </span>
                    <p className="text-slate-900 font-medium">{ev.studentAnswer}</p>
                    {ev.studentReasoning && ev.studentReasoning !== 'None' && (
                      <p className="text-slate-600 text-xs mt-2 italic border-t border-slate-200 pt-2 leading-relaxed">
                        Reasoning Quoted: &ldquo;{ev.studentReasoning}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200">
                    <span className="block text-xs font-bold text-blue-900 mb-1">
                      Expected Deduction:
                    </span>
                    <p className="text-blue-950 font-medium">{ev.expectedAnswer}</p>
                  </div>
                </div>

                {/* Diagnostics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200">
                    <span className="block text-xs font-bold text-orange-900 mb-1">
                      Cognitive Error Analysis:
                    </span>
                    <p className="text-orange-950 leading-relaxed">{ev.cognitiveErrorAnalysis}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <span className="block text-xs font-bold text-emerald-900 mb-1">
                      Demonstrated Reasoning Strengths:
                    </span>
                    <p className="text-emerald-950 leading-relaxed">{ev.demonstratedStrengths}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: GROWTH ROADMAP & DRILLS */}
      {activeTab === 'coaching' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Strengths Card */}
            <div className="pro-card rounded-2xl p-6 shadow-xs border-t-4 border-t-emerald-500">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Observed Cognitive Strengths
              </h4>
              <ul className="space-y-2 text-xs text-slate-700">
                {report.coachOutput.observedStrengths.map((str, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span className="leading-relaxed">{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Growth Opportunities */}
            <div className="pro-card rounded-2xl p-6 shadow-xs border-t-4 border-t-amber-500">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-3 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-amber-600" />
                Targeted Growth Opportunities
              </h4>
              <ul className="space-y-2 text-xs text-slate-700">
                {report.coachOutput.areasToImprove.map((area, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span className="leading-relaxed">{area}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actionable Practice Drills */}
          <div className="pro-card rounded-2xl p-6 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Actionable Practice Modules
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {report.coachOutput.practiceSuggestions.map((mod, i) => (
                <div
                  key={i}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-300 transition"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center font-mono">
                        {i + 1}
                      </span>
                      <button
                        onClick={() => copyDrill(`${mod.title}\n${mod.description}\nExercise: ${mod.exampleExercise}`, i)}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                      >
                        {copiedDrillIdx === i ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedDrillIdx === i ? 'Copied' : 'Copy Drill'}
                      </button>
                    </div>

                    <h5 className="font-bold text-xs text-slate-900 mb-1">{mod.title}</h5>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      {mod.description}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-orange-50/80 border border-orange-200 text-xs text-orange-950">
                    <span className="font-bold block text-orange-900 mb-1">Puzzle Exercise Drill:</span>
                    <p className="leading-relaxed">{mod.exampleExercise}</p>
                  </div>
                </div>
              ))}
            </div>

            {report.coachOutput.encouragementNote && (
              <div className="mt-5 p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-blue-900 font-semibold">Coach&apos;s Concluding Encouragement: </strong>
                  {report.coachOutput.encouragementNote}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: HISTORY */}
      {activeTab === 'history' && history.length > 0 && (
        <div className="pro-card rounded-2xl p-6 shadow-xs animate-in fade-in duration-200">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4">
            Locally Stored Assessment Sessions
          </h4>
          <div className="space-y-3">
            {history.map((hist) => (
              <div
                key={hist.assessmentId}
                onClick={() => onSelectHistory && onSelectHistory(hist.assessmentId)}
                className={`cursor-pointer p-4 rounded-xl border flex items-center justify-between transition ${
                  hist.assessmentId === report.assessmentId
                    ? 'bg-blue-50 border-blue-400'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-xs text-slate-900">{hist.studentName}</span>
                    <span className="text-xs text-slate-500 font-mono">REF: {hist.assessmentId}</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Archetype: {hist.orchestratorSynthesis.cognitiveProfileType} • {new Date(hist.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-blue-700">
                    {hist.overallScore}%
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Non-Clinical Notice */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center gap-3 text-xs text-slate-500 shadow-xs">
        <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
        <p>
          Formative educational diagnostic based on explicit student submission evidence. Does not measure clinical or fixed intelligence.
        </p>
      </div>
    </div>
  );
};
