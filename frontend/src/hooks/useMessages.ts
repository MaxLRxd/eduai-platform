import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getContactos,
  getConversationMessages,
  getInbox,
  sendBroadcast,
  sendMessage,
} from "../services/messages.service";

export function useInbox() {
  return useQuery({ queryKey: ["messages", "inbox"], queryFn: getInbox });
}

export function useContacts() {
  return useQuery({ queryKey: ["messages", "contacts"], queryFn: getContactos });
}

export function useConversation(conversacionId: string | null) {
  return useQuery({
    queryKey: ["messages", "conversation", conversacionId],
    queryFn: () => getConversationMessages(conversacionId as string),
    enabled: Boolean(conversacionId),
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["messages", "inbox"] });
      void queryClient.invalidateQueries({ queryKey: ["messages", "conversation"] });
    },
  });
}

export function useSendBroadcast() {
  return useMutation({ mutationFn: sendBroadcast });
}
