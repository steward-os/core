import pb from "../pb";

/**
 * Get all markings for a specific video and user
 * @param {string} videoId - YouTube video ID
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Marking records
 */
export async function getMarkingsByVideo(videoId, userId) {
  return await pb.collection("mb_music_markings").getFullList({
    filter: `videoId="${videoId}" && user="${userId}"`,
    sort: "time",
  });
}

/**
 * Create a new marking
 * @param {Object} data - Marking data (videoId, user, time, label)
 * @returns {Promise<Object>} Created marking record
 */
export async function createMarking(data) {
  return await pb.collection("mb_music_markings").create(data);
}

/**
 * Update a marking
 * @param {string} id - Marking ID
 * @param {Object} data - Data to update (time, label)
 * @returns {Promise<Object>} Updated marking record
 */
export async function updateMarking(id, data) {
  return await pb.collection("mb_music_markings").update(id, data);
}

/**
 * Delete a marking
 * @param {string} id - Marking ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteMarking(id) {
  return await pb.collection("mb_music_markings").delete(id);
}
