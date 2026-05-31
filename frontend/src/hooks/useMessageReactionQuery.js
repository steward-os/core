import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMessageReactions,
  getUserMessageReactions,
  createMessageReaction,
  deleteMessageReaction,
} from "../services/messageReactionService";

export function useMessageReactions(messageId) {
  return useQuery({
    queryKey: ["message-reactions", messageId],
    queryFn: () => getMessageReactions(messageId),
    enabled: !!messageId,
    staleTime: 30 * 1000,
  });
}

export function useUserMessageReactions(messageId, userId) {
  return useQuery({
    queryKey: ["message-reactions", messageId, "user", userId],
    queryFn: () => getUserMessageReactions(messageId, userId),
    enabled: !!messageId && !!userId,
    staleTime: 30 * 1000,
  });
}

export function useToggleMessageReaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ messageId, userId, standardReactionId, existingReactionId, replaceReactionId }) => {
      if (existingReactionId) {
        await deleteMessageReaction(existingReactionId);
        return { action: "removed" };
      } else {
        if (replaceReactionId) {
          await deleteMessageReaction(replaceReactionId);
        }
        const result = await createMessageReaction({
          message: messageId,
          user: userId,
          standard_reaction: standardReactionId,
        });
        return { action: "added", result };
      }
    },
    onSuccess: (_, { messageId, userId }) => {
      queryClient.invalidateQueries({ queryKey: ["message-reactions", messageId] });
      queryClient.invalidateQueries({ queryKey: ["message-reactions", messageId, "user", userId] });
    },
  });
}
