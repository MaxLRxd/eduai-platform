import type { AdminUser } from "../types/domain";
import { MOCK_ADMIN_USERS } from "../data/mock/adminUsers.mock";

// TODO(backend): GET /api/admin/users (CU-AD03).
export async function getAdminUsers(): Promise<AdminUser[]> {
  return Promise.resolve(MOCK_ADMIN_USERS);
}
