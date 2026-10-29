'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  AgentId,
  AgentLogEntry,
  AgentStatus,
  AssessmentLifecycleStatus,
  AssessmentMode,
  AssessmentProgressEvent,
  BloomLevel,
  BLOOM_LEVELS,
  DEFAULT_QUESTION_COUNT,
  FinalAssessmentReport,
  Question,
  StudentAnswer,
} from '@/types/assessment';
import { getSimulatedQuestions } from '@/lib/agents/designer';
import { parseQuestionGenerationConfig, validateGeneratedQuestions } from '@/lib/assessment-contracts';

interface AssessmentContextType {
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
  questionCount: number;
  setQuestionCount: (count: number) => void;
  targetBloomLevels: BloomLevel[];
  setTargetBloomLevels: (levels: BloomLevel[]) => void;
  assessmentId: string | null;
  assessmentMode: AssessmentMode | null;
  assessmentStatus: AssessmentLifecycleStatus | null;
  pauseRequested: boolean;
  requestError: string | null;
  progressEvents: AssessmentProgressEvent[];
  isEvaluating: boolean;
  isGeneratingQuestions: boolean;
  logs: AgentLogEntry[];
  clearLogs: () => void;
  agentStatuses: Record<AgentId, AgentStatus>;
  agentExecutionTimes: Record<AgentId, number | undefined>;
  agentActivities: Record<AgentId, string | undefined>;
  agentPayloads: Record<AgentId, { input?: unknown; output?: unknown; executionTimeMs?: number }>;
  report: FinalAssessmentReport | null;
  isRestoringSession: boolean;
  history: FinalAssessmentReport[];
  loadReportFromHistory: (assessmentId: string) => void;
  generateQuestions: (params: {
    gradeLevel: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    focusArea: string;
    questionCount: number;
    targetBloomLevels: BloomLevel[];
  }) => Promise<void>;
  startAssessment: (params: {
    studentName: string;
    gradeLevel: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    focusArea: string;
    questionCount: number;
    targetBloomLevels: BloomLevel[];
    questions: Question[];
    studentAnswers: StudentAnswer[];
  }) => Promise<void>;
  retryAssessment: () => Promise<void>;
  resumeAssessment: () => Promise<void>;
  requestAssessmentPause: () => Promise<void>;
  resetAssessment: () => Promise<void>;
  refreshAssessmentStatus: () => Promise<void>;
  inspectingAgentId: AgentId | null;
  setInspectingAgentId: (id: AgentId | null) => void;
  isApiKeyModalOpen: boolean;
  setIsApiKeyModalOpen: (open: boolean) => void;
  isArchitectureModalOpen: boolean;
  setIsArchitectureModalOpen: (open: boolean) => void;
  hasServerGroqKey: boolean;
}

interface AssessmentSnapshot {
  id: string;
  status: AssessmentLifecycleStatus;
  pauseRequested: boolean;
  mode: AssessmentMode;
  studentName: string;
  gradeLevel: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  focusArea: string;
  questionCount: number;
  targetBloomLevels: BloomLevel[];
  questions: Question[];
  report: FinalAssessmentReport | null;
  events: {
    id: string;
    timestamp: string;
    stage: string;
    status: 'waiting' | 'in_progress' | 'completed' | 'failed';
    message: string;
    agentId?: AgentId;
  }[];
}

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);
const ACTIVE_ASSESSMENT_KEY = 'active_assessment_id';

const defaultStatuses: Record<AgentId, AgentStatus> = {
  orchestrator: 'idle',
  designer: 'idle',
  analyzer: 'idle',
  coach: 'idle',
};

const defaultActivities: Record<AgentId, string | undefined> = {
  orchestrator: 'Ready to coordinate pipeline',
  designer: 'Reasoning question formulator on standby',
  analyzer: 'Awaiting student answers for evaluation',
  coach: 'Awaiting evaluation findings for coaching roadmap',
};

const agentNames: Record<AgentId, string> = {
  orchestrator: 'Orchestrator Agent',
  designer: 'Agent 1: Assessment Designer',
  analyzer: 'Agent 2: Cognitive Response Analyzer',
  coach: 'Agent 3: Feedback Coach',
};

const runningStatuses: AssessmentLifecycleStatus[] = [
  'queued',
  'generating_questions',
  'evaluating',
  'generating_report',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isLifecycleStatus(value: unknown): value is AssessmentLifecycleStatus {
  return [
    'queued',
    'generating_questions',
    'awaiting_answers',
    'evaluating',
    'generating_report',
    'paused',
    'completed',
    'failed',
  ].includes(String(value));
}

function isAgentId(value: unknown): value is AgentId {
  return value === 'orchestrator' || value === 'designer' || value === 'analyzer' || value === 'coach';
}

function isAssessmentSnapshot(value: unknown): value is AssessmentSnapshot {
  if (!isRecord(value) || !isLifecycleStatus(value.status)) return false;
  return (
    typeof value.id === 'string' &&
    (value.mode === 'groq' || value.mode === 'demo') &&
    typeof value.studentName === 'string' &&
    typeof value.gradeLevel === 'string' &&
    (value.difficulty === 'beginner' || value.difficulty === 'intermediate' || value.difficulty === 'advanced') &&
    typeof value.focusArea === 'string' &&
    typeof value.questionCount === 'number' &&
    typeof value.pauseRequested === 'boolean' &&
    parseQuestionGenerationConfig(value.questionCount, value.targetBloomLevels) !== null &&
    Array.isArray(value.questions) &&
    Array.isArray(value.events)
  );
}

export const AssessmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [questionCount, setQuestionCount] = useState(DEFAULT_QUESTION_COUNT);
  const [targetBloomLevels, setTargetBloomLevels] = useState<BloomLevel[]>([...BLOOM_LEVELS]);
  const [questions, setQuestions] = useState<Question[]>(
    getSimulatedQuestions('intermediate', DEFAULT_QUESTION_COUNT, [...BLOOM_LEVELS]),
  );
  const [studentName, setStudentName] = useState('Maya Chen');
  const [gradeLevel, setGradeLevel] = useState('High School');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [focusArea, setFocusArea] = useState('Deductive Logic & Pattern Analysis');
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [assessmentMode, setAssessmentMode] = useState<AssessmentMode | null>(null);
  const [assessmentStatus, setAssessmentStatus] = useState<AssessmentLifecycleStatus | null>(null);
  const [pauseRequested, setPauseRequested] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [progressEvents, setProgressEvents] = useState<AssessmentProgressEvent[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [logs, setLogs] = useState<AgentLogEntry[]>([]);
  const [agentStatuses, setAgentStatuses] = useState<Record<AgentId, AgentStatus>>(defaultStatuses);
  const [agentExecutionTimes, setAgentExecutionTimes] = useState<Record<AgentId, number | undefined>>({
    orchestrator: undefined,
    designer: undefined,
    analyzer: undefined,
    coach: undefined,
  });
  const [agentActivities, setAgentActivities] = useState<Record<AgentId, string | undefined>>(defaultActivities);
  const [agentPayloads, setAgentPayloads] = useState<Record<AgentId, { input?: unknown; output?: unknown; executionTimeMs?: number }>>({
    orchestrator: {},
    designer: {},
    analyzer: {},
    coach: {},
  });
  const [report, setReport] = useState<FinalAssessmentReport | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [history, setHistory] = useState<FinalAssessmentReport[]>([]);
  const [inspectingAgentId, setInspectingAgentId] = useState<AgentId | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState(false);
  const [hasServerGroqKey, setHasServerGroqKey] = useState(false);

  const loadAssessmentSnapshot = useCallback(async (id: string) => {
    const response = await fetch(`/api/assessments/${encodeURIComponent(id)}`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(response.status === 404 ? 'Saved assessment was not found.' : 'Unable to load saved assessment status.');
    }

    const payload: unknown = await response.json();
    if (!isRecord(payload) || !isAssessmentSnapshot(payload.assessment)) {
      throw new Error('Saved assessment status has an invalid format.');
    }
    const snapshot = payload.assessment;
    const savedQuestions = snapshot.questions.length > 0
      ? validateGeneratedQuestions(
          { questions: snapshot.questions },
          snapshot.difficulty,
          snapshot.focusArea,
          {
            questionCount: snapshot.questionCount,
            targetBloomLevels: snapshot.targetBloomLevels,
          },
        )
      : [];
    let savedDetails: Record<string, unknown> = {};
    const storedDetails = localStorage.getItem(`assessment_details_${snapshot.id}`);
    if (storedDetails) {
      try {
        const parsedDetails: unknown = JSON.parse(storedDetails);
        if (isRecord(parsedDetails)) savedDetails = parsedDetails;
        else localStorage.removeItem(`assessment_details_${snapshot.id}`);
      } catch {
        localStorage.removeItem(`assessment_details_${snapshot.id}`);
      }
    }

    setAssessmentId(snapshot.id);
    setAssessmentMode(snapshot.mode);
    setAssessmentStatus(snapshot.status);
    setPauseRequested(snapshot.pauseRequested);
    setProgressEvents(snapshot.events);
    setStudentName(
      typeof savedDetails.studentName === 'string' &&
        savedDetails.studentName.trim().length > 0 &&
        savedDetails.studentName.length <= 100
        ? savedDetails.studentName
        : snapshot.studentName || 'Maya Chen',
    );
    setGradeLevel(
      typeof savedDetails.gradeLevel === 'string' &&
        savedDetails.gradeLevel.trim().length > 0 &&
        savedDetails.gradeLevel.length <= 80
        ? savedDetails.gradeLevel
        : snapshot.gradeLevel,
    );
    setDifficulty(
      savedDetails.difficulty === 'beginner' ||
        savedDetails.difficulty === 'intermediate' ||
        savedDetails.difficulty === 'advanced'
        ? savedDetails.difficulty
        : snapshot.difficulty,
    );
    setFocusArea(
      typeof savedDetails.focusArea === 'string' &&
        savedDetails.focusArea.trim().length > 0 &&
        savedDetails.focusArea.length <= 200
        ? savedDetails.focusArea
        : snapshot.focusArea,
    );
    const restoredCount = snapshot.questions.length === 0 &&
      typeof savedDetails.questionCount === 'number' &&
      Number.isInteger(savedDetails.questionCount) &&
      savedDetails.questionCount >= 3 &&
      savedDetails.questionCount <= 12
        ? savedDetails.questionCount
        : snapshot.questionCount;
    const restoredTargets = snapshot.questions.length === 0 &&
      Array.isArray(savedDetails.targetBloomLevels) &&
      savedDetails.targetBloomLevels.length > 0 &&
      savedDetails.targetBloomLevels.length <= restoredCount &&
      savedDetails.targetBloomLevels.every((level) => (BLOOM_LEVELS as readonly unknown[]).includes(level)) &&
      new Set(savedDetails.targetBloomLevels).size === savedDetails.targetBloomLevels.length
        ? savedDetails.targetBloomLevels as BloomLevel[]
        : snapshot.targetBloomLevels;
    setQuestionCount(restoredCount);
    setTargetBloomLevels(restoredTargets);
    if (savedQuestions.length > 0) setQuestions(savedQuestions);
    setIsEvaluating(runningStatuses.includes(snapshot.status));
    setIsGeneratingQuestions(snapshot.status === 'generating_questions');

    const nextStatuses = { ...defaultStatuses };
    const nextActivities = { ...defaultActivities };
    const nextLogs: AgentLogEntry[] = [];
    for (const event of snapshot.events) {
      if (!isRecord(event) || typeof event.message !== 'string' || typeof event.timestamp !== 'string') continue;
      const agentId = isAgentId(event.agentId) ? event.agentId : 'orchestrator';
      const status = event.status === 'completed' ? 'completed' : event.status === 'failed' ? 'error' : event.status === 'in_progress' ? 'running' : 'waiting';
      nextStatuses[agentId] = status;
      nextActivities[agentId] = event.message;
      nextLogs.push({
        id: typeof event.id === 'string' ? event.id : `${event.timestamp}-${agentId}`,
        timestamp: event.timestamp,
        agentId,
        agentName: agentNames[agentId],
        level: status === 'completed' ? 'success' : status === 'error' ? 'error' : status === 'running' ? 'action' : 'info',
        message: event.message,
      });
    }
    if (snapshot.status === 'completed') {
      nextStatuses.orchestrator = 'completed';
      nextStatuses.designer = 'completed';
      nextStatuses.analyzer = 'completed';
      nextStatuses.coach = 'completed';
    } else if (snapshot.status === 'failed') {
      nextStatuses.orchestrator = 'error';
    } else if (runningStatuses.includes(snapshot.status)) {
      nextStatuses.orchestrator = 'running';
    }
    setAgentStatuses(nextStatuses);
    setAgentActivities(nextActivities);
    setLogs(nextLogs.slice(-100));

    if (snapshot.report) {
      setReport(snapshot.report);
      localStorage.setItem('latest_cognitive_report', JSON.stringify(snapshot.report));
      setHistory((previous) => {
        const updated = [
          snapshot.report as FinalAssessmentReport,
          ...previous.filter((item) => item.assessmentId !== snapshot.id),
        ].slice(0, 10);
        localStorage.setItem('cognitive_assessment_history', JSON.stringify(updated));
        return updated;
      });
    }

    return snapshot.status;
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/config', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to check server AI configuration.');
        return response.json();
      })
      .then((data: unknown) => {
        if (active && isRecord(data)) setHasServerGroqKey(data.hasGroqKey === true);
      })
      .catch(() => {
        if (active) setRequestError('Unable to check the server AI configuration.');
      });

    const storedReport = localStorage.getItem('latest_cognitive_report');
    if (storedReport) {
      try {
        const parsedReport = JSON.parse(storedReport) as FinalAssessmentReport;
        Promise.resolve().then(() => {
          if (active) setReport(parsedReport);
        });
      } catch {
        localStorage.removeItem('latest_cognitive_report');
        Promise.resolve().then(() => {
          if (active) setRequestError('The locally saved report could not be restored.');
        });
      }
    }

    const storedHistory = localStorage.getItem('cognitive_assessment_history');
    if (storedHistory) {
      try {
        const parsedHistory = JSON.parse(storedHistory) as FinalAssessmentReport[];
        Promise.resolve().then(() => {
          if (active) setHistory(parsedHistory);
        });
      } catch {
        localStorage.removeItem('cognitive_assessment_history');
        Promise.resolve().then(() => {
          if (active) setRequestError('Saved report history could not be restored.');
        });
      }
    }

    const storedAssessmentId = localStorage.getItem(ACTIVE_ASSESSMENT_KEY);
    if (storedAssessmentId) {
      Promise.resolve()
        .then(() => active ? loadAssessmentSnapshot(storedAssessmentId) : undefined)
        .catch((error: unknown) => {
          if (active) setRequestError(error instanceof Error ? error.message : 'Unable to restore the saved assessment.');
        })
        .finally(() => {
          if (active) setIsRestoringSession(false);
        });
    } else {
      Promise.resolve().then(() => {
        if (active) setIsRestoringSession(false);
      });
    }

    return () => {
      active = false;
    };
  }, [loadAssessmentSnapshot]);

  useEffect(() => {
    if (!assessmentId || !assessmentStatus || !runningStatuses.includes(assessmentStatus)) return;
    let active = true;
    const timer = window.setInterval(() => {
      loadAssessmentSnapshot(assessmentId).catch((error: unknown) => {
        if (active) setRequestError(error instanceof Error ? error.message : 'Unable to refresh assessment status.');
      });
    }, 2000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [assessmentId, assessmentStatus, loadAssessmentSnapshot]);

  useEffect(() => {
    if (assessmentStatus === 'completed' && pathname === '/processing') {
      router.replace('/report');
    } else if (
      ['queued', 'evaluating', 'generating_report', 'paused'].includes(assessmentStatus ?? '') &&
      pathname !== '/processing'
    ) {
      router.replace('/processing');
    } else if (assessmentStatus === 'awaiting_answers' && pathname === '/processing') {
      router.replace('/');
    }
  }, [assessmentStatus, pathname, router]);

  const clearLogs = () => setLogs([]);

  const generateQuestions = async (params: {
    gradeLevel: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    focusArea: string;
    questionCount: number;
    targetBloomLevels: BloomLevel[];
  }) => {
    setIsGeneratingQuestions(true);
    setRequestError(null);
    let draftId: string | null = null;
    setAgentStatuses((previous) => ({ ...previous, designer: 'running' }));
    setAgentActivities((previous) => ({ ...previous, designer: 'Generating and validating questions on the server.' }));

    try {
      if (assessmentId && assessmentStatus === 'awaiting_answers') {
        const deleteResponse = await fetch(`/api/assessments/${encodeURIComponent(assessmentId)}`, { method: 'DELETE' });
        if (!deleteResponse.ok) throw new Error('Unable to replace the saved question set.');
        localStorage.removeItem(`assessment_answers_${assessmentId}`);
        localStorage.removeItem(`assessment_details_${assessmentId}`);
      }

      const draftResponse = await fetch('/api/assessments/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const draftPayload: unknown = await draftResponse.json();
      if (
        !draftResponse.ok ||
        !isRecord(draftPayload) ||
        typeof draftPayload.assessmentId !== 'string' ||
        (draftPayload.mode !== 'demo' && draftPayload.mode !== 'groq')
      ) {
        throw new Error(isRecord(draftPayload) && typeof draftPayload.error === 'string'
          ? draftPayload.error
          : 'Unable to initialize question generation.');
      }
      draftId = draftPayload.assessmentId;
      setAssessmentId(draftId);
      setAssessmentMode(draftPayload.mode);
      setAssessmentStatus('generating_questions');
      localStorage.setItem(ACTIVE_ASSESSMENT_KEY, draftId);

      const response = await fetch('/api/assessment/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId: draftId }),
      });
      const payload: unknown = await response.json();
      if (!response.ok || !isRecord(payload) || payload.success !== true || !Array.isArray(payload.questions)) {
        const message = isRecord(payload) && typeof payload.error === 'string'
          ? payload.error
          : 'Question generation failed. Please retry.';
        throw new Error(message);
      }

      const generatedQuestions = validateGeneratedQuestions(
        { questions: payload.questions },
        params.difficulty,
        params.focusArea,
        { questionCount: params.questionCount, targetBloomLevels: params.targetBloomLevels },
      );
      if (typeof payload.assessmentId !== 'string' || (payload.mode !== 'demo' && payload.mode !== 'groq')) {
        throw new Error('The saved question set did not include a valid assessment ID.');
      }

      setQuestions(generatedQuestions);
      setAssessmentId(payload.assessmentId);
      setAssessmentMode(payload.mode);
      setAssessmentStatus('awaiting_answers');
      localStorage.setItem(ACTIVE_ASSESSMENT_KEY, payload.assessmentId);
      setAgentStatuses((previous) => ({ ...previous, designer: 'completed' }));
      setAgentExecutionTimes((previous) => ({
        ...previous,
        designer: typeof payload.executionTimeMs === 'number' ? payload.executionTimeMs : undefined,
      }));
      setAgentActivities((previous) => ({ ...previous, designer: 'Validated question set saved and ready.' }));
      setAgentPayloads((previous) => ({
        ...previous,
        designer: { input: params, output: { questions: generatedQuestions }, executionTimeMs: payload.executionTimeMs as number | undefined },
      }));
    } catch (error) {
      let message = error instanceof Error ? error.message : 'Question generation failed. Please retry.';
      if (draftId) {
        try {
          await loadAssessmentSnapshot(draftId);
        } catch (statusError) {
          message = `${message} Assessment status could not be refreshed: ${
            statusError instanceof Error ? statusError.message : 'unknown error'
          }`;
        }
      }
      setRequestError(message);
      setAgentStatuses((previous) => ({ ...previous, designer: 'error' }));
      setAgentActivities((previous) => ({ ...previous, designer: message }));
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const startAssessment = async (params: {
    studentName: string;
    gradeLevel: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    focusArea: string;
    questionCount: number;
    targetBloomLevels: BloomLevel[];
    questions: Question[];
    studentAnswers: StudentAnswer[];
  }) => {
    if (isEvaluating) return;
    setRequestError(null);
    const isResumingCheckpoint = assessmentStatus === 'paused' || assessmentStatus === 'failed';
    setStudentName(params.studentName);
    setGradeLevel(params.gradeLevel);
    setDifficulty(params.difficulty);
    setFocusArea(params.focusArea);
    setQuestionCount(params.questionCount);
    setTargetBloomLevels(params.targetBloomLevels);
    setReport(null);
    if (!isResumingCheckpoint) setLogs([]);
    setPauseRequested(false);

    try {
      let id = assessmentId;
      let status = assessmentStatus;
      if (id && status === 'awaiting_answers') {
        const answerResponse = await fetch(`/api/assessments/${encodeURIComponent(id)}/answers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentName: params.studentName,
            gradeLevel: params.gradeLevel,
            difficulty: params.difficulty,
            focusArea: params.focusArea,
            studentAnswers: params.studentAnswers,
          }),
        });
        const answerData: unknown = await answerResponse.json();
        if (!answerResponse.ok || !isRecord(answerData) || typeof answerData.assessmentId !== 'string') {
          throw new Error(isRecord(answerData) && typeof answerData.error === 'string' ? answerData.error : 'Unable to save student answers.');
        }
        status = 'queued';
      } else if (status === 'failed') {
        status = 'queued';
      } else if (!id || status === 'completed') {
        const idempotencyKey = localStorage.getItem('assessment_submission_key') ?? crypto.randomUUID();
        localStorage.setItem('assessment_submission_key', idempotencyKey);
        const createResponse = await fetch('/api/assessments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
          body: JSON.stringify({
            studentName: params.studentName,
            gradeLevel: params.gradeLevel,
            difficulty: params.difficulty,
            focusArea: params.focusArea,
            questionCount: params.questionCount,
            targetBloomLevels: params.targetBloomLevels,
            questions: params.questions,
            studentAnswers: params.studentAnswers,
          }),
        });
        const createData: unknown = await createResponse.json();
        if (!createResponse.ok || !isRecord(createData) || typeof createData.assessmentId !== 'string') {
          throw new Error(isRecord(createData) && typeof createData.error === 'string' ? createData.error : 'Unable to create assessment.');
        }
        id = createData.assessmentId;
        status = isLifecycleStatus(createData.status) ? createData.status : 'queued';
        setAssessmentMode(createData.mode === 'groq' ? 'groq' : 'demo');
        localStorage.removeItem('assessment_submission_key');
      }

      if (!id) throw new Error('The assessment could not be assigned an ID.');
      setAssessmentId(id);
      setAssessmentStatus(status === 'paused' ? 'evaluating' : status);
      localStorage.setItem(ACTIVE_ASSESSMENT_KEY, id);
      setIsEvaluating(true);
      setAgentStatuses((previous) =>
        isResumingCheckpoint
          ? { ...previous, orchestrator: 'running' }
          : { ...defaultStatuses, orchestrator: 'running', designer: 'completed' },
      );
      setAgentActivities((previous) =>
        isResumingCheckpoint
          ? { ...previous, orchestrator: 'Resuming from the last saved agent checkpoint.' }
          : {
              ...defaultActivities,
              orchestrator: 'Assessment ID created; response evaluation is starting.',
              designer: 'Validated questions saved',
            },
      );

      const response = await fetch('/api/assessment/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId: id }),
      });
      if (!response.ok || !response.body) {
        const errorPayload: unknown = await response.json().catch(() => null);
        throw new Error(
          isRecord(errorPayload) && typeof errorPayload.error === 'string'
            ? errorPayload.error
            : 'Unable to start assessment processing.',
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let completed = false;
      let failed = false;
      let paused = false;

      const handleEvent = (rawEvent: string) => {
        const lines = rawEvent.split('\n');
        const eventName = lines.find((line) => line.startsWith('event: '))?.slice(7).trim();
        const dataLine = lines.find((line) => line.startsWith('data: '))?.slice(6).trim();
        if (!eventName || !dataLine) return;
        const data: unknown = JSON.parse(dataLine);

        if (eventName === 'status' && isRecord(data) && isAgentId(data.agentId)) {
          const nextStatus: AgentStatus =
            data.status === 'completed' || data.status === 'running' || data.status === 'error' || data.status === 'waiting'
              ? data.status
              : 'waiting';
          setAgentStatuses((previous) => ({ ...previous, [data.agentId as AgentId]: nextStatus }));
        } else if (eventName === 'log' && isRecord(data) && isAgentId(data.agentId) && typeof data.message === 'string') {
          const entry = data as unknown as AgentLogEntry;
          setLogs((previous) => [...previous, entry]);
          setAgentActivities((previous) => ({ ...previous, [entry.agentId]: entry.message }));
        } else if (eventName === 'complete' && isRecord(data)) {
          const finalReport = data as unknown as FinalAssessmentReport;
          if (finalReport.assessmentId !== id || !finalReport.analyzerOutput || !finalReport.coachOutput) {
            throw new Error('The server returned an invalid final report.');
          }
          completed = true;
          setReport(finalReport);
          setAssessmentStatus('completed');
          setPauseRequested(false);
          setAssessmentMode(finalReport.mode);
          localStorage.setItem('latest_cognitive_report', JSON.stringify(finalReport));
          localStorage.removeItem(`assessment_answers_${id}`);
          localStorage.removeItem(`assessment_details_${id}`);
          setHistory((previous) => {
            const updated = [finalReport, ...previous.filter((item) => item.assessmentId !== finalReport.assessmentId)].slice(0, 10);
            localStorage.setItem('cognitive_assessment_history', JSON.stringify(updated));
            localStorage.removeItem(`assessment_details_${id}`);
            return updated;
          });
          setAgentStatuses({
            orchestrator: 'completed',
            designer: 'completed',
            analyzer: 'completed',
            coach: 'completed',
          });
          setAgentActivities({
            orchestrator: 'Report saved and ready to view.',
            designer: 'Validated question set',
            analyzer: `Response analysis complete (score: ${finalReport.overallScore}).`,
            coach: 'Personalized practice plan generated.',
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
            coach: { input: finalReport.analyzerOutput, output: finalReport.coachOutput },
          });
        } else if (eventName === 'paused') {
          paused = true;
          setAssessmentStatus('paused');
          setPauseRequested(false);
          setIsEvaluating(false);
          setProgressEvents((previous) => [
            ...previous,
            {
              id: `pause-${id}-${Date.now()}`,
              timestamp: new Date().toISOString(),
              stage: 'pause',
              status: 'completed',
              message: 'Execution paused safely. Resume to continue from the next agent checkpoint.',
            },
          ]);
          setAgentStatuses((previous) => ({ ...previous, orchestrator: 'waiting' }));
          setAgentActivities((previous) => ({
            ...previous,
            orchestrator: 'Execution paused safely. Resume to continue from the next agent.',
          }));
        } else if (eventName === 'error' && isRecord(data)) {
          failed = true;
          setAssessmentStatus('failed');
          setAgentStatuses((previous) => ({ ...previous, orchestrator: 'error' }));
          setRequestError(typeof data.message === 'string' ? data.message : 'Assessment processing failed.');
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';
        for (const event of events) handleEvent(event);
      }
      buffer += decoder.decode();
      if (buffer.trim()) handleEvent(buffer);
      if (!completed && !failed && !paused) {
        await loadAssessmentSnapshot(id);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Assessment processing failed.';
      setRequestError(message);
      setAssessmentStatus((previous) => previous === 'completed' ? previous : 'failed');
      setAgentStatuses((previous) => ({ ...previous, orchestrator: 'error' }));
    } finally {
      setIsEvaluating(false);
    }
  };

  const resetAssessment = async () => {
    if (assessmentId && assessmentStatus !== 'completed') {
      try {
        const response = await fetch(`/api/assessments/${encodeURIComponent(assessmentId)}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Unable to delete the unfinished assessment.');
        localStorage.removeItem(`assessment_answers_${assessmentId}`);
        localStorage.removeItem(`assessment_details_${assessmentId}`);
      } catch (error) {
        setRequestError(error instanceof Error ? error.message : 'Unable to delete the unfinished assessment.');
        return;
      }
    }

    if (assessmentId) {
      localStorage.removeItem(`assessment_answers_${assessmentId}`);
      localStorage.removeItem(`assessment_details_${assessmentId}`);
    }

    setReport(null);
    setAssessmentId(null);
    setAssessmentMode(null);
    setAssessmentStatus(null);
    setPauseRequested(false);
    setRequestError(null);
    setProgressEvents([]);
    setIsEvaluating(false);
    setIsGeneratingQuestions(false);
    setQuestions(getSimulatedQuestions(difficulty, questionCount, targetBloomLevels, focusArea));
    setAgentStatuses(defaultStatuses);
    setAgentActivities(defaultActivities);
    localStorage.removeItem(ACTIVE_ASSESSMENT_KEY);
    router.push('/');
  };

  const refreshAssessmentStatus = async () => {
    if (!assessmentId) return;
    try {
      await loadAssessmentSnapshot(assessmentId);
      setRequestError(null);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Unable to refresh assessment status.');
    }
  };

  const retryAssessment = async () => {
    if (!assessmentId || assessmentStatus !== 'failed') return;
    await startAssessment({
      studentName,
      gradeLevel,
      difficulty,
      focusArea,
      questionCount,
      targetBloomLevels,
      questions,
      studentAnswers: [],
    });
  };

  const resumeAssessment = async () => {
    if (!assessmentId || assessmentStatus !== 'paused') return;
    await startAssessment({
      studentName,
      gradeLevel,
      difficulty,
      focusArea,
      questionCount,
      targetBloomLevels,
      questions,
      studentAnswers: [],
    });
  };

  const requestAssessmentPause = async () => {
    if (!assessmentId || !isEvaluating || pauseRequested) return;
    setRequestError(null);
    try {
      const response = await fetch(
        `/api/assessments/${encodeURIComponent(assessmentId)}/pause`,
        { method: 'POST' },
      );
      const payload: unknown = await response.json();
      if (!response.ok || !isRecord(payload) || typeof payload.status !== 'string') {
        throw new Error(
          isRecord(payload) && typeof payload.error === 'string'
            ? payload.error
            : 'Unable to pause the assessment.',
        );
      }
      if (payload.status === 'paused') {
        setAssessmentStatus('paused');
        setIsEvaluating(false);
      } else {
        setPauseRequested(true);
      }
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Unable to pause the assessment.');
    }
  };

  const loadReportFromHistory = (id: string) => {
    const item = history.find((entry) => entry.assessmentId === id);
    if (item) {
      setReport(item);
      setAssessmentId(item.assessmentId);
      setAssessmentMode(item.mode);
      setAssessmentStatus('completed');
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
        questionCount,
        setQuestionCount,
        targetBloomLevels,
        setTargetBloomLevels,
        assessmentId,
        assessmentMode,
        assessmentStatus,
        pauseRequested,
        requestError,
        progressEvents,
        isEvaluating,
        isGeneratingQuestions,
        logs,
        clearLogs,
        agentStatuses,
        agentExecutionTimes,
        agentActivities,
        agentPayloads,
        report,
        isRestoringSession,
        history,
        loadReportFromHistory,
        generateQuestions,
        startAssessment,
        retryAssessment,
        resumeAssessment,
        requestAssessmentPause,
        resetAssessment,
        refreshAssessmentStatus,
        inspectingAgentId,
        setInspectingAgentId,
        isApiKeyModalOpen,
        setIsApiKeyModalOpen,
        isArchitectureModalOpen,
        setIsArchitectureModalOpen,
        hasServerGroqKey,
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
