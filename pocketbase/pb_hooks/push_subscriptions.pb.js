/// <reference path="../pb_data/types.d.ts" />

// A device (browser endpoint or Android FCM token) belongs to whoever subscribed it last. When someone
// logs in on a device that still has a subscription of another user, e.g. after logging out offline,
// that old subscription is removed so the device no longer receives the other user's messages.
onRecordAfterCreateSuccess((e) => {
  try {
    const others = e.app.findRecordsByFilter(
      "push_subscriptions",
      "endpoint = {:endpoint} && user != {:user}",
      "",
      0,
      0,
      { endpoint: e.record.get("endpoint"), user: e.record.get("user") }
    );
    for (const other of others) {
      e.app.delete(other);
    }
    if (others.length > 0) {
      console.log(`Removed ${others.length} push subscription(s) of other users for the same device`);
    }
  } catch (err) {
    console.error("Failed to remove other users' push subscriptions:", err);
  }
  e.next();
}, "push_subscriptions");
