'use client';

import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  User,
  GraduationCap,
  Wand2,
  Play,
  CornerDownLeft,
  Lightbulb,
} from 'lucide-react';
import {
  BLOOM_LEVELS,
  BloomLevel,
  MAX_QUESTION_COUNT,
  MIN_QUESTION_COUNT,
  Question,
  StudentAnswer,
} from '@/types/assessment';
import { SAMPLE_STUDENT_PRESETS } from '@/lib/samplePresets';

interface AssessmentWorkflowProps {
  questions: Question[];
  assessmentId: string | null;
  requestError: string | null;
  studentName: string;
  setStudentName: (name: string) => void;
  gradeLevel: string;
  setGradeLevel: (grade: string) => void;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  setDifficulty: (difficulty: 'beginner' | 'intermediate' | 'advanced') => void;
  focusArea: string;
  setFocusArea: (focusArea: string) => void;
  questionCount: number;
  setQuestionCount: (count: number) => void;
  targetBloomLevels: BloomLevel[];
  setTargetBloomLevels: (levels: BloomLevel[]) => void;
  onGenerateQuestions: (params: {
    gradeLevel: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    focusArea: string;
    questionCount: number;
    targetBloomLevels: BloomLevel[];
  }) => Promise<void>;
  onSubmitAssessment: (params: {
    studentName: string;
    gradeLevel: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    focusArea: string;
    questionCount: number;
    targetBloomLevels: BloomLevel[];
    questions: Question[];
    studentAnswers: StudentAnswer[];
  }) => Promise<void>;
  isGeneratingQuestions: boolean;
  isEvaluating: boolean;
  onReset: () => void;
}

export const AssessmentWorkflow: React.FC<AssessmentWorkflowProps> = ({
  questions,
  assessmentId,
  requestError,
  studentName,
  setStudentName,
  gradeLevel,
  setGradeLevel,
  difficulty,
  setDifficulty,
  focusArea,
  setFocusArea,
  questionCount,
  setQuestionCount,
  targetBloomLevels,
  setTargetBloomLevels,
  onGenerateQuestions,
  onSubmitAssessment,
  isGeneratingQuestions,
  isEvaluating,
  onReset,
}) => {
  // Answers state
  const [answers, setAnswers] = useState<Record<string, { answer: string; reasoning: string }>>({});

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      if (!assessmentId) {
        setAnswers({});
        return;
      }

      const storedAnswers = localStorage.getItem(`assessment_answers_${assessmentId}`);
      if (!storedAnswers) {
        setAnswers({});
        return;
      }

      try {
        const parsed: unknown = JSON.parse(storedAnswers);
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          setAnswers(parsed as Record<string, { answer: string; reasoning: string }>);
        } else {
          throw new Error('Invalid answer draft.');
        }
      } catch {
        localStorage.removeItem(`assessment_answers_${assessmentId}`);
        setAnswers({});
      }
    });

    return () => {
      active = false;
    };
  }, [assessmentId]);

  useEffect(() => {
    if (!assessmentId) return;
    localStorage.setItem(`assessment_details_${assessmentId}`, JSON.stringify({
      studentName,
      gradeLevel,
      difficulty,
      focusArea,
      questionCount,
      targetBloomLevels,
    }));
  }, [assessmentId, studentName, gradeLevel, difficulty, focusArea, questionCount, targetBloomLevels]);

  const handleAnswerChange = (qId: string, field: 'answer' | 'reasoning', value: string) => {
    setAnswers((prev) => {
      const updated = {
      ...prev,
      [qId]: {
        ...prev[qId],
        [field]: value,
      },
      };
      if (assessmentId) {
        localStorage.setItem(`assessment_answers_${assessmentId}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const applyPreset = (presetId: string) => {
    const preset = SAMPLE_STUDENT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setStudentName(preset.studentName);

    const updatedAnswers: Record<string, { answer: string; reasoning: string }> = {};

    questions.forEach((q) => {
      const isAnswerOnly = preset.id === 'preset_rushed';
      const isFlawed = preset.id === 'preset_flawed';
      updatedAnswers[q.id] = {
        answer: isFlawed
          ? 'There is not enough information to determine a solution.'
          : q.expectedAnswer,
        reasoning: isAnswerOnly
          ? ''
          : isFlawed
            ? 'I made a quick guess without checking each condition.'
            : q.explanation,
      };
    });

    setAnswers(updatedAnswers);
    if (assessmentId) {
      localStorage.setItem(`assessment_answers_${assessmentId}`, JSON.stringify(updatedAnswers));
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isGeneratingQuestions || isEvaluating) return;

    const formattedAnswers: StudentAnswer[] = questions.map((q) => ({
      questionId: q.id,
      answer: answers[q.id]?.answer || '',
      reasoning: answers[q.id]?.reasoning || '',
    }));

    onSubmitAssessment({
      studentName,
      gradeLevel,
      difficulty,
      focusArea,
      questionCount,
      targetBloomLevels,
      questions,
      studentAnswers: formattedAnswers,
    });
  };

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'logical_reasoning':
        return {
          pill: 'bg-blue-50 text-blue-700 border-blue-200',
          numberBg: 'bg-blue-100 text-blue-800',
        };
      case 'pattern_recognition':
        return {
          pill: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          numberBg: 'bg-indigo-100 text-indigo-800',
        };
      case 'problem_solving':
        return {
          pill: 'bg-amber-50 text-amber-800 border-amber-200',
          numberBg: 'bg-amber-100 text-amber-900',
        };
      default:
        return {
          pill: 'bg-slate-100 text-slate-700 border-slate-200',
          numberBg: 'bg-slate-200 text-slate-800',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Configuration Strip Card */}
      <div className="pro-card rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center font-mono">
                01
              </span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Assessment Parameters</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Set candidate information, cohort complexity, or generate fresh reasoning items.
            </p>
          </div>

          <button
            type="button"
            disabled={
              isGeneratingQuestions ||
              isEvaluating ||
              targetBloomLevels.length === 0 ||
              targetBloomLevels.length > questionCount
            }
            onClick={() => onGenerateQuestions({
              gradeLevel,
              difficulty,
              focusArea,
              questionCount,
              targetBloomLevels,
            })}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition disabled:opacity-50"
          >
            {isGeneratingQuestions ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Designing Items...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Regenerate Questions (Agent 1)</span>
              </>
            )}
          </button>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-5">
          {/* Candidate Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Candidate Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Candidate Full Name"
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 font-medium transition placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Academic Level */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Academic Cohort
            </label>
            <div className="relative">
              <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 font-medium transition cursor-pointer"
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
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Difficulty Level
            </label>
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              {(['beginner', 'intermediate', 'advanced'] as const).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setDifficulty(diff)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg capitalize transition ${
                    difficulty === diff
                      ? 'bg-white text-blue-700 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Topic / Focus Area
            </label>
            <input
              type="text"
              value={focusArea}
              onChange={(event) => setFocusArea(event.target.value)}
              maxLength={200}
              className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium transition"
            />
          </div>

          <div>
            <label htmlFor="question-count" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Number of Questions
            </label>
            <select
              id="question-count"
              value={questionCount}
              onChange={(event) => setQuestionCount(Number(event.target.value))}
              disabled={isGeneratingQuestions || isEvaluating}
              className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium transition cursor-pointer"
            >
              {Array.from({ length: MAX_QUESTION_COUNT - MIN_QUESTION_COUNT + 1 }, (_, index) => {
                const count = MIN_QUESTION_COUNT + index;
                return (
                  <option key={count} value={count} disabled={count < targetBloomLevels.length}>
                    {count} questions
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <fieldset className="mt-5">
          <legend className="block text-xs font-semibold text-slate-700 mb-1.5">Target Bloom Levels</legend>
          <p className="text-[11px] text-slate-500 mb-3">
            Every selected level appears at least once. Scores need two answered items per level; choose 12 questions to target all six levels with two items each.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {BLOOM_LEVELS.map((level) => {
              const checked = targetBloomLevels.includes(level);
              const disableAdding = !checked && targetBloomLevels.length >= questionCount;
              const disableRemoving = checked && targetBloomLevels.length === 1;
              return (
                <label
                  key={level}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs capitalize ${
                    checked ? 'border-blue-300 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-700'
                  } ${disableAdding ? 'opacity-50' : 'cursor-pointer'}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={isGeneratingQuestions || isEvaluating || disableAdding || disableRemoving}
                    onChange={() => {
                      setTargetBloomLevels(
                        checked
                          ? targetBloomLevels.filter((selected) => selected !== level)
                          : [...targetBloomLevels, level],
                      );
                    }}
                    className="accent-blue-600"
                  />
                  {level}
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>

      {/* 2. Questions & Response Input Card */}
      <div className="pro-card rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-200 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center font-mono">
                02
              </span>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Student Responses</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Input answers and reasoning steps, or choose a quick sample profile.
            </p>
          </div>

          {/* Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              Quick Fill:
            </span>
            {SAMPLE_STUDENT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  preset.id === 'preset_balanced'
                    ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                    : preset.id === 'preset_rushed'
                    ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                }`}
                title={preset.description}
              >
                {preset.studentName} ({preset.id === 'preset_balanced' ? 'High Logic' : preset.id === 'preset_rushed' ? 'Answers Only' : 'Common Flaws'})
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
                className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition"
              >
                {/* Question header */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-md font-bold text-xs flex items-center justify-center font-mono ${theme.numberBg}`}>
                      {idx + 1}
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${theme.pill}`}>
                      {q.categoryTitle}
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white text-slate-600 border border-slate-200 capitalize">
                      {q.bloomLevel}
                    </span>
                    {q.source === 'demo' && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-orange-50 text-orange-800 border border-orange-200">
                        Demo item
                      </span>
                    )}
                  </div>
                </div>

                {/* Prompt */}
                <p className="text-sm font-medium text-slate-900 leading-relaxed mb-4">
                  {q.question}
                </p>

                {/* Dual Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Final Answer <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={currentAns}
                      onChange={(e) => handleAnswerChange(q.id, 'answer', e.target.value)}
                      disabled={isGeneratingQuestions || isEvaluating}
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                          handleSubmit(e);
                        }
                      }}
                      placeholder="Enter student answer... (Ctrl+Enter to run)"
                      className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl p-3 text-xs text-slate-900 transition resize-none placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Reasoning / Thought Process (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={currentReasoning}
                      onChange={(e) => handleAnswerChange(q.id, 'reasoning', e.target.value)}
                      disabled={isGeneratingQuestions || isEvaluating}
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                          handleSubmit(e);
                        }
                      }}
                      placeholder="Explain logic or steps... (Ctrl+Enter to run)"
                      className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl p-3 text-xs text-slate-900 transition resize-none placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Action Bar */}
          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-200">
            {requestError && (
              <p role="alert" className="text-xs font-medium text-rose-700">
                {requestError}
              </p>
            )}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <CornerDownLeft className="w-3.5 h-3.5 text-slate-400" />
              <span>Press <strong>Ctrl + Enter</strong> to submit directly from any field</span>
            </div>
            <p role="status" className="text-[11px] text-slate-500">
              Draft responses save in this browser as you type; the server saves them to this assessment before evaluation.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onReset}
                disabled={isGeneratingQuestions || isEvaluating}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition disabled:opacity-50"
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={isGeneratingQuestions || isEvaluating}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition active:scale-[0.98] disabled:opacity-50"
              >
                {isEvaluating ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Executing Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
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
