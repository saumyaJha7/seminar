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
  ShieldAlert,
  Check,
} from 'lucide-react';
import { FinalAssessmentReport } from '@/types/assessment';

interface CognitiveReportViewProps {
  report: FinalAssessmentReport;
  onNewAssessment: () => void;
}

export const CognitiveReportView: React.FC<CognitiveReportViewProps> = ({
  report,
  onNewAssessment,
}) => {
  const [copied, setCopied] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 60) return 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10';
    return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
  };

  const getVerdictBadge = (isCorrect: boolean | 'partial') => {
    if (isCorrect === true) {
      return (
        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Correct
        </span>
      );
    }
    if (isCorrect === 'partial') {
      return (
        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          Partially Sound
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
        <XCircle className="w-3.5 h-3.5 text-rose-400" />
        Incorrect / Flawed
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

## Executive Summary
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
- **Expected Answer:** ${ev.expectedAnswer}
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
   - *Exercise:* ${p.exampleExercise}
`
  )
  .join('\n')}

> *Ethical Notice:* This report is designed for educational development and cognitive reasoning practice. It does not constitute a clinical diagnosis or measure definitive intelligence.
`;

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Cognitive Assessment Report
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ID: {report.assessmentId}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {report.studentName}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <span className="px-2.5 py-1 rounded-md bg-slate-800 font-medium border border-slate-700">
                Archetype: {report.orchestratorSynthesis.cognitiveProfileType}
              </span>
              <span>•</span>
              <span className="text-slate-400">{report.gradeLevel || 'Secondary Level'}</span>
              <span>•</span>
              <span className="text-slate-400">
                {new Date(report.timestamp).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Overall Score Circle */}
          <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
            <div className="text-right">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Cognitive Index
              </span>
              <span className="text-xs text-slate-400">Multi-Agent Composite</span>
            </div>
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center font-extrabold text-2xl border-2 ${getScoreColor(
                report.overallScore
              )}`}
            >
              {report.overallScore}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={copyMarkdownReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Markdown Report'}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>

          <button
            onClick={onNewAssessment}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Start New Assessment</span>
          </button>
        </div>
      </div>

      {/* Synthesis & Category Metric Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Executive Summary Card (from Orchestrator) */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-violet-400" />
            <h3 className="font-semibold text-white text-sm">
              Orchestrator Executive Synthesis
            </h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            {report.orchestratorSynthesis.executiveSummary}
          </p>
          <div className="p-3.5 rounded-xl bg-violet-950/30 border border-violet-500/30 text-xs text-violet-200 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-violet-300">Key Takeaway: </span>
              {report.orchestratorSynthesis.keyTakeaway}
            </div>
          </div>
        </div>

        {/* Category Breakdown Bars */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
          <h3 className="font-semibold text-white text-sm mb-4">Cognitive Dimensions</h3>
          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Logical Reasoning</span>
                <span className="font-mono font-semibold text-cyan-400">
                  {report.categoryScores.logicalReasoning}%
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className="bg-cyan-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${report.categoryScores.logicalReasoning}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Pattern Recognition</span>
                <span className="font-mono font-semibold text-indigo-400">
                  {report.categoryScores.patternRecognition}%
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${report.categoryScores.patternRecognition}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Problem Solving</span>
                <span className="font-mono font-semibold text-fuchsia-400">
                  {report.categoryScores.problemSolving}%
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className="bg-fuchsia-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${report.categoryScores.problemSolving}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Reasoning Articulation</span>
                <span className="font-mono font-semibold text-emerald-400">
                  {report.reasoningClarityScore}%
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${report.reasoningClarityScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Question Diagnostic Cards (Agent 2) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-5">
          <Search className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-semibold text-white">
            Agent 2: Evidence-Based Cognitive Diagnostics
          </h3>
        </div>

        <div className="space-y-4">
          {report.analyzerOutput.evaluations.map((ev, idx) => (
            <div
              key={ev.questionId}
              className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition"
            >
              {/* Question Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 font-mono text-xs flex items-center justify-center font-bold">
                    Q{idx + 1}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {ev.categoryTitle}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-slate-400 font-semibold">
                    Score: {ev.score}/100
                  </span>
                  {getVerdictBadge(ev.isCorrect)}
                </div>
              </div>

              {/* Prompt Text */}
              <p className="text-xs text-slate-300 font-medium mb-3">{ev.question}</p>

              {/* Answer Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-xs">
                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                  <span className="block font-semibold text-slate-400 mb-1">
                    Student Submission:
                  </span>
                  <p className="text-slate-200 font-mono">{ev.studentAnswer}</p>
                  {ev.studentReasoning && ev.studentReasoning !== 'None' && (
                    <p className="text-slate-400 text-[11px] mt-2 italic border-t border-slate-800 pt-1.5">
                      Articulated Reasoning: &ldquo;{ev.studentReasoning}&rdquo;
                    </p>
                  )}
                </div>

                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                  <span className="block font-semibold text-indigo-400 mb-1">
                    Expected Deduction:
                  </span>
                  <p className="text-indigo-200 font-mono">{ev.expectedAnswer}</p>
                </div>
              </div>

              {/* Cognitive Analysis Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/20">
                  <span className="block font-semibold text-rose-300 mb-1">
                    Cognitive Error Analysis:
                  </span>
                  <p className="text-slate-300 leading-relaxed">{ev.cognitiveErrorAnalysis}</p>
                </div>

                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20">
                  <span className="block font-semibold text-emerald-300 mb-1">
                    Demonstrated Cognitive Strengths:
                  </span>
                  <p className="text-slate-300 leading-relaxed">{ev.demonstratedStrengths}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback Coach Roadmap (Agent 3) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-5">
          <Award className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-semibold text-white">
            Agent 3: Feedback Coach & Personalized Growth Roadmap
          </h3>
        </div>

        {/* Strengths & Improvement Opportunities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          {/* Strengths */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Observed Cognitive Strengths
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              {report.coachOutput.observedStrengths.map((str, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Growth Points */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
              <Compass className="w-4 h-4" />
              Targeted Areas for Improvement
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              {report.coachOutput.areasToImprove.map((area, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Personalized Practice Suggestions */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            Targeted Practice Modules
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {report.coachOutput.practiceSuggestions.map((mod, i) => (
              <div
                key={i}
                className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center">
                      {i + 1}
                    </span>
                    <h5 className="font-semibold text-xs text-white">{mod.title}</h5>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    {mod.description}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-[11px] text-indigo-200">
                  <span className="font-semibold block text-indigo-300 mb-0.5">Example Drill:</span>
                  {mod.exampleExercise}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Encouragement note */}
        {report.coachOutput.encouragementNote && (
          <div className="mt-5 p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-200 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-emerald-300">Coach&apos;s Closing Note: </span>
              {report.coachOutput.encouragementNote}
            </div>
          </div>
        )}
      </div>

      {/* Ethical Non-Clinical Disclaimer */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3 text-xs text-slate-400">
        <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-300">Assessment Protocol Notice:</strong> This assessment evaluates specific task-based cognitive reasoning patterns (deductive logic, sequential extrapolation, constraint satisfaction) for formative educational purposes. It does not provide clinical neuropsychological diagnoses, nor does it measure fixed general intelligence.
        </p>
      </div>
    </div>
  );
};
