'use client';

import React from 'react';
import { AssessmentWorkflow } from '@/components/AssessmentWorkflow';
import { useAssessment } from '@/context/AssessmentContext';
import { Sparkles, Info, Brain, Layers } from 'lucide-react';

export default function HomePage() {
  const {
    questions,
    generateQuestions,
    startAssessment,
    isGeneratingQuestions,
    isEvaluating,
    hasServerGroqKey,
    setIsApiKeyModalOpen,
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
    resetAssessment,
  } = useAssessment();

  const isGroqConnected = hasServerGroqKey;

  return (
    <div className="assessment-workspace relative isolate -mx-2 space-y-5 rounded-[2rem] p-3 sm:-mx-3 sm:p-5 lg:p-6">
      <header className="assessment-hero relative isolate overflow-hidden rounded-[1.75rem] border border-blue-950/20 px-5 py-6 text-white shadow-xl shadow-blue-950/10 sm:px-8 sm:py-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-28 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 left-1/3 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-100">
              <Sparkles className="h-3.5 w-3.5" />
              Step 01 · Assessment workspace
            </div>
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
              Build a clearer picture of how a student thinks.
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-blue-100/90 sm:text-base">
              Set the learning context, prepare reasoning questions, and capture the thinking behind each answer before the agents begin.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 lg:min-w-64">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-sm">
              <Brain className="mb-2 h-4 w-4 text-cyan-200" />
              <p className="text-lg font-bold leading-none">3</p>
              <p className="mt-1 text-xs text-blue-100">Reasoning domains</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-sm">
              <Layers className="mb-2 h-4 w-4 text-violet-200" />
              <p className="text-lg font-bold leading-none">6</p>
              <p className="mt-1 text-xs text-blue-100">Thinking levels</p>
            </div>
          </div>
        </div>
      </header>

      {!isGroqConnected && (
        <button
          type="button"
          onClick={() => setIsApiKeyModalOpen(true)}
          className="flex w-full items-center gap-3 rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 p-3.5 text-left text-orange-900 shadow-xs transition hover:border-orange-300 hover:shadow-sm"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-orange-600 shadow-xs">
            <Info className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-bold">Demo Mode Active</span>
            <span className="mt-0.5 block text-xs text-orange-800">Configure a Groq API key to use live agent responses.</span>
          </span>
          <span className="hidden text-xs font-semibold text-orange-800 sm:block">Configure</span>
        </button>
      )}

      {/* Main Workflow Form */}
      <AssessmentWorkflow
        questions={questions}
        assessmentId={assessmentId}
        requestError={requestError}
        studentName={studentName}
        setStudentName={setStudentName}
        gradeLevel={gradeLevel}
        setGradeLevel={setGradeLevel}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        focusArea={focusArea}
        setFocusArea={setFocusArea}
        questionCount={questionCount}
        setQuestionCount={setQuestionCount}
        targetBloomLevels={targetBloomLevels}
        setTargetBloomLevels={setTargetBloomLevels}
        onGenerateQuestions={generateQuestions}
        onSubmitAssessment={startAssessment}
        isGeneratingQuestions={isGeneratingQuestions}
        isEvaluating={isEvaluating}
        onReset={resetAssessment}
      />
    </div>
  );
}
