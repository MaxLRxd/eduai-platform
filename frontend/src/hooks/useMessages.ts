import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { getAlumnosContactos, getInbox, sendBroadcast, sendMessage } from "../services/messages.service";

export function useInbox() {
  const { user } = useAuth();
  return useQuery({ queryKey: ["messages", "inbox"], queryFn: () => getInbox(user?.id) });
}

export function useContacts() {
  return useQuery({ queryKey: ["messages", "contacts"], queryFn: getAlumnosContactos });
}

export function useSendMessage() {
  return useMutation({ mutationFn: sendMessage });
}

export function useSendBroadcast() {
  return useMutation({ mutationFn: sendBroadcast });
}