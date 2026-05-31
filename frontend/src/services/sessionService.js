import pb from "../pb";
import { getAttendanceBySession } from "./attendanceService";

/**
 * Get a single session by ID
 * @param {string} id - Session ID
 * @param {Object} options - Query options (expand, etc.)
 * @returns {Promise<Object>} Session data
 */
export async function getSession(id, options = {}) {
  return await pb.collection("mb_sessions").getOne(id, options);
}

/**
 * Get sessions with pagination, filtering and sorting
 * @param {number} page - Page number
 * @param {number} perPage - Items per page
 * @param {Object} options - Query options (expand, filter, sort)
 * @returns {Promise<Object>} Paginated session list
 */
export async function getSessions(page = 1, perPage = 50, options = {}) {
  return await pb.collection("mb_sessions").getList(page, perPage, options);
}

/**
 * Create a new session
 * @param {Object} sessionData - Session data to create
 * @returns {Promise<Object>} Created session
 */
export async function createSession(sessionData) {
  return await pb.collection("mb_sessions").create(sessionData);
}

/**
 * Update an existing session
 * @param {string} id - Session ID
 * @param {Object} sessionData - Updated session data
 * @returns {Promise<Object>} Updated session
 */
export async function updateSession(id, sessionData) {
  return await pb.collection("mb_sessions").update(id, sessionData);
}

/**
 * Delete a session
 * @param {string} id - Session ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteSession(id) {
  return await pb.collection("mb_sessions").delete(id);
}

/**
 * Duplicate a session with a new name and date
 * @param {string} id - Original session ID
 * @returns {Promise<Object>} Created duplicate session
 */
export async function duplicateSession(id) {
  const originalSession = await getSession(id, { expand: "groups" });

  // Remove fields that shouldn't be duplicated
  const { id: _id, created, updated, expand, ...sessionData } = originalSession;

  // Keep groups relation if it exists
  if (originalSession.groups) {
    sessionData.groups = originalSession.groups;
  }

  return await createSession(sessionData);
}

/**
 * Save the canvas layout for a session
 * @param {string} sessionId - Session ID
 * @param {Object} layout - Layout object { [attendanceId]: { x, y } }
 * @returns {Promise<Object>} Updated session
 */
export async function saveCanvasLayout(sessionId, layout) {
  return await pb.collection("mb_sessions").update(sessionId, { canvas_layout: layout });
}

/**
 * Get all sessions for a specific group
 * @param {string} groupId - Group ID
 * @returns {Promise<Array>} Sessions sorted by date descending
 */
export async function getSessionsForGroup(groupId, sort = "date_time") {
  return await pb.collection("mb_sessions").getFullList({
    filter: `groups ~ "${groupId}"`,
    sort: sort,
  });
}

/**
 * Get session with attendance data (combines session + attendance)
 * @param {string} id - Session ID
 * @returns {Promise<Object>} Object with sessionData and attendanceData
 */
export async function getSessionWithAttendance(id) {
  try {
    const [sessionData, attendanceData] = await Promise.all([
      getSession(id, { expand: "groups" }),
      getAttendanceBySession(id),
    ]);
    return { sessionData, attendanceData };
  } catch (e) {
    console.error("Fout bij ophalen gegevens", e);
    return { sessionData: null, attendanceData: [] };
  }
}
