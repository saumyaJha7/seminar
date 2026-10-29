import {
  AgentId,
  AgentLogEntry,
  FinalAssessmentReport,
  Question,
  StudentAnswer,
} from '@/types/assessment';
import { runAssessmentDesigner } from './designer';
import { runCognitiveResponseAnalyzer } from './analyzer';
import { runFeedbackCoach } from './coach';
import { callGroqChat, extractJSONFromLLMResponse, getGroqClient } from '../groq';
import { validateOrchestratorSynthesis } from '../assessment-contracts';

export type LogCallback = (entry: AgentLogEntry) => void;

export const ORCHESTRATOR_SYSTEM_PROMPT = `You are the Orchestrator Agent in a Multi-Agent Student Cognitive Assessment system.
Your responsibility:
- Oversee the entire workflow: Agent 1 (Designer) -> Student Answers -> Agent 2 (Analyzer) -> Agent 3 (Coach).
- Synthesize all findings into an Executive Cognitive Profile.
- Classify the student's cognitive archetype (e.g. "Systematic Deductive Thinker", "Intuitive Pattern Seeker", "Pragmatic Problem Solver", "Emerging Analytical Reasoner").
- Provide an overarching executive summary and a key strategic takeaway for educators or parents.
- Output MUST be valid JSON adhering strictly to the requested schema.`;

export async function runFullAssessmentPipeline({
  studentName = 'Alex Mercer',
  gradeLevel = 'High School',
  difficulty = 'intermediate',
  focusArea = 'Logic & Pattern Recognition',
  preExistingQuestions,
  studentAnswers,
  onLog,
  assessmentId,
}: {
  studentName?: string;
  gradeLevel?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  focusArea?: string;
  preExistingQuestions?: Question[];
  studentAnswers: StudentAnswer[];
  onLog?: LogCallback;
  assessmentId?: string;
}): Promise<FinalAssessmentReport> {
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

  // Step 2: Validate student answers
  emitLog('orchestrator', 'Orchestrator Agent', 'action', `Dispatching ${questions.length} question-answer pairs to Agent 2 (Cognitive Response Analyzer)...`);

  // Step 3: Agent 2 Cognitive Response Analyzer
  emitLog('analyzer', 'Agent 2: Cognitive Response Analyzer', 'action', 'Evaluating submitted answers against the question rubrics.');
  const analyzerResult = await runCognitiveResponseAnalyzer({
    studentName,
    questions,
    studentAnswers,
  });
  const answeredCount = analyzerResult.analysis.evaluations.filter(
    (evaluation) => evaluation.answerCorrectness !== 'unanswered',
  ).length;
  emitLog(
    'analyzer',
    'Agent 2: Cognitive Response Analyzer',
    'success',
    answeredCount > 0
      ? `Cognitive analysis complete! Overall Score: ${analyzerResult.analysis.overallScore}/100 in ${analyzerResult.executionTimeMs}ms.`
      : 'Cognitive analysis complete; no responses were available for scoring.',
    {
      scores: analyzerResult.analysis.categoryScores,
    }
  );

  // Step 4: Agent 3 Feedback Coach
  emitLog('coach', 'Agent 3: Feedback Coach', 'action', `Formulating non-clinical, constructive growth roadmap & practice modules...`);
  const coachResult = await runFeedbackCoach({
    analysis: analyzerResult.analysis,
  });
  emitLog('coach', 'Agent 3: Feedback Coach', 'success', `Personalized coaching plan created with ${coachResult.feedback.practiceSuggestions.length} targeted exercises in ${coachResult.executionTimeMs}ms.`);

  // Step 5: Orchestrator Synthesis
  emitLog('orchestrator', 'Orchestrator Agent', 'action', 'Synthesizing the validated agent results into a report.');
  const synthesisPrompt = `Student Name: ${studentName}
Overall Cognitive Score: ${analyzerResult.analysis.overallScore}
Answered Items: ${answeredCount} of ${analyzerResult.analysis.evaluations.length}
Category Scores: ${JSON.stringify(analyzerResult.analysis.categoryScores)}
Analyzer Evaluations: ${JSON.stringify(analyzerResult.analysis.evaluations.map(e => ({ q: e.categoryTitle, score: e.score, strengths: e.demonstratedStrengths, errors: e.cognitiveErrorAnalysis })))}
Coach Strengths: ${JSON.stringify(coachResult.feedback.observedStrengths)}
Coach Areas: ${JSON.stringify(coachResult.feedback.areasToImprove)}

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
    executiveSummary: `${studentName} demonstrated solid cognitive capabilities across the assessment, with particular strength in ${analyzerResult.analysis.categoryScores.logicalReasoning >= analyzerResult.analysis.categoryScores.patternRecognition ? 'logical deduction' : 'pattern recognition'}. Their reasoning is structured and responds well to concrete problem framing.`,
    cognitiveProfileType: analyzerResult.analysis.overallScore >= 85 ? 'Strategic Analytical Thinker' : 'Intuitive Adaptive Problem Solver',
    keyTakeaway: 'Focus on writing out intermediate logic steps to prevent minor heuristic oversights during complex multi-stage problems.'
    };

  let synthesis = fallbackSynthesis;
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

  emitLog('orchestrator', 'Orchestrator Agent', 'success', 'Assessment pipeline completed.');

  const finalReport: FinalAssessmentReport = {
    studentName,
    assessmentId: assessmentId ?? `cog-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    mode: getGroqClient() ? 'groq' : 'demo',
    overallScore: analyzerResult.analysis.overallScore,
    gradeLevel,
    difficulty,
    focusArea,
    questionCount: questions.length,
    targetBloomLevels: [...new Set(questions.map((question) => question.bloomLevel))],
    categoryScores: analyzerResult.analysis.categoryScores,
    reasoningClarityScore: analyzerResult.analysis.reasoningClarityScore,
    designerOutput: {
      questions,
    },
    analyzerOutput: analyzerResult.analysis,
    coachOutput: coachResult.feedback,
    orchestratorSynthesis: synthesis,
  };

  return finalReport;
}
