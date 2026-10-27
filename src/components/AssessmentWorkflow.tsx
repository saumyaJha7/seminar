'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  User,
  GraduationCap,
  SlidersHorizontal,
  Wand2,
  Play,
  RotateCcw,
  Zap,
  CornerDownLeft,
} from 'lucide-react';
import { Question, StudentAnswer } from '@/types/assessment';
import { SAMPLE_STUDENT_PRESETS } from '@/lib/samplePresets';

interface AssessmentWorkflowProps {
  questions: Question[];
  onGenerateQuestions: (params: {
    gradeLevel: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    focusArea: string;
  }) => Promise<void>;
  onSubmitAssessment: (params: {
    studentName: string;
    gradeLevel: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    questions: Question[];
    studentAnswers: StudentAnswer[];
  }) => Promise<void>;
  isGeneratingQuestions: boolean;
  isEvaluating: boolean;
  onReset: () => void;
}

export const AssessmentWorkflow: React.FC<AssessmentWorkflowProps> = ({
  questions,
  onGenerateQuestions,
  onSubmitAssessment,
  isGeneratingQuestions,
  isEvaluating,
  onReset,
}) => {
  const [studentName, setStudentName] = useState('Maya Chen');
  const [gradeLevel, setGradeLevel] = useState('High School');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [focusArea, setFocusArea] = useState('Deductive Logic & Pattern Analysis');

  // Answers state
  const [answers, setAnswers] = useState<Record<string, { answer: string; reasoning: string }>>({
    q1_logical: {
      answer: 'It did not rain.',
      reasoning: 'By modus tollens: If it rains then ground is wet. Ground is not wet, so it did not rain.',
    },
    q2_pattern: {
      answer: '35',
      reasoning: 'The differences are +5, +7, +9, +11. So 24 + 11 = 35.',
    },
    q3_problem_solving: {
      answer: '41 students',
      reasoning: '48 capacity minus 7 teacher seats leaves 41 seats for students.',
    },
  });

  const handleAnswerChange = (qId: string, field: 'answer' | 'reasoning', value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        [field]: value,
      },
    }));
  };

  const applyPreset = (presetId: string) => {
    const preset = SAMPLE_STUDENT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setStudentName(preset.studentName);

    const updatedAnswers: Record<string, { answer: string; reasoning: string }> = {};

    questions.forEach((q) => {
      const presetAns = preset.answers[q.category];
      if (presetAns) {
        updatedAnswers[q.id] = {
          answer: presetAns.answer,
          reasoning: presetAns.reasoning,
        };
      }
    });

    setAnswers(updatedAnswers);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const formattedAnswers: StudentAnswer[] = questions.map((q) => ({
      questionId: q.id,
      answer: answers[q.id]?.answer || '',
      reasoning: answers[q.id]?.reasoning || '',
    }));

    onSubmitAssessment({
      studentName,
      gradeLevel,
      difficulty,
      questions,
      studentAnswers: formattedAnswers,
    });
  };

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'logical_reasoning':
        return {
          pill: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
          indicator: 'bg-violet-500',
        };
      case 'pattern_recognition':
        return {
          pill: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
          indicator: 'bg-cyan-500',
        };
      case 'problem_solving':
        return {
          pill: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
          indicator: 'bg-emerald-500',
        };
      default:
        return {
          pill: 'bg-zinc-800 text-zinc-300 border-zinc-700',
          indicator: 'bg-indigo-500',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Configuration Strip Card */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[11px] font-bold flex items-center justify-center">
                01
              </span>
              <h2 className="text-sm font-semibold text-white tracking-tight">Assessment Parameters</h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Select student profile, calibrate difficulty, or generate new questions using Agent 1.
            </p>
          </div>

          <button
            type="button"
            disabled={isGeneratingQuestions || isEvaluating}
            onClick={() => onGenerateQuestions({ gradeLevel, difficulty, focusArea })}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-white/10 hover:border-white/20 text-xs font-medium transition shadow-xs disabled:opacity-50"
          >
            {isGeneratingQuestions ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>Designing Items...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Regenerate Questions (Agent 1)</span>
              </>
            )}
          </button>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
          {/* Student Name */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Candidate Name
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Student Name"
                className="w-full bg-zinc-950/80 border border-white/[0.08] focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 rounded-xl pl-9 pr-3 py-2 text-xs text-white transition placeholder:text-zinc-600 font-medium"
              />
            </div>
          </div>

          {/* Academic Level */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Academic Cohort
            </label>
            <div className="relative">
              <GraduationCap className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full bg-zinc-950/80 border border-white/[0.08] focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 rounded-xl pl-9 pr-3 py-2 text-xs text-white transition font-medium appearance-none cursor-pointer"
              >
                <option value="Middle School">Middle School</option>
                <option value="High School">High School (Standard)</option>
                <option value="Undergraduate">Undergraduate / College</option>
                <option value="Adult Learner">Professional / Adult</option>
              </select>
            </div>
          </div>

          {/* Difficulty Segmented Control */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Cognitive Complexity
            </label>
            <div className="flex bg-zinc-950/80 p-1 rounded-xl border border-white/[0.08]">
              {(['beginner', 'intermediate', 'advanced'] as const).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setDifficulty(diff)}
                  className={`flex-1 py-1.5 text-[11px] font-medium rounded-lg capitalize transition font-mono ${
                    difficulty === diff
                      ? 'bg-zinc-800 text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Questions & Response Input Card */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-white/[0.06] gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[11px] font-bold flex items-center justify-center">
                02
              </span>
              <h3 className="text-sm font-semibold text-white tracking-tight">Student Responses</h3>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Enter answers and optional reasoning traces, or load a quick evaluation preset.
            </p>
          </div>

          {/* Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-mono text-zinc-500 mr-1">Presets:</span>
            {SAMPLE_STUDENT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/[0.07] transition hover:border-white/20"
                title={preset.description}
              >
                {preset.studentName} ({preset.id === 'preset_balanced' ? 'High Logic' : preset.id === 'preset_rushed' ? 'No Reason' : 'Fallacy'})
              </button>
            ))}
          </div>
        </div>

        {/* Questions list */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {questions.map((q, idx) => {
            const currentAns = answers[q.id]?.answer || '';
            const currentReasoning = answers[q.id]?.reasoning || '';
            const theme = getCategoryTheme(q.category);

            return (
              <div
                key={q.id}
                className="bg-zinc-950/70 border border-white/[0.07] rounded-xl p-4 sm:p-5 hover:border-white/[0.12] transition-all duration-200"
              >
                {/* Question header */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-zinc-500 font-bold">
                      [{String(idx + 1).padStart(2, '0')}]
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border font-mono ${theme.pill}`}
                    >
                      {q.categoryTitle}
                    </span>
                  </div>
                </div>

                {/* Prompt */}
                <p className="text-xs sm:text-sm text-zinc-200 font-medium leading-relaxed mb-4">
                  {q.question}
                </p>

                {/* Dual Input: Answer & Reasoning */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                      Final Answer <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={currentAns}
                      onChange={(e) => handleAnswerChange(q.id, 'answer', e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                          handleSubmit(e);
                        }
                      }}
                      placeholder="Enter student answer... (Ctrl+Enter to run)"
                      className="w-full bg-zinc-900/80 border border-white/[0.08] focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 rounded-xl p-2.5 text-xs text-zinc-100 placeholder:text-zinc-600 transition resize-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                      Reasoning Trace (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={currentReasoning}
                      onChange={(e) => handleAnswerChange(q.id, 'reasoning', e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                          handleSubmit(e);
                        }
                      }}
                      placeholder="Explain mental steps... (Ctrl+Enter to run)"
                      className="w-full bg-zinc-900/80 border border-white/[0.08] focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 rounded-xl p-2.5 text-xs text-zinc-100 placeholder:text-zinc-600 transition resize-none font-mono"
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Launch Action Bar */}
          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/[0.06]">
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
              <CornerDownLeft className="w-3.5 h-3.5 text-zinc-400" />
              <span>Tip: Press Ctrl + Enter from any field to run</span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onReset}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-white/[0.06] transition"
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={isEvaluating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 transition active:scale-[0.98] disabled:opacity-50"
              >
                {isEvaluating ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Run Multi-Agent Assessment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
