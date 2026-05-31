import { useQuery } from "@tanstack/react-query";
import { getUserGroupMembers } from "../services/userService";
import pb from "../pb";

/**
 * Hook to get group memberships for a specific user
 */
export function useUserGroupMembers(userId, sortField, sortDirection, filters = {}, options = {}) {
  return useQuery({
    queryKey: ["userGroupMembers", userId, sortField, sortDirection, filters, options],
    queryFn: async () => {
      if (!userId) return [];

      // Build query options
      const queryOptions = {
        filter: `user="${userId}"`,
        expand: "group,section",
        sort: sortDirection === "desc" ? `-${sortField}` : sortField,
        ...options,
      };

      // Add filters if any
      const filterConditions = [`user="${userId}"`];
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.trim()) {
          // Handle different filter types based on field
          if (key === "group") {
            filterConditions.push(`group.name ~ "${value}"`);
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
    enabled: !!userId,
    keepPreviousData: true,
  });
}

/**
 * Hook to get attendance history for a user's group memberships
 */
export function useUserAttendanceHistory(
  groupMembers,
  sortField,
  sortDirection,
  filters = {},
  page = 1,
  perPage = 25,
  options = {}
) {
  const memberIds = groupMembers?.map((member) => member.id) || [];

  return useQuery({
    queryKey: ["userAttendanceHistory", memberIds, sortField, sortDirection, filters, page, perPage, options],
    queryFn: async () => {
      if (!groupMembers || groupMembers.length === 0) {
        return { items: [], totalItems: 0 };
      }

      // Build base filter for group members
      const baseFilter = groupMembers.map((member) => `group_member="${member.id}"`).join(" || ");

      // Add additional filters
      const filterConditions = [`(${baseFilter})`];
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.trim()) {
          if (key === "group_member.group") {
            filterConditions.push(`group_member.group.name ~ "${value}"`);
          } else if (key === "group_member.section") {
            filterConditions.push(`group_member.section.name ~ "${value}"`);
          } else if (key === "state") {
            filterConditions.push(`state ~ "${value}"`);
          }
        }
      });

      const queryOptions = {
        filter: filterConditions.join(" && "),
        expand: "group_member,group_member.group,group_member.section,session",
        sort: sortDirection === "desc" ? `-${sortField}` : sortField,
        ...options,
      };

      // Use pagination for attendance history
      return await pb.collection("mb_attendance").getList(page, perPage, queryOptions);
    },
    enabled: !!groupMembers && groupMembers.length > 0,
    keepPreviousData: true,
  });
}
