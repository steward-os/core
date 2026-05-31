import pb from "../pb";

/**
 * Get remarks for a specific entity (using polymorphic bs_updates table)
 * @param {string} entityType - The collection name (e.g., "bs_notes", "bs_meeting_topics")
 * @param {string} entityId - The entity ID
 * @param {Object} options - Query options (expand, sort, etc.)
 * @returns {Promise<Array>} Remarks for the entity
 */
export async function getRemarksForEntity(entityType, entityId, options = {}) {
  const defaultOptions = {
    filter: `entity_type = "${entityType}" && parent = "${entityId}"`,
    sort: "-created",
    expand: "author",
    ...options,
  };

  const result = await pb.collection("bs_updates").getFullList(defaultOptions);
  return result;
}

/**
 * Get count of remarks for a specific entity (using polymorphic bs_updates table)
 * @param {string} entityType - The collection name (e.g., "bs_notes", "bs_meeting_topics")
 * @param {string} entityId - The entity ID
 * @returns {Promise<number>} Count of remarks for the entity
 */
export async function getRemarksCountForEntity(entityType, entityId) {
  const result = await pb.collection("bs_updates").getList(1, 1, {
    filter: `entity_type = "${entityType}" && parent = "${entityId}"`,
  });

  return result.totalItems || 0;
}

/**
 * Create a new remark for an entity (using polymorphic bs_updates table)
 * @param {Object} remarkData - Remark data to create
 * @param {string} remarkData.entity_type - The collection name
 * @param {string} remarkData.entity_id - The entity ID
 * @param {string} remarkData.content - The remark content
 * @param {string} remarkData.author - The author user ID
 * @returns {Promise<Object>} Created remark
 */
export async function createRemark(remarkData) {
  // Map to polymorphic bs_updates field structure using new 'parent' field
  const updateData = {
    entity_type: remarkData.entity_type,
    parent: remarkData.entity_id, // Use new 'parent' field for polymorphic entity ID
    update: remarkData.content, // bs_updates uses 'update' field for content
    author: remarkData.author,
    // Leave 'note' field empty/null for new polymorphic records
  };

  try {
    const result = await pb.collection("bs_updates").create(updateData);
    return result;
  } catch (error) {
    console.error("Failed to create remark:", error);
    console.error("Error details:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get a single remark by ID (using bs_updates table)
 * @param {string} id - Remark ID
 * @param {Object} options - Query options (expand, etc.)
 * @returns {Promise<Object>} Remark
 */
export async function getRemark(id, options = {}) {
  return await pb.collection("bs_updates").getOne(id, options);
}

/**
 * Update an existing remark (using bs_updates table)
 * @param {string} id - Remark ID
 * @param {Object} remarkData - Updated remark data
 * @returns {Promise<Object>} Updated remark
 */
export async function updateRemark(id, remarkData) {
  // Map content field to existing bs_updates structure
  const updateData = { ...remarkData };
  if (remarkData.content !== undefined) {
    updateData.update = remarkData.content;
    delete updateData.content;
  }
  return await pb.collection("bs_updates").update(id, updateData);
}

/**
 * Delete a remark (using bs_updates table)
 * @param {string} id - Remark ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteRemark(id) {
  return await pb.collection("bs_updates").delete(id);
}

// Convenience functions for common entities
export const getActionItemRemarks = (actionItemId, options = {}) =>
  getRemarksForEntity("bs_notes", actionItemId, options);

export const getMeetingTopicRemarks = (meetingTopicId, options = {}) =>
  getRemarksForEntity("bs_meeting_topics", meetingTopicId, options);

export const getProjectRemarks = (projectId, options = {}) => getRemarksForEntity("bs_projects", projectId, options);

export const getRelationRemarks = (relationId, options = {}) =>
  getRemarksForEntity("bs_relations", relationId, options);

// Simple aliases for ActionItems (uses parent field for polymorphic design)
export const getUpdatesForActionItem = (actionItemId, options = {}) => {
  const defaultOptions = {
    filter: `parent = "${actionItemId}" && entity_type = "bs_notes"`,
    sort: "-created",
    expand: "author",
    ...options,
  };
  return pb.collection("bs_updates").getFullList(defaultOptions);
};

export const createUpdate = (updateData) =>
  createRemark({
    entity_type: "bs_notes",
    entity_id: updateData.note,
    content: updateData.update,
    author: updateData.author,
  });

export const updateUpdate = (id, updateData) => updateRemark(id, { update: updateData.update });

export const deleteUpdate = deleteRemark;

export const getUpdate = getRemark;
