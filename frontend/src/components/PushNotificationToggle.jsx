import { useState, useEffect } from 'react';
import { BellIcon, BellSlashIcon } from '@heroicons/react/24/outline';
import {
  requestNotificationPermission,
  subscribeToPush,
  savePushSubscription,
  unsubscribeFromPush,
  isSubscribed
} from '../services/pushNotificationService';

// VAPID public key - replace with your generated key
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

export default function PushNotificationToggle({ onSubscribe }) {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkSubscription();
  }, []);

  async function checkSubscription() {
    try {
      const status = await isSubscribed();
      console.log('PushNotificationToggle: isSubscribed status:', status);
      setSubscribed(status);
    } catch (err) {
      console.error('Error checking subscription status:', err);
      setSubscribed(false);
    }
  }

  async function handleToggle() {
    setLoading(true);
    setError(null);

    try {
      if (subscribed) {
        // Unsubscribe
        await unsubscribeFromPush();
        setSubscribed(false);
      } else {
        // Subscribe
        const permission = await requestNotificationPermission();

        if (permission !== 'granted') {
          setError('Notification permission denied');
          return;
        }

        if (!VAPID_PUBLIC_KEY) {
          setError('VAPID key not configured. Please add VITE_VAPID_PUBLIC_KEY to your .env file');
          return;
        }

        const subscription = await subscribeToPush(VAPID_PUBLIC_KEY);
        await savePushSubscription(subscription);
        setSubscribed(true);

        // Call the callback if provided
        if (onSubscribe) {
          onSubscribe();
        }
      }
    } catch (err) {
      console.error('Error toggling notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleToggle}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {subscribed ? (
          <>
            <BellSlashIcon className="w-5 h-5" />
            {loading ? 'Afmelden...' : 'Meldingen uitzetten'}
          </>
        ) : (
          <>
            <BellIcon className="w-5 h-5" />
            {loading ? 'Aanmelden...' : 'Meldingen toestaan'}
          </>
        )}
      </button>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
