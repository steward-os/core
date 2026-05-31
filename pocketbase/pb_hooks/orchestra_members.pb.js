onRecordAfterCreateSuccess(async (e) => {
  const today = new Date().toISOString().slice(0, 10);
  let sessions = await e.app.findRecordsByFilter(
    "mb_sessions",
    `date_time >= "${today}" && groups ~ "${e.record.get("group")}"`,
    "-date_time",
    1000,
    0
  );

  // For each session, create an attendance record for the new group_member
  for (const session of sessions) {
    let collection = $app.findCollectionByNameOrId("mb_attendance");
    let record = new Record(collection);
    record.set("session", session.id);
    record.set("group_member", e.record.id);
    record.set("state", session.get("default_attendance_state"));
    try {
      await $app.save(record);
      console.log("Attendance record saved for session:", session.id);
    } catch (err) {
      console.error(
        "Failed to save attendance record for session:",
        session.id,
        err
      );
    }
  }
}, "mb_group_members");

onRecordDelete(async (e) => {
  try {
    // Find all attendance records for this group_member
    let attendanceRecords = await e.app.findRecordsByFilter(
      "mb_attendance",
      `group_member = "${e.record.id}"`,
      "", // No specific order needed for deletion
      1000,
      0
    );

    console.log(`Found ${attendanceRecords.length} attendance records to delete for group_member:`, e.record.id);

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
    console.error("Failed to delete attendance records for group_member:", e.record.id, err);
  }

  // Call next() to continue with the group member deletion
  e.next();
}, "mb_group_members");
