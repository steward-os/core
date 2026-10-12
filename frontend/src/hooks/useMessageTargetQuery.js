import { useQuery } from "@tanstack/react-query";
import { getGroupMembers } from "../services/groupService";
import { getUserGroupMembers } from "../services/userService";

/** The members of the group a message goes to, with their section, for the section picker and count. */
export function useGroupMembers(groupId) {
  return useQuery({
    queryKey: ["group-members", groupId],
    queryFn: () => getGroupMembers(groupId),
    enabled: !!groupId,
    staleTime: 60 * 1000,
  });
}

/** The user's own memberships (group + section), which decide which messages they receive. */
export function useMyMemberships(userId) {
  return useQuery({
    queryKey: ["my-memberships", userId],
    queryFn: () => getUserGroupMembers(userId),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}
