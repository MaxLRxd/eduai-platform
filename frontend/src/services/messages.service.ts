import type { InboxMessage } from "../types/domain";
import { MOCK_INBOX } from "../data/mock/messages.mock";

// TODO(backend): GET /api/messages?userId=... (no hay modelo de Message 1:1 en el schema.prisma, solo Chat con el tutor).
export async function getInbox(): Promise<InboxMessage[]> {
  return Promise.resolve(MOCK_INBOX);
}

// TODO(backend): POST /api/messages { to, subject, body }.
export async function sendMessage(): Promise<{ success: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return { success: true };
}

// TODO(backend): POST /api/messages/broadcast { courseId | 'all', subject, body }.
export async function sendBroadcast(): Promise<{ success: boolean; recipients: number }> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return { success: true, recipients: 15 };
}
