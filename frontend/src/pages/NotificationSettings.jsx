import { useState } from "react";
import PageContent from "../components/Page/PageContent";
import PageHeader from "../components/Page/PageHeader";
import PushNotificationToggle from "../components/PushNotificationToggle";
import { Button } from "../components/Button/Button";

export default function NotificationSettings() {
  const [testResult, setTestResult] = useState("");

  async function sendTestNotification() {
    setTestResult("");

    try {
      // Check if service worker is ready
      const registration = await navigator.serviceWorker.ready;

      // Get the active subscription
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        setTestResult("Error: Not subscribed to push notifications. Please enable notifications first.");
        return;
      }

      setTestResult("✓ Test notification sent! (In production, this would be triggered by your server)");

      // In a real scenario, you would send the subscription to your server
      // and the server would send a push notification
      // For testing, we'll just show a local notification
      if (Notification.permission === "granted") {
        registration.showNotification("Test Notification", {
          body: "This is a test notification from Fanfare Tools",
          icon: "/icon-192.png",
          badge: "/badge.png",
          vibrate: [100, 50, 100],
          data: {
            url: "/notification-test",
          },
        });
      }
    } catch (error) {
      console.error("Error sending test notification:", error);
      setTestResult(`Error: ${error.message}`);
    }
  }

  return (
    <PageContent>
      <PageHeader title="Push Notification Test" />
      <div className="max-w-2xl space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Aan/uitzetten notificaties</h2>
          <p className="text-gray-600 mb-4">Click op de button om notificaties aan of uit te zetten</p>
          <PushNotificationToggle />
        </div>
      </div>
    </PageContent>
  );
}
