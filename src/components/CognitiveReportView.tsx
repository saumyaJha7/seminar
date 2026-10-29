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
  ArrowRight,
  BarChart3,
  History,
  Lightbulb,
} from 'lucide-react';
import { FinalAssessmentReport, QuestionCategory } from '@/types/assessment';

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
  const answeredEvaluations = report.analyzerOutput.evaluations.filter(
    (evaluation) => evaluation.answerCorrectness !== 'unanswered',
  );
  const hasAnsweredEvaluations = answeredEvaluations.length > 0;
  const hasCategoryAnswers = (category: QuestionCategory) =>
    answeredEvaluations.some((evaluation) => evaluation.category === category);
  const categoryScoreLabel = (category: QuestionCategory, score: number) =>
    hasCategoryAnswers(category) ? `${score}%` : 'N/A';
  const categoryScoreBadge = (category: QuestionCategory, score: number) =>
    !hasCategoryAnswers(category) ? 'Not assessed' : score >= 85 ? 'Exemplary' : 'Developing';
  const categoryResults = [
    {
      label: 'Logical deduction',
      score: report.categoryScores.logicalReasoning,
      category: 'logical_reasoning' as const,
      color: 'bg-blue-600',
    },
    {
      label: 'Pattern recognition',
      score: report.categoryScores.patternRecognition,
      category: 'pattern_recognition' as const,
      color: 'bg-indigo-600',
    },
    {
      label: 'Problem solving',
      score: report.categoryScores.problemSolving,
      category: 'problem_solving' as const,
      color: 'bg-amber-500',
    },
  ];
  const outcomeResults = [
    { key: 'correct', label: 'Correct', color: '#059669' },
    { key: 'partially_correct', label: 'Partially correct', color: '#d97706' },
    { key: 'incorrect', label: 'Incorrect', color: '#e11d48' },
    { key: 'uncertain', label: 'Uncertain', color: '#64748b' },
    { key: 'unanswered', label: 'Unanswered', color: '#cbd5e1' },
  ].map((outcome) => ({
    ...outcome,
    count: report.analyzerOutput.evaluations.filter(
      (evaluation) => evaluation.answerCorrectness === outcome.key,
    ).length,
  }));
  const outcomeTotal = outcomeResults.reduce((total, outcome) => total + outcome.count, 0);
  const chartCircumference = 2 * Math.PI * 44;
  let chartOffset = 0;
  const getVerdictBadge = (isCorrect: boolean | 'partial' | 'uncertain' | 'unanswered') => {
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
    if (isCorrect === 'uncertain') {
      return (
        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
          Uncertain
        </span>
      );
    }
    if (isCorrect === 'unanswered') {
      return (
        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <XCircle className="w-3.5 h-3.5 text-slate-500" />
          Not answered
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
**Focus area:** ${report.focusArea || 'Not specified'}
**Difficulty:** ${report.difficulty || 'Not specified'}
**Question count:** ${report.questionCount ?? report.designerOutput.questions.length}
**Target Bloom levels:** ${(report.targetBloomLevels ?? [...new Set(report.designerOutput.questions.map((question) => question.bloomLevel))]).join(', ')}
**Cognitive Archetype:** ${report.orchestratorSynthesis.cognitiveProfileType}
**Overall Cognitive Score:** ${hasAnsweredEvaluations ? `${report.overallScore}/100` : 'Not available (no responses submitted)'}

---

## Executive Summary (Orchestrator Synthesis)
${report.orchestratorSynthesis.executiveSummary}

**Key Strategic Takeaway:** ${report.orchestratorSynthesis.keyTakeaway}

---

## Cognitive Dimension Scores
- Logical Reasoning: ${categoryScoreLabel('logical_reasoning', report.categoryScores.logicalReasoning)}
- Pattern Recognition: ${categoryScoreLabel('pattern_recognition', report.categoryScores.patternRecognition)}
- Problem Solving: ${categoryScoreLabel('problem_solving', report.categoryScores.problemSolving)}
- Reasoning Clarity: ${report.reasoningClarityScore === null ? 'Insufficient evidence' : `${report.reasoningClarityScore}/100`}

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
- **Verdict:** ${ev.isCorrect === true ? 'Correct' : ev.isCorrect === 'partial' ? 'Partial' : ev.isCorrect === 'uncertain' ? 'Uncertain' : ev.isCorrect === 'unanswered' ? 'Not answered' : 'Incorrect'} (${ev.score}/100)
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
              {report.mode === 'demo' && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200">
                  Demo Mode
                </span>
              )}
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
              {report.difficulty && (
                <>
                  <span>•</span>
                  <span className="capitalize">{report.difficulty} difficulty</span>
                </>
              )}
              <span>•</span>
              <span>{report.questionCount ?? report.designerOutput.questions.length} questions</span>
              <span>•</span>
              <span className="max-w-xs truncate" title={report.focusArea || undefined}>
                Focus: {report.focusArea || 'Not specified'}
              </span>
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
                {!hasAnsweredEvaluations
                  ? 'Insufficient evidence'
                  : report.overallScore >= 90
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
                  strokeDashoffset={hasAnsweredEvaluations ? 175.9 - (175.9 * report.overallScore) / 100 : 175.9}
                  className="text-blue-600 transition-all duration-1000 ease-out motion-reduce:transition-none"
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <span className="absolute font-bold text-lg text-slate-900">
                {hasAnsweredEvaluations ? report.overallScore : 'N/A'}
              </span>
            </div>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-slate-500">
          Target Bloom levels: {(report.targetBloomLevels ?? [...new Set(report.designerOutput.questions.map((question) => question.bloomLevel))]).join(', ')}
        </p>

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
        <div className="space-y-6 animate-in fade-in duration-200 motion-reduce:animate-none motion-reduce:transition-none">
          <div className="flex flex-col gap-1 border-l-4 border-blue-600 pl-4">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Assessment results</h2>
            <p className="text-sm text-slate-600">
              A visual summary of performance across the submitted assessment responses.
            </p>
          </div>

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

            {/* Score interpretation */}
            <div className="pro-card rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Score Interpretation
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  An estimate from this assessment&apos;s question-level rubrics. It is not norm-referenced or a clinical measure.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-600">
                Score: <strong className="text-slate-900">
                  {hasAnsweredEvaluations ? `${report.overallScore}/100` : 'Not available — no responses submitted'}
                </strong>
                <span className="block mt-1">No population comparison is available for this project.</span>
              </div>
            </div>
          </div>

          {/* Assessment dimension cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="pro-card rounded-xl p-5 shadow-xs border-l-4 border-l-blue-500">
              <span className="block text-xs font-semibold text-slate-500 mb-1">
                Logical Deduction
              </span>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl font-bold text-slate-900">
                  {categoryScoreLabel('logical_reasoning', report.categoryScores.logicalReasoning)}
                </span>
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {categoryScoreBadge('logical_reasoning', report.categoryScores.logicalReasoning)}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${hasCategoryAnswers('logical_reasoning') ? report.categoryScores.logicalReasoning : 0}%` }}
                />
              </div>
            </div>

            <div className="pro-card rounded-xl p-5 shadow-xs border-l-4 border-l-indigo-500">
              <span className="block text-xs font-semibold text-slate-500 mb-1">
                Pattern Recognition
              </span>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl font-bold text-slate-900">
                  {categoryScoreLabel('pattern_recognition', report.categoryScores.patternRecognition)}
                </span>
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  {categoryScoreBadge('pattern_recognition', report.categoryScores.patternRecognition)}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{ width: `${hasCategoryAnswers('pattern_recognition') ? report.categoryScores.patternRecognition : 0}%` }}
                />
              </div>
            </div>

            <div className="pro-card rounded-xl p-5 shadow-xs border-l-4 border-l-amber-500">
              <span className="block text-xs font-semibold text-slate-500 mb-1">
                Problem Solving
              </span>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl font-bold text-slate-900">
                  {categoryScoreLabel('problem_solving', report.categoryScores.problemSolving)}
                </span>
                <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                  {categoryScoreBadge('problem_solving', report.categoryScores.problemSolving)}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-amber-500 h-2 rounded-full"
                  style={{ width: `${hasCategoryAnswers('problem_solving') ? report.categoryScores.problemSolving : 0}%` }}
                />
              </div>
            </div>

            <div className="pro-card rounded-xl p-5 shadow-xs border-l-4 border-l-emerald-500">
              <span className="block text-xs font-semibold text-slate-500 mb-1">
                Reasoning Clarity
              </span>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl font-bold text-slate-900">
                  {report.reasoningClarityScore === null ? 'N/A' : `${report.reasoningClarityScore}%`}
                </span>
                <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                  {report.reasoningClarityScore === null ? 'Not assessed' : 'Articulated'}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full"
                  style={{ width: `${report.reasoningClarityScore ?? 0}%` }}
                />
              </div>
            </div>

          </div>

          <section aria-label="Assessment result charts" className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <article className="pro-card rounded-2xl p-5 shadow-xs sm:p-6">
              <div className="mb-6">
                <h3 className="text-base font-bold text-slate-900">Performance by category</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Rubric scores for categories with submitted answers.
                </p>
              </div>
              <div role="img" aria-label="Horizontal bar chart showing scores by reasoning category">
                <div className="space-y-5">
                  {categoryResults.map((result) => {
                    const categoryResponses = answeredEvaluations.filter(
                      (evaluation) => evaluation.category === result.category,
                    ).length;
                    const assessed = categoryResponses > 0;
                    return (
                      <div key={result.category}>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{result.label}</p>
                            <p className="text-xs text-slate-500">
                              {categoryResponses} answered {categoryResponses === 1 ? 'question' : 'questions'}
                            </p>
                          </div>
                          <span className="text-lg font-bold tabular-nums text-slate-900">
                            {assessed ? `${Math.round(result.score)}%` : 'N/A'}
                          </span>
                        </div>
                        <div
                          className="relative h-3 overflow-hidden rounded-full bg-slate-100"
                          aria-hidden="true"
                        >
                          <div className="absolute inset-0 grid grid-cols-4 divide-x divide-white/90">
                            <span /><span /><span /><span />
                          </div>
                          <div
                            className={`relative h-full rounded-full ${result.color} transition-[width] duration-700 motion-reduce:transition-none`}
                            style={{ width: `${assessed ? Math.min(100, Math.max(0, result.score)) : 0}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="ml-[1px] mt-2 flex justify-between text-[11px] font-medium text-slate-500">
                  <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
                </div>
              </div>
            </article>

            <article className="pro-card rounded-2xl p-5 shadow-xs sm:p-6">
              <div className="mb-4">
                <h3 className="text-base font-bold text-slate-900">Answer outcomes</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Distribution of evaluated questions, including unanswered items.
                </p>
              </div>
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-8">
                <div
                  className="relative h-44 w-44 shrink-0"
                  role="img"
                  aria-label={outcomeTotal > 0
                    ? `Donut chart showing outcomes for ${outcomeTotal} questions`
                    : 'No question outcomes are available to chart'}
                >
                  <svg viewBox="0 0 112 112" className="h-full w-full -rotate-90" aria-hidden="true">
                    <circle cx="56" cy="56" r="44" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                    {outcomeResults.map((outcome) => {
                      const segmentLength = outcomeTotal > 0
                        ? (outcome.count / outcomeTotal) * chartCircumference
                        : 0;
                      const segment = (
                        <circle
                          key={outcome.key}
                          cx="56"
                          cy="56"
                          r="44"
                          fill="none"
                          stroke={outcome.color}
                          strokeWidth="12"
                          strokeDasharray={`${segmentLength} ${chartCircumference - segmentLength}`}
                          strokeDashoffset={-chartOffset}
                          strokeLinecap="butt"
                        />
                      );
                      chartOffset += segmentLength;
                      return segment;
                    })}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {outcomeTotal > 0 ? (
                      <>
                        <span className="text-3xl font-bold tabular-nums text-slate-900">{outcomeTotal}</span>
                        <span className="text-xs font-medium text-slate-500">questions</span>
                      </>
                    ) : (
                      <span className="max-w-20 text-center text-xs font-semibold text-slate-500">
                        No outcomes yet
                      </span>
                    )}
                  </div>
                </div>
                <ul className="w-full space-y-3 sm:max-w-xs" aria-label="Answer outcome legend">
                  {outcomeResults.map((outcome) => (
                    <li key={outcome.key} className="flex items-center justify-between gap-4 text-sm">
                      <span className="flex items-center gap-2.5 text-slate-700">
                        <span
                          className="h-3 w-3 shrink-0 rounded-sm"
                          style={{ backgroundColor: outcome.color }}
                          aria-hidden="true"
                        />
                        {outcome.label}
                      </span>
                      <span className="font-semibold tabular-nums text-slate-900">{outcome.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </section>
        </div>
      )}

      {/* TAB 2: EVIDENCE DIAGNOSTICS */}
      {activeTab === 'diagnostics' && (
        <div className="space-y-4 animate-in fade-in duration-200 motion-reduce:animate-none motion-reduce:transition-none">
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
                    <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                      Bloom: {ev.bloomLevel ?? 'unclassified'}
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-xs">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <span className="block text-slate-500">Answer correctness</span>
                    <strong className="text-slate-800">{ev.answerCorrectnessScore ?? ev.score}/100</strong>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <span className="block text-slate-500">Reasoning quality</span>
                    <strong className="text-slate-800">
                      {ev.reasoningQualityScore == null ? 'Not assessed' : `${ev.reasoningQualityScore}/100`}
                    </strong>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <span className="block text-slate-500">Evaluation confidence</span>
                    <strong className="text-slate-800">
                      {typeof ev.confidence === 'number' ? `${Math.round(ev.confidence * 100)}%` : 'Not available'}
                    </strong>
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
                {(ev.evidence?.length ?? 0) > 0 && (
                  <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-xs">
                    <span className="block font-bold text-blue-900 mb-1">Evidence from this response</span>
                    <ul className="list-disc list-inside space-y-1 text-blue-950">
                      {ev.evidence?.map((item, evidenceIndex) => <li key={`${ev.questionId}-${evidenceIndex}`}>{item}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: GROWTH ROADMAP & DRILLS */}
      {activeTab === 'coaching' && (
        <div className="space-y-6 animate-in fade-in duration-200 motion-reduce:animate-none motion-reduce:transition-none">
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
        <div className="pro-card rounded-2xl p-6 shadow-xs animate-in fade-in duration-200 motion-reduce:animate-none motion-reduce:transition-none">
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
