export type QuestionCategory = 'logical_reasoning' | 'pattern_recognition' | 'problem_solving';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type AssessmentMode = 'groq' | 'demo';
export type AssessmentLifecycleStatus =
  | 'queued'
  | 'generating_questions'
  | 'awaiting_answers'
  | 'evaluating'
  | 'generating_report'
  | 'paused'
  | 'completed'
  | 'failed';
export type AssessmentEventStatus = 'waiting' | 'in_progress' | 'completed' | 'failed';
export const BLOOM_LEVELS = [
  'remember',
  'understand',
  'apply',
  'analyze',
  'evaluate',
  'create',
] as const;
export type BloomLevel = (typeof BLOOM_LEVELS)[number];
export const MIN_QUESTION_COUNT = 3;
export const MAX_QUESTION_COUNT = 12;
export const DEFAULT_QUESTION_COUNT = 6;

export interface RubricScoreBand {
  minScore: number;
  maxScore: number;
  label: string;
  criteria: string;
}

export interface EvaluationRubric {
  version: string;
  bloomLevel: BloomLevel;
  answerCriteria: string;
  reasoningCriteria: string;
  scoreBands: RubricScoreBand[];
}

export interface Question {
  id: string;
  category: QuestionCategory;
  categoryTitle: string;
  question: string;
  difficulty: Difficulty;
  bloomLevel: BloomLevel;
  evaluationRubric: EvaluationRubric;
  context?: string;
  expectedAnswer: string;
  explanation: string;
  topic?: string;
  source?: string;
}

export interface StudentAnswer {
  questionId: string;
  answer: string;
  reasoning?: string;
}

export interface AssessmentProgressEvent {
  id: string;
  timestamp: string;
  stage: string;
  status: AssessmentEventStatus;
  message: string;
  agentId?: AgentId;
}

export interface AssessmentRecord {
  id: string;
  idempotencyKey?: string;
  status: AssessmentLifecycleStatus;
  mode: AssessmentMode;
  createdAt: string;
  updatedAt: string;
  studentName: string;
  gradeLevel: string;
  difficulty: Difficulty;
  focusArea: string;
  questionCount: number;
  targetBloomLevels: BloomLevel[];
  questions: Question[];
  answers: StudentAnswer[];
  evaluations: QuestionEvaluation[];
  events: AssessmentProgressEvent[];
  report: FinalAssessmentReport | null;
  pipelineCheckpoint?: AssessmentPipelineCheckpoint;
  pauseRequested: boolean;
  failureStage?: string;
}

export interface AssessmentPipelineCheckpoint {
  nextStage: 'analyzer' | 'coach' | 'synthesis' | 'save_report';
  analysis?: CognitiveAnalysisResult;
  feedback?: FeedbackCoachResult;
  synthesis?: OrchestratorSynthesis;
}

export interface QuestionEvaluation {
  questionId: string;
  category: QuestionCategory;
  categoryTitle: string;
  bloomLevel: BloomLevel;
  question: string;
  expectedAnswer: string;
  studentAnswer: string;
  studentReasoning?: string;
  isCorrect: boolean | 'partial' | 'uncertain' | 'unanswered';
  score: number; // 0 to 100
  answerCorrectness: 'correct' | 'partially_correct' | 'incorrect' | 'unanswered' | 'uncertain';
  answerCorrectnessScore: number;
  reasoningQualityScore: number | null;
  evidence: string[];
  misconceptions: string[];
  confidence: number;
  rubricVersion: string;
  feedback: string;
  cognitiveErrorAnalysis: string;
  demonstratedStrengths: string;
  evidenceNotes: string;
}

export interface CognitiveProfile {
  scores: Record<BloomLevel, number | null>;
  evidenceCounts: Record<BloomLevel, number>;
  insufficientEvidenceLevels: BloomLevel[];
}

export interface CognitiveAnalysisResult {
  studentName: string;
  overallScore: number;
  evaluations: QuestionEvaluation[];
  cognitiveProfile: CognitiveProfile;
  categoryScores: {
    logicalReasoning: number;
    patternRecognition: number;
    problemSolving: number;
  };
  reasoningClarityScore: number | null;
}

export interface FeedbackCoachResult {
  observedStrengths: string[];
  areasToImprove: string[];
  practiceSuggestions: {
    title: string;
    description: string;
    exampleExercise: string;
  }[];
  encouragementNote: string;
}

export interface FinalAssessmentReport {
  studentName: string;
  assessmentId: string;
  timestamp: string;
  mode: AssessmentMode;
  overallScore: number;
  gradeLevel?: string;
  difficulty?: Difficulty;
  focusArea?: string;
  questionCount?: number;
  targetBloomLevels?: BloomLevel[];
  categoryScores: {
    logicalReasoning: number;
    patternRecognition: number;
    problemSolving: number;
  };
  reasoningClarityScore: number | null;
  designerOutput: {
    questions: Question[];
  };
  analyzerOutput: CognitiveAnalysisResult;
  coachOutput: FeedbackCoachResult;
  orchestratorSynthesis: OrchestratorSynthesis;
}

export interface OrchestratorSynthesis {
  executiveSummary: string;
  cognitiveProfileType: string;
  keyTakeaway: string;
}

export type AgentId = 'orchestrator' | 'designer' | 'analyzer' | 'coach';

export type AgentStatus = 'idle' | 'waiting' | 'running' | 'completed' | 'error';

export interface AgentInfo {
  id: AgentId;
  name: string;
  role: string;
  description: string;
  model: string;
  status: AgentStatus;
  executionTimeMs?: number;
  lastLog?: string;
  rawInput?: unknown;
  rawOutput?: unknown;
}

export interface AgentLogEntry {
  id: string;
  timestamp: string;
  agentId: AgentId;
  agentName: string;
  level: 'info' | 'thought' | 'action' | 'success' | 'warn' | 'error';
  message: string;
  details?: unknown;
}

export interface SampleStudentPreset {
  id: string;
  label: string;
  studentName: string;
  description: string;
  answers: {
    [category in QuestionCategory]: {
      answer: string;
      reasoning: string;
    };
  };
}
