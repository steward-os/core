// When a bs_notes record is created or updated with type="action",
// automatically create/sync a corresponding bs_actions record and bs_action_connections records.
//
// Connection records created per action:
//   - connection_model="bs_notes"     → links back to the source note (used for update sync)
//   - connection_model="bs_meetings"  → links to the meeting (if note has a meeting_topic)
//   - connection_model="bs_projects"  → links to the project (if note has a project)

onRecordAfterCreateSuccess((e) => {
  console.log("[bs_notes] create hook fired, type:", e.record.get("type"), "id:", e.record.id);
  if (e.record.get("type") !== "action") return;

  try {
    const actionsCollection = e.app.findCollectionByNameOrId("bs_actions");
    const action = new Record(actionsCollection);
    action.set("name", e.record.get("name") || "");
    action.set("state", e.record.get("state") || "open");
    action.set("description", e.record.get("description") || "");
    action.set("assigned_to", e.record.get("assigned_to") || "");
    action.set("tags", []);
    action.set("datetime", e.record.get("created"));
    e.app.save(action);

    // Connection back to the source note (used for update sync)
    const connectionsCollection = e.app.findCollectionByNameOrId("bs_action_connections");
    const noteConnection = new Record(connectionsCollection);
    noteConnection.set("action", action.id);
    noteConnection.set("connection_model", "bs_notes");
    noteConnection.set("connection_id", e.record.id);
    e.app.save(noteConnection);

    // Connection to the meeting (if note has a meeting_topic)
    const meetingTopicId = e.record.get("meeting_topic");
    if (meetingTopicId) {
      const meetingTopic = e.app.findRecordById("bs_meeting_topics", meetingTopicId);
      const meetingId = meetingTopic.get("meeting");
      if (meetingId) {
        const meeting = e.app.findRecordById("bs_meetings", meetingId);
        const meetingDate = meeting.get("date_time") ? new Date(meeting.get("date_time")).toLocaleDateString("nl-NL") : "";
        const meetingLabel = meetingDate ? meeting.get("name") + " · " + meetingDate : meeting.get("name");
        const meetingConnection = new Record(connectionsCollection);
        meetingConnection.set("action", action.id);
        meetingConnection.set("connection_model", "bs_meetings");
        meetingConnection.set("connection_id", meetingId);
        meetingConnection.set("type", "Afgesproken");
        meetingConnection.set("label", meetingLabel);
        e.app.save(meetingConnection);
      }
    }

    // Connection to the project (if note has a project)
    const projectId = e.record.get("project");
    if (projectId) {
      const project = e.app.findRecordById("bs_projects", projectId);
      const projectConnection = new Record(connectionsCollection);
      projectConnection.set("action", action.id);
      projectConnection.set("connection_model", "bs_projects");
      projectConnection.set("connection_id", projectId);
      projectConnection.set("label", project.get("name") || "");
      e.app.save(projectConnection);
    }

    console.log("[bs_notes] action + connections created for note:", e.record.id);
  } catch (err) {
    console.error("[bs_notes] Failed to create bs_action for note:", e.record.id, err);
  }
}, "bs_notes");

onRecordAfterUpdateSuccess((e) => {
  const type = e.record.get("type");
  const prevType = e.record.original().get("type");
  console.log("[bs_notes] update hook fired, type:", type, "prevType:", prevType, "id:", e.record.id);

  if (type !== "action") return;

  try {
    const connectionsCollection = e.app.findCollectionByNameOrId("bs_action_connections");

    if (prevType !== "action") {
      // Type just changed to "action" — create a new action
      const actionsCollection = e.app.findCollectionByNameOrId("bs_actions");
      const action = new Record(actionsCollection);
      action.set("name", e.record.get("name") || "");
      action.set("state", e.record.get("state") || "open");
      action.set("description", e.record.get("description") || "");
      action.set("assigned_to", e.record.get("assigned_to") || "");
      action.set("tags", []);
      action.set("datetime", e.record.get("created"));
      e.app.save(action);

      const noteConnection = new Record(connectionsCollection);
      noteConnection.set("action", action.id);
      noteConnection.set("connection_model", "bs_notes");
      noteConnection.set("connection_id", e.record.id);
      e.app.save(noteConnection);

      const meetingTopicId = e.record.get("meeting_topic");
      if (meetingTopicId) {
        const meetingTopic = e.app.findRecordById("bs_meeting_topics", meetingTopicId);
        const meetingId = meetingTopic.get("meeting");
        if (meetingId) {
          const meeting = e.app.findRecordById("bs_meetings", meetingId);
          const meetingDate = meeting.get("date_time") ? new Date(meeting.get("date_time")).toLocaleDateString("nl-NL") : "";
          const meetingLabel = meetingDate ? meeting.get("name") + " · " + meetingDate : meeting.get("name");
          const meetingConnection = new Record(connectionsCollection);
          meetingConnection.set("action", action.id);
          meetingConnection.set("connection_model", "bs_meetings");
          meetingConnection.set("connection_id", meetingId);
          meetingConnection.set("type", "Afgesproken");
          meetingConnection.set("label", meetingLabel);
          e.app.save(meetingConnection);
        }
      }

      console.log("[bs_notes] action + connections created for note:", e.record.id);
    } else {
      // Note was already type="action" — sync name and assigned_to to the existing action
      const results = e.app.findRecordsByFilter(
        "bs_action_connections",
        'connection_model = "bs_notes" && connection_id = "' + e.record.id + '"',
        "",
        1,
        0
      );

      if (results.length === 0) {
        console.log("[bs_notes] no action found for note:", e.record.id);
        return;
      }

      const actionId = results[0].get("action");
      const action = e.app.findRecordById("bs_actions", actionId);
      action.set("name", e.record.get("name") || "");
      action.set("assigned_to", e.record.get("assigned_to") || "");
      e.app.save(action);

      console.log("[bs_notes] action synced for note:", e.record.id);
    }
  } catch (err) {
    console.error("[bs_notes] Failed to sync bs_action on update for note:", e.record.id, err);
  }
}, "bs_notes");
