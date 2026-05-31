onRecordAfterCreateSuccess(async (e) => {
  const meetingTemplateId = e.record.get("meeting_template");
  
  if (!meetingTemplateId) {
    console.log("No meeting template specified for meeting:", e.record.id);
    return;
  }

  try {
    // Get all template topics for this meeting template
    let templateTopics = await e.app.findRecordsByFilter(
      "bs_meeting_template_topics",
      `meeting_template = "${meetingTemplateId}"`,
      "created", // Order by creation order
      1000,
      0
    );

    console.log(`Found ${templateTopics.length} template topics for meeting template:`, meetingTemplateId);

    // Create a meeting topic for each template topic
    for (let i = 0; i < templateTopics.length; i++) {
      const templateTopic = templateTopics[i];
      let collection = $app.findCollectionByNameOrId("bs_meeting_topics");
      let record = new Record(collection);
      
      record.set("name", templateTopic.get("name"));
      record.set("meeting", e.record.id);
      record.set("type", "note"); // Default type
      record.set("state", "open"); // Default state
      record.set("order", i + 1); // Set order based on position
      
      try {
        await $app.save(record);
        console.log("Meeting topic created:", templateTopic.get("name"));
      } catch (err) {
        console.error(
          "Failed to create meeting topic:",
          templateTopic.get("name"),
          err
        );
      }
    }
  } catch (err) {
    console.error("Failed to process meeting template topics for meeting:", e.record.id, err);
  }
}, "bs_meetings");

onRecordDelete(async (e) => {
  try {
    // Find all meeting topics for this meeting
    let meetingTopics = await e.app.findRecordsByFilter(
      "bs_meeting_topics",
      `meeting = "${e.record.id}"`,
      "", // No specific order needed for deletion
      1000,
      0
    );

    console.log(`Found ${meetingTopics.length} meeting topics to delete for meeting:`, e.record.id);

    // Delete each meeting topic
    for (let topic of meetingTopics) {
      try {
        await $app.delete(topic);
        console.log("Deleted meeting topic:", topic.get("name"));
      } catch (err) {
        console.error("Failed to delete meeting topic:", topic.get("name"), err);
      }
    }
  } catch (err) {
    console.error("Failed to delete meeting topics for meeting:", e.record.id, err);
  }
  
  // Call next() to continue with the meeting deletion
  e.next();
}, "bs_meetings");