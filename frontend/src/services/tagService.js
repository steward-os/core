import pb from "../pb";

/**
 * Get a single relation tag by ID
 * @param {string} id - Tag ID
 * @param {Object} options - Query options (expand, etc.)
 * @returns {Promise<Object>} Tag data
 */
export async function getRelationTag(id, options = {}) {
  return await pb.collection("sys_tags").getOne(id, options);
}

/**
 * Get all relation tags
 * @param {Object} options - Query options (expand, filter, sort)
 * @returns {Promise<Array>} All tags
 */
export async function getRelationTags(options = {}) {
  return await pb.collection("sys_tags").getFullList({
    filter: 'type = "relation"',
    ...options,
  });
}

/**
 * Get relation tags with pagination, filtering and sorting
 * @param {number} page - Page number
 * @param {number} perPage - Items per page
 * @param {Object} options - Query options (expand, filter, sort)
 * @returns {Promise<Object>} Paginated tag list
 */
export async function getRelationTagsPaginated(page = 1, perPage = 50, options = {}) {
  return await pb.collection("sys_tags").getList(page, perPage, {
    filter: 'type = "relation"',
    ...options,
  });
}

/**
 * Get all tags regardless of type
 * @param {Object} options - Query options (expand, filter, sort)
 * @returns {Promise<Array>} All tags
 */
export async function getAllTags(options = {}) {
  return await pb.collection("sys_tags").getFullList(options);
}

/**
 * Get all tags with pagination regardless of type
 * @param {number} page - Page number
 * @param {number} perPage - Items per page
 * @param {Object} options - Query options (expand, filter, sort)
 * @returns {Promise<Object>} Paginated tag list
 */
export async function getAllTagsPaginated(page = 1, perPage = 50, options = {}) {
  return await pb.collection("sys_tags").getList(page, perPage, options);
}

/**
 * Create a new relation tag
 * @param {Object} tagData - Tag data to create
 * @returns {Promise<Object>} Created tag
 */
export async function createRelationTag(tagData) {
  return await pb.collection("sys_tags").create(tagData);
}

/**
 * Update an existing relation tag
 * @param {string} id - Tag ID
 * @param {Object} tagData - Updated tag data
 * @returns {Promise<Object>} Updated tag
 */
export async function updateRelationTag(id, tagData) {
  return await pb.collection("sys_tags").update(id, tagData);
}

/**
 * Delete a relation tag
 * @param {string} id - Tag ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteRelationTag(id) {
  return await pb.collection("sys_tags").delete(id);
}

/**
 * Get tags for a specific relation
 * @param {string} relationId - Relation ID
 * @returns {Promise<Array>} Array of tags for the relation
 */
export async function getTagsForRelation(relationId) {
  const relation = await pb.collection("bs_relations").getOne(relationId, {
    expand: "tags",
  });
  return relation.expand?.tags || [];
}

export async function getTagsForEmail(emailId) {
  const email = await pb.collection("bs_correspondence").getOne(emailId, {
    expand: "tags",
  });
  return email.expand?.tags || [];
}

/**
 * Set tags for a relation (replaces all existing tags)
 * @param {string} relationId - Relation ID
 * @param {Array} tagIds - Array of tag IDs to assign
 * @returns {Promise<void>}
 */
export async function setTagsForRelation(relationId, tagIds) {
  // Update the relation with the new tag IDs
  await pb.collection("bs_relations").update(relationId, {
    tags: tagIds,
  });
}

/**
 * Add a tag to a relation
 * @param {string} relationId - Relation ID
 * @param {string} tagId - Tag ID to add
 * @returns {Promise<Object>} Updated relation
 */
export async function addTagToRelation(relationId, tagId) {
  // Get current tags
  const currentTags = await getTagsForRelation(relationId);
  const currentTagIds = currentTags.map((tag) => tag.id);

  // Add new tag if not already present
  if (!currentTagIds.includes(tagId)) {
    const newTagIds = [...currentTagIds, tagId];
    return await pb.collection("bs_relations").update(relationId, {
      tags: newTagIds,
    });
  }

  return await pb.collection("bs_relations").getOne(relationId);
}

/**
 * Remove a tag from a relation
 * @param {string} relationId - Relation ID
 * @param {string} tagId - Tag ID to remove
 * @returns {Promise<Object>} Updated relation
 */
export async function removeTagFromRelation(relationId, tagId) {
  // Get current tags
  const currentTags = await getTagsForRelation(relationId);
  const currentTagIds = currentTags.map((tag) => tag.id);

  // Remove tag if present
  const newTagIds = currentTagIds.filter((id) => id !== tagId);

  return await pb.collection("bs_relations").update(relationId, {
    tags: newTagIds,
  });
}
