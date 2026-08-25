import type { ReportCard } from "../types/domain";
import { MOCK_REPORTS } from "../data/mock/adminReports.mock";

// TODO(backend): GET /api/admin/reports — vendría del Analytics Engine (Sprint 5).
export async function getAdminReports(): Promise<ReportCard[]> {
  return Promise.resolve(MOCK_REPORTS);
}

// TODO(backend): POST /api/admin/reports/:type/export.
export async function exportReport(): Promise<{ success: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { success: true };
}
