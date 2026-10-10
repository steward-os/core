import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getReadMessageIds, markMessageRead } from "../services/messageReadService";

const key = (userId) => ["message-reads", userId];

/** The ids of the messages the user has opened, as a Set. */
export function useReadMessageIds(userId) {
  return useQuery({
    queryKey: key(userId),
    queryFn: () => getReadMessageIds(userId),
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

/** Marks a message as read, updating the list at once rather than after the round trip. */
export function useMarkMessageRead(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId) => markMessageRead(messageId, userId),
    onMutate: (messageId) => {
      queryClient.setQueryData(key(userId), (ids) => (ids ? new Set(ids).add(messageId) : ids));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key(userId) }),
  });
}
