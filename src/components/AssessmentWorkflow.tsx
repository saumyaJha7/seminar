'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  User,
  GraduationCap,
  Sliders,
  HelpCircle,
  Lightbulb,
  FileQuestion,
  Wand2,
  CheckCircle,
  Play,
  RotateCcw,
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
  const [studentName, setStudentName] = useState('Alex Mercer');
  const [gradeLevel, setGradeLevel] = useState('High School');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [focusArea, setFocusArea] = useState('Logical & Pattern Reasoning');

  // Answers state
  const [answers, setAnswers] = useState<Record<string, { answer: string; reasoning: string }>>({
    q1_logical: { answer: '', reasoning: '' },
    q2_pattern: { answer: '', reasoning: '' },
    q3_problem_solving: { answer: '', reasoning: '' },
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
      {/* Step 1: Configuration & Question Generation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 mb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center border border-indigo-500/30">
              1
            </span>
            <h2 className="text-base font-semibold text-white">Student & Assessment Setup</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure target difficulty and generate customized reasoning items using Agent 1 (Assessment Designer).
          </p>
        </div>

        {/* Form controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Student Name</label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Student Name"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Grade Level</label>
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="Middle School">Middle School</option>
              <option value="High School">High School</option>
              <option value="Undergraduate">Undergraduate / College</option>
              <option value="Adult Learner">Adult Analytical</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate (Standard)</option>
              <option value="advanced">Advanced (Deep Logic)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isGeneratingQuestions || isEvaluating}
            onClick={() => onGenerateQuestions({ gradeLevel, difficulty, focusArea })}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 transition disabled:opacity-50"
          >
            {isGeneratingQuestions ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Designing Items...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5" />
                <span>Generate New Questions</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Step 2: Questions & Answers Form */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800/80 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center border border-indigo-500/30">
                2
              </span>
              <h3 className="text-base font-semibold text-white">Student Response Input</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Input student answers, or use quick presets to test different cognitive response behaviors.
            </p>
          </div>

          {/* Quick Presets Dropdown / Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              Quick Fill:
            </span>
            {SAMPLE_STUDENT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition"
                title={preset.description}
              >
                {preset.studentName} ({preset.id === 'preset_balanced' ? 'High Logic' : preset.id === 'preset_rushed' ? 'Final Ans Only' : 'Fallacy Trap'})
              </button>
            ))}
          </div>
        </div>

        {/* Question Cards Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {questions.map((q, idx) => {
            const currentAns = answers[q.id]?.answer || '';
            const currentReasoning = answers[q.id]?.reasoning || '';

            return (
              <div
                key={q.id}
                className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition"
              >
                {/* Question Header */}
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-300 font-mono text-xs flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {q.categoryTitle}
                    </span>
                  </div>
                </div>

                {/* Question Prompt */}
                <p className="text-sm font-medium text-slate-100 leading-relaxed mb-4">
                  {q.question}
                </p>

                {/* Answer Inputs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Final Answer */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Student Final Answer <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={currentAns}
                      onChange={(e) => handleAnswerChange(q.id, 'answer', e.target.value)}
                      placeholder="e.g. Yes, Dr. Miller is a physicist..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition resize-none"
                    />
                  </div>

                  {/* Student Reasoning */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Reasoning / Thought Process (Optional for deeper diagnosis)
                    </label>
                    <textarea
                      rows={2}
                      value={currentReasoning}
                      onChange={(e) => handleAnswerChange(q.id, 'reasoning', e.target.value)}
                      placeholder="e.g. I deduced this because premise A implies..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition resize-none"
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Form Actions */}
          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-800">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <span>Agent 2 (Analyzer) & Agent 3 (Coach) will process these responses via Orchestrator.</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onReset}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition"
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={isEvaluating}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 transition disabled:opacity-50"
              >
                {isEvaluating ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Running Multi-Agent Assessment...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Run Multi-Agent Cognitive Assessment</span>
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
