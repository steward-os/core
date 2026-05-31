import { useState, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import PushNotificationToggle from './PushNotificationToggle';
import { isSubscribed, getUserSubscriptions, unsubscribeFromPush, subscribeToPush, savePushSubscription } from '../services/pushNotificationService';
import pb from '../pb';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

export default function PushNotificationPrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  async function checkSubscriptionStatus() {
    // Only check if authenticated
    if (!pb.authStore.isValid) {
      return;
    }

    try {
      // Check if THIS device has a push subscription in the browser
      const browserHasSubscription = await isSubscribed();

      // Check if database has any subscriptions for this user
      const dbSubscriptions = await getUserSubscriptions();

      // If browser has subscription but database doesn't, clean up orphaned subscription
      if (browserHasSubscription && dbSubscriptions.length === 0) {
        console.log('Detected orphaned browser subscription - cleaning up');
        await unsubscribeFromPush();
        // Fall through to re-subscribe silently if permission already granted
      }

      // If this device is not subscribed, try to silently re-subscribe if permission
      // was already granted (e.g. after subscription expired or was cleaned up).
      // Only show the prompt when we actually need to ask the user.
      const browserHasSubscriptionNow = await isSubscribed();
      if (!browserHasSubscriptionNow) {
        if (Notification.permission === 'granted' && VAPID_PUBLIC_KEY) {
          try {
            console.log('Permission already granted - silently re-subscribing');
            const subscription = await subscribeToPush(VAPID_PUBLIC_KEY);
            await savePushSubscription(subscription);
          } catch (resubErr) {
            console.error('Silent re-subscribe failed, showing prompt:', resubErr);
            setIsOpen(true);
          }
        } else {
          setIsOpen(true);
        }
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
    } finally {
      setHasChecked(true);
    }
  }

  function handleClose() {
    setIsOpen(false);
  }

  if (!hasChecked) {
    return null;
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="mx-auto max-w-sm rounded-lg bg-white p-6 shadow-xl">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <BellIcon className="h-6 w-6 text-blue-600" />
              </div>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Blijf op de hoogte
              </DialogTitle>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Ontvang meldingen over nieuwe sessies, belangrijke updates en meer.
          </p>

          <PushNotificationToggle onSubscribe={handleClose} />

          <button
            onClick={handleClose}
            className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700"
          >
            Niet nu
          </button>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
