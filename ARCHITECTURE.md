# Cognitive Assessment Architecture

## Stack and configuration

- Next.js 16 App Router, React 19, and TypeScript.
- Groq SDK for server-side model calls. `GROQ_MODEL` selects the preferred model; model-not-found responses can fall through to configured alternatives. Provider requests have a 45-second timeout and one SDK retry.
- SQLite via `better-sqlite3`, stored at `.data/assessments.sqlite` by default. `ASSESSMENT_DB_PATH` can point to another writable location.
- No user authentication is configured. Assessment creation is limited to 10 requests per 15 minutes per `X-Forwarded-For` address; production must use a trusted proxy that overwrites this header. Only a hash of the address is stored for rate limiting, with stale entries removed after 24 hours. An assessment's random ID currently acts as a bearer token for status and deletion endpoints.

## Assessment lifecycle

1. `AssessmentWorkflow` asks `POST /api/assessments/drafts` for an ID before question generation starts. The draft's status is `generating_questions`.
2. `POST /api/assessment/generate-questions` runs Agent 1, validates the requested 3–12 questions, verifies all selected Bloom levels and reasoning categories are represented, saves the questions to SQLite, and returns them only after persistence. The default is six questions targeting all six Bloom levels. Without a configured Groq key, deterministic questions are used and the assessment is labeled `demo`.
3. Answers and reasoning are kept as a browser draft while the student works. Submission sends the answers to `POST /api/assessments/[assessmentId]/answers`, which validates and persists them before moving the assessment to `queued`.
4. `POST /api/assessment/stream` transitions the saved assessment to `evaluating`, runs the analyzer and coach, persists evaluations and the final report, and then emits the SSE completion event. Invalid output/provider failures are not presented as successful results; the saved assessment moves to `failed` and can be retried.
5. `GET /api/assessments/[assessmentId]` returns the persisted status, questions, answers, evaluations, report, and progress events. The UI polls this endpoint while work is active and restores the active assessment after a page refresh.
6. Completed reports are also cached in browser history for navigation, while the SQLite record is the persistent source of truth. `DELETE /api/assessments/[assessmentId]` removes the record and its related data.

The lifecycle states are `queued`, `generating_questions`, `awaiting_answers`, `evaluating`, `generating_report`, `completed`, and `failed`. State changes and operational events are written to SQLite. Progress logs do not include private prompts, provider keys, or hidden reasoning.

## Evaluation and reporting

- Shared contracts in `src/types/assessment.ts` and `src/lib/assessment-contracts.ts` define the question, rubric, evaluation, and six-level Bloom profile shapes.
- Model output is runtime-validated. Scores separate answer correctness from reasoning quality, and evidence citations must match submitted text.
- Unanswered responses are excluded from measured scores and Bloom evidence counts. Fewer than two answered items at a Bloom level is displayed as insufficient evidence. If no responses are submitted, the report avoids inferring strengths or weaknesses.
- Reports distinguish formative scores from AI-generated synthesis and state that results are not clinical or norm-referenced measures.
- Demo behavior is deterministic for the same answers and is labeled `Demo Mode`; it is not represented as live AI evaluation.

## Limitations and deployment notes

- The generator covers all three reasoning categories and every selected Bloom level, but scores for a Bloom level still require at least two answered items to meet the report's evidence threshold.
- Generated questions are checked for required metadata, requested difficulty, Bloom/category coverage, unique IDs, and duplicate normalized prompts. Structural checks cannot guarantee semantic clarity or detect every near-duplicate; human review is still needed before using items for consequential decisions.
- This project adapts Bloom-level assessment ideas using LLM agents; it does not reproduce the source paper's SVM or Random Forest models. No research accuracy claims have been measured.
- SQLite data survives process restarts when the database path is on persistent storage. Ephemeral/serverless deployments need a persistent volume or a different database adapter.
- Assessment IDs are bearer credentials: anyone who obtains one can read or delete that assessment. Authentication, authorization, proxy trust configuration, a user-facing data-retention policy, and production deployment validation remain to be implemented before public deployment. The creation rate limit is not a substitute for access controls.
- The project has been validated with a local Demo Mode end-to-end smoke test. Real-provider behavior, human-graded research validation, deployment behavior, and broader accessibility checks remain unverified.
