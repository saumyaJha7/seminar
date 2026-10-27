import { CognitiveAnalysisResult, Question, StudentAnswer, QuestionEvaluation } from '@/types/assessment';
import { callGroqChat, extractJSONFromLLMResponse } from '../groq';

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
  apiKeyOverride,
}: {
  studentName: string;
  questions: Question[];
  studentAnswers: StudentAnswer[];
  apiKeyOverride?: string;
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
      expectedAnswer: q.expectedAnswer,
      explanation: q.explanation,
      studentAnswer: ans.answer,
      studentReasoning: ans.reasoning || 'No reasoning provided',
    };
  });

  const userPrompt = `Analyze the cognitive performance for student: "${studentName}".

Input Assessment Items & Student Responses:
${JSON.stringify(pairs, null, 2)}

Provide your output strictly in JSON format matching this schema:
{
  "studentName": "${studentName}",
  "overallScore": 85,
  "categoryScores": {
    "logicalReasoning": 90,
    "patternRecognition": 80,
    "problemSolving": 85
  },
  "reasoningClarityScore": 80,
  "evaluations": [
    {
      "questionId": "q1_logical",
      "category": "logical_reasoning",
      "categoryTitle": "Logical Reasoning",
      "question": "...",
      "expectedAnswer": "...",
      "studentAnswer": "...",
      "studentReasoning": "...",
      "isCorrect": true,
      "score": 100,
      "cognitiveErrorAnalysis": "Specific analysis of any errors or logical flaws based on evidence.",
      "demonstratedStrengths": "Specific reasoning strengths observed directly from student response.",
      "evidenceNotes": "Evidence citation from student answer."
    }
  ]
}`;

  try {
    const rawResponse = await callGroqChat({
      messages: [
        { role: 'system', content: ANALYZER_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      apiKeyOverride,
    });

    const parsed = extractJSONFromLLMResponse<CognitiveAnalysisResult>(rawResponse);
    const executionTimeMs = Date.now() - startTime;

    return {
      analysis: parsed,
      rawPrompt: userPrompt,
      rawResponse,
      executionTimeMs,
    };
  } catch (error: any) {
    if (error?.message === 'GROQ_API_KEY_NOT_CONFIGURED') {
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

    let isCorrect: boolean | 'partial' = true;
    let score = 90;
    let cognitiveErrorAnalysis = 'No cognitive missteps detected. The student correctly reconciled the constraints.';
    let demonstratedStrengths = 'Clear deductive synthesis and accurate rule following.';
    let evidenceNotes = 'The student directly arrived at the expected deduction.';

    if (isBlank) {
      isCorrect = false;
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
    }

    return {
      questionId: q.id,
      category: q.category,
      categoryTitle: q.categoryTitle,
      question: q.question,
      expectedAnswer: q.expectedAnswer,
      studentAnswer: rawAnswer || 'No answer submitted',
      studentReasoning: rawReasoning || (isBlank ? 'None' : 'Final answer only without reasoning trace'),
      isCorrect,
      score,
      cognitiveErrorAnalysis,
      demonstratedStrengths,
      evidenceNotes,
    };
  });

  const avg = Math.round(evaluations.reduce((acc, curr) => acc + curr.score, 0) / evaluations.length);

  return {
    studentName,
    overallScore: avg,
    categoryScores: {
      logicalReasoning: evaluations.find((e) => e.category === 'logical_reasoning')?.score ?? 85,
      patternRecognition: evaluations.find((e) => e.category === 'pattern_recognition')?.score ?? 85,
      problemSolving: evaluations.find((e) => e.category === 'problem_solving')?.score ?? 85,
    },
    reasoningClarityScore: studentAnswers.some((a) => a.reasoning && a.reasoning.length > 10) ? 88 : 65,
    evaluations,
  };
}
