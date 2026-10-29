
# Cognitive Assessment System — Implementation Tasks

## Project Goal

Build a working multi-agent student cognitive assessment system inspired by the IEEE paper, while keeping the existing website polished and making the assessment process visibly active and trustworthy.

**Core principle:** The interface must show real work being performed by the backend. Do not fake progress, agent activity, scores, or completion states. If a step is simulated for a demo, label it clearly as Demo Mode.

## Research Alignment

The project should reflect these key concepts from the paper:

- Bloom's Taxonomy: Remember, Understand, Apply, Analyze, Evaluate, Create.
- Classifying questions according to cognitive levels.
- Evaluating student answers at the relevant cognitive level.
- Producing a cognitive profile across levels, not just one overall score.
- Comparing the original paper's classical ML approach with our LLM-agent approach.

**Important:** The paper uses SVM for question classification and Random Forest models for response assessment. Our LLM-based implementation is an adaptation, not an exact reproduction, unless those original models are implemented and evaluated.

## Proposed Architecture

Student UI
    |
    v
Assessment API / Orchestrator
    |
    +--> Agent 1: Question Generator
    |
    +--> Student answers
    |
    +--> Agent 2: Response and Reasoning Evaluator
    |
    +--> Agent 3: Cognitive Profile and Coaching Report
    |
    v
Validated assessment result
    |
    +--> Database: assessments, questions, answers, evaluations
    |
    v
Live progress UI + Results dashboard

Use the existing project stack wherever possible. If Groq is already configured, continue using it for the MVP. All API keys must remain server-side.

---

# PHASE 0 — Audit the Existing Project

- [x] 0.1 Review the repository, routes, components, API handlers, and environment variables.
- [x] 0.2 Identify which features are real, mocked, static, or incomplete.
- [x] 0.3 Document the current flow from assessment launch to final result.
- [x] 0.4 Confirm the LLM provider and verify server-side secret handling.
- [x] 0.5 Create `ARCHITECTURE.md` documenting the actual stack and request flow.
- [x] 0.6 Preserve existing working UI and avoid unnecessary redesign.

**Done when:** We know what already works and what still needs implementation.

# PHASE 1 — Define Data Models and Scoring

- [x] 1.1 Define the six Bloom levels in a shared constants/config file.
- [x] 1.2 Create a scoring rubric for each cognitive level.
- [x] 1.3 Define a question schema containing:
  - id
  - prompt
  - difficulty
  - bloomLevel
  - expectedAnswer or answer criteria
  - evaluationRubric
  - optional topic and source
- [x] 1.4 Define an evaluation schema containing:
  - answer correctness
  - reasoning quality
  - rubric-based score
  - evidence from the student's answer
  - misconceptions or gaps
  - confidence or uncertainty
  - concise feedback
- [x] 1.5 Define a cognitive-profile schema with scores for all six levels.
- [x] 1.6 Validate model output against schemas before using it.
- [x] 1.7 Define behavior for missing answers, invalid output, timeouts, and partial assessments.
- [x] 1.8 Store concise evidence-based explanations; never expose hidden chain-of-thought.

**Done when:** The frontend and backend share stable data contracts and handle invalid model responses safely.

# PHASE 2 — Orchestration and Persistence

- [x] 2.1 Create a server-side assessment entry point, such as `POST /api/assessments`.
- [x] 2.2 Generate an assessment ID before starting long-running work.
- [x] 2.3 Track lifecycle states:
  - queued
  - generating_questions
  - awaiting_answers
  - evaluating
  - generating_report
  - completed
  - failed
- [x] 2.4 Create an orchestrator that controls state transitions.
- [x] 2.5 Persist assessments, questions, answers, evaluations, and reports using the existing database if available.
- [x] 2.6 Create an endpoint to fetch assessment status and progress events.
- [x] 2.7 Add input validation, timeouts, and safe retries for transient failures.
- [x] 2.8 Prevent duplicate submissions from creating duplicate evaluations.
- [x] 2.9 Never expose API keys or sensitive provider errors to the browser.
- [x] 2.10 Add a deterministic mock provider for development and automated tests.

**Done when:** Every assessment has a persistent ID and a truthful, queryable lifecycle, including failure states.

# PHASE 3 — Agent 1: Question Generator

- [x] 3.1 Define inputs: topic, difficulty, number of questions, and target Bloom levels.
- [x] 3.2 Generate questions with clear wording and a specific cognitive objective.
- [x] 3.3 Attach Bloom level, expected-answer criteria, and evaluation rubric to every question.
- [ ] 3.4 Check for duplicates, ambiguity, missing metadata, and difficulty mismatches.
- [x] 3.5 Validate generated questions and retry once if output is invalid.
- [x] 3.6 Save validated questions before displaying them.
- [x] 3.7 Add an evaluator/debug view for inspecting question labels and rubrics.

**Done when:** Questions are genuinely generated and validated by the backend rather than hard-coded and presented as AI-generated.

# PHASE 4 — Student Answer Submission

- [x] 4.1 Preserve or implement the question-taking UI.
- [x] 4.2 Allow students to provide answers and explain their reasoning.
- [x] 4.3 Save answers against the correct assessment ID and question ID.
- [x] 4.4 Prevent accidental duplicate submissions.
- [x] 4.5 Show clear validation, saving, and network-error states.
- [x] 4.6 Resume an assessment after refresh when persistence is available.
- [x] 4.7 Clearly indicate when an answer has been saved successfully.

**Done when:** Answers are stored reliably and can be evaluated after refresh.

# PHASE 5 — Agent 2: Response and Reasoning Evaluator

- [x] 5.1 Pass the question, Bloom level, expected-answer criteria, rubric, and student answer to the evaluator.
- [x] 5.2 Score answer correctness separately from reasoning quality.
- [x] 5.3 Evaluate using the defined rubric rather than a vague instruction to judge intelligence.
- [x] 5.4 Return a concise explanation grounded in specific parts of the student's answer.
- [x] 5.5 Identify misconceptions, missing steps, and unsupported claims.
- [x] 5.6 Return uncertainty for ambiguous answers instead of inventing precision.
- [x] 5.7 Validate output and handle provider failures.
- [x] 5.8 Save evaluations and the rubric version used.
- [x] 5.9 Never present an LLM score as a clinical diagnosis or definitive measurement of intelligence.

**Done when:** Each submitted answer receives a structured, rubric-based evaluation.

# PHASE 6 — Agent 3: Cognitive Profile and Coaching

- [x] 6.1 Aggregate question evaluations into a profile across all six Bloom levels.
- [x] 6.2 Show the number of evaluated questions per level.
- [x] 6.3 Mark levels as insufficient evidence when too few questions were answered.
- [x] 6.4 Identify strengths and improvement areas using evidence from responses.
- [x] 6.5 Generate actionable recommendations tied to identified weaknesses.
- [x] 6.6 Suggest follow-up exercises targeting weaker areas.
- [x] 6.7 Separate measured results from AI-generated interpretations.
- [x] 6.8 Include assessment date, scoring definitions, and limitations.
- [x] 6.9 Save the report so the student can revisit it.

**Done when:** The report explains the student's performance and gives useful next steps rather than displaying only one score.

# PHASE 7 — Real-Time Product UI

The interface should feel like a professional assessment product. It must show what is happening, what has finished, and what is waiting without inventing activity.

## 7A. Assessment Progress

- [x] 7.1 Create an assessment on the server when the user launches it.
- [x] 7.2 Receive an assessment ID and display an Assessment in Progress screen.
- [x] 7.3 Add a persistent progress timeline with relevant stages:
  1. Initializing assessment
  2. Generating questions
  3. Validating cognitive-level coverage
  4. Saving assessment
  5. Evaluating responses
  6. Building cognitive profile
  7. Preparing recommendations
  8. Finalizing report
- [x] 7.4 Show only stages that are genuinely implemented and relevant to the current workflow.
- [x] 7.5 Use explicit statuses: waiting, in progress, completed, and failed.
- [x] 7.6 Show timestamps where useful.
- [x] 7.7 Animate only the active step and respect reduced-motion preferences.
- [x] 7.8 Add an activity log with real events such as "Question set validated" or "Response 2 of 5 evaluated."
- [x] 7.9 Never expose private prompts, API keys, or hidden reasoning in the activity log.
- [x] 7.10 Use server-reported progress as the source of truth.
- [x] 7.11 Never use a timer to automatically advance progress to 100%.
- [x] 7.12 Add a slow-processing state with an explanation and recovery option.
- [x] 7.13 Identify the failed stage and provide a safe retry on errors.
- [x] 7.14 Preserve the assessment ID and submitted answers across refreshes.
- [x] 7.15 Show completion only after the final report is successfully saved.

## 7B. Product-Quality Details

- [x] 7.16 Use consistent status icons, timestamps, spacing, and typography.
- [x] 7.17 Preserve the existing brand and visual language.
- [x] 7.18 Add skeleton loading states for report cards and charts when data is loading.
- [x] 7.19 Show selected topic, difficulty, question count, and assessment ID where appropriate.
- [x] 7.20 Make the timeline responsive on mobile and desktop.
- [x] 7.21 Handle empty states, partial results, errors, and refreshes.
- [x] 7.22 Add an assessment-details view showing which stages ran and when.
- [x] 7.23 Clearly label mock data and simulated processing as Demo Mode.

**Done when:** The UI reflects actual backend events, survives refreshes, and handles delays and failures honestly.

# PHASE 8 — Results Dashboard and History

- [x] 8.1 Display a profile chart containing all six Bloom levels.
- [x] 8.2 Explain score definitions and calculation methods.
- [x] 8.3 Display evidence-based strengths and improvement areas.
- [x] 8.4 Allow inspection of individual question feedback.
- [ ] 8.5 Show previous assessments if identity and persistence are implemented.
- [ ] 8.6 Compare assessments only when scoring methods are comparable.
- [x] 8.7 Distinguish unavailable data from a score of zero.
- [x] 8.8 Add a print/export view if useful for the seminar demonstration.

**Done when:** Students can understand results, inspect evidence, and revisit previous assessments.

# PHASE 9 — Research Validation

- [ ] 9.1 Create a small, ethically sourced evaluation set with reference answers and human-assigned rubric scores.
- [ ] 9.2 Have a human reviewer grade a subset of responses.
- [ ] 9.3 Compare agent scores with human scores using suitable metrics, such as agreement or mean absolute error.
- [ ] 9.4 Measure Bloom-level classification agreement against human labels.
- [ ] 9.5 Test consistency by evaluating selected responses multiple times.
- [ ] 9.6 Include correct, partially correct, incorrect, and ambiguous answers.
- [ ] 9.7 Record model/provider, prompt version, rubric version, test-set size, and evaluation date.
- [ ] 9.8 Create a paper-versus-project comparison covering methods, common concepts, differences, and measured results.
- [ ] 9.9 Never claim the paper's reported accuracy figures for this project without independently reproducing them under a comparable evaluation protocol.
- [ ] 9.10 Document limitations such as LLM variability, rubric subjectivity, language effects, and sample size.

**Done when:** The project has measurable evidence of performance and a clear explanation of how it differs from the paper.

# PHASE 10 — Reliability, Privacy, and Deployment

- [x] 10.1 Test schema validation, scoring aggregation, and lifecycle transitions.
- [ ] 10.2 Test provider timeouts, rate limits, invalid output, database failures, and browser refreshes.
- [x] 10.3 Rate-limit assessment creation and validate user input.
- [x] 10.4 Keep API keys on the server and avoid unnecessary logging of student answers.
- [x] 10.5 Explain data storage and provide deletion functionality where applicable.
- [x] 10.6 Avoid presenting results as clinical or psychometric diagnoses.
- [ ] 10.7 Verify responsiveness, keyboard accessibility, color contrast, and reduced-motion behavior.
- [ ] 10.8 Test the deployed production build with real provider configuration.
- [x] 10.9 Provide a clear fallback when the AI provider is unavailable.
- [x] 10.10 Ensure no stage claims success unless its operation succeeded.

**Done when:** The application is reliable, safe to demonstrate, and honest about its outputs.

---

# IMPLEMENTATION MILESTONES

Implement one milestone at a time. Test each milestone before continuing.

## Milestone 1 — Honest End-to-End Skeleton

- [x] Complete Phase 0 audit.
- [x] Define Phase 1 schemas and rubrics.
- [x] Implement assessment ID and lifecycle.
- [x] Implement status endpoint.
- [x] Build progress UI using actual backend status.
- [x] Complete one end-to-end assessment with a clearly labelled mock provider.

**Acceptance test:** Launch an assessment, refresh the page, and see the same assessment status. Mock processing must be clearly labelled.

## Milestone 2 — Real Question Generation

- [x] Implement Agent 1.
- [x] Validate generated questions and handle provider errors.
- [x] Save questions.
- [x] Connect generated questions to the existing UI.

**Acceptance test:** The server generates and saves valid questions with Bloom labels and rubrics.

## Milestone 3 — Student Answers and Evaluation

- [x] Implement answer submission.
- [x] Implement Agent 2.
- [x] Save structured evaluations.
- [x] Connect evaluation events to the progress UI.

**Acceptance test:** Submitted answers are evaluated against question-specific rubrics and can be revisited after refresh.

## Milestone 4 — Cognitive Profile and Report

- [x] Implement Agent 3.
- [x] Build the results dashboard.
- [x] Persist and revisit reports.
- [x] Handle insufficient evidence and partial failures.

**Acceptance test:** The report displays six-level coverage, evidence-based feedback, and actionable recommendations.

## Milestone 5 — Research Validation and Release

- [ ] Implement the evaluation protocol.
- [ ] Complete reliability and privacy checks.
- [ ] Prepare a paper-versus-project comparison.
- [ ] Prepare a final demonstration script.

**Acceptance test:** The system can be demonstrated end-to-end, and its performance claims are supported by measured evidence.

---

# DEFINITION OF DONE

A task is complete only when:

- [ ] The implementation exists in code, not just in the UI.
- [ ] Loading, success, empty, and failure states are handled where relevant.
- [ ] Data is validated and persisted where required.
- [ ] The UI reflects actual backend status.
- [ ] A manual or automated test verifies the behavior.
- [ ] Research claims are supported by measured evidence.
- [ ] Mock behavior is never presented as real AI processing.

# OUT OF SCOPE FOR THE FIRST MVP

Avoid these until the core pipeline works reliably:

- Training custom SVM or Random Forest models from scratch.
- Complex autonomous agent-to-agent conversations.
- Streaming hidden chain-of-thought to the browser.
- Real-time collaboration, leaderboards, and gamification.
- Large-scale analytics or elaborate admin dashboards.

# FIRST TARGET

One student completes one assessment. Questions are generated and tagged with Bloom levels, answers are evaluated against a rubric, a six-level cognitive profile is produced, and the UI truthfully shows each stage as it happens.
