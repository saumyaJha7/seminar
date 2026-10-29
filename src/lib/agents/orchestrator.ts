import {
  AgentId,
  AgentLogEntry,
  AssessmentPipelineCheckpoint,
  CognitiveAnalysisResult,
  FeedbackCoachResult,
  FinalAssessmentReport,
  OrchestratorSynthesis,
  Question,
  StudentAnswer,
} from '@/types/assessment';
import { runAssessmentDesigner } from './designer';
import { runCognitiveResponseAnalyzer } from './analyzer';
import { runFeedbackCoach } from './coach';
import { callGroqChat, extractJSONFromLLMResponse, getGroqClient } from '../groq';
import { validateOrchestratorSynthesis } from '../assessment-contracts';

export type LogCallback = (entry: AgentLogEntry) => void;

export interface AssessmentPipelineInput {
  studentName?: string;
  gradeLevel?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  focusArea?: string;
  preExistingQuestions?: Question[];
  studentAnswers: StudentAnswer[];
  onLog?: LogCallback;
  assessmentId?: string;
  checkpoint?: AssessmentPipelineCheckpoint;
  onCheckpoint?: (checkpoint: AssessmentPipelineCheckpoint) => Promise<boolean>;
}

export type AssessmentPipelineResult =
  | { paused: true; checkpoint: AssessmentPipelineCheckpoint }
  | { paused: false; report: FinalAssessmentReport };

export const ORCHESTRATOR_SYSTEM_PROMPT = `You are the Orchestrator Agent in a Multi-Agent Student Cognitive Assessment system.
Your responsibility:
- Oversee the entire workflow: Agent 1 (Designer) -> Student Answers -> Agent 2 (Analyzer) -> Agent 3 (Coach).
- Synthesize all findings into an Executive Cognitive Profile.
- Classify the student's cognitive archetype (e.g. "Systematic Deductive Thinker", "Intuitive Pattern Seeker", "Pragmatic Problem Solver", "Emerging Analytical Reasoner").
- Provide an overarching executive summary and a key strategic takeaway for educators or parents.
- Output MUST be valid JSON adhering strictly to the requested schema.`;

export async function runAssessmentPipeline({
  studentName = 'Alex Mercer',
  gradeLevel = 'High School',
  difficulty = 'intermediate',
  focusArea = 'Logic & Pattern Recognition',
  preExistingQuestions,
  studentAnswers,
  onLog,
  assessmentId,
  checkpoint = { nextStage: 'analyzer' },
  onCheckpoint,
}: AssessmentPipelineInput): Promise<AssessmentPipelineResult> {
  const emitLog = (
    agentId: AgentId,
    agentName: string,
    level: AgentLogEntry['level'],
    message: string,
    details?: unknown
  ) => {
    if (onLog) {
      onLog({
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toLocaleTimeString(),
        agentId,
        agentName,
        level,
        message,
        details,
      });
    }
  };

  emitLog('orchestrator', 'Orchestrator Agent', 'info', 'Initializing cognitive assessment pipeline.');
  emitLog('orchestrator', 'Orchestrator Agent', 'info', `Verified workflow configuration: Grade Level: ${gradeLevel}, Difficulty: ${difficulty}`);

  // Step 1: Agent 1 Assessment Designer
  let questions: Question[];
  if (preExistingQuestions && preExistingQuestions.length > 0) {
    questions = preExistingQuestions;
    emitLog('orchestrator', 'Orchestrator Agent', 'info', `Using ${questions.length} existing questions designed for this session.`);
  } else {
    emitLog('designer', 'Agent 1: Assessment Designer', 'action', 'Formulating reasoning questions across the requested categories...');
    const designerResult = await runAssessmentDesigner(
      { gradeLevel, difficulty, focusArea },
    );
    questions = designerResult.questions;
    emitLog('designer', 'Agent 1: Assessment Designer', 'success', `Generated ${questions.length} calibrated questions in ${designerResult.executionTimeMs}ms.`, {
      questionsCount: questions.length,
      categories: questions.map((q) => q.categoryTitle),
    });
  }

  let analysis: CognitiveAnalysisResult | undefined = checkpoint.analysis;
  if (!analysis) {
    emitLog('orchestrator', 'Orchestrator Agent', 'action', `Dispatching ${questions.length} question-answer pairs to Agent 2 (Cognitive Response Analyzer)...`);
    emitLog('analyzer', 'Agent 2: Cognitive Response Analyzer', 'action', 'Evaluating submitted answers against the question rubrics.');
    const analyzerResult = await runCognitiveResponseAnalyzer({
      studentName,
      questions,
      studentAnswers,
    });
    analysis = analyzerResult.analysis;
    const nextCheckpoint: AssessmentPipelineCheckpoint = {
      ...checkpoint,
      nextStage: 'coach',
      analysis,
    };
    emitLog(
      'analyzer',
      'Agent 2: Cognitive Response Analyzer',
      'success',
      analysis.evaluations.some((evaluation) => evaluation.answerCorrectness !== 'unanswered')
        ? `Cognitive analysis complete! Overall Score: ${analysis.overallScore}/100 in ${analyzerResult.executionTimeMs}ms.`
        : 'Cognitive analysis complete; no responses were available for scoring.',
      { scores: analysis.categoryScores },
    );
    if (await onCheckpoint?.(nextCheckpoint)) {
      return { paused: true, checkpoint: nextCheckpoint };
    }
    checkpoint = nextCheckpoint;
  }

  if (!analysis) {
    throw new Error('Assessment checkpoint is missing cognitive analysis.');
  }

  const answeredCount = analysis.evaluations.filter(
    (evaluation) => evaluation.answerCorrectness !== 'unanswered',
  ).length;

  let feedback: FeedbackCoachResult | undefined = checkpoint.feedback;
  if (!feedback) {
    emitLog('coach', 'Agent 3: Feedback Coach', 'action', 'Formulating a constructive growth roadmap and practice modules.');
    const coachResult = await runFeedbackCoach({ analysis });
    feedback = coachResult.feedback;
    const nextCheckpoint: AssessmentPipelineCheckpoint = {
      ...checkpoint,
      nextStage: 'synthesis',
      analysis,
      feedback,
    };
    emitLog(
      'coach',
      'Agent 3: Feedback Coach',
      'success',
      `Personalized coaching plan created with ${feedback.practiceSuggestions.length} targeted exercises in ${coachResult.executionTimeMs}ms.`,
    );
    if (await onCheckpoint?.(nextCheckpoint)) {
      return { paused: true, checkpoint: nextCheckpoint };
    }
    checkpoint = nextCheckpoint;
  }

  let synthesis: OrchestratorSynthesis | undefined = checkpoint.synthesis;
  if (!synthesis) {
    emitLog('orchestrator', 'Orchestrator Agent', 'action', 'Synthesizing the validated agent results into a report.');
    const synthesisPrompt = `Student Name: ${studentName}
Overall Cognitive Score: ${analysis.overallScore}
Answered Items: ${answeredCount} of ${analysis.evaluations.length}
Category Scores: ${JSON.stringify(analysis.categoryScores)}
Analyzer Evaluations: ${JSON.stringify(analysis.evaluations.map(e => ({ q: e.categoryTitle, score: e.score, strengths: e.demonstratedStrengths, errors: e.cognitiveErrorAnalysis })))}
Coach Strengths: ${JSON.stringify(feedback.observedStrengths)}
Coach Areas: ${JSON.stringify(feedback.areasToImprove)}

Do not treat unanswered items as incorrect or infer performance where there is no submitted evidence.

Synthesize these results into a final cognitive profile. Return valid JSON strictly matching:
{
  "executiveSummary": "A concise 2-3 sentence overview of the student's cognitive performance.",
  "cognitiveProfileType": "E.g., Methodical Deductive Reasoner",
  "keyTakeaway": "Single high-impact recommendation for student/educator."
}`;

    const fallbackSynthesis = answeredCount === 0
      ? {
        executiveSummary: `${studentName} did not submit responses, so there is insufficient evidence to describe cognitive performance.`,
        cognitiveProfileType: 'Insufficient evidence',
        keyTakeaway: 'Complete the assessment items to receive evidence-based feedback.',
      }
      : {
          executiveSummary: `${studentName} demonstrated solid cognitive capabilities across the assessment, with particular strength in ${analysis.categoryScores.logicalReasoning >= analysis.categoryScores.patternRecognition ? 'logical deduction' : 'pattern recognition'}. Their reasoning is structured and responds well to concrete problem framing.`,
          cognitiveProfileType: analysis.overallScore >= 85 ? 'Strategic Analytical Thinker' : 'Intuitive Adaptive Problem Solver',
          keyTakeaway: 'Focus on writing out intermediate logic steps to prevent minor heuristic oversights during complex multi-stage problems.',
        };

    synthesis = fallbackSynthesis;
    if (getGroqClient() && answeredCount > 0) {
      const rawSynthesis = await callGroqChat({
        messages: [
          { role: 'system', content: ORCHESTRATOR_SYSTEM_PROMPT },
          { role: 'user', content: synthesisPrompt },
        ],
        temperature: 0.3,
      });
      synthesis = validateOrchestratorSynthesis(extractJSONFromLLMResponse<unknown>(rawSynthesis));
    }
    const nextCheckpoint: AssessmentPipelineCheckpoint = {
      ...checkpoint,
      nextStage: 'save_report',
      analysis,
      feedback,
      synthesis,
    };
    if (await onCheckpoint?.(nextCheckpoint)) {
      return { paused: true, checkpoint: nextCheckpoint };
    }
    checkpoint = nextCheckpoint;
  }

  if (!analysis || !feedback || !synthesis) {
    throw new Error('Assessment pipeline checkpoint is missing completed agent output.');
  }
  emitLog('orchestrator', 'Orchestrator Agent', 'success', 'Assessment pipeline completed.');

  const finalReport: FinalAssessmentReport = {
    studentName,
    assessmentId: assessmentId ?? `cog-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    mode: getGroqClient() ? 'groq' : 'demo',
    overallScore: analysis.overallScore,
    gradeLevel,
    difficulty,
    focusArea,
    questionCount: questions.length,
    targetBloomLevels: [...new Set(questions.map((question) => question.bloomLevel))],
    categoryScores: analysis.categoryScores,
    reasoningClarityScore: analysis.reasoningClarityScore,
    designerOutput: {
      questions,
    },
    analyzerOutput: analysis,
    coachOutput: feedback,
    orchestratorSynthesis: synthesis,
  };

  return { paused: false, report: finalReport };
}
