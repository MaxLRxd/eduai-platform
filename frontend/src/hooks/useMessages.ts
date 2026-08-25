import { useMutation, useQuery } from "@tanstack/react-query";
import { getInbox, sendBroadcast, sendMessage } from "../services/messages.service";

export function useInbox() {
  return useQuery({ queryKey: ["messages", "inbox"], queryFn: getInbox });
}

export function useSendMessage() {
  return useMutation({ mutationFn: sendMessage });
}

export function useSendBroadcast() {
  return useMutation({ mutationFn: sendBroadcast });
}
