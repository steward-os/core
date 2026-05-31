import pb from "../pb";

/**
 * Get volunteering jobs with filtering and options
 * @param {Object} options - Query options (filter, sort, expand, etc.)
 * @returns {Promise<Array>} Volunteering jobs
 */
export async function getVolunteering(options = {}) {
  return await pb.collection("mb_volunteering").getFullList(options);
}

/**
 * Get volunteering jobs with pagination
 * @param {number} page - Page number
 * @param {number} perPage - Items per page
 * @param {Object} options - Query options (filter, sort, expand, etc.)
 * @returns {Promise<Object>} Paginated volunteering jobs
 */
export async function getVolunteeringList(page = 1, perPage = 300, options = {}) {
  return await pb.collection("mb_volunteering").getList(page, perPage, options);
}

/**
 * Get volunteering jobs with attendance counts computed from expanded data.
 * @param {Object} options - PocketBase query options (filter, sort, expand, etc.)
 * @returns {Promise<Object>} Paginated volunteering jobs with signed_up and still_needed fields
 */
export async function getVolunteeringFiltered(options = {}) {
  const result = await getVolunteeringList(1, 300, {
    expand: "mb_volunteering_attendance_via_volunteering",
    ...options,
  });
  
  // Process the expanded data to include attendance counts
  const itemsWithAttendance = result.items.map(item => {
    const attendances = item.expand?.mb_volunteering_attendance_via_volunteering || [];
    const signedUpCount = attendances.length;
    const stillNeeded = Math.max(0, item.number_needed - signedUpCount);
    
    return {
      ...item,
      signed_up: signedUpCount,
      still_needed: stillNeeded
    };
  });

  return {
    ...result,
    items: itemsWithAttendance
  };
}

/**
 * Get a single volunteering job by ID
 * @param {string} id - Volunteering job ID
 * @param {Object} options - Query options (expand, etc.)
 * @returns {Promise<Object>} Volunteering job with attendance data
 */
export async function getVolunteeringJob(id, options = {}) {
  const defaultOptions = {
    expand: "mb_volunteering_attendance_via_volunteering.user",
    ...options
  };
  
  const result = await pb.collection("mb_volunteering").getOne(id, defaultOptions);
  
  // Process attendance data
  const attendances = result.expand?.mb_volunteering_attendance_via_volunteering || [];
  const signedUpCount = attendances.length;
  const stillNeeded = Math.max(0, result.number_needed - signedUpCount);
  
  return {
    ...result,
    signed_up: signedUpCount,
    still_needed: stillNeeded
  };
}

/**
 * Create a new volunteering job
 * @param {Object} volunteeringData - Volunteering job data
 * @returns {Promise<Object>} Created volunteering job
 */
export async function createVolunteering(volunteeringData) {
  return await pb.collection("mb_volunteering").create(volunteeringData);
}

/**
 * Update an existing volunteering job
 * @param {string} id - Volunteering job ID
 * @param {Object} volunteeringData - Updated volunteering job data
 * @returns {Promise<Object>} Updated volunteering job
 */
export async function updateVolunteering(id, volunteeringData) {
  return await pb.collection("mb_volunteering").update(id, volunteeringData);
}

/**
 * Delete a volunteering job
 * @param {string} id - Volunteering job ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteVolunteering(id) {
  return await pb.collection("mb_volunteering").delete(id);
}

/**
 * Duplicate a volunteering job
 * @param {string} id - Original volunteering job ID
 * @returns {Promise<Object>} Created duplicate volunteering job
 */
export async function duplicateVolunteering(id) {
  const originalVolunteering = await getVolunteeringJob(id);

  // Remove fields that shouldn't be duplicated
  const { id: _id, created, updated, expand, signed_up, still_needed, ...volunteeringData } = originalVolunteering;

  return await createVolunteering(volunteeringData);
}

/**
 * Get volunteering attendance for a specific job
 * @param {string} volunteeringId - Volunteering job ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Attendance records
 */
export async function getVolunteeringAttendance(volunteeringId, options = {}) {
  const defaultOptions = {
    filter: `volunteering="${volunteeringId}"`,
    expand: "user",
    ...options
  };
  return await pb.collection("mb_volunteering_attendance").getFullList(defaultOptions);
}

/**
 * Create volunteering attendance (sign up)
 * @param {string} volunteeringId - Volunteering job ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Created attendance record
 */
export async function createVolunteeringAttendance(volunteeringId, userId) {
  return await pb.collection("mb_volunteering_attendance").create({
    volunteering: volunteeringId,
    user: userId
  });
}

/**
 * Delete volunteering attendance (sign out)
 * @param {string} attendanceId - Attendance record ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteVolunteeringAttendance(attendanceId) {
  return await pb.collection("mb_volunteering_attendance").delete(attendanceId);
}

/**
 * Check if user is signed up for volunteering job
 * @param {string} volunteeringId - Volunteering job ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Attendance record or null
 */
export async function getUserVolunteeringAttendance(volunteeringId, userId) {
  try {
    const records = await pb.collection("").getFullList({
      filter: `volunteering="${volunteeringId}" && user="${userId}"`
    });
    return records.length > 0 ? records[0] : null;
  } catch (error) {
    console.error("Error checking user attendance:", error);
    return null;
  }
}