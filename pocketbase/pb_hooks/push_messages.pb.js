/// <reference path="../pb_data/types.d.ts" />

// Send push notification when a new message is created
// This hook calls an external Node.js microservice to handle Web Push
onRecordAfterCreateSuccess(async (e) => {
  const title = e.record.get("title");
  const body = e.record.get("body");
  const groups = e.record.get("groups");
  const url = e.record.get("url");

  console.log("New message created:", title);

  try {
    // Determine which users to send to based on groups
    let targetUserIds = null;
    if (groups && groups.length > 0) {
      console.log(`Targeting groups: ${groups.join(", ")}`);

      // Query mb_group_members to get all users in the selected groups
      const groupFilters = groups.map(groupId => `group = "${groupId}"`).join(" || ");
      const groupMembers = await e.app.findRecordsByFilter(
        "mb_group_members",
        `(${groupFilters})`,
        "",
        1000,
        0
      );

      // Extract unique user IDs
      targetUserIds = [...new Set(groupMembers.map(member => member.get("user")))];
      console.log(`Found ${targetUserIds.length} unique users in ${groups.length} group(s)`);
    } else {
      console.log("No groups specified, sending to all users");
    }

    // Build filter for push subscriptions
    let filter = "";
    if (targetUserIds && targetUserIds.length > 0) {
      // Filter subscriptions to only include target users
      const userFilters = targetUserIds.map(userId => `user = "${userId}"`).join(" || ");
      filter = `(${userFilters})`;
      console.log(`Fetching push subscriptions for ${targetUserIds.length} specific users...`, targetUserIds);
    } else {
      console.log("Fetching all push subscriptions...");
    }

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
    const subscriptionData = subscriptions.map(sub => ({
      id: sub.id,
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
