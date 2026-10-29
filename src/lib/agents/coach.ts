import { CognitiveAnalysisResult, FeedbackCoachResult, QuestionCategory } from '@/types/assessment';
import { callGroqChat, extractJSONFromLLMResponse } from '../groq';
import { validateFeedbackCoach } from '../assessment-contracts';

export const COACH_SYSTEM_PROMPT = `You are Agent 3: Feedback Coach in a Multi-Agent Student Cognitive Assessment system.
Your responsibility:
- Review the detailed evaluation from Agent 2 (Cognitive Response Analyzer).
- Formulate an empowering, constructive cognitive growth plan:
  1. Observed Strengths (3 distinct points highlighting specific cognitive capabilities shown in their answers).
  2. Areas to Improve (2-3 focused growth opportunities targeting error points or gaps).
  3. Personalized Practice Suggestions (2 to 3 actionable, engaging exercises with concrete examples).
- ETHICAL GUIDELINES:
  - DO NOT make clinical diagnoses (e.g., ADHD, learning disorders, cognitive impairment).
  - DO NOT claim to measure fixed or definitive general intelligence (IQ).
  - Treat unanswered items as unavailable evidence, not as incorrect answers or demonstrated weaknesses.
  - Frame all feedback around malleable cognitive habits, mental models, and deliberate reasoning strategies.
- Output MUST strictly be valid JSON matching the requested structure.`;

export async function runFeedbackCoach({
  analysis,
}: {
  analysis: CognitiveAnalysisResult;
}): Promise<{ feedback: FeedbackCoachResult; rawPrompt: string; rawResponse: string; executionTimeMs: number }> {
  const startTime = Date.now();

  const userPrompt = `Formulate personalized cognitive feedback and coaching suggestions for student "${analysis.studentName}".

Analyzer Findings:
- Overall Score: ${analysis.overallScore}/100
- Category Scores: Logical Reasoning: ${analysis.categoryScores.logicalReasoning}, Pattern Recognition: ${analysis.categoryScores.patternRecognition}, Problem Solving: ${analysis.categoryScores.problemSolving}
- Evaluations Breakdown:
${JSON.stringify(analysis.evaluations, null, 2)}

Unanswered items are unavailable evidence, not incorrect answers. Do not infer weaknesses from them.

Provide your output strictly in JSON format matching this schema:
{
  "observedStrengths": [
    "Clear strength 1...",
    "Clear strength 2...",
    "Clear strength 3..."
  ],
  "areasToImprove": [
    "Growth point 1...",
    "Growth point 2..."
  ],
  "practiceSuggestions": [
    {
      "title": "Exercise Name",
      "description": "Why and how to practice this skill",
      "exampleExercise": "A quick concrete puzzle or mental model to try"
    },
    {
      "title": "Exercise Name 2",
      "description": "Why and how to practice this skill",
      "exampleExercise": "A quick concrete puzzle or mental model to try"
    }
  ],
  "encouragementNote": "Inspiring, growth-mindset closing remark for the student."
}`;

  if (!analysis.evaluations.some((evaluation) => evaluation.answerCorrectness !== 'unanswered')) {
    const feedback = getSimulatedCoachResult(analysis);
    return {
      feedback,
      rawPrompt: 'No responses were submitted; no performance-based coaching was generated.',
      rawResponse: JSON.stringify(feedback, null, 2),
      executionTimeMs: Date.now() - startTime,
    };
  }

  try {
    const rawResponse = await callGroqChat({
      messages: [
        { role: 'system', content: COACH_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
    });

    const parsed = validateFeedbackCoach(extractJSONFromLLMResponse<unknown>(rawResponse));
    const executionTimeMs = Date.now() - startTime;

    return {
      feedback: parsed,
      rawPrompt: userPrompt,
      rawResponse,
      executionTimeMs,
    };
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'GROQ_API_KEY_NOT_CONFIGURED') {
      const simulated = getSimulatedCoachResult(analysis);
      const executionTimeMs = Date.now() - startTime;
      return {
        feedback: simulated,
        rawPrompt: userPrompt,
        rawResponse: JSON.stringify(simulated, null, 2),
        executionTimeMs,
      };
    }
    throw error;
  }
}

export function getSimulatedCoachResult(analysis: CognitiveAnalysisResult): FeedbackCoachResult {
  const strengths: string[] = [];
  const areas: string[] = [];
  const answeredEvaluations = analysis.evaluations.filter(
    (evaluation) => evaluation.answerCorrectness !== 'unanswered',
  );
  const hasCategoryAnswer = (category: QuestionCategory) =>
    answeredEvaluations.some((evaluation) => evaluation.category === category);

  if (hasCategoryAnswer('logical_reasoning') && analysis.categoryScores.logicalReasoning >= 80) {
    strengths.push('Aptitude for deductive inference and working with categorical statements.');
  } else if (hasCategoryAnswer('logical_reasoning')) {
    areas.push('Practicing contrapositives and verifying conditional premises step-by-step.');
  }

  if (hasCategoryAnswer('pattern_recognition') && analysis.categoryScores.patternRecognition >= 80) {
    strengths.push('Strong spatial/numerical trend detection across non-linear sequences.');
  } else if (hasCategoryAnswer('pattern_recognition')) {
    areas.push('Exploring higher-order number patterns (e.g. geometric rates, differences between differences).');
  }

  if (hasCategoryAnswer('problem_solving') && analysis.categoryScores.problemSolving >= 80) {
    strengths.push('Methodical decomposition of multi-variable constraints and elimination logic.');
  } else if (hasCategoryAnswer('problem_solving')) {
    areas.push('Writing down intermediate invariant states during multi-stage puzzles.');
  }

  if (strengths.length < 3 && answeredEvaluations.length > 0) {
    strengths.push('Willingness to tackle abstract logical puzzles and test deduction hypotheses.');
  }

  return {
    observedStrengths: strengths,
    areasToImprove: areas.length > 0
      ? areas
      : answeredEvaluations.length > 0
        ? ['Continue challenging yourself with nested multi-condition logic problems.']
        : ['Submit responses to generate evidence-based strengths and practice recommendations.'],
    practiceSuggestions: [
      {
        title: 'The "What-If" Invariant Game',
        description: 'Train sequential elimination by holding one variable constant and tracking cascades.',
        exampleExercise: 'Try the classic river crossing puzzle with a wolf, goat, and cabbage to build zero-error constraint retention.'
      },
      {
        title: 'Pattern Delta Decomposition',
        description: 'When solving numerical series, always calculate the 1st differences and 2nd differences in parallel.',
        exampleExercise: 'For 2, 5, 11, 23: note deltas are 3, 6, 12 (doubling deltas), which immediately unmasks the generator rule (×2 - 1).'
      },
      {
        title: 'Explicit Reasoning Articulation',
        description: 'Writing down even 1-2 bullet points of why you chose an answer solidifies neural pathways for logical verification.',
        exampleExercise: 'Before finalizing any puzzle solution, state: "My answer must be X because if it were not X, then Y condition would break."'
      }
    ],
    encouragementNote: answeredEvaluations.length > 0
      ? `Great effort, ${analysis.studentName}! Your analytical curiosity shines through. Cognitive reasoning is like a muscle—deliberate practice with deliberate self-explanation will accelerate your problem-solving intuition even further.`
      : 'Your results will be more useful once you submit responses to the assessment items.',
  };
}
