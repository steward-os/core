import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createRemark,
  getRemarksForEntity,
  getRemarksCountForEntity,
  updateRemark,
  deleteRemark,
} from "../services/remarksService";

/**
 * Hook to get remarks for a specific entity
 * @param {string} entityType - The collection name (e.g., "bs_notes", "bs_meeting_topics")
 * @param {string} entityId - The entity ID
 * @param {Object} options - Query options
 * @returns {Object} Query result with data, isLoading, error
 */
export function useRemarksForEntity(entityType, entityId, options = {}) {
  return useQuery({
    queryKey: ["remarks", entityType, entityId], // Remove options from queryKey to prevent instability
    queryFn: () => getRemarksForEntity(entityType, entityId, options),
    enabled: !!(entityType && entityId),
    staleTime: 5 * 60 * 1000, // 5 minutes - helps prevent unnecessary refetches
    gcTime: 10 * 60 * 1000, // 10 minutes - keeps data in cache longer
    retry: 3,
    refetchOnWindowFocus: false, // Prevent refetch on window focus that might clear data
  });
}

/**
 * Hook to get remarks count for a specific entity
 * @param {string} entityType - The collection name (e.g., "bs_notes", "bs_meeting_topics")
 * @param {string} entityId - The entity ID
 * @returns {Object} Query result with data (count), isLoading, error
 */
export function useRemarksCountForEntity(entityType, entityId) {
  return useQuery({
    queryKey: ["remarks-count", entityType, entityId],
    queryFn: () => getRemarksCountForEntity(entityType, entityId),
    enabled: !!(entityType && entityId),
    staleTime: 5 * 60 * 1000, // 5 minutes - helps prevent unnecessary refetches
    gcTime: 10 * 60 * 1000, // 10 minutes - keeps data in cache longer
    retry: 3,
    refetchOnWindowFocus: false, // Prevent refetch on window focus that might clear data
  });
}

/**
 * Hook to create a new remark
 * @returns {Object} Mutation object
 */
export function useCreateRemark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRemark,
    onSuccess: (newRemark) => {
      // Invalidate both old format and new format queries
      queryClient.invalidateQueries({
        queryKey: ["remarks", newRemark.entity_type, newRemark.parent],
      });

      // Invalidate count queries
      queryClient.invalidateQueries({
        queryKey: ["remarks-count", newRemark.entity_type, newRemark.parent],
      });

      // Invalidate RemarksIndicator queries (different key format)
      queryClient.invalidateQueries({
        queryKey: ["entity-remarks", newRemark.entity_type, newRemark.parent],
      });

      // Also invalidate all queries with this entity type and parent using predicate
      queryClient.invalidateQueries({
        predicate: (query) => {
          const [prefix, entityType, entityId] = query.queryKey;
          return (
            (prefix === "remarks" || prefix === "entity-remarks" || prefix === "remarks-count") &&
            entityType === newRemark.entity_type &&
            entityId === newRemark.parent
          );
        },
      });
    },
  });
}

/**
 * Hook to update an existing remark
 * @returns {Object} Mutation object
 */
export function useUpdateRemark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateRemark(id, data),
    onSuccess: (updatedRemark) => {
      // Invalidate both old format and new format queries
      queryClient.invalidateQueries({
        queryKey: ["remarks", updatedRemark.entity_type, updatedRemark.parent],
      });

      // Invalidate count queries
      queryClient.invalidateQueries({
        queryKey: ["remarks-count", updatedRemark.entity_type, updatedRemark.parent],
      });

      // Invalidate RemarksIndicator queries (different key format)
      queryClient.invalidateQueries({
        queryKey: ["entity-remarks", updatedRemark.entity_type, updatedRemark.parent],
      });
    },
  });
}

/**
 * Hook to delete a remark
 * @returns {Object} Mutation object
 */
export function useDeleteRemark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRemark,
    onSuccess: () => {
      // Invalidate all remark queries since we don't have the entity info after deletion
      queryClient.invalidateQueries({
        queryKey: ["remarks"],
      });
    },
  });
}

// Convenience hooks for common entities
export const useActionItemRemarks = (actionItemId) =>
  useRemarksForEntity("bs_notes", actionItemId, { expand: "author" });

export const useMeetingTopicRemarks = (meetingTopicId) =>
  useRemarksForEntity("bs_meeting_topics", meetingTopicId, { expand: "author" });

export const useProjectRemarks = (projectId, options = {}) => useRemarksForEntity("bs_projects", projectId, options);

export const useRelationRemarks = (relationId, options = {}) =>
  useRemarksForEntity("bs_relations", relationId, options);
