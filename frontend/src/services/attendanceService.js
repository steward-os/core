import pb from "../pb";

/**
 * Get attendance records for a session
 * @param {string} sessionId - Session ID
 * @param {Object} options - Query options (expand, filter, etc.)
 * @returns {Promise<Array>} Attendance records
 */
export async function getAttendanceBySession(sessionId, options = {}) {
  const defaultOptions = {
    filter: `session="${sessionId}"`,
    expand: "group_member,group_member.user,group_member.section,session",
    sort: "group_member.section.name",
    ...options,
  };
  return await pb.collection("mb_attendance").getFullList(defaultOptions);
}

/**
 * Update attendance state for selected records
 * @param {Object} params - Parameters object
 * @param {Array} params.attendance - Attendance records
 * @param {Array} params.selectedRowKeys - Selected attendance IDs
 * @param {string} params.newState - New state to set
 * @param {Function} params.fetchSessionAndAttendance - Callback to refresh data
 * @param {Function} params.setSelectedRowKeys - Callback to clear selection
 * @param {Function} params.setUpdating - Callback to set updating state
 */
export async function setAttendanceState({
  attendance,
  selectedRowKeys,
  newState,
  fetchSessionAndAttendance,
  setSelectedRowKeys,
  setUpdating,
}) {
  setUpdating(true);
  try {
    await Promise.all(
      selectedRowKeys.map((attendanceId) => {
        const record = attendance.find((a) => a.id === attendanceId);
        let finalState = newState;
        if (newState === "not_present") {
          if (record?.state === "wont_be_present") {
            finalState = "not_present_with_notice";
          } else {
            finalState = "not_present_without_notice";
          }
        }
        return updateAttendanceRecord(attendanceId, { state: finalState });
      })
    );
    await fetchSessionAndAttendance();
    setSelectedRowKeys([]);
  } catch (e) {
    console.log("Bijwerken mislukt");
  }
  setUpdating(false);
}

/**
 * Confirm attendance states (convert will_be_present to present, etc.)
 * @param {Object} params - Parameters object
 * @param {Array} params.attendance - Attendance records
 * @param {Function} params.fetchSessionAndAttendance - Callback to refresh data
 * @param {Function} params.setSelectedRowKeys - Callback to clear selection
 * @param {Function} params.setUpdating - Callback to set updating state
 */
export async function setConfirmState({ attendance, fetchSessionAndAttendance, setSelectedRowKeys, setUpdating }) {
  setUpdating(true);
  try {
    const updates = attendance
      .filter((a) => a.state === "will_be_present" || a.state === "wont_be_present")
      .map((a) => {
        let newState = a.state;
        if (a.state === "will_be_present") newState = "present";
        if (a.state === "wont_be_present") newState = "not_present_with_notice";
        return updateAttendanceRecord(a.id, { state: newState });
      });

    await Promise.all(updates);
    await fetchSessionAndAttendance();
    setSelectedRowKeys([]);
  } catch (e) {
    console.error("Bevestigen mislukt");
  }
  setUpdating(false);
}

/**
 * Update a single attendance record
 * @param {string} id - Attendance record ID
 * @param {Object} data - Data to update
 * @returns {Promise<Object>} Updated attendance record
 */
export async function updateAttendanceRecord(id, data) {
  return await pb.collection("mb_attendance").update(id, data);
}

/**
 * Create attendance record
 * @param {Object} data - Attendance data
 * @returns {Promise<Object>} Created attendance record
 */
export async function createAttendanceRecord(data) {
  return await pb.collection("mb_attendance").create(data);
}

/**
 * Get attendance records with filtering and options
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Attendance records
 */
export async function getAttendanceRecords(options = {}) {
  return await pb.collection("mb_attendance").getFullList(options);
}

/**
 * Get attendance records for a set of sessions and a specific group (for matrix view)
 * @param {Array} sessionIds - Array of session IDs
 * @param {string} groupId - Group ID
 * @returns {Promise<Array>} Attendance records with expanded group_member and user
 */
export async function getAttendanceForMatrix(sessionIds, groupId) {
  if (!sessionIds.length) return [];
  const sessionFilter = sessionIds.map((id) => `session="${id}"`).join(" || ");
  return await pb.collection("mb_attendance").getFullList({
    filter: `(${sessionFilter}) && group_member.group="${groupId}"`,
    expand: "group_member,group_member.user",
  });
}
