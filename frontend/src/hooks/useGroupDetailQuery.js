import { useQuery } from "@tanstack/react-query";
import pb from "../pb";

/**
 * Hook to get members for a specific group
 */
export function useGroupMembers(groupId, sortField, sortDirection, filters = {}, options = {}) {
  return useQuery({
    queryKey: ["groupMembers", groupId, sortField, sortDirection, filters, options],
    queryFn: async () => {
      if (!groupId) return [];

      // Build query options
      const queryOptions = {
        filter: `group="${groupId}"`,
        expand: "user,section",
        sort: sortDirection === "desc" ? `-${sortField}` : sortField,
        ...options,
      };

      // Add filters if any
      const filterConditions = [`group="${groupId}"`];
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.trim()) {
          // Handle different filter types based on field
          if (key === "user") {
            filterConditions.push(`user.name ~ "${value}"`);
          } else if (key === "section") {
            filterConditions.push(`section.name ~ "${value}"`);
          }
        }
      });

      if (filterConditions.length > 1) {
        queryOptions.filter = filterConditions.join(" && ");
      }

      return await pb.collection("mb_group_members").getFullList(queryOptions);
    },
    enabled: !!groupId,
    keepPreviousData: true,
  });
}
