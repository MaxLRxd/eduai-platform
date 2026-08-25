import type { LicensePlan } from "../types/domain";
import { MOCK_LICENSE_PLANS, MOCK_MAU } from "../data/mock/adminLicensing.mock";

// TODO(backend): GET /api/admin/license — depende de un proveedor de billing todavía no definido en implementacion.docx.
export async function getLicenseUsage(): Promise<{ current: number; limit: number }> {
  return Promise.resolve(MOCK_MAU);
}

export async function getLicensePlans(): Promise<LicensePlan[]> {
  return Promise.resolve(MOCK_LICENSE_PLANS);
}
