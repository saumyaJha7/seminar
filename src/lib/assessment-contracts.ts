import {
  BLOOM_LEVELS,
  BloomLevel,
  CognitiveAnalysisResult,
  CognitiveProfile,
  Difficulty,
  EvaluationRubric,
  FeedbackCoachResult,
  MAX_QUESTION_COUNT,
  MIN_QUESTION_COUNT,
  OrchestratorSynthesis,
  Question,
  QuestionCategory,
  QuestionEvaluation,
  StudentAnswer,
} from '@/types/assessment';

export const RUBRIC_VERSION = '1.0';
export const ANSWER_CORRECTNESS_WEIGHT = 0.7;
export const REASONING_QUALITY_WEIGHT = 0.3;
export const MIN_BLOOM_EVIDENCE_COUNT = 2;

export class AssessmentOutputValidationError extends Error {}

export function isBloomLevel(value: unknown): value is BloomLevel {
  return typeof value === 'string' && (BLOOM_LEVELS as readonly string[]).includes(value);
}

export function parseQuestionGenerationConfig(
  questionCount: unknown,
  targetBloomLevels: unknown,
): { questionCount: number; targetBloomLevels: BloomLevel[] } | null {
  const isValid =
    typeof questionCount === 'number' &&
    Number.isInteger(questionCount) &&
    questionCount >= MIN_QUESTION_COUNT &&
    questionCount <= MAX_QUESTION_COUNT &&
    Array.isArray(targetBloomLevels) &&
    targetBloomLevels.length > 0 &&
    targetBloomLevels.length <= questionCount &&
    targetBloomLevels.every(isBloomLevel) &&
    new Set(targetBloomLevels).size === targetBloomLevels.length
  if (!isValid) return null;
  return {
    questionCount,
    targetBloomLevels: [...targetBloomLevels],
  };
}

const SCORE_BANDS: EvaluationRubric['scoreBands'] = [
  { minScore: 0, maxScore: 24, label: 'Not yet demonstrated', criteria: 'The answer is missing or does not meet the stated objective.' },
  { minScore: 25, maxScore: 49, label: 'Emerging', criteria: 'The response shows limited progress but has substantial gaps.' },
  { minScore: 50, maxScore: 74, label: 'Developing', criteria: 'The response meets part of the objective with some gaps or unsupported steps.' },
  { minScore: 75, maxScore: 100, label: 'Demonstrated', criteria: 'The response meets the objective with an accurate, sufficiently supported result.' },
];

export const BLOOM_RUBRICS: Record<BloomLevel, Pick<EvaluationRubric, 'answerCriteria' | 'reasoningCriteria'>> = {
  remember: {
    answerCriteria: 'Recall the relevant fact, term, or rule accurately.',
    reasoningCriteria: 'Identify the relevant remembered information without adding unsupported claims.',
  },
  understand: {
    answerCriteria: 'Interpret or explain the relevant idea accurately in the context of the question.',
    reasoningCriteria: 'Make the meaning clear and connect the explanation to the prompt.',
  },
  apply: {
    answerCriteria: 'Use the relevant rule or procedure correctly in the given situation.',
    reasoningCriteria: 'Show the key application steps and preserve the conditions in the prompt.',
  },
  analyze: {
    answerCriteria: 'Identify the relevant structure, relationships, or constraints and reach a conclusion consistent with them.',
    reasoningCriteria: 'Connect evidence to the conclusion and distinguish relevant from unsupported assumptions.',
  },
  evaluate: {
    answerCriteria: 'Reach a defensible judgment using the stated criteria or constraints.',
    reasoningCriteria: 'Explain the criteria used and support the judgment with relevant evidence.',
  },
  create: {
    answerCriteria: 'Produce a coherent response or solution that satisfies the stated requirements.',
    reasoningCriteria: 'Explain the design choices and show how the response meets the constraints.',
  },
};

const QUESTION_CATEGORIES: QuestionCategory[] = [
  'logical_reasoning',
  'pattern_recognition',
  'problem_solving',
];
const QUESTION_CATEGORY_TITLES: Record<QuestionCategory, string> = {
  logical_reasoning: 'Logical Reasoning',
  pattern_recognition: 'Pattern Recognition',
  problem_solving: 'Problem Solving',
};

export function createEvaluationRubric(bloomLevel: BloomLevel): EvaluationRubric {
  return {
    version: RUBRIC_VERSION,
    bloomLevel,
    ...BLOOM_RUBRICS[bloomLevel],
    scoreBands: SCORE_BANDS,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isScore(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
}

function isAnswerCorrectness(
  value: unknown,
): value is QuestionEvaluation['answerCorrectness'] {
  return value === 'correct' ||
    value === 'partially_correct' ||
    value === 'incorrect' ||
    value === 'unanswered' ||
    value === 'uncertain';
}

export function validateGeneratedQuestions(
  value: unknown,
  difficulty: Difficulty,
  topic?: string,
  config: { questionCount: number; targetBloomLevels?: BloomLevel[] } = {
    questionCount: 3,
  },
): Question[] {
  if (
    !isRecord(value) ||
    !Array.isArray(value.questions) ||
    value.questions.length !== config.questionCount ||
    value.questions.length < MIN_QUESTION_COUNT ||
    value.questions.length > MAX_QUESTION_COUNT
  ) {
    throw new AssessmentOutputValidationError(
      `Question generation must return exactly ${config.questionCount} questions.`,
    );
  }

  const seenIds = new Set<string>();
  const seenPrompts = new Set<string>();
  const seenCategories = new Set<QuestionCategory>();

  const questions = value.questions.map((rawQuestion, index): Question => {
    if (!isRecord(rawQuestion)) {
      throw new AssessmentOutputValidationError(`Generated question ${index + 1} is not an object.`);
    }

    const { id, category, categoryTitle, question, expectedAnswer, explanation, bloomLevel } = rawQuestion;
    if (
      !isString(id) ||
      !QUESTION_CATEGORIES.includes(category as QuestionCategory) ||
      !isString(categoryTitle) ||
      !isString(question) ||
      !isString(expectedAnswer) ||
      !isString(explanation) ||
      !isBloomLevel(bloomLevel) ||
      question.length > 2000 ||
      expectedAnswer.length > 2000 ||
      explanation.length > 1000
    ) {
      throw new AssessmentOutputValidationError(`Generated question ${index + 1} is missing valid required fields.`);
    }
    if (rawQuestion.difficulty !== undefined && rawQuestion.difficulty !== difficulty) {
      throw new AssessmentOutputValidationError(`Generated question ${index + 1} has difficulty metadata that conflicts with the requested setting.`);
    }
    const normalizedPrompt = question.toLowerCase().replace(/[\W_]+/g, ' ').trim();
    if (seenIds.has(id) || seenPrompts.has(normalizedPrompt)) {
      throw new AssessmentOutputValidationError('Generated questions must have unique IDs and distinct prompts.');
    }

    seenIds.add(id);
    seenPrompts.add(normalizedPrompt);
    seenCategories.add(category as QuestionCategory);

    return {
      id,
      category: category as QuestionCategory,
      categoryTitle: QUESTION_CATEGORY_TITLES[category as QuestionCategory],
      question,
      expectedAnswer,
      explanation,
      difficulty,
      bloomLevel,
      evaluationRubric: createEvaluationRubric(bloomLevel),
      ...(topic ? { topic } : {}),
      source: rawQuestion.source === 'demo' ? 'demo' : isString(rawQuestion.source) ? rawQuestion.source : 'model-generated',
    };
  });

  if (QUESTION_CATEGORIES.some((category) => !seenCategories.has(category))) {
    throw new AssessmentOutputValidationError('Generated questions must cover logical reasoning, pattern recognition, and problem solving.');
  }
  if (config.targetBloomLevels) {
    const levels = new Set(questions.map((question) => question.bloomLevel));
    if (
      questions.some((question) => !config.targetBloomLevels?.includes(question.bloomLevel)) ||
      config.targetBloomLevels.some((level) => !levels.has(level))
    ) {
      throw new AssessmentOutputValidationError('Generated questions must include each selected Bloom level and no unselected levels.');
    }
  }

  return questions;
}

export function buildCognitiveProfile(evaluations: QuestionEvaluation[], questions: Question[]): CognitiveProfile {
  const scores = Object.fromEntries(BLOOM_LEVELS.map((level) => [level, null])) as Record<BloomLevel, number | null>;
  const evidenceCounts = Object.fromEntries(BLOOM_LEVELS.map((level) => [level, 0])) as Record<BloomLevel, number>;

  for (const level of BLOOM_LEVELS) {
    const levelEvaluations = evaluations.filter((evaluation) => {
      const question = questions.find((item) => item.id === evaluation.questionId);
      return question?.bloomLevel === level && evaluation.answerCorrectness !== 'unanswered';
    });

    evidenceCounts[level] = levelEvaluations.length;
    if (levelEvaluations.length > 0) {
      scores[level] = Math.round(
        levelEvaluations.reduce((total, evaluation) => total + evaluation.score, 0) / levelEvaluations.length,
      );
    }
  }

  return {
    scores,
    evidenceCounts,
    insufficientEvidenceLevels: BLOOM_LEVELS.filter(
      (level) => evidenceCounts[level] < MIN_BLOOM_EVIDENCE_COUNT,
    ),
  };
}

export function validateCognitiveAnalysis(
  value: unknown,
  questions: Question[],
  studentAnswers: StudentAnswer[],
  studentName: string,
): CognitiveAnalysisResult {
  if (!isRecord(value) || !Array.isArray(value.evaluations) || value.evaluations.length !== questions.length) {
    throw new AssessmentOutputValidationError('The response evaluator returned an invalid evaluation set.');
  }

  const questionById = new Map(questions.map((question) => [question.id, question]));
  const answerById = new Map(studentAnswers.map((answer) => [answer.questionId, answer]));
  const evaluations = value.evaluations.map((rawEvaluation): QuestionEvaluation => {
    if (!isRecord(rawEvaluation) || !isString(rawEvaluation.questionId)) {
      throw new AssessmentOutputValidationError('The response evaluator returned an invalid question evaluation.');
    }

    const question = questionById.get(rawEvaluation.questionId);
    const correctness = rawEvaluation.answerCorrectness;
    const reasoningScore = rawEvaluation.reasoningQualityScore;
    if (
      !question ||
      !isAnswerCorrectness(correctness) ||
      !isScore(rawEvaluation.answerCorrectnessScore) ||
      !(reasoningScore === null || isScore(reasoningScore)) ||
      typeof rawEvaluation.confidence !== 'number' ||
      !Number.isFinite(rawEvaluation.confidence) ||
      rawEvaluation.confidence < 0 ||
      rawEvaluation.confidence > 1 ||
      rawEvaluation.rubricVersion !== question.evaluationRubric.version ||
      !Array.isArray(rawEvaluation.evidence) ||
      !rawEvaluation.evidence.every(isString) ||
      !Array.isArray(rawEvaluation.misconceptions) ||
      !rawEvaluation.misconceptions.every(isString) ||
      !isString(rawEvaluation.feedback) ||
      !isString(rawEvaluation.cognitiveErrorAnalysis) ||
      !isString(rawEvaluation.demonstratedStrengths) ||
      !isString(rawEvaluation.evidenceNotes)
    ) {
      throw new AssessmentOutputValidationError(`The response evaluator returned invalid fields for question ${rawEvaluation.questionId}.`);
    }

    const answer = answerById.get(question.id);
    const studentAnswer = answer?.answer.trim() ?? '';
    const studentReasoning = answer?.reasoning?.trim() ?? '';
    const hasAnswer = studentAnswer.length > 0;
    const hasReasoning = studentReasoning.length > 0;
    const answerCorrectness = hasAnswer
      ? correctness === 'unanswered'
        ? 'uncertain'
        : correctness
      : 'unanswered';
    const answerCorrectnessScore = hasAnswer ? rawEvaluation.answerCorrectnessScore : 0;
    const reasoningQualityScore = hasReasoning && reasoningScore !== null ? reasoningScore : null;
    const score = !hasAnswer
      ? 0
      : reasoningQualityScore === null
        ? answerCorrectnessScore
        : Math.round(
            answerCorrectnessScore * ANSWER_CORRECTNESS_WEIGHT +
              reasoningQualityScore * REASONING_QUALITY_WEIGHT,
          );
    const evidence = hasAnswer ? rawEvaluation.evidence.filter(isString) : [];
    const submittedText = `${studentAnswer}\n${studentReasoning}`.toLocaleLowerCase();
    if (hasAnswer && evidence.length === 0) {
      throw new AssessmentOutputValidationError(
        `The response evaluator did not cite submitted evidence for question ${question.id}.`,
      );
    }
    if (hasAnswer && evidence.some((item) => !submittedText.includes(item.toLocaleLowerCase()))) {
      throw new AssessmentOutputValidationError(
        `The response evaluator cited evidence that was not submitted for question ${question.id}.`,
      );
    }

    const normalizedCorrectness = answerCorrectness;
    const isCorrect: QuestionEvaluation['isCorrect'] =
      normalizedCorrectness === 'correct'
        ? true
        : normalizedCorrectness === 'incorrect'
          ? false
          : normalizedCorrectness === 'uncertain'
            ? 'uncertain'
            : normalizedCorrectness === 'unanswered'
              ? 'unanswered'
              : 'partial';
    const noReasoningFeedback = hasAnswer
      ? 'Only a final answer was provided; reasoning quality cannot be assessed without an explanation.'
      : 'No answer was provided, so this item could not be evaluated.';

    return {
      questionId: question.id,
      category: question.category,
      categoryTitle: question.categoryTitle,
      bloomLevel: question.bloomLevel,
      question: question.question,
      expectedAnswer: question.expectedAnswer,
      studentAnswer: hasAnswer ? studentAnswer : 'No answer submitted',
      ...(hasReasoning ? { studentReasoning } : {}),
      isCorrect,
      score,
      answerCorrectness: normalizedCorrectness,
      answerCorrectnessScore,
      reasoningQualityScore,
      evidence,
      misconceptions: hasReasoning ? rawEvaluation.misconceptions : [],
      confidence: hasAnswer ? rawEvaluation.confidence : 1,
      rubricVersion: question.evaluationRubric.version,
      feedback: hasReasoning ? rawEvaluation.feedback : noReasoningFeedback,
      cognitiveErrorAnalysis: hasReasoning
        ? rawEvaluation.cognitiveErrorAnalysis
        : noReasoningFeedback,
      demonstratedStrengths: hasReasoning
        ? rawEvaluation.demonstratedStrengths
        : 'No reasoning strategy can be assessed without an explanation.',
      evidenceNotes: hasReasoning
        ? rawEvaluation.evidenceNotes
        : 'No reasoning evidence was submitted.',
    };
  });

  if (new Set(evaluations.map((evaluation) => evaluation.questionId)).size !== questions.length) {
    throw new AssessmentOutputValidationError('The response evaluator returned duplicate or missing question evaluations.');
  }

  const average = (scores: number[]) =>
    scores.length === 0 ? 0 : Math.round(scores.reduce((total, score) => total + score, 0) / scores.length);
  const answeredEvaluations = evaluations.filter(
    (evaluation) => evaluation.answerCorrectness !== 'unanswered',
  );
  const scoreForCategory = (category: QuestionCategory) =>
    average(
      answeredEvaluations
        .filter((evaluation) => evaluation.category === category)
        .map((evaluation) => evaluation.score),
    );
  const reasoningScores = evaluations
    .map((evaluation) => evaluation.reasoningQualityScore)
    .filter((score): score is number => score !== null);

  return {
    studentName,
    overallScore: average(answeredEvaluations.map((evaluation) => evaluation.score)),
    evaluations,
    cognitiveProfile: buildCognitiveProfile(evaluations, questions),
    categoryScores: {
      logicalReasoning: scoreForCategory('logical_reasoning'),
      patternRecognition: scoreForCategory('pattern_recognition'),
      problemSolving: scoreForCategory('problem_solving'),
    },
    reasoningClarityScore: reasoningScores.length > 0 ? average(reasoningScores) : null,
  };
}

export function validateFeedbackCoach(value: unknown): FeedbackCoachResult {
  if (
    !isRecord(value) ||
    !Array.isArray(value.observedStrengths) ||
    !value.observedStrengths.every(isString) ||
    !Array.isArray(value.areasToImprove) ||
    !value.areasToImprove.every(isString) ||
    !Array.isArray(value.practiceSuggestions) ||
    !value.practiceSuggestions.every(
      (suggestion) =>
        isRecord(suggestion) &&
        isString(suggestion.title) &&
        isString(suggestion.description) &&
        isString(suggestion.exampleExercise),
    ) ||
    !isString(value.encouragementNote)
  ) {
    throw new Error('The feedback coach returned an invalid report.');
  }

  return {
    observedStrengths: value.observedStrengths,
    areasToImprove: value.areasToImprove,
    practiceSuggestions: value.practiceSuggestions.map((suggestion) => ({
      title: (suggestion as Record<string, string>).title,
      description: (suggestion as Record<string, string>).description,
      exampleExercise: (suggestion as Record<string, string>).exampleExercise,
    })),
    encouragementNote: value.encouragementNote,
  };
}

export function validateOrchestratorSynthesis(value: unknown): OrchestratorSynthesis {
  if (
    !isRecord(value) ||
    !isString(value.executiveSummary) ||
    !isString(value.cognitiveProfileType) ||
    !isString(value.keyTakeaway)
  ) {
    throw new Error('The report synthesis returned an invalid result.');
  }

  return {
    executiveSummary: value.executiveSummary,
    cognitiveProfileType: value.cognitiveProfileType,
    keyTakeaway: value.keyTakeaway,
  };
}
