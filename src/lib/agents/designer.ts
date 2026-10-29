import { BloomLevel, Question, QuestionCategory } from '@/types/assessment';
import { callGroqChat, extractJSONFromLLMResponse } from '../groq';
import {
  AssessmentOutputValidationError,
  createEvaluationRubric,
  validateGeneratedQuestions,
} from '../assessment-contracts';

export interface AssessmentDesignerInput {
  gradeLevel?: string;
  focusArea?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  questionCount?: number;
  targetBloomLevels?: BloomLevel[];
}

export const DESIGNER_SYSTEM_PROMPT = `You are Agent 1: Assessment Designer in a Multi-Agent Student Cognitive Assessment system.
Your responsibility:
- Generate the requested number of short reasoning questions:
  1. Logical reasoning (deductive or conditional logic).
  2. Pattern recognition (sequence, analogy, or symbolic pattern).
  3. Problem-solving (practical situational deduction or multi-step logic).
- For each question, provide:
  - An unambiguous question prompt.
  - The precise expected answer.
  - A brief, clear explanation of the underlying reasoning principle.
- Use only the requested Bloom levels and include each requested level at least once.
- Cover all three reasoning categories at least once; additional questions may reuse categories.
- Keep every question distinct, unambiguous, fair, and easy to evaluate objectively.
- Output MUST be valid JSON adhering strictly to the requested schema.`;

export async function runAssessmentDesigner(
  input: AssessmentDesignerInput = {},
): Promise<{ questions: Question[]; rawPrompt: string; rawResponse: string; executionTimeMs: number }> {
  const startTime = Date.now();
  const difficulty = input.difficulty || 'intermediate';
  const gradeLevel = input.gradeLevel || 'Secondary / High School';
  const focusArea = input.focusArea || 'General Cognitive & Analytical Reasoning';
  const questionCount = input.questionCount ?? 3;
  const targetBloomLevels = input.targetBloomLevels ?? ['analyze', 'evaluate'];

  const userPrompt = `Generate exactly ${questionCount} distinct questions for a student at level: ${gradeLevel}, difficulty: ${difficulty}, focus: ${focusArea}.

Include all three categories (logical_reasoning, pattern_recognition, problem_solving) at least once. Use only these Bloom levels and include every listed level at least once: ${targetBloomLevels.join(', ')}. Additional questions may reuse categories and Bloom levels.

Output strictly as a JSON object with a "questions" array containing exactly ${questionCount} objects, each following this structure:
{
  "questions": [{
    "id": "unique_question_id",
    "category": "logical_reasoning | pattern_recognition | problem_solving",
    "categoryTitle": "Human-readable category",
    "bloomLevel": "${targetBloomLevels[0]}",
    "question": "Clear, self-contained question prompt",
    "expectedAnswer": "Answer criteria or acceptable outcome",
    "explanation": "Brief explanation of the reasoning objective"
  }]
}`;

  const generateOnce = async () => {
    const rawResponse = await callGroqChat({
      messages: [
        { role: 'system', content: DESIGNER_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
    });

    let parsed: unknown;
    try {
      parsed = extractJSONFromLLMResponse<unknown>(rawResponse);
    } catch {
      throw new AssessmentOutputValidationError('Question generation returned invalid JSON.');
    }

    return {
      rawResponse,
      questions: validateGeneratedQuestions(parsed, difficulty, focusArea, {
        questionCount,
        targetBloomLevels,
      }),
    };
  };

  try {
    let generated: Awaited<ReturnType<typeof generateOnce>>;
    try {
      generated = await generateOnce();
    } catch (error) {
      if (!(error instanceof AssessmentOutputValidationError)) throw error;
      generated = await generateOnce();
    }
    const executionTimeMs = Date.now() - startTime;

    return {
      questions: generated.questions,
      rawPrompt: userPrompt,
      rawResponse: generated.rawResponse,
      executionTimeMs,
    };
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'GROQ_API_KEY_NOT_CONFIGURED') {
      // Return high quality simulation questions
      const executionTimeMs = Date.now() - startTime;
      return {
        questions: getSimulatedQuestions(difficulty, questionCount, targetBloomLevels, focusArea),
        rawPrompt: userPrompt,
        rawResponse: JSON.stringify(
          { questions: getSimulatedQuestions(difficulty, questionCount, targetBloomLevels, focusArea) },
          null,
          2,
        ),
        executionTimeMs,
      };
    }
    throw error;
  }
}

const DEMO_CATEGORIES: { category: QuestionCategory; title: string }[] = [
  { category: 'logical_reasoning', title: 'Logical Reasoning' },
  { category: 'pattern_recognition', title: 'Pattern Recognition' },
  { category: 'problem_solving', title: 'Problem Solving' },
];

const DEMO_NAMES = [
  ['Alex', 'Liam', 'Maya'],
  ['Riley', 'Jordan', 'Casey'],
  ['Ari', 'Sam', 'Taylor'],
  ['Noah', 'Sofia', 'Evan'],
];

function createDemoQuestion(
  categoryIndex: number,
  variant: number,
  bloomLevel: BloomLevel,
  difficulty: string,
  topic: string,
): Question {
  const { category, title } = DEMO_CATEGORIES[categoryIndex];
  const [first, second, third] = DEMO_NAMES[variant];
  let scenario: string;
  let question: string;
  let expectedAnswer: string;
  let explanation: string;

  if (category === 'logical_reasoning') {
    const groups = ['debate club', 'robotics team', 'science group', 'library committee'];
    const traits = [
      { plural: 'avid readers', singular: 'an avid reader' },
      { plural: 'trained participants', singular: 'a trained participant' },
      { plural: 'registered volunteers', singular: 'a registered volunteer' },
      { plural: 'active volunteers', singular: 'an active volunteer' },
    ];
    const group = groups[variant];
    const trait = traits[variant];
    scenario = `All members of the ${group} are ${trait.plural}. ${first} is a member of the ${group}. ${second} is not ${trait.singular}.`;
    const tasks: Record<BloomLevel, { prompt: string; answer: string; explanation: string }> = {
      remember: {
        prompt: 'State the rule that applies to members of this group.',
        answer: `Every member of the ${group} is ${trait.singular}.`,
        explanation: 'The response recalls the universal rule stated in the scenario.',
      },
      understand: {
        prompt: `Explain what the rule tells us about ${first}.`,
        answer: `${first} is ${trait.singular} because ${first} is a member of the ${group}.`,
        explanation: 'The response interprets the universal rule in the context of a named member.',
      },
      apply: {
        prompt: `Apply the rule to determine whether ${first} is ${trait.singular}.`,
        answer: `Yes. ${first} is ${trait.singular}.`,
        explanation: 'The response applies the given implication to a specific case.',
      },
      analyze: {
        prompt: `Can ${second} be a member of the ${group}? Explain using the stated rule.`,
        answer: `No. Membership implies being ${trait.singular}, so someone who is not ${trait.singular} cannot be a member.`,
        explanation: 'The response uses the contrapositive of the stated implication.',
      },
      evaluate: {
        prompt: `A student claims that ${second} could still be a member of the ${group}. Evaluate the claim using only the scenario.`,
        answer: `The claim is inconsistent with the rule: all members are ${trait.plural}, but ${second} is not ${trait.singular}.`,
        explanation: 'The response judges a claim against the premises and avoids adding assumptions.',
      },
      create: {
        prompt: `Write one conclusion about ${first} and one conclusion about ${second} that follow from the scenario.`,
        answer: `${first} is ${trait.singular}, and ${second} is not a member of the ${group}.`,
        explanation: 'The response constructs two conclusions supported by the stated implication.',
      },
    };
    const task = tasks[bloomLevel];
    question = `${scenario} ${task.prompt}`;
    expectedAnswer = task.answer;
    explanation = task.explanation;
  } else if (category === 'pattern_recognition') {
    const start = variant + 2;
    const increment = variant + 1;
    const terms = [start];
    for (let index = 0; index < 4; index += 1) {
      terms.push(terms[index] * 2 + increment);
    }
    const next = terms[terms.length - 1] * 2 + increment;
    const sequence = terms.join(', ');
    const tasks: Record<BloomLevel, { prompt: string; answer: string; explanation: string }> = {
      remember: {
        prompt: `Recall the next term in this sequence: ${sequence}, ?`,
        answer: String(next),
        explanation: `Each term is twice the previous term plus ${increment}.`,
      },
      understand: {
        prompt: `Explain the rule in the sequence ${sequence}, then give its next term.`,
        answer: `Multiply by 2 and add ${increment}; the next term is ${next}.`,
        explanation: 'The response explains the repeated relationship and its result.',
      },
      apply: {
        prompt: `The sequence ${sequence} follows the rule “multiply by 2, then add ${increment}.” Apply the rule to find the next term.`,
        answer: String(next),
        explanation: 'The response applies the explicitly stated operation to the final term.',
      },
      analyze: {
        prompt: `Analyze the sequence ${sequence}. What consistent operation connects each term, and what comes next?`,
        answer: `Multiply by 2 and add ${increment}; the next term is ${next}.`,
        explanation: 'The response identifies the operation that accounts for each transition.',
      },
      evaluate: {
        prompt: `For the sequence ${sequence}, a student predicts ${next + 1} next. Evaluate this prediction using the rule “multiply by 2, then add ${increment}.”`,
        answer: `The prediction is incorrect; applying the rule gives ${next}.`,
        explanation: 'The response tests a proposed value against the defined operation.',
      },
      create: {
        prompt: `Continue the sequence ${sequence} for two terms and describe the rule you used.`,
        answer: `The next terms are ${next} and ${next * 2 + increment}; multiply each term by 2 and add ${increment}.`,
        explanation: 'The response constructs additional terms that consistently follow the sequence rule.',
      },
    };
    const task = tasks[bloomLevel];
    question = task.prompt;
    expectedAnswer = task.answer;
    explanation = task.explanation;
  } else {
    const scenario = `${first}, ${second}, and ${third} finished first, second, and third in a contest. ${first} finished ahead of ${second}, and ${third} finished second.`;
    const order = `${first} first, ${third} second, ${second} third`;
    const tasks: Record<BloomLevel, { prompt: string; answer: string; explanation: string }> = {
      remember: {
        prompt: 'Which contestant is explicitly stated to have finished second?',
        answer: third,
        explanation: 'The response recalls the placement explicitly stated in the scenario.',
      },
      understand: {
        prompt: 'Explain how the stated placements constrain the final order.',
        answer: `${third} is second; because ${first} is ahead of ${second}, ${first} must be first and ${second} third.`,
        explanation: 'The response interprets both constraints and relates them to the complete order.',
      },
      apply: {
        prompt: 'Apply the two constraints to determine the finishing order.',
        answer: order,
        explanation: 'The response applies the explicit placement and ordering constraints.',
      },
      analyze: {
        prompt: 'Analyze the constraints and list the only finishing order that satisfies both.',
        answer: order,
        explanation: 'The response combines the fixed second place with the relative ordering constraint.',
      },
      evaluate: {
        prompt: `A student proposes this order: ${second} first, ${third} second, ${first} third. Evaluate it against both constraints.`,
        answer: `It is invalid because ${first} would finish after ${second}, contrary to the condition. The valid order is ${order}.`,
        explanation: 'The response checks a proposed solution against each stated constraint.',
      },
      create: {
        prompt: `Give a valid finishing order and add one additional constraint that remains true for that order.`,
        answer: `A valid order is ${order}; for example, ${first} finished before ${second}.`,
        explanation: 'The response constructs a solution that satisfies the original constraints and adds a consistent one.',
      },
    };
    const task = tasks[bloomLevel];
    question = `${scenario} ${task.prompt}`;
    expectedAnswer = task.answer;
    explanation = task.explanation;
  }

  return {
    id: `demo_${category}_${variant + 1}_${bloomLevel}`,
    category,
    categoryTitle: title,
    question,
    expectedAnswer,
    explanation,
    difficulty: difficulty === 'beginner' || difficulty === 'advanced' ? difficulty : 'intermediate',
    bloomLevel,
    evaluationRubric: createEvaluationRubric(bloomLevel),
    topic,
    source: 'demo',
  };
}

export function getSimulatedQuestions(
  difficulty: string = 'intermediate',
  questionCount = 3,
  targetBloomLevels: BloomLevel[] = ['analyze', 'evaluate'],
  topic = 'General Cognitive & Analytical Reasoning',
): Question[] {
  const questions: Question[] = [];
  for (let index = 0; index < questionCount; index += 1) {
    questions.push(
      createDemoQuestion(
        index % DEMO_CATEGORIES.length,
        Math.floor(index / DEMO_CATEGORIES.length),
        targetBloomLevels[index % targetBloomLevels.length],
        difficulty,
        topic,
      ),
    );
  }
  return questions;
}
