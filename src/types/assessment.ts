export type QuestionCategory = 'logical_reasoning' | 'pattern_recognition' | 'problem_solving';

export interface Question {
  id: string;
  category: QuestionCategory;
  categoryTitle: string;
  question: string;
  context?: string;
  expectedAnswer: string;
  explanation: string;
}

export interface StudentAnswer {
  questionId: string;
  answer: string;
  reasoning?: string;
}

export interface QuestionEvaluation {
  questionId: string;
  category: QuestionCategory;
  categoryTitle: string;
  question: string;
  expectedAnswer: string;
  studentAnswer: string;
  studentReasoning?: string;
  isCorrect: boolean | 'partial';
  score: number; // 0 to 100
  cognitiveErrorAnalysis: string;
  demonstratedStrengths: string;
  evidenceNotes: string;
}

export interface CognitiveAnalysisResult {
  studentName: string;
  overallScore: number;
  evaluations: QuestionEvaluation[];
  categoryScores: {
    logicalReasoning: number;
    patternRecognition: number;
    problemSolving: number;
  };
  reasoningClarityScore: number;
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
  overallScore: number;
  gradeLevel?: string;
  categoryScores: {
    logicalReasoning: number;
    patternRecognition: number;
    problemSolving: number;
  };
  reasoningClarityScore: number;
  designerOutput: {
    questions: Question[];
  };
  analyzerOutput: CognitiveAnalysisResult;
  coachOutput: FeedbackCoachResult;
  orchestratorSynthesis: {
    executiveSummary: string;
    cognitiveProfileType: string;
    keyTakeaway: string;
  };
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
  rawInput?: any;
  rawOutput?: any;
}

export interface AgentLogEntry {
  id: string;
  timestamp: string;
  agentId: AgentId;
  agentName: string;
  level: 'info' | 'thought' | 'action' | 'success' | 'warn' | 'error';
  message: string;
  details?: any;
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
