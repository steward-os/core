import pb from "../pb";

/**
 * Get a single user by ID
 * @param {string} id - User ID
 * @param {Object} options - Query options (expand, etc.)
 * @returns {Promise<Object>} User data
 */
export async function getUser(id, options = {}) {
  return await pb.collection("users").getOne(id, options);
}

/**
 * Get all users with filtering and sorting
 * @param {Object} options - Query options (filter, sort, etc.)
 * @returns {Promise<Array>} List of users
 */
export async function getUsers(options = {}) {
  return await pb.collection("users").getFullList(options);
}

/**
 * Get users with pagination, filtering and sorting
 * @param {number} page - Page number
 * @param {number} perPage - Items per page
 * @param {Object} options - Query options (expand, filter, sort)
 * @returns {Promise<Object>} Paginated user list
 */
export async function getUsersPaginated(page = 1, perPage = 50, options = {}) {
  return await pb.collection("users").getList(page, perPage, options);
}

/**
 * Create a new user
 * @param {Object} userData - User data to create
 * @returns {Promise<Object>} Created user
 */
export async function createUser(userData) {
  // Ensure emailVisibility and emailConfirm are set if not provided
  const dataToCreate = { ...userData };
  if (userData.email) {
    if (!userData.hasOwnProperty("emailVisibility")) {
      dataToCreate.emailVisibility = true;
    }
    if (!userData.hasOwnProperty("emailConfirm")) {
      dataToCreate.emailConfirm = userData.email;
    }
  }
  return await pb.collection("users").create(dataToCreate);
}

/**
 * Update an existing user
 * @param {string} id - User ID
 * @param {Object} userData - Updated user data
 * @returns {Promise<Object>} Updated user
 */
export async function updateUser(id, userData) {
  // Ensure emailVisibility and emailConfirm are set if email is being updated
  const dataToUpdate = { ...userData };
  if (userData.email) {
    if (!userData.hasOwnProperty("emailVisibility")) {
      dataToUpdate.emailVisibility = true;
    }
    if (!userData.hasOwnProperty("emailConfirm")) {
      dataToUpdate.emailConfirm = userData.email;
    }
  }
  return await pb.collection("users").update(id, dataToUpdate);
}

/**
 * Delete a user
 * @param {string} id - User ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteUser(id) {
  return await pb.collection("users").delete(id);
}


/**
 * Authenticate user with Google OAuth2
 * @returns {Promise<Object>} Authentication result
 */
export async function authenticateWithGoogle() {
  console.log("Starting Google OAuth with PocketBase URL:", pb.baseUrl);
  try {
    const result = await pb.collection("users").authWithOAuth2({ provider: "google" });
    console.log("OAuth result:", result);
    return result;
  } catch (error) {
    console.error("OAuth error:", error);
    throw error;
  }
}

/**
 * Authenticate user with Facebook OAuth2
 * @returns {Promise<Object>} Authentication result
 */
export async function authenticateWithFacebook() {
  return await pb.collection("users").authWithOAuth2({ provider: "facebook" });
}

/**
 * Authenticate user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Authentication result
 */
export async function authenticateWithPassword(email, password) {
  return await pb.collection("users").authWithPassword(email, password);
}

/**
 * Request password reset email
 * @param {string} email - User email
 * @returns {Promise<Object>} Password reset request result
 */
export async function requestPasswordReset(email) {
  return await pb.collection("users").requestPasswordReset(email);
}

/**
 * Confirm password reset with token
 * @param {string} token - Password reset token
 * @param {string} password - New password
 * @param {string} passwordConfirm - New password confirmation
 * @returns {Promise<Object>} Password reset confirmation result
 */
export async function confirmPasswordReset(token, password, passwordConfirm) {
  return await pb.collection("users").confirmPasswordReset(token, password, passwordConfirm);
}

/**
 * Get group members for a specific user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of group memberships
 */
export async function getUserGroupMembers(userId) {
  if (!userId) return [];

  return await pb.collection("mb_group_members").getFullList({
    filter: `user="${userId}"`,
    expand: "group,section",
  });
}

/**
 * Create group membership for a user
 * @param {string} userId - User ID
 * @param {string} groupId - Group ID
 * @param {string} sectionId - Section ID
 * @returns {Promise<Object>} Created group membership
 */
export async function createUserGroupMember(userId, groupId, sectionId) {
  return await pb.collection("mb_group_members").create({
    user: userId,
    group: groupId,
    section: sectionId,
  });
}

/**
 * Delete group membership
 * @param {string} membershipId - Group membership ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteUserGroupMember(membershipId) {
  return await pb.collection("mb_group_members").delete(membershipId);
}

/**
 * Get board members (users with is_board_member=true)
 * @param {Object} options - Query options (sort, etc.)
 * @returns {Promise<Array>} List of board members
 */
export async function getBoardMembers(options = {}) {
  const defaultOptions = {
    filter: "is_board_member=true",
    sort: "name",
    requestKey: null,
    ...options,
  };

  return await pb.collection("users").getFullList(defaultOptions);
}

/**
 * Get attendance count by state and date range for a specific user
 * @param {string} userId - User ID
 * @param {string} state - Attendance state from stateVars.js
 * @param {string} startDate - Start date in ISO format
 * @param {string} endDate - End date in ISO format
 * @returns {Promise<number>} Count of matching attendance records
 */
export async function getUserAttendanceCount(userId, state, startDate, endDate) {
  if (!userId || !state || !startDate || !endDate) return 0;

  const filter = `group_member.user="${userId}" && state="${state}" && session.date_time >= "${startDate}" && session.date_time <= "${endDate}"`;

  try {
    const result = await pb.collection("mb_attendance").getList(1, 1, {
      filter: filter,
      fields: "id",
      $autoCancel: false,
    });

    return result.totalItems;
  } catch (error) {
    console.error("--->Error in getUserAttendanceCount:", error);
    return 0;
  }
}

/**
 * Get attendance statistics for a user for current year-to-date and last full year
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Attendance statistics
 */
export async function getUserAttendanceStats(userId) {
  if (!userId) return null;

  try {
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;

    // Year-to-date (current year from Jan 1 to now)
    const ytdStart = `${currentYear}-01-01 00:00:00`;
    const ytdEnd = new Date().toISOString();

    // Last full year (Jan 1 to Dec 31)
    const lastYearStart = `${lastYear}-01-01 00:00:00`;
    const lastYearEnd = `${lastYear}-12-31 23:59:59`;

    // Make all calls concurrently now that auto-cancel is disabled
    const [
      ytdPresent,
      ytdWillBePresent,
      ytdNotPresentWithoutNotice,
      ytdNotPresentWithNotice,
      lastYearPresent,
      lastYearWillBePresent,
      lastYearNotPresentWithoutNotice,
      lastYearNotPresentWithNotice,
    ] = await Promise.all([
      getUserAttendanceCount(userId, "present", ytdStart, ytdEnd),
      getUserAttendanceCount(userId, "will_be_present", ytdStart, ytdEnd),
      getUserAttendanceCount(userId, "not_present_without_notice", ytdStart, ytdEnd),
      getUserAttendanceCount(userId, "not_present_with_notice", ytdStart, ytdEnd),
      getUserAttendanceCount(userId, "present", lastYearStart, lastYearEnd),
      getUserAttendanceCount(userId, "will_be_present", lastYearStart, lastYearEnd),
      getUserAttendanceCount(userId, "not_present_without_notice", lastYearStart, lastYearEnd),
      getUserAttendanceCount(userId, "not_present_with_notice", lastYearStart, lastYearEnd),
    ]);

    return {
      yearToDate: {
        year: currentYear,
        present: ytdPresent,
        willBePresent: ytdWillBePresent,
        notPresentWithoutNotice: ytdNotPresentWithoutNotice,
        notPresentWithNotice: ytdNotPresentWithNotice,
        total: ytdPresent + ytdWillBePresent + ytdNotPresentWithoutNotice + ytdNotPresentWithNotice,
      },
      lastYear: {
        year: lastYear,
        present: lastYearPresent,
        willBePresent: lastYearWillBePresent,
        notPresentWithoutNotice: lastYearNotPresentWithoutNotice,
        notPresentWithNotice: lastYearNotPresentWithNotice,
        total: lastYearPresent + lastYearWillBePresent + lastYearNotPresentWithoutNotice + lastYearNotPresentWithNotice,
      },
    };
  } catch (error) {
    console.error("Error in getUserAttendanceStats:", error);
    return null;
  }
}
