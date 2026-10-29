import { CognitiveAnalysisResult, Question, StudentAnswer, QuestionEvaluation } from '@/types/assessment';
import { callGroqChat, extractJSONFromLLMResponse } from '../groq';
import {
  AssessmentOutputValidationError,
  buildCognitiveProfile,
  validateCognitiveAnalysis,
} from '../assessment-contracts';

export const ANALYZER_SYSTEM_PROMPT = `You are Agent 2: Cognitive Response Analyzer in a Multi-Agent Student Cognitive Assessment system.
Your responsibility:
- Compare each student answer and their articulated reasoning against the expected answers and principles provided by Agent 1.
- Identify whether the answer is correct, partially correct, or incorrect.
- Provide objective, evidence-based cognitive error analysis:
  - If reasoning was provided, pinpoint where their logic diverged, where calculation or assumption errors took place, or if they applied a heuristic incorrectly.
  - CRITICAL RULE: If the student provided only a final answer without reasoning, DO NOT speculate or pretend to know their internal mental process; note explicitly that only final output was provided.
- Identify demonstrated reasoning strengths where supported by evidence (e.g., sound inductive thinking, systematic elimination, accurate rule identification).
- Compute scores (0 to 100) per question and an overall cognitive index.
- Return structured JSON strictly adhering to the requested schema.`;

export async function runCognitiveResponseAnalyzer({
  studentName,
  questions,
  studentAnswers,
}: {
  studentName: string;
  questions: Question[];
  studentAnswers: StudentAnswer[];
}): Promise<{ analysis: CognitiveAnalysisResult; rawPrompt: string; rawResponse: string; executionTimeMs: number }> {
  const startTime = Date.now();

  const pairs = questions.map((q) => {
    const ans = studentAnswers.find((a) => a.questionId === q.id) || {
      questionId: q.id,
      answer: 'No answer provided',
      reasoning: 'None provided',
    };
    return {
      questionId: q.id,
      category: q.category,
      categoryTitle: q.categoryTitle,
      question: q.question,
      bloomLevel: q.bloomLevel,
      evaluationRubric: q.evaluationRubric,
      expectedAnswer: q.expectedAnswer,
      explanation: q.explanation,
      studentAnswer: ans.answer,
      studentReasoning: ans.reasoning || 'No reasoning provided',
    };
  });

  const userPrompt = `Analyze the cognitive performance for student: "${studentName}".

Input Assessment Items & Student Responses:
${JSON.stringify(pairs, null, 2)}

Treat blank answers as unavailable evidence. Do not assign them an incorrect score or cite text that the student did not submit.

Return only a JSON object with an "evaluations" array containing exactly one item per input question. Use the same questionId values. Keep all prose fields to one concise sentence. Do not repeat question text, answers, or other input fields in the output.

For evidence, use one or two short, exact quotations copied from the submitted answer or reasoning. Do not paraphrase evidence. If there is no answer, use an empty evidence array and answerCorrectness "unanswered".

The rubricVersion must exactly match the version supplied for that question. Scores are numbers from 0 to 100. Confidence is a number from 0 to 1. Use null for reasoningQualityScore when no reasoning was submitted.

Return strictly in this shape:
{
  "evaluations": [
    {
      "questionId": "q1_logical",
      "answerCorrectness": "correct",
      "answerCorrectnessScore": 100,
      "reasoningQualityScore": 80,
      "confidence": 0.9,
      "rubricVersion": "1.0",
      "evidence": ["exact short quote"],
      "misconceptions": [],
      "feedback": "Concise feedback tied to the rubric.",
      "cognitiveErrorAnalysis": "Specific analysis of any errors or logical flaws based on evidence.",
      "demonstratedStrengths": "Specific reasoning strengths observed directly from student response.",
      "evidenceNotes": "Evidence citation from student answer."
    }
  ]
}`;

  if (!studentAnswers.some((answer) => answer.answer.trim().length > 0)) {
    const analysis = getSimulatedCognitiveAnalysis(studentName, questions, studentAnswers);
    return {
      analysis,
      rawPrompt: userPrompt,
      rawResponse: JSON.stringify(analysis, null, 2),
      executionTimeMs: Date.now() - startTime,
    };
  }

  try {
    let validationError: AssessmentOutputValidationError | null = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const attemptPrompt = attempt === 0
        ? userPrompt
        : `${userPrompt}\n\nYour previous response did not match the required evaluation schema. Return the complete JSON object again, with exactly one concise evaluation per question, exact submitted-text evidence, and no extra fields.`;
      const rawResponse = await callGroqChat({
        messages: [
          { role: 'system', content: ANALYZER_SYSTEM_PROMPT },
          { role: 'user', content: attemptPrompt },
        ],
        temperature: 0.2,
        max_tokens: Math.min(8192, Math.max(2048, questions.length * 700)),
      });

      let rawAnalysis: unknown;
      try {
        rawAnalysis = extractJSONFromLLMResponse<unknown>(rawResponse);
      } catch {
        validationError = new AssessmentOutputValidationError(
          'The response evaluator returned invalid structured output.',
        );
        continue;
      }

      try {
        const analysis = validateCognitiveAnalysis(
          rawAnalysis,
          questions,
          studentAnswers,
          studentName,
        );
        return {
          analysis,
          rawPrompt: attemptPrompt,
          rawResponse,
          executionTimeMs: Date.now() - startTime,
        };
      } catch (error: unknown) {
        if (!(error instanceof AssessmentOutputValidationError)) throw error;
        validationError = error;
      }
    }

    throw validationError ?? new AssessmentOutputValidationError(
      'The response evaluator could not return a valid evaluation.',
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'GROQ_API_KEY_NOT_CONFIGURED') {
      const simulated = getSimulatedCognitiveAnalysis(studentName, questions, studentAnswers);
      const executionTimeMs = Date.now() - startTime;
      return {
        analysis: simulated,
        rawPrompt: userPrompt,
        rawResponse: JSON.stringify(simulated, null, 2),
        executionTimeMs,
      };
    }
    throw error;
  }
}

export function getSimulatedCognitiveAnalysis(
  studentName: string,
  questions: Question[],
  studentAnswers: StudentAnswer[]
): CognitiveAnalysisResult {
  const evaluations: QuestionEvaluation[] = questions.map((q) => {
    const studentAns = studentAnswers.find((a) => a.questionId === q.id);
    const rawAnswer = (studentAns?.answer || '').trim();
    const rawReasoning = (studentAns?.reasoning || '').trim();

    // Check similarity / correctness heuristics for simulation
    const isBlank = !rawAnswer;
    const hasReasoning = Boolean(rawReasoning && rawReasoning.length > 5);

    let isCorrect: QuestionEvaluation['isCorrect'] = true;
    let score = 90;
    let cognitiveErrorAnalysis = 'No cognitive missteps detected. The student correctly reconciled the constraints.';
    let demonstratedStrengths = 'Clear deductive synthesis and accurate rule following.';
    let evidenceNotes = 'The student directly arrived at the expected deduction.';

    if (isBlank) {
      isCorrect = 'unanswered';
      score = 0;
      cognitiveErrorAnalysis = 'No response was provided. Cannot evaluate cognitive mechanisms.';
      demonstratedStrengths = 'None demonstrated.';
      evidenceNotes = 'Blank response.';
    } else if (q.category === 'pattern_recognition') {
      if (rawAnswer.includes('159') || rawAnswer.includes('127')) {
        isCorrect = true;
        score = 100;
        demonstratedStrengths = 'Accurately recognized recurring exponential or difference factor.';
        cognitiveErrorAnalysis = 'No error. Methodical sequence computation.';
        evidenceNotes = hasReasoning ? `Student noted: "${rawReasoning}"` : 'Direct correct numerical match.';
      } else {
        isCorrect = false;
        score = 40;
        cognitiveErrorAnalysis = 'Student likely assumed a simple arithmetic progression (+10, +20) rather than a geometric multiplier.';
        demonstratedStrengths = 'Attempted sequential projection.';
        evidenceNotes = `Student submitted "${rawAnswer}".`;
      }
    } else if (q.category === 'logical_reasoning') {
      if (rawAnswer.toLowerCase().includes('not') || rawAnswer.toLowerCase().includes('cannot') || rawAnswer.toLowerCase().includes('alex')) {
        isCorrect = true;
        score = 95;
        demonstratedStrengths = 'Correctly applied contrapositive deductive inference.';
        cognitiveErrorAnalysis = 'No significant logical gaps.';
        evidenceNotes = `Answer correctly differentiated categorical statements: "${rawAnswer}".`;
      } else {
        isCorrect = 'partial';
        score = 55;
        cognitiveErrorAnalysis = 'Conflated the conditional premise with its converse (fallacy of affirming the consequent).';
        demonstratedStrengths = 'Partial identification of subject terms.';
        evidenceNotes = `Student response "${rawAnswer}" missed the negative constraint.`;
      }
    } else {
      // problem solving
      if (rawAnswer.toLowerCase().includes('maya') || rawAnswer.toLowerCase().includes('jug') || rawAnswer.toLowerCase().includes('4')) {
        isCorrect = true;
        score = 90;
        demonstratedStrengths = 'Successfully structured multi-step constraints and elimination criteria.';
        cognitiveErrorAnalysis = 'Solid analytical flow.';
        evidenceNotes = `Consistent solution path: "${rawAnswer}".`;
      } else {
        isCorrect = 'partial';
        score = 60;
        cognitiveErrorAnalysis = 'Incomplete constraint tracking across intermediate steps.';
        demonstratedStrengths = 'Recognized the final goal state.';
        evidenceNotes = `Answer lacked full intermediate reconciliation: "${rawAnswer}".`;
      }
    }

    if (!hasReasoning && !isBlank) {
      evidenceNotes += ' (Note: Student supplied only final answer; internal reasoning steps were not articulated).';
      cognitiveErrorAnalysis = 'Only a final answer was provided; the student’s reasoning cannot be inferred.';
      demonstratedStrengths = 'The final answer is recorded; no reasoning strategy can be assessed without an explanation.';
    }

    return {
      questionId: q.id,
      category: q.category,
      categoryTitle: q.categoryTitle,
      bloomLevel: q.bloomLevel,
      question: q.question,
      expectedAnswer: q.expectedAnswer,
      studentAnswer: rawAnswer || 'No answer submitted',
      studentReasoning: rawReasoning || (isBlank ? 'None' : 'Final answer only without reasoning trace'),
      isCorrect,
      score,
      answerCorrectness: isBlank ? 'unanswered' : isCorrect === true ? 'correct' : isCorrect === 'partial' ? 'partially_correct' : 'incorrect',
      answerCorrectnessScore: score,
      reasoningQualityScore: hasReasoning ? (isCorrect === true ? 85 : isCorrect === 'partial' ? 55 : 30) : null,
      evidence: [rawAnswer, ...(hasReasoning ? [rawReasoning] : [])].filter(Boolean),
      misconceptions: hasReasoning && (isCorrect === false || isCorrect === 'partial') ? [cognitiveErrorAnalysis] : [],
      confidence: isBlank ? 1 : hasReasoning ? 0.8 : 0.6,
      rubricVersion: q.evaluationRubric.version,
      feedback: isBlank
        ? 'No answer was provided, so this item could not be evaluated.'
        : hasReasoning
          ? `${score >= 75 ? 'The response meets' : 'The response partially meets'} the ${q.bloomLevel} objective.`
          : 'The final answer was recorded, but reasoning quality cannot be assessed without an explanation.',
      cognitiveErrorAnalysis,
      demonstratedStrengths,
      evidenceNotes,
    };
  });

  const answeredEvaluations = evaluations.filter(
    (evaluation) => evaluation.answerCorrectness !== 'unanswered',
  );
  const avg = answeredEvaluations.length > 0
    ? Math.round(answeredEvaluations.reduce((total, evaluation) => total + evaluation.score, 0) / answeredEvaluations.length)
    : 0;
  const reasoningScores = evaluations
    .map((evaluation) => evaluation.reasoningQualityScore)
    .filter((score): score is number => score !== null);

  return {
    studentName,
    overallScore: avg,
    categoryScores: {
      logicalReasoning: answeredEvaluations.find((e) => e.category === 'logical_reasoning')?.score ?? 0,
      patternRecognition: answeredEvaluations.find((e) => e.category === 'pattern_recognition')?.score ?? 0,
      problemSolving: answeredEvaluations.find((e) => e.category === 'problem_solving')?.score ?? 0,
    },
    cognitiveProfile: buildCognitiveProfile(evaluations, questions),
    reasoningClarityScore: reasoningScores.length > 0
      ? Math.round(reasoningScores.reduce((total, score) => total + score, 0) / reasoningScores.length)
      : null,
    evaluations,
  };
}
