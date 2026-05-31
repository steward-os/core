import pb from "../pb";

/**
 * Get a single group by ID
 * @param {string} id - Group ID
 * @param {Object} options - Query options (expand, etc.)
 * @returns {Promise<Object>} Group data
 */
export async function getGroup(id, options = {}) {
  return await pb.collection("mb_groups").getOne(id, options);
}

/**
 * Get all groups with filtering and sorting
 * @param {Object} options - Query options (filter, sort, etc.)
 * @returns {Promise<Array>} List of groups
 */
export async function getGroups(options = {}) {
  const defaultOptions = {
    sort: "-created",
    ...options
  };
  return await pb.collection("mb_groups").getFullList(defaultOptions);
}

/**
 * Get paginated groups
 * @param {number} page - Page number
 * @param {number} perPage - Items per page
 * @param {Object} options - Query options (filter, sort, etc.)
 * @returns {Promise<Object>} Paginated group data
 */
export async function getGroupsPage(page = 1, perPage = 50, options = {}) {
  const defaultOptions = {
    sort: "-created",
    ...options
  };
  return await pb.collection("mb_groups").getList(page, perPage, defaultOptions);
}

/**
 * Create a new group
 * @param {Object} groupData - Group data to create
 * @returns {Promise<Object>} Created group
 */
export async function createGroup(groupData) {
  return await pb.collection("mb_groups").create(groupData);
}

/**
 * Update a group
 * @param {string} id - Group ID
 * @param {Object} groupData - Group data to update
 * @returns {Promise<Object>} Updated group
 */
export async function updateGroup(id, groupData) {
  return await pb.collection("mb_groups").update(id, groupData);
}

/**
 * Delete a group
 * @param {string} id - Group ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteGroup(id) {
  return await pb.collection("mb_groups").delete(id);
}

/**
 * Get group members for a specific group
 * @param {string} groupId - Group ID
 * @returns {Promise<Array>} List of group members
 */
export async function getGroupMembers(groupId) {
  if (!groupId) return [];

  return await pb.collection("mb_group_members").getFullList({
    filter: `group="${groupId}"`,
    expand: "user,section",
  });
}

/**
 * Create group membership (add user to group)
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID
 * @param {string} sectionId - Section ID
 * @returns {Promise<Object>} Created group membership
 */
export async function createGroupMember(groupId, userId, sectionId, defaultRow) {
  const data = {
    user: userId,
    group: groupId,
  };
  if (sectionId) {
    data.section = sectionId;
  }
  if (defaultRow) {
    data.default_row = defaultRow;
  }
  return await pb.collection("mb_group_members").create(data);
}

/**
 * Delete group membership
 * @param {string} membershipId - Group membership ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteGroupMember(membershipId) {
  return await pb.collection("mb_group_members").delete(membershipId);
}
