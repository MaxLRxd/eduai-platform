import type { Assignment } from "../types/domain";
import { MOCK_ASSIGNMENTS } from "../data/mock/assignments.mock";

// TODO(backend): GET /api/submissions?studentId=... cuando exista submissions.service.ts en el backend.
export async function getAssignments(): Promise<Assignment[]> {
  return Promise.resolve(MOCK_ASSIGNMENTS);
}
