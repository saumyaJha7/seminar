import { SampleStudentPreset } from '@/types/assessment';

export const SAMPLE_STUDENT_PRESETS: SampleStudentPreset[] = [
  {
    id: 'preset_balanced',
    label: 'Balanced High-Performer (Detailed Reasoning)',
    studentName: 'Maya Chen',
    description: 'Provides thoughtful, step-by-step reasoning for all three cognitive domains.',
    answers: {
      logical_reasoning: {
        answer: 'Liam is NOT in the debate club, and Alex IS an avid reader.',
        reasoning:
          'Premise 1 states all debate members are avid readers. Alex is a member, so Alex must be an avid reader. Liam is not an avid reader; by contrapositive logic, if someone is not an avid reader, they cannot possibly be in the debate club.',
      },
      pattern_recognition: {
        answer: '159',
        reasoning:
          'I checked the differences between terms: 9-4=5, 19-9=10, 39-19=20, 79-39=40. The difference doubles every time (5, 10, 20, 40). So the next difference must be 80. 79 + 80 = 159. Alternatively, (x * 2) + 1.',
      },
      problem_solving: {
        answer: '1st: Maya, 2nd: Sofia, 3rd: Noah',
        reasoning:
          'Constraint 1: Sofia did not finish 3rd (she is 1st or 2nd). Constraint 2: Maya finished ahead of Sofia, which means Sofia cannot be 1st. Therefore, Sofia must be 2nd! If Sofia is 2nd, Maya must be 1st. That leaves 3rd place for Noah.',
      },
    },
  },
  {
    id: 'preset_rushed',
    label: 'Final Answers Only (Zero Articulated Reasoning)',
    studentName: 'Jordan Taylor',
    description: 'Tests Agent 2\'s ethical rule: "If the student provides only final answers, do not pretend to know their reasoning process".',
    answers: {
      logical_reasoning: {
        answer: 'Liam is out, Alex is a reader.',
        reasoning: '', // Deliberately blank
      },
      pattern_recognition: {
        answer: '159',
        reasoning: '', // Deliberately blank
      },
      problem_solving: {
        answer: 'Maya, Sofia, Noah',
        reasoning: '', // Deliberately blank
      },
    },
  },
  {
    id: 'preset_fallacy',
    label: 'Intuitive but Falls for Heuristic Traps',
    studentName: 'Samira Khan',
    description: 'Demonstrates common cognitive pitfalls like affirming the consequent and linear pattern extrapolation.',
    answers: {
      logical_reasoning: {
        answer: 'Liam could be in the club because maybe non-readers can join on probation.',
        reasoning: 'I assumed maybe there are exceptions for students who are trying to become avid readers.',
      },
      pattern_recognition: {
        answer: '119',
        reasoning: 'I thought the pattern was adding 40 each time after 79.',
      },
      problem_solving: {
        answer: '1st: Sofia, 2nd: Maya, 3rd: Noah',
        reasoning: 'I read Sofia did not finish 3rd so I put her first, then Maya second.',
      },
    },
  },
];
