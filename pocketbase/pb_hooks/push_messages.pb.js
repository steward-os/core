/// <reference path="../pb_data/types.d.ts" />

// The sender is always the logged-in user, whatever the request says, and never changes afterwards.
// Messages made by a superuser (dashboard) have no sender: sender only points to users.
onRecordCreateRequest((e) => {
  const isUser = e.auth && e.auth.collection().name === "users";
  e.record.set("sender", isUser ? e.auth.id : "");
  e.next();
}, "mb_messages");

onRecordUpdateRequest((e) => {
  e.record.set("sender", e.record.original().get("sender"));
  e.next();
}, "mb_messages");

// Send push notification when a new message is created
// This hook calls the push service (PUSH_SERVICE_URL), which delivers web push and Android (FCM) pushes
onRecordAfterCreateSuccess(async (e) => {
  const title = e.record.get("title");
  const body = e.record.get("body");
  const group = e.record.get("group");
  const sections = e.record.get("sections") || [];
  const url = e.record.get("url");

  console.log("New message created:", title);

  try {
    if (!group) {
      console.log("No group specified, skipping push notification");
      return;
    }
    console.log(`Targeting group ${group}` + (sections.length ? `, sections: ${sections.join(", ")}` : ", everyone"));

    // Recipients: members of the group, narrowed to the chosen sections if there are any.
    // Members without a section only match when no sections are chosen.
    const params = { group: group };
    let memberFilter = "group = {:group}";
    if (sections.length > 0) {
      sections.forEach((sectionId, i) => (params[`section${i}`] = sectionId));
      memberFilter += ` && (${sections.map((_, i) => `section = {:section${i}}`).join(" || ")})`;
    }
    const groupMembers = await e.app.findRecordsByFilter("mb_group_members", memberFilter, "", 1000, 0, params);

    // Extract unique user IDs
    const targetUserIds = [...new Set(groupMembers.map(member => member.get("user")))];
    console.log(`Found ${targetUserIds.length} recipients`);
    if (targetUserIds.length === 0) {
      console.log("No members match the group and sections, skipping push notification");
      return;
    }

    // Filter subscriptions to only include target users
    const userFilters = targetUserIds.map(userId => `user = "${userId}"`).join(" || ");
    const filter = `(${userFilters})`;
    console.log(`Fetching push subscriptions for ${targetUserIds.length} specific users...`, targetUserIds);

    // Get push subscriptions
    const subscriptions = await e.app.findRecordsByFilter(
      "push_subscriptions",
      filter,
      "-created",
      1000,
      0
    );

    console.log(`Found ${subscriptions.length} subscriptions`);

    if (subscriptions.length === 0) {
      console.log("No subscriptions found, skipping push notification");
      return;
    }

    // Prepare subscription data for the push service
    // platform "android" rows hold an FCM token in endpoint; an empty platform means web push
    const subscriptionData = subscriptions.map(sub => ({
      id: sub.id,
      platform: sub.get('platform') || 'web',
      endpoint: sub.get('endpoint'),
      p256dh: sub.get('p256dh'),
      auth: sub.get('auth')
    }));

    // Call the push notification service (requires PUSH_SERVICE_URL env var)
    const pushServiceUrl = process.env.PUSH_SERVICE_URL;
    if (!pushServiceUrl) {
      console.log("PUSH_SERVICE_URL not configured, skipping push notification delivery");
      return;
    }

    console.log(`Calling push service at ${pushServiceUrl}`);

    const response = $http.send({
      url: pushServiceUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: title,
        body: body,
        url: url || '/',
        messageId: e.record.id,
        subscriptions: subscriptionData
      }),
      timeout: 30
    });

    if (response.statusCode === 200) {
      const result = JSON.parse(response.raw);
      console.log(`Push notifications sent: ${result.sent} success, ${result.failed} failed`);

      // Delete invalid subscriptions
      if (result.invalidSubscriptions && result.invalidSubscriptions.length > 0) {
        console.log(`Deleting ${result.invalidSubscriptions.length} invalid subscriptions...`);
        for (const subId of result.invalidSubscriptions) {
          try {
            const sub = await e.app.findRecordById("push_subscriptions", subId);
            await e.app.delete(sub);
            console.log(`Deleted invalid subscription ${subId}`);
          } catch (deleteErr) {
            console.error(`Failed to delete subscription ${subId}:`, deleteErr);
          }
        }
      }
    } else {
      console.error(`Push service returned status ${response.statusCode}: ${response.raw}`);
    }
  } catch (err) {
    console.error("Failed to send push notifications:", err);
  }
}, "mb_messages");
