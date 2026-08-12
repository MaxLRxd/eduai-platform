import type { FrequentError, FrequentQuestion, RiskAlert, TopicUnderstanding } from "../types/domain";
import { MOCK_FREQUENT_ERRORS, MOCK_FREQUENT_QUESTIONS, MOCK_RISK_ALERTS, MOCK_TOPIC_UNDERSTANDING } from "../data/mock/analytics.mock";

// TODO(backend): estos cuatro endpoints viven en el Analytics Engine (Sprint 5, aún sin construir).
export async function getTopicUnderstanding(): Promise<TopicUnderstanding[]> {
  return Promise.resolve(MOCK_TOPIC_UNDERSTANDING);
}

export async function getRiskAlerts(): Promise<RiskAlert[]> {
  return Promise.resolve(MOCK_RISK_ALERTS);
}

export async function getFrequentErrors(): Promise<FrequentError[]> {
  return Promise.resolve(MOCK_FREQUENT_ERRORS);
}

export async function getFrequentQuestions(): Promise<FrequentQuestion[]> {
  return Promise.resolve(MOCK_FREQUENT_QUESTIONS);
}
