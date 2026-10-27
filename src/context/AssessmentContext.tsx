'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AgentId,
  AgentLogEntry,
  AgentStatus,
  FinalAssessmentReport,
  Question,
  StudentAnswer,
} from '@/types/assessment';
import { getSimulatedQuestions } from '@/lib/agents/designer';

interface AssessmentContextType {
  // Config & State
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  studentName: string;
  setStudentName: (name: string) => void;
  gradeLevel: string;
  setGradeLevel: (grade: string) => void;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  setDifficulty: (diff: 'beginner' | 'intermediate' | 'advanced') => void;
  focusArea: string;
  setFocusArea: (focus: string) => void;

  // Agent Execution
  isEvaluating: boolean;
  isGeneratingQuestions: boolean;
  logs: AgentLogEntry[];
  clearLogs: () => void;
  agentStatuses: Record<AgentId, AgentStatus>;
  agentExecutionTimes: Record<AgentId, number | undefined>;
  agentActivities: Record<AgentId, string | undefined>;
  agentPayloads: Record<AgentId, { input?: any; output?: any; executionTimeMs?: number }>;

  // Report
  report: FinalAssessmentReport | null;
  history: FinalAssessmentReport[];
  loadReportFromHistory: (assessmentId: string) => void;

  // Actions
  generateQuestions: (params: {
    gradeLevel: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    focusArea: string;
  }) => Promise<void>;
  startAssessment: (params: {
    studentName: string;
    gradeLevel: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    questions: Question[];
    studentAnswers: StudentAnswer[];
  }) => Promise<void>;
  resetAssessment: () => void;

  // Inspection
  inspectingAgentId: AgentId | null;
  setInspectingAgentId: (id: AgentId | null) => void;
  isApiKeyModalOpen: boolean;
  setIsApiKeyModalOpen: (open: boolean) => void;
  isArchitectureModalOpen: boolean;
  setIsArchitectureModalOpen: (open: boolean) => void;
  hasServerGroqKey: boolean;
  clientGroqKey: string;
  saveClientGroqKey: (key: string) => void;
}

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

export const AssessmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();

  // Basic Config
  const [questions, setQuestions] = useState<Question[]>(getSimulatedQuestions('intermediate'));
  const [studentName, setStudentName] = useState('Maya Chen');
  const [gradeLevel, setGradeLevel] = useState('High School');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [focusArea, setFocusArea] = useState('Deductive Logic & Pattern Analysis');

  // Agent State
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [logs, setLogs] = useState<AgentLogEntry[]>([]);
  const [agentStatuses, setAgentStatuses] = useState<Record<AgentId, AgentStatus>>({
    orchestrator: 'idle',
    designer: 'idle',
    analyzer: 'idle',
    coach: 'idle',
  });
  const [agentExecutionTimes, setAgentExecutionTimes] = useState<Record<AgentId, number | undefined>>({
    orchestrator: undefined,
    designer: undefined,
    analyzer: undefined,
    coach: undefined,
  });
  const [agentActivities, setAgentActivities] = useState<Record<AgentId, string | undefined>>({
    orchestrator: 'Ready to coordinate pipeline',
    designer: 'Reasoning question formulator on standby',
    analyzer: 'Awaiting student answers for cognitive diagnosis',
    coach: 'Awaiting analyzer findings for coaching roadmap',
  });
  const [agentPayloads, setAgentPayloads] = useState<Record<AgentId, { input?: any; output?: any; executionTimeMs?: number }>>({
    orchestrator: {},
    designer: {},
    analyzer: {},
    coach: {},
  });

  // Report & History
  const [report, setReport] = useState<FinalAssessmentReport | null>(null);
  const [history, setHistory] = useState<FinalAssessmentReport[]>([]);

  // Modals & Keys
  const [inspectingAgentId, setInspectingAgentId] = useState<AgentId | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState(false);
  const [hasServerGroqKey, setHasServerGroqKey] = useState(false);
  const [clientGroqKey, setClientGroqKey] = useState('');

  // Initial Load from localStorage & Server
  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setHasServerGroqKey(data.hasGroqKey))
      .catch(() => {});

    const storedKey = localStorage.getItem('user_groq_api_key');
    if (storedKey) setClientGroqKey(storedKey);

    const storedReport = localStorage.getItem('latest_cognitive_report');
    if (storedReport) {
      try {
        setReport(JSON.parse(storedReport));
      } catch {}
    }

    const storedHistory = localStorage.getItem('cognitive_assessment_history');
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory));
      } catch {}
    }
  }, []);

  const saveClientGroqKey = (key: string) => {
    setClientGroqKey(key);
    if (key) {
      localStorage.setItem('user_groq_api_key', key);
    } else {
      localStorage.removeItem('user_groq_api_key');
    }
  };

  const clearLogs = () => setLogs([]);

  // Generate Questions via Agent 1
  const generateQuestions = async (params: {
    gradeLevel: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    focusArea: string;
  }) => {
    setIsGeneratingQuestions(true);
    setAgentStatuses((prev) => ({ ...prev, designer: 'running' }));
    setAgentActivities((prev) => ({ ...prev, designer: 'Formulating 3 reasoning questions...' }));

    const startTimestamp = Date.now();

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (clientGroqKey) {
        headers['x-groq-api-key'] = clientGroqKey;
      }

      const res = await fetch('/api/assessment/generate-questions', {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });

      const data = await res.json();
      const elapsed = Date.now() - startTimestamp;

      if (data.success && data.questions) {
        setQuestions(data.questions);
        setAgentStatuses((prev) => ({ ...prev, designer: 'completed' }));
        setAgentExecutionTimes((prev) => ({ ...prev, designer: data.executionTimeMs || elapsed }));
        setAgentActivities((prev) => ({ ...prev, designer: `Created 3 questions in ${data.executionTimeMs || elapsed}ms` }));
        setAgentPayloads((prev) => ({
          ...prev,
          designer: {
            input: params,
            output: { questions: data.questions },
            executionTimeMs: data.executionTimeMs || elapsed,
          },
        }));
      }
    } catch {
      setAgentStatuses((prev) => ({ ...prev, designer: 'error' }));
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Start Multi-Agent Assessment Pipeline (Navigates to /processing with animation!)
  const startAssessment = async (params: {
    studentName: string;
    gradeLevel: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    questions: Question[];
    studentAnswers: StudentAnswer[];
  }) => {
    setStudentName(params.studentName);
    setIsEvaluating(true);
    setReport(null);
    setLogs([]);

    // Immediately route to /processing page!
    router.push('/processing');

    setAgentStatuses({
      orchestrator: 'running',
      designer: 'completed',
      analyzer: 'waiting',
      coach: 'waiting',
    });
    setAgentActivities({
      orchestrator: 'Coordinating multi-agent workflow...',
      designer: 'Questions formulated',
      analyzer: 'Queued to diagnose answers',
      coach: 'Queued to build coaching roadmap',
    });

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (clientGroqKey) {
        headers['x-groq-api-key'] = clientGroqKey;
      }

      const res = await fetch('/api/assessment/stream', {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });

      if (!res.ok || !res.body) {
        throw new Error('Failed to initiate agent stream');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const rawEvent of events) {
          if (!rawEvent.trim()) continue;

          const lines = rawEvent.split('\n');
          let eventName = '';
          let dataStr = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventName = line.substring(7).trim();
            } else if (line.startsWith('data: ')) {
              dataStr = line.substring(6).trim();
            }
          }

          if (eventName && dataStr) {
            try {
              const data = JSON.parse(dataStr);

              if (eventName === 'status') {
                setAgentStatuses((prev) => ({ ...prev, [data.agentId]: data.status }));
                if (data.status === 'running') {
                  setAgentActivities((prev) => ({ ...prev, [data.agentId]: 'Executing LLM inference...' }));
                } else if (data.status === 'completed') {
                  setAgentActivities((prev) => ({ ...prev, [data.agentId]: 'Finished task successfully' }));
                }
              } else if (eventName === 'log') {
                setLogs((prev) => [...prev, data]);
              } else if (eventName === 'complete') {
                const finalReport: FinalAssessmentReport = data;
                setReport(finalReport);
                localStorage.setItem('latest_cognitive_report', JSON.stringify(finalReport));

                // Save to history
                setHistory((prev) => {
                  const updated = [finalReport, ...prev.filter((h) => h.assessmentId !== finalReport.assessmentId)].slice(0, 10);
                  localStorage.setItem('cognitive_assessment_history', JSON.stringify(updated));
                  return updated;
                });

                setAgentStatuses({
                  orchestrator: 'completed',
                  designer: 'completed',
                  analyzer: 'completed',
                  coach: 'completed',
                });
                setAgentActivities({
                  orchestrator: 'Report synthesized and ready',
                  designer: '3 items calibrated',
                  analyzer: `Analyzed (Score: ${finalReport.overallScore})`,
                  coach: 'Personalized practice plan generated',
                });

                setAgentPayloads({
                  orchestrator: {
                    input: { studentName: params.studentName, questionsCount: params.questions.length },
                    output: finalReport.orchestratorSynthesis,
                  },
                  designer: { output: finalReport.designerOutput },
                  analyzer: {
                    input: { questions: params.questions, studentAnswers: params.studentAnswers },
                    output: finalReport.analyzerOutput,
                  },
                  coach: {
                    input: finalReport.analyzerOutput,
                    output: finalReport.coachOutput,
                  },
                });
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    } catch (err: any) {
      setLogs((prev) => [
        ...prev,
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          agentId: 'orchestrator',
          agentName: 'Orchestrator Agent',
          level: 'error',
          message: err?.message || 'Error occurred during assessment',
        },
      ]);
    } finally {
      setIsEvaluating(false);
    }
  };

  const resetAssessment = () => {
    setReport(null);
    setAgentStatuses({
      orchestrator: 'idle',
      designer: 'idle',
      analyzer: 'idle',
      coach: 'idle',
    });
    router.push('/');
  };

  const loadReportFromHistory = (assessmentId: string) => {
    const item = history.find((h) => h.assessmentId === assessmentId);
    if (item) {
      setReport(item);
      router.push('/report');
    }
  };

  return (
    <AssessmentContext.Provider
      value={{
        questions,
        setQuestions,
        studentName,
        setStudentName,
        gradeLevel,
        setGradeLevel,
        difficulty,
        setDifficulty,
        focusArea,
        setFocusArea,
        isEvaluating,
        isGeneratingQuestions,
        logs,
        clearLogs,
        agentStatuses,
        agentExecutionTimes,
        agentActivities,
        agentPayloads,
        report,
        history,
        loadReportFromHistory,
        generateQuestions,
        startAssessment,
        resetAssessment,
        inspectingAgentId,
        setInspectingAgentId,
        isApiKeyModalOpen,
        setIsApiKeyModalOpen,
        isArchitectureModalOpen,
        setIsArchitectureModalOpen,
        hasServerGroqKey,
        clientGroqKey,
        saveClientGroqKey,
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
};

export const useAssessment = () => {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return context;
};
