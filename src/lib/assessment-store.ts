import Database from 'better-sqlite3';
import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import {
  AssessmentLifecycleStatus,
  AssessmentMode,
  AssessmentPipelineCheckpoint,
  AssessmentProgressEvent,
  AssessmentRecord,
  BLOOM_LEVELS,
  BloomLevel,
  Difficulty,
  FinalAssessmentReport,
  Question,
  QuestionEvaluation,
  StudentAnswer,
} from '@/types/assessment';

type DatabaseConnection = InstanceType<typeof Database>;

interface AssessmentInput {
  studentName: string;
  gradeLevel: string;
  difficulty: Difficulty;
  focusArea: string;
  questionCount?: number;
  targetBloomLevels?: BloomLevel[];
  questions: Question[];
  answers: StudentAnswer[];
  mode: AssessmentMode;
}

interface DraftAssessmentInput extends Omit<AssessmentInput, 'studentName' | 'answers'> {
  studentName?: string;
}

interface AssessmentRow {
  id: string;
  idempotency_key: string | null;
  status: AssessmentLifecycleStatus;
  mode: AssessmentMode;
  created_at: string;
  updated_at: string;
  student_name: string;
  grade_level: string;
  difficulty: Difficulty;
  focus_area: string;
  question_count: number;
  target_bloom_levels: string;
  failure_stage: string | null;
  pipeline_checkpoint: string | null;
  pause_requested: number;
}

const globalForAssessmentDb = globalThis as typeof globalThis & {
  assessmentDatabase?: DatabaseConnection;
  assessmentSchemaVersion?: number;
};
const ASSESSMENT_SCHEMA_VERSION = 2;
const ASSESSMENT_CREATION_LIMIT = 10;
const ASSESSMENT_CREATION_WINDOW_MS = 15 * 60 * 1000;

function initializeDatabase(database: DatabaseConnection): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS assessments (
      id TEXT PRIMARY KEY,
      idempotency_key TEXT UNIQUE,
      status TEXT NOT NULL,
      mode TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      student_name TEXT NOT NULL,
      grade_level TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      focus_area TEXT NOT NULL,
      question_count INTEGER NOT NULL DEFAULT 3,
      target_bloom_levels TEXT NOT NULL DEFAULT '["analyze","evaluate"]',
      failure_stage TEXT,
      pipeline_checkpoint TEXT,
      pause_requested INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS assessment_questions (
      assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
      question_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      question_json TEXT NOT NULL,
      PRIMARY KEY (assessment_id, question_id)
    );
    CREATE TABLE IF NOT EXISTS assessment_answers (
      assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
      question_id TEXT NOT NULL,
      answer TEXT NOT NULL,
      reasoning TEXT NOT NULL,
      PRIMARY KEY (assessment_id, question_id)
    );
    CREATE TABLE IF NOT EXISTS assessment_evaluations (
      assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
      question_id TEXT NOT NULL,
      evaluation_json TEXT NOT NULL,
      PRIMARY KEY (assessment_id, question_id)
    );
    CREATE TABLE IF NOT EXISTS assessment_reports (
      assessment_id TEXT PRIMARY KEY REFERENCES assessments(id) ON DELETE CASCADE,
      report_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS assessment_events (
      id TEXT PRIMARY KEY,
      assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
      timestamp TEXT NOT NULL,
      stage TEXT NOT NULL,
      status TEXT NOT NULL,
      message TEXT NOT NULL,
      agent_id TEXT
    );
    CREATE INDEX IF NOT EXISTS assessment_events_by_assessment
      ON assessment_events (assessment_id, timestamp);
    CREATE TABLE IF NOT EXISTS assessment_creation_limits (
      address_hash TEXT PRIMARY KEY,
      window_started_at INTEGER NOT NULL,
      request_count INTEGER NOT NULL
    );
  `);
  const assessmentColumns = database.pragma('table_info(assessments)') as { name: string }[];
  if (!assessmentColumns.some((column) => column.name === 'question_count')) {
    database.exec('ALTER TABLE assessments ADD COLUMN question_count INTEGER NOT NULL DEFAULT 3');
  }
  if (!assessmentColumns.some((column) => column.name === 'target_bloom_levels')) {
    database.exec(`ALTER TABLE assessments ADD COLUMN target_bloom_levels TEXT NOT NULL DEFAULT '["analyze","evaluate"]'`);
  }
  if (!assessmentColumns.some((column) => column.name === 'pipeline_checkpoint')) {
    database.exec('ALTER TABLE assessments ADD COLUMN pipeline_checkpoint TEXT');
  }
  if (!assessmentColumns.some((column) => column.name === 'pause_requested')) {
    database.exec('ALTER TABLE assessments ADD COLUMN pause_requested INTEGER NOT NULL DEFAULT 0');
  }
}

function getDatabase(): DatabaseConnection {
  let database = globalForAssessmentDb.assessmentDatabase;
  if (!database) {
    const configuredPath = process.env.ASSESSMENT_DB_PATH;
    const databasePath = configuredPath
      ? resolve(configuredPath)
      : join(process.cwd(), '.data', 'assessments.sqlite');
    mkdirSync(dirname(databasePath), { recursive: true });

    database = new Database(databasePath);
    database.pragma('journal_mode = WAL');
    database.pragma('foreign_keys = ON');
    database.pragma('busy_timeout = 5000');
    globalForAssessmentDb.assessmentDatabase = database;
  }

  if (globalForAssessmentDb.assessmentSchemaVersion !== ASSESSMENT_SCHEMA_VERSION) {
    initializeDatabase(database);
    globalForAssessmentDb.assessmentSchemaVersion = ASSESSMENT_SCHEMA_VERSION;
  }

  return database;
}

export function consumeAssessmentCreationLimit(
  clientAddress: string,
): { allowed: boolean; retryAfterSeconds: number } {
  const database = getDatabase();
  const addressHash = createHash('sha256').update(clientAddress).digest('hex');
  const now = Date.now();
  const result = database.transaction(() => {
    database.prepare('DELETE FROM assessment_creation_limits WHERE window_started_at < ?')
      .run(now - 24 * 60 * 60 * 1000);
    const existing = database.prepare(`
      SELECT window_started_at, request_count
      FROM assessment_creation_limits WHERE address_hash = ?
    `).get(addressHash) as { window_started_at: number; request_count: number } | undefined;

    if (!existing || now - existing.window_started_at >= ASSESSMENT_CREATION_WINDOW_MS) {
      database.prepare(`
        INSERT INTO assessment_creation_limits (address_hash, window_started_at, request_count)
        VALUES (?, ?, 1)
        ON CONFLICT(address_hash) DO UPDATE SET
          window_started_at = excluded.window_started_at,
          request_count = excluded.request_count
      `).run(addressHash, now);
      return { allowed: true, retryAfterSeconds: 0 };
    }

    if (existing.request_count >= ASSESSMENT_CREATION_LIMIT) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((ASSESSMENT_CREATION_WINDOW_MS - (now - existing.window_started_at)) / 1000),
        ),
      };
    }

    database.prepare(`
      UPDATE assessment_creation_limits
      SET request_count = request_count + 1
      WHERE address_hash = ?
    `).run(addressHash);
    return { allowed: true, retryAfterSeconds: 0 };
  })();
  return result;
}

function addEvent(
  database: DatabaseConnection,
  assessmentId: string,
  stage: string,
  status: AssessmentProgressEvent['status'],
  message: string,
  agentId?: AssessmentProgressEvent['agentId'],
): void {
  database.prepare(`
    INSERT INTO assessment_events (id, assessment_id, timestamp, stage, status, message, agent_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(randomUUID(), assessmentId, new Date().toISOString(), stage, status, message, agentId ?? null);
}

function createRecord(
  input: AssessmentInput | DraftAssessmentInput,
  status: AssessmentLifecycleStatus,
  idempotencyKey?: string,
): AssessmentRecord {
  const database = getDatabase();
  const id = randomUUID();
  const timestamp = new Date().toISOString();
  const studentName = input.studentName?.trim() ?? '';

  const insert = database.transaction(() => {
    database.prepare(`
      INSERT INTO assessments (
        id, idempotency_key, status, mode, created_at, updated_at,
        student_name, grade_level, difficulty, focus_area, question_count, target_bloom_levels
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      idempotencyKey ?? null,
      status,
      input.mode,
      timestamp,
      timestamp,
      studentName,
      input.gradeLevel,
      input.difficulty,
      input.focusArea,
      input.questionCount ?? input.questions.length,
      JSON.stringify(
        input.targetBloomLevels ??
          (input.questions.length > 0
            ? [...new Set(input.questions.map((question) => question.bloomLevel))]
            : BLOOM_LEVELS),
      ),
    );

    const insertQuestion = database.prepare(`
      INSERT INTO assessment_questions (assessment_id, question_id, position, question_json)
      VALUES (?, ?, ?, ?)
    `);
    input.questions.forEach((question, index) => {
      insertQuestion.run(id, question.id, index, JSON.stringify(question));
    });

    if ('answers' in input) {
      const insertAnswer = database.prepare(`
        INSERT INTO assessment_answers (assessment_id, question_id, answer, reasoning)
        VALUES (?, ?, ?, ?)
      `);
      input.answers.forEach((answer) => {
        insertAnswer.run(id, answer.questionId, answer.answer, answer.reasoning ?? '');
      });
    }

    addEvent(
      database,
      id,
      status === 'awaiting_answers' || status === 'generating_questions' ? 'questions' : 'initialization',
      status === 'awaiting_answers' ? 'completed' : 'in_progress',
      status === 'awaiting_answers'
        ? 'Validated question set saved and ready for student answers.'
        : status === 'generating_questions'
          ? 'Question generation started on the server.'
          : 'Assessment created and submitted.',
      status === 'awaiting_answers' || status === 'generating_questions' ? 'designer' : 'orchestrator',
    );
  });

  insert();
  const record = getAssessment(id);
  if (!record) {
    throw new Error('Assessment was created but could not be loaded from storage.');
  }
  return record;
}

export function createAssessmentDraft(input: DraftAssessmentInput): AssessmentRecord {
  return createRecord(input, 'awaiting_answers');
}

export function createQuestionGenerationAssessment(input: Omit<DraftAssessmentInput, 'questions'>): AssessmentRecord {
  return createRecord({ ...input, questions: [] }, 'generating_questions');
}

export function saveGeneratedQuestions(assessmentId: string, questions: Question[]): AssessmentRecord {
  const database = getDatabase();
  const transaction = database.transaction(() => {
    const assessment = database.prepare('SELECT status FROM assessments WHERE id = ?').get(assessmentId) as
      | { status: AssessmentLifecycleStatus }
      | undefined;
    if (!assessment || assessment.status !== 'generating_questions') {
      throw new Error('Assessment is not waiting for question generation.');
    }

    const insertQuestion = database.prepare(`
      INSERT INTO assessment_questions (assessment_id, question_id, position, question_json)
      VALUES (?, ?, ?, ?)
    `);
    questions.forEach((question, index) => {
      insertQuestion.run(assessmentId, question.id, index, JSON.stringify(question));
    });
    database.prepare(`
      UPDATE assessments SET status = 'awaiting_answers', updated_at = ?, failure_stage = NULL
      WHERE id = ? AND status = 'generating_questions'
    `).run(new Date().toISOString(), assessmentId);
    addEvent(database, assessmentId, 'questions', 'completed', 'Question set validated and saved.');
  });
  transaction();

  const record = getAssessment(assessmentId);
  if (!record) throw new Error('Saved question set could not be loaded.');
  return record;
}

export function createSubmittedAssessment(
  input: AssessmentInput,
  idempotencyKey: string,
): AssessmentRecord {
  const database = getDatabase();
  const existing = database.prepare(
    'SELECT id FROM assessments WHERE idempotency_key = ?',
  ).get(idempotencyKey) as { id: string } | undefined;

  if (existing) {
    const record = getAssessment(existing.id);
    if (!record) {
      throw new Error('An existing assessment submission could not be loaded.');
    }
    return record;
  }

  try {
    return createRecord(input, 'queued', idempotencyKey);
  } catch (error) {
    const duplicate = database.prepare(
      'SELECT id FROM assessments WHERE idempotency_key = ?',
    ).get(idempotencyKey) as { id: string } | undefined;
    if (duplicate) {
      const record = getAssessment(duplicate.id);
      if (record) return record;
    }
    throw error;
  }
}

export function getAssessment(assessmentId: string): AssessmentRecord | null {
  const database = getDatabase();
  const row = database.prepare('SELECT * FROM assessments WHERE id = ?').get(assessmentId) as AssessmentRow | undefined;
  if (!row) return null;

  const questions = database.prepare(`
    SELECT question_json FROM assessment_questions
    WHERE assessment_id = ? ORDER BY position
  `).all(assessmentId) as { question_json: string }[];
  const answers = database.prepare(`
    SELECT question_id, answer, reasoning FROM assessment_answers
    WHERE assessment_id = ? ORDER BY rowid
  `).all(assessmentId) as { question_id: string; answer: string; reasoning: string }[];
  const evaluations = database.prepare(`
    SELECT evaluation_json FROM assessment_evaluations
    WHERE assessment_id = ? ORDER BY rowid
  `).all(assessmentId) as { evaluation_json: string }[];
  const events = database.prepare(`
    SELECT id, timestamp, stage, status, message, agent_id
    FROM assessment_events WHERE assessment_id = ? ORDER BY timestamp, rowid
  `).all(assessmentId) as {
    id: string;
    timestamp: string;
    stage: string;
    status: AssessmentProgressEvent['status'];
    message: string;
    agent_id: AssessmentProgressEvent['agentId'] | null;
  }[];
  const reportRow = database.prepare(
    'SELECT report_json FROM assessment_reports WHERE assessment_id = ?',
  ).get(assessmentId) as { report_json: string } | undefined;

  return {
    id: row.id,
    ...(row.idempotency_key ? { idempotencyKey: row.idempotency_key } : {}),
    status: row.status,
    mode: row.mode,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    studentName: row.student_name,
    gradeLevel: row.grade_level,
    difficulty: row.difficulty,
    focusArea: row.focus_area,
    questionCount: row.question_count,
    targetBloomLevels: JSON.parse(row.target_bloom_levels) as BloomLevel[],
    questions: questions.map(({ question_json }) => JSON.parse(question_json) as Question),
    answers: answers.map(({ question_id, answer, reasoning }) => ({ questionId: question_id, answer, reasoning })),
    evaluations: evaluations.map(({ evaluation_json }) => JSON.parse(evaluation_json) as QuestionEvaluation),
    events: events.map((event) => ({
      id: event.id,
      timestamp: event.timestamp,
      stage: event.stage,
      status: event.status,
      message: event.message,
      ...(event.agent_id ? { agentId: event.agent_id } : {}),
    })),
    report: reportRow ? JSON.parse(reportRow.report_json) as FinalAssessmentReport : null,
    ...(row.pipeline_checkpoint
      ? { pipelineCheckpoint: JSON.parse(row.pipeline_checkpoint) as AssessmentPipelineCheckpoint }
      : {}),
    pauseRequested: row.pause_requested === 1,
    ...(row.failure_stage ? { failureStage: row.failure_stage } : {}),
  };
}

export function updateAssessmentStatus(
  assessmentId: string,
  status: AssessmentLifecycleStatus,
  stage: string,
  message: string,
): void {
  const database = getDatabase();
  const current = database.prepare('SELECT status FROM assessments WHERE id = ?').get(assessmentId) as
    | { status: AssessmentLifecycleStatus }
    | undefined;
  if (!current) throw new Error('Assessment was not found.');

  const allowed: Record<AssessmentLifecycleStatus, AssessmentLifecycleStatus[]> = {
    queued: ['generating_questions', 'evaluating', 'generating_report', 'failed'],
    generating_questions: ['awaiting_answers', 'failed'],
    awaiting_answers: ['queued', 'failed'],
    evaluating: ['generating_report', 'paused', 'failed'],
    generating_report: ['paused', 'completed', 'failed'],
    paused: ['queued'],
    completed: [],
    failed: ['queued', 'generating_questions'],
  };
  if (!allowed[current.status].includes(status)) {
    throw new Error(`Invalid assessment transition: ${current.status} -> ${status}.`);
  }

  const transaction = database.transaction(() => {
    database.prepare(`
      UPDATE assessments SET status = ?, updated_at = ?, failure_stage = ?
      WHERE id = ?
    `).run(status, new Date().toISOString(), status === 'failed' ? stage : null, assessmentId);
    addEvent(
      database,
      assessmentId,
      stage,
      status === 'failed' ? 'failed' : status === 'completed' ? 'completed' : 'in_progress',
      message,
    );
  });
  transaction();
}

export function requestAssessmentPause(assessmentId: string): 'requested' | 'paused' | 'not_running' | 'not_found' {
  const database = getDatabase();
  return database.transaction(() => {
    const assessment = database.prepare(
      'SELECT status, pause_requested, pipeline_checkpoint FROM assessments WHERE id = ?',
    ).get(assessmentId) as {
      status: AssessmentLifecycleStatus;
      pause_requested: number;
      pipeline_checkpoint: string | null;
    } | undefined;
    if (!assessment) return 'not_found';
    if (assessment.status === 'paused') return 'paused';
    if (!['queued', 'evaluating', 'generating_report'].includes(assessment.status)) return 'not_running';
    if (
      assessment.status === 'generating_report' &&
      assessment.pipeline_checkpoint &&
      (JSON.parse(assessment.pipeline_checkpoint) as AssessmentPipelineCheckpoint).nextStage === 'save_report'
    ) {
      return 'not_running';
    }
    if (assessment.pause_requested === 1) return 'requested';

    database.prepare('UPDATE assessments SET pause_requested = 1, updated_at = ? WHERE id = ?')
      .run(new Date().toISOString(), assessmentId);
    addEvent(database, assessmentId, 'pause', 'waiting', 'Pause requested; the active agent will finish before execution stops.');
    return 'requested';
  })();
}

export function saveAssessmentCheckpoint(
  assessmentId: string,
  checkpoint: AssessmentPipelineCheckpoint,
): boolean {
  const database = getDatabase();
  return database.transaction(() => {
    const assessment = database.prepare(
      'SELECT status, pause_requested FROM assessments WHERE id = ?',
    ).get(assessmentId) as { status: AssessmentLifecycleStatus; pause_requested: number } | undefined;
    if (!assessment || !['evaluating', 'generating_report'].includes(assessment.status)) {
      throw new Error('Assessment is not processing and cannot save a pipeline checkpoint.');
    }

    const timestamp = new Date().toISOString();
    database.prepare(`
      UPDATE assessments
      SET pipeline_checkpoint = ?, updated_at = ?
      WHERE id = ?
    `).run(JSON.stringify(checkpoint), timestamp, assessmentId);

    if (assessment.pause_requested !== 1) return false;

    const nextAgent = checkpoint.nextStage === 'coach'
      ? 'Feedback Coach'
      : checkpoint.nextStage === 'synthesis'
        ? 'Orchestrator'
        : checkpoint.nextStage === 'save_report'
          ? 'report saving'
          : 'Cognitive Analyzer';
    database.prepare(`
      UPDATE assessments
      SET status = 'paused', pause_requested = 0, updated_at = ?
      WHERE id = ?
    `).run(timestamp, assessmentId);
    addEvent(
      database,
      assessmentId,
      'pause',
      'completed',
      `Execution paused safely. Resume to continue with ${nextAgent}.`,
    );
    return true;
  })();
}

export function appendAssessmentEvent(
  assessmentId: string,
  event: Omit<AssessmentProgressEvent, 'id' | 'timestamp'>,
): void {
  const database = getDatabase();
  const transaction = database.transaction(() => {
    addEvent(database, assessmentId, event.stage, event.status, event.message, event.agentId);
    database.prepare('UPDATE assessments SET updated_at = ? WHERE id = ?')
      .run(new Date().toISOString(), assessmentId);
  });
  transaction();
}

export function saveAssessmentAnswers(
  assessmentId: string,
  studentName: string,
  gradeLevel: string,
  difficulty: Difficulty,
  focusArea: string,
  answers: StudentAnswer[],
): AssessmentRecord {
  const database = getDatabase();
  const record = getAssessment(assessmentId);
  if (!record) throw new Error('Assessment was not found.');

  if (record.status !== 'awaiting_answers') {
    return record;
  }

  const answerIds = new Set(answers.map((answer) => answer.questionId));
  if (
    answers.length !== record.questions.length ||
    record.questions.some((question) => !answerIds.has(question.id))
  ) {
    throw new Error('Answers must be provided exactly once for each assessment question.');
  }

  const transaction = database.transaction(() => {
    const insertAnswer = database.prepare(`
      INSERT INTO assessment_answers (assessment_id, question_id, answer, reasoning)
      VALUES (?, ?, ?, ?)
    `);
    answers.forEach((answer) => {
      insertAnswer.run(assessmentId, answer.questionId, answer.answer, answer.reasoning ?? '');
    });
    database.prepare(`
      UPDATE assessments
      SET student_name = ?, grade_level = ?, difficulty = ?, focus_area = ?,
          status = 'queued', updated_at = ?, pipeline_checkpoint = NULL, pause_requested = 0
      WHERE id = ?
    `).run(studentName, gradeLevel, difficulty, focusArea, new Date().toISOString(), assessmentId);
    addEvent(database, assessmentId, 'answers', 'completed', 'Student answers saved for evaluation.');
    addEvent(database, assessmentId, 'evaluation', 'waiting', 'Waiting for response evaluation to begin.');
  });
  transaction();

  const updated = getAssessment(assessmentId);
  if (!updated) throw new Error('Saved assessment could not be loaded.');
  return updated;
}

export function saveAssessmentReport(
  assessmentId: string,
  report: FinalAssessmentReport,
  evaluations: QuestionEvaluation[],
): void {
  const database = getDatabase();
  const transaction = database.transaction(() => {
    const assessment = database.prepare('SELECT status FROM assessments WHERE id = ?').get(assessmentId) as
      | { status: AssessmentLifecycleStatus }
      | undefined;
    if (!assessment || assessment.status !== 'generating_report') {
      throw new Error('Assessment must be in report generation before its report can be saved.');
    }

    const insertEvaluation = database.prepare(`
      INSERT OR REPLACE INTO assessment_evaluations (assessment_id, question_id, evaluation_json)
      VALUES (?, ?, ?)
    `);
    evaluations.forEach((evaluation) => {
      insertEvaluation.run(assessmentId, evaluation.questionId, JSON.stringify(evaluation));
    });
    database.prepare(`
      INSERT OR REPLACE INTO assessment_reports (assessment_id, report_json)
      VALUES (?, ?)
    `).run(assessmentId, JSON.stringify(report));
    const result = database.prepare(`
      UPDATE assessments
      SET status = 'completed', updated_at = ?, failure_stage = NULL, pause_requested = 0
      WHERE id = ? AND status = 'generating_report'
    `).run(new Date().toISOString(), assessmentId);
    if (result.changes !== 1) {
      throw new Error('Assessment report was saved without completing its lifecycle.');
    }
    addEvent(database, assessmentId, 'report', 'completed', 'Final report saved and ready to view.');
  });
  transaction();
}

export function deleteAssessment(assessmentId: string): boolean {
  const result = getDatabase().prepare('DELETE FROM assessments WHERE id = ?').run(assessmentId);
  return result.changes > 0;
}
