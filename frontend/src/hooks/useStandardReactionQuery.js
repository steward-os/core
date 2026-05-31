import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getStandardReactions,
  getStandardReactionsPaginated,
  getStandardReaction,
  createStandardReaction,
  updateStandardReaction,
  deleteStandardReaction,
} from "../services/standardReactionService";

export function useStandardReactions(options = {}) {
  return useQuery({
    queryKey: ["standard-reactions", options],
    queryFn: () => getStandardReactions(options),
    staleTime: 30 * 1000,
  });
}

export function useStandardReactionsPaginated(page = 1, perPage = 100, options = {}) {
  return useQuery({
    queryKey: ["standard-reactions-paginated", page, perPage, options],
    queryFn: () => getStandardReactionsPaginated(page, perPage, options),
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000,
  });
}

export function useStandardReaction(id, options = {}) {
  return useQuery({
    queryKey: ["standard-reactions", id, options],
    queryFn: () => getStandardReaction(id, options),
    enabled: !!id,
  });
}

export function useCreateStandardReaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createStandardReaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["standard-reactions"] });
      queryClient.invalidateQueries({ queryKey: ["standard-reactions-paginated"] });
    },
  });
}

export function useUpdateStandardReaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateStandardReaction(id, data),
    onSuccess: (updatedReaction) => {
      queryClient.setQueryData(["standard-reactions", updatedReaction.id], updatedReaction);
      queryClient.invalidateQueries({ queryKey: ["standard-reactions"] });
      queryClient.invalidateQueries({ queryKey: ["standard-reactions-paginated"] });
    },
  });
}

export function useDeleteStandardReaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteStandardReaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["standard-reactions"] });
      queryClient.invalidateQueries({ queryKey: ["standard-reactions-paginated"] });
    },
  });
}
