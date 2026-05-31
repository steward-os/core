onRecordDelete(async (e) => {
  try {
    // Find all group members for this user
    let groupMembers = await e.app.findRecordsByFilter(
      "mb_group_members",
      `user = "${e.record.id}"`,
      "", // No specific order needed for deletion
      1000,
      0
    );

    console.log(`Found ${groupMembers.length} group_members to delete for user:`, e.record.id);

    // Delete each group member
    for (let member of groupMembers) {
      try {
        await $app.delete(member);
        console.log("Deleted group_member:", member.get("user"));
      } catch (err) {
        console.error("Failed to delete group_member:", member.get("user"), err);
      }
    }
  } catch (err) {
    console.error("Failed to delete group_members for user:", e.record.id, err);
  }

  // Call next() to continue with the user deletion
  e.next();
}, "users");
