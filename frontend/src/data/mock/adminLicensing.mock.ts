import type { LicensePlan } from "../../types/domain";

export const MOCK_MAU = { current: 298, limit: 500 };

export const MOCK_LICENSE_PLANS: LicensePlan[] = [
  { name: "Starter", range: "≤ 100 MAU", features: "LMS + IA básico", current: false },
  { name: "Growth", range: "101 – 500 MAU", features: "+ Corrección + Analítica", current: true },
  { name: "Scale", range: "501 – 2K MAU", features: "+ SSO + Integración", current: false },
  { name: "Enterprise", range: "2K+ MAU", features: "Personalizado", current: false },
];
