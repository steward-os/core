onRecordDelete(async (e) => {
  try {
    // Find all meeting topics for this meeting
    let meetingTemplateTopics = await e.app.findRecordsByFilter(
      "bs_meeting_template_topics",
      `meeting_template = "${e.record.id}"`,
      "", // No specific order needed for deletion
      1000,
      0
    );

    console.log(`Found ${meetingTemplateTopics.length} meeting template topics to delete for meeting:`, e.record.id);

    // Delete each meeting topic
    for (let topic of meetingTemplateTopics) {
      try {
        await $app.delete(topic);
        console.log("Deleted meeting template topic:", topic.get("name"));
      } catch (err) {
        console.error("Failed to delete meeting template topic:", topic.get("name"), err);
      }
    }
  } catch (err) {
    console.error("Failed to delete meeting template topics for meeting_template:", e.record.id, err);
  }
  
  // Call next() to continue with the meeting deletion
  e.next();
}, "bs_meeting_templates");