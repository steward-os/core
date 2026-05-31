import pb from "../pb";

/**
 * Get updates for a specific action item
 * @param {string} actionItemId - Action item ID
 * @param {Object} options - Query options (expand, sort, etc.)
 * @returns {Promise<Array>} Updates for the action item
 */
export async function getUpdatesForActionItem(actionItemId, options = {}) {
  const defaultOptions = {
    filter: `parent = "${actionItemId}" && entity_type = "bs_notes"`,
    sort: "-created",
    expand: "author",
    ...options,
  };
  return await pb.collection("bs_updates").getFullList(defaultOptions);
}

/**
 * Create a new update for an action item
 * @param {Object} updateData - Update data to create
 * @returns {Promise<Object>} Created update
 */
export async function createUpdate(updateData) {
  console.log("createUpdate called with:", updateData);

  const data = {
    ...updateData,
    entity_type: "bs_notes", // Set entity_type for ActionItems
    parent: updateData.note, // Map note field to parent field
  };
  // Remove the old note field to avoid conflicts
  delete data.note;

  console.log("Final data to send to PocketBase:", data);

  try {
    const result = await pb.collection("bs_updates").create(data);
    console.log("Successfully created update:", result);
    return result;
  } catch (error) {
    console.error("Error creating update:", error);
    console.error("Error details:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get a single update by ID
 * @param {string} id - Update ID
 * @param {Object} options - Query options (expand, etc.)
 * @returns {Promise<Object>} Update
 */
export async function getUpdate(id, options = {}) {
  return await pb.collection("bs_updates").getOne(id, options);
}

/**
 * Update an existing update
 * @param {string} id - Update ID
 * @param {Object} updateData - Updated update data
 * @returns {Promise<Object>} Updated update
 */
export async function updateUpdate(id, updateData) {
  return await pb.collection("bs_updates").update(id, updateData);
}

/**
 * Delete an update
 * @param {string} id - Update ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteUpdate(id) {
  return await pb.collection("bs_updates").delete(id);
}