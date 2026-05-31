onRecordAfterCreateSuccess(async (e) => {
  const groups = e.record.get("groups"); // array of group IDs
  console.log("Creating attendance records for session:", e.record.id, "for groups:", groups);

  for (const groupId of groups) {
    let group_members = await e.app.findRecordsByFilter(
      "mb_group_members",
      `group = "${groupId}"`,
      "-created",
      1000,
      0
    );

    // For each group_member, create an attendance record for this session
    for (const member of group_members) {
      let collection = $app.findCollectionByNameOrId("mb_attendance");
      let record = new Record(collection);
      record.set("session", e.record.id);
      record.set("group_member", member.id);
      record.set("state", e.record.get("default_attendance_state"));
      try {
        await $app.save(record);
        console.log("Attendance record saved for member:", member.id, "in session:", e.record.id);
      } catch (err) {
        console.error("Failed to save attendance record for member:", member.id, "in session:", e.record.id, err);
      }
    }
  }

}, "mb_sessions");

onRecordDelete(async (e) => {
  try {
    // Find all attendance records for this session
    let attendanceRecords = await e.app.findRecordsByFilter(
      "mb_attendance",
      `session = "${e.record.id}"`,
      "", // No specific order needed for deletion
      1000,
      0
    );

    console.log(`Found ${attendanceRecords.length} attendance records to delete for session:`, e.record.id);

    // Delete each attendance record
    for (let attendance of attendanceRecords) {
      try {
        await $app.delete(attendance);
        console.log("Deleted attendance record for member:", attendance.get("group_member"));
      } catch (err) {
        console.error("Failed to delete attendance record for member:", attendance.get("group_member"), err);
      }
    }
  } catch (err) {
    console.error("Failed to delete attendance records for session:", e.record.id, err);
  }

  // Call next() to continue with the session deletion
  e.next();
}, "mb_sessions");

// Handle group changes - recreate attendance records when groups change
onRecordUpdate(async (e) => {
  const oldRecord = await e.app.findRecordById("mb_sessions", e.record.id);
  const oldGroups = oldRecord.get("groups") || [];
  const newGroups = e.record.get("groups") || [];

  // Convert to strings for comparison
  const oldGroupIds = oldGroups.map(id => String(id)).sort();
  const newGroupIds = newGroups.map(id => String(id)).sort();

  // Check if groups have changed
  const groupsChanged = JSON.stringify(oldGroupIds) !== JSON.stringify(newGroupIds);

  if (groupsChanged) {
    console.log("Groups changed for session:", e.record.id);
    console.log("Old groups:", oldGroupIds);
    console.log("New groups:", newGroupIds);

    // Find groups that were removed
    const removedGroups = oldGroupIds.filter(id => !newGroupIds.includes(id));
    console.log("Removed groups:", removedGroups);

    // Delete attendance records for removed groups
    for (const groupId of removedGroups) {
      try {
        // Find all group members for this group
        const groupMembers = await e.app.findRecordsByFilter(
          "mb_group_members",
          `group = "${groupId}"`,
          "-created",
          1000,
          0
        );

        const memberIds = groupMembers.map(m => m.id);
        console.log(`Found ${memberIds.length} members in removed group ${groupId}`);

        // Delete attendance records for these members in this session
        for (const memberId of memberIds) {
          const attendanceRecords = await e.app.findRecordsByFilter(
            "mb_attendance",
            `session = "${e.record.id}" && group_member = "${memberId}"`,
            "",
            100,
            0
          );

          for (const attendance of attendanceRecords) {
            await e.app.delete(attendance);
            console.log("Deleted attendance record for member:", memberId);
          }
        }
      } catch (err) {
        console.error("Failed to delete attendance records for group:", groupId, err);
      }
    }

    // Find groups that were added
    const addedGroups = newGroupIds.filter(id => !oldGroupIds.includes(id));
    console.log("Added groups:", addedGroups);

    // Create attendance records for added groups
    for (const groupId of addedGroups) {
      try {
        const groupMembers = await e.app.findRecordsByFilter(
          "mb_group_members",
          `group = "${groupId}"`,
          "-created",
          1000,
          0
        );

        console.log(`Found ${groupMembers.length} members in added group ${groupId}`);

        // Create attendance record for each member
        for (const member of groupMembers) {
          const collection = $app.findCollectionByNameOrId("mb_attendance");
          const record = new Record(collection);
          record.set("session", e.record.id);
          record.set("group_member", member.id);
          record.set("state", e.record.get("default_attendance_state") || "");

          try {
            await $app.save(record);
            console.log("Created attendance record for member:", member.id);
          } catch (err) {
            console.error("Failed to create attendance record for member:", member.id, err);
          }
        }
      } catch (err) {
        console.error("Failed to create attendance records for group:", groupId, err);
      }
    }
  }

  e.next();
}, "mb_sessions");

