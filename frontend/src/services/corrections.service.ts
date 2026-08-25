import type { CorrectionQueueItem, Rubric, RubricCriterion } from "../types/domain";
import { MOCK_CORRECTION_QUEUE, MOCK_RUBRIC_CRITERIA, MOCK_RUBRICS } from "../data/mock/corrections.mock";

// TODO(backend): GET /api/submissions?status=pending_review (Auto-correction Engine, Sprint 4).
export async function getCorrectionQueue(): Promise<CorrectionQueueItem[]> {
  return Promise.resolve(MOCK_CORRECTION_QUEUE);
}

// TODO(backend): GET /api/rubrics/:activityId/criteria.
export async function getRubricCriteria(): Promise<RubricCriterion[]> {
  return Promise.resolve(MOCK_RUBRIC_CRITERIA);
}

// TODO(backend): GET /api/rubrics?teacherId=...
export async function getRubrics(): Promise<Rubric[]> {
  return Promise.resolve(MOCK_RUBRICS);
}

// TODO(backend): PATCH /api/submissions/:id { grade, feedback } — publica y notifica al alumno.
export async function publishCorrection(): Promise<{ success: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return { success: true };
}
