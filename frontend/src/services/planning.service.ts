import type { PlanningClass } from "../types/domain";
import { MOCK_PLANNING } from "../data/mock/planning.mock";

// TODO(backend): GET /api/courses/:id/planning — no hay modelo de Planning en el schema.prisma todavía.
export async function getPlanning(): Promise<PlanningClass[]> {
  return Promise.resolve(MOCK_PLANNING);
}

// TODO(backend): PUT /api/courses/:id/planning/:date.
export async function savePlanning(): Promise<{ success: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return { success: true };
}
