import type { AdminSubject } from "../types/domain";
import { MOCK_ADMIN_SUBJECTS } from "../data/mock/adminSubjects.mock";

// TODO(backend): GET /api/admin/subjects (CU-AD01).
export async function getAdminSubjects(): Promise<AdminSubject[]> {
  return Promise.resolve(MOCK_ADMIN_SUBJECTS);
}

// TODO(backend): POST /api/admin/subjects (crear) / PUT /api/admin/subjects/:id (editar).
export async function saveAdminSubject(subject: AdminSubject): Promise<AdminSubject> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return subject;
}
