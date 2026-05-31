import pb from "../pb";

/**
 * Get relation notes with filtering and options
 * @param {Object} options - Query options (filter, sort, expand, etc.)
 * @returns {Promise<Array>} Relation notes
 */
export async function getRelationNotes(options = {}) {
  const defaultOptions = {
    expand: "author",
    ...options,
  };
  return await pb.collection("bs_relation_notes").getFullList(defaultOptions);
}

/**
 * Get relation notes for a specific relation
 * @param {string} relationId - Relation ID
 * @param {Object} options - Additional query options
 * @returns {Promise<Array>} Relation notes for the relation
 */
export async function getNotesByRelation(relationId, options = {}) {
  const defaultOptions = {
    filter: `relation = "${relationId}"`,
    sort: "-created",
    expand: "author",
    ...options,
  };
  return await getRelationNotes(defaultOptions);
}

/**
 * Get a single relation note by ID
 * @param {string} id - Note ID
 * @param {Object} options - Query options (expand, etc.)
 * @returns {Promise<Object>} Relation note
 */
export async function getRelationNote(id, options = {}) {
  const defaultOptions = {
    expand: "author",
    ...options,
  };
  return await pb.collection("bs_relation_notes").getOne(id, defaultOptions);
}

/**
 * Create a new relation note
 * @param {Object} noteData - Note data to create
 * @returns {Promise<Object>} Created note
 */
export async function createRelationNote(noteData) {
  return await pb.collection("bs_relation_notes").create(noteData);
}

/**
 * Create a relation note for a specific relation with current user as author
 * @param {string} relationId - Relation ID
 * @param {string} title - Note title
 * @param {string} note - Note content
 * @param {Object} additionalData - Additional note data
 * @returns {Promise<Object>} Created note
 */
export async function createNoteForRelation(relationId, title, note, additionalData = {}) {
  return await createRelationNote({
    relation: relationId,
    title: title.trim(),
    note: note.trim(),
    author: pb.authStore.record?.id,
    ...additionalData,
  });
}

/**
 * Update an existing relation note
 * @param {string} id - Note ID
 * @param {Object} noteData - Updated note data
 * @returns {Promise<Object>} Updated note
 */
export async function updateRelationNote(id, noteData) {
  return await pb.collection("bs_relation_notes").update(id, noteData);
}

/**
 * Delete a relation note
 * @param {string} id - Note ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteRelationNote(id) {
  return await pb.collection("bs_relation_notes").delete(id);
}
