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

  const getVerdictBadge = (isCorrect: boolean | 'partial') => {
    if (isCorrect === true) {
      return (
        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          Sound
        </span>
      );
    }
    if (isCorrect === 'partial') {
      return (
        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          Partially Sound
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
        <XCircle className="w-3 h-3 text-rose-400" />
        Unsound
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

  return (
    <div className="space-y-6">
      {/* 1. Executive Top Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] glass-card p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold">
                Cognitive Assessment Report
              </span>
              <span className="text-xs text-zinc-500 font-mono">
                REF: {report.assessmentId}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {report.studentName}
            </h1>

            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-zinc-400 font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/[0.06] text-zinc-300 font-medium">
                {report.orchestratorSynthesis.cognitiveProfileType}
              </span>
              <span>•</span>
              <span>{report.gradeLevel || 'Secondary Level'}</span>
              <span>•</span>
              <span>
                {new Date(report.timestamp).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Radial Circular Score Badge */}
          <div className="flex items-center gap-4 bg-zinc-950/80 border border-white/[0.08] p-4 rounded-2xl shrink-0">
            <div className="text-right">
              <span className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                Cognitive Index
              </span>
              <span className="text-xs text-zinc-500 font-mono">Composite</span>
            </div>
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="5"
                  className="text-zinc-800"
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
                  className="text-indigo-400 transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <span className="absolute font-mono font-bold text-lg text-white">
                {report.overallScore}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-6 pt-5 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={copyMarkdownReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-white/[0.08] transition shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-white/[0.08] transition shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>

          <button
            onClick={onNewAssessment}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition active:scale-[0.98]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Start New Assessment</span>
          </button>
        </div>
      </div>

      {/* 2. Executive Synthesis & Cognitive Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Synthesis */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Orchestrator Executive Synthesis
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-4">
            {report.orchestratorSynthesis.executiveSummary}
          </p>
          <div className="p-3.5 rounded-xl bg-violet-950/20 border border-violet-500/20 text-xs text-violet-200 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-violet-300 font-medium">Strategic Recommendation: </strong>
              {report.orchestratorSynthesis.keyTakeaway}
            </div>
          </div>
        </div>

        {/* Cognitive Dimension Meters */}
        <div className="glass-card rounded-2xl p-6 shadow-xl">
          <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold mb-4">
            Dimensional Breakdown
          </h3>
          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-xs mb-1.5 font-mono">
                <span className="text-zinc-300">Logical Reasoning</span>
                <span className="font-semibold text-cyan-400">
                  {report.categoryScores.logicalReasoning}%
                </span>
              </div>
              <div className="w-full bg-zinc-950 rounded-full h-1.5">
                <div
                  className="bg-cyan-500 h-1.5 rounded-full transition-all duration-700"
                  style={{ width: `${report.categoryScores.logicalReasoning}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5 font-mono">
                <span className="text-zinc-300">Pattern Recognition</span>
                <span className="font-semibold text-indigo-400">
                  {report.categoryScores.patternRecognition}%
                </span>
              </div>
              <div className="w-full bg-zinc-950 rounded-full h-1.5">
                <div
                  className="bg-indigo-500 h-1.5 rounded-full transition-all duration-700"
                  style={{ width: `${report.categoryScores.patternRecognition}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5 font-mono">
                <span className="text-zinc-300">Problem Solving</span>
                <span className="font-semibold text-fuchsia-400">
                  {report.categoryScores.problemSolving}%
                </span>
              </div>
              <div className="w-full bg-zinc-950 rounded-full h-1.5">
                <div
                  className="bg-fuchsia-500 h-1.5 rounded-full transition-all duration-700"
                  style={{ width: `${report.categoryScores.problemSolving}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5 font-mono">
                <span className="text-zinc-300">Reasoning Articulation</span>
                <span className="font-semibold text-emerald-400">
                  {report.reasoningClarityScore}%
                </span>
              </div>
              <div className="w-full bg-zinc-950 rounded-full h-1.5">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-700"
                  style={{ width: `${report.reasoningClarityScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Question Diagnostic Cards (Agent 2) */}
      <div className="glass-card rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white tracking-tight">
            Agent 2: Evidence-Based Cognitive Diagnostics
          </h3>
        </div>

        <div className="space-y-3.5">
          {report.analyzerOutput.evaluations.map((ev, idx) => (
            <div
              key={ev.questionId}
              className="bg-zinc-950/70 border border-white/[0.07] rounded-xl p-4 sm:p-5 hover:border-white/[0.12] transition"
            >
              {/* Question header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-zinc-500 font-bold">
                    Q{idx + 1}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold">
                    {ev.categoryTitle}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-zinc-400 font-semibold">
                    Score: {ev.score}/100
                  </span>
                  {getVerdictBadge(ev.isCorrect)}
                </div>
              </div>

              {/* Prompt */}
              <p className="text-xs text-zinc-300 font-medium mb-3.5 leading-relaxed">{ev.question}</p>

              {/* Answers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3.5 text-xs">
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/[0.06]">
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                    Student Submission:
                  </span>
                  <p className="text-zinc-200 font-mono text-[11px]">{ev.studentAnswer}</p>
                  {ev.studentReasoning && ev.studentReasoning !== 'None' && (
                    <p className="text-zinc-400 text-[11px] mt-2 italic border-t border-white/[0.06] pt-1.5 font-mono">
                      Articulated: &ldquo;{ev.studentReasoning}&rdquo;
                    </p>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/[0.06]">
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-indigo-400 mb-1">
                    Expected Deduction:
                  </span>
                  <p className="text-indigo-200 font-mono text-[11px]">{ev.expectedAnswer}</p>
                </div>
              </div>

              {/* Cognitive Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20">
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-rose-300 mb-1">
                    Cognitive Error Analysis:
                  </span>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">{ev.cognitiveErrorAnalysis}</p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-emerald-300 mb-1">
                    Demonstrated Strengths:
                  </span>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">{ev.demonstratedStrengths}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Feedback Coach Growth Roadmap (Agent 3) */}
      <div className="glass-card rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white tracking-tight">
            Agent 3: Feedback Coach & Growth Roadmap
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {/* Strengths */}
          <div className="bg-zinc-950/70 border border-white/[0.07] rounded-xl p-4">
            <h4 className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 mb-2.5 flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Observed Cognitive Strengths
            </h4>
            <ul className="space-y-1.5 text-xs text-zinc-300">
              {report.coachOutput.observedStrengths.map((str, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{str}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Growth Points */}
          <div className="bg-zinc-950/70 border border-white/[0.07] rounded-xl p-4">
            <h4 className="text-[10px] font-mono uppercase tracking-wider text-amber-400 mb-2.5 flex items-center gap-1.5 font-bold">
              <Compass className="w-3.5 h-3.5" />
              Targeted Opportunities
            </h4>
            <ul className="space-y-1.5 text-xs text-zinc-300">
              {report.coachOutput.areasToImprove.map((area, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{area}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Practice Exercises */}
        <div>
          <h4 className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5 font-bold">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            Personalized Practice Drills
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {report.coachOutput.practiceSuggestions.map((mod, i) => (
              <div
                key={i}
                className="bg-zinc-950/70 border border-white/[0.07] rounded-xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 font-mono text-[10px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <h5 className="font-semibold text-xs text-white">{mod.title}</h5>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                    {mod.description}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-indigo-950/20 border border-indigo-500/20 text-[11px] text-indigo-200 font-mono">
                  <span className="font-semibold block text-indigo-300 mb-0.5">Example Drill:</span>
                  {mod.exampleExercise}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Closing note */}
        {report.coachOutput.encouragementNote && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-200 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-emerald-300 font-medium">Coach&apos;s Closing Note: </strong>
              {report.coachOutput.encouragementNote}
            </div>
          </div>
        )}
      </div>

      {/* Non-Clinical Notice */}
      <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-white/[0.06] flex items-center gap-3 text-xs text-zinc-500 font-mono">
        <ShieldCheck className="w-4 h-4 text-zinc-400 shrink-0" />
        <p>
          Formative reasoning diagnostic based on explicit student submission evidence. Does not measure clinical or fixed intelligence.
        </p>
      </div>
    </div>
  );
};
