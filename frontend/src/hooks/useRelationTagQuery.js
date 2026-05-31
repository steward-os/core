import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllTags,
  getAllTagsPaginated,
  getRelationTags,
  getRelationTagsPaginated,
  getRelationTag,
  createRelationTag,
  updateRelationTag,
  deleteRelationTag,
  getTagsForRelation,
  getTagsForEmail,
  setTagsForRelation,
} from "../services/tagService";

export function useAllTags(options = {}, { enabled = true } = {}) {
  return useQuery({
    queryKey: ["all-tags", options],
    queryFn: () => getAllTags(options),
    staleTime: 30 * 1000,
    enabled,
  });
}

export function useAllTagsPaginated(page = 1, perPage = 100, options = {}) {
  return useQuery({
    queryKey: ["all-tags-paginated", page, perPage, options],
    queryFn: () => getAllTagsPaginated(page, perPage, options),
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000,
  });
}

export function useRelationTags(options = {}) {
  return useQuery({
    queryKey: ["relation-tags", options],
    queryFn: () => getRelationTags(options),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useRelationTagsPaginated(page = 1, perPage = 100, options = {}) {
  return useQuery({
    queryKey: ["relation-tags-paginated", page, perPage, options],
    queryFn: () => getRelationTagsPaginated(page, perPage, options),
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000,
  });
}

export function useRelationTag(id, options = {}) {
  return useQuery({
    queryKey: ["relation-tags", id, options],
    queryFn: () => getRelationTag(id, options),
    enabled: !!id,
  });
}

export function useTagsForRelation(relationId) {
  return useQuery({
    queryKey: ["tags", "bs_relations", relationId],
    queryFn: () => getTagsForRelation(relationId),
    enabled: !!relationId,
    staleTime: 30 * 1000,
  });
}

export function useTagsForEmail(emailId) {
  return useQuery({
    queryKey: ["tags", "bs_correspondence", emailId],
    queryFn: () => getTagsForEmail(emailId),
    enabled: !!emailId,
    staleTime: 30 * 1000,
  });
}

export function useCreateRelationTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRelationTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["relation-tags"] });
      queryClient.invalidateQueries({ queryKey: ["relation-tags-paginated"] });
    },
  });
}

export function useUpdateRelationTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateRelationTag(id, data),
    onSuccess: (updatedTag) => {
      queryClient.setQueryData(["relation-tags", updatedTag.id], updatedTag);
      queryClient.invalidateQueries({ queryKey: ["relation-tags"] });
      queryClient.invalidateQueries({ queryKey: ["relation-tags-paginated"] });
    },
  });
}

export function useDeleteRelationTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRelationTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["relation-tags"] });
      queryClient.invalidateQueries({ queryKey: ["relation-tags-paginated"] });
    },
  });
}

export function useSetTagsForRelation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ relationId, tagIds }) => setTagsForRelation(relationId, tagIds),
    onSuccess: (_, { relationId }) => {
      queryClient.invalidateQueries({ queryKey: ["tags", "bs_relations", relationId] });
      queryClient.invalidateQueries({ queryKey: ["relations"] });
    },
  });
}
