onRecordDelete(async (e) => {
  try {
    // Find all volunteering attendance for this volunteering
    let volunteeringAttendance = await e.app.findRecordsByFilter(
      "mb_volunteering_attendance",
      `volunteering = "${e.record.id}"`,
      "", // No specific order needed for deletion
      1000,
      0
    );

    console.log(`Found ${volunteeringAttendance.length} volunteering attendance records to delete for volunteering:`, e.record.id);

    // Delete each volunteering attendance
    for (let att of volunteeringAttendance) {
      try {
        await $app.delete(att);
        console.log("Deleted volunteering attendance:", att.get("user"));
      } catch (err) {
        console.error("Failed to delete volunteering attendance:", att.get("user"), err);
      }
    }
  } catch (err) {
    console.error("Failed to delete volunteering attendance for volunteering:", e.record.id, err);
  }

  // Call next() to continue with the volunteering deletion
  e.next();
}, "mb_volunteering");