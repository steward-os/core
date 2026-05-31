import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createUpdate, getUpdatesForActionItem, updateUpdate, deleteUpdate } from "../services/updateService";

export function useUpdatesForActionItem(actionItemId, options = {}) {
  return useQuery({
    queryKey: ["updates", "actionItem", actionItemId, options],
    queryFn: () => getUpdatesForActionItem(actionItemId, options),
    enabled: !!actionItemId,
  });
}

export function useCreateUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUpdate,
    onSuccess: (newUpdate) => {
      // Invalidate queries for this action item's updates
      queryClient.invalidateQueries({
        queryKey: ["updates", "actionItem", newUpdate.parent]
      });

      // Also invalidate RemarksIndicator queries for action items
      queryClient.invalidateQueries({
        queryKey: ["remarks-count", "bs_notes", newUpdate.parent]
      });
    },
  });
}

export function useUpdateUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateUpdate(id, data),
    onSuccess: (updatedUpdate) => {
      // Invalidate queries for this action item's updates
      queryClient.invalidateQueries({
        queryKey: ["updates", "actionItem", updatedUpdate.parent] // Use parent instead of note
      });

      // Also invalidate RemarksIndicator queries for action items
      queryClient.invalidateQueries({
        queryKey: ["remarks-count", "bs_notes", updatedUpdate.parent]
      });
    },
  });
}

export function useDeleteUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUpdate,
    onSuccess: () => {
      // Invalidate all update queries since we don't have the note ID after deletion
      queryClient.invalidateQueries({
        queryKey: ["updates"]
      });

      // Also invalidate all remarks-count queries since we don't have specific entity info after deletion
      queryClient.invalidateQueries({
        queryKey: ["remarks-count"]
      });
    },
  });
}