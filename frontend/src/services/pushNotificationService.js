import pb from "../pb";

/**
 * Convert a base64 string to Uint8Array for VAPID key
 * @param {string} base64String - Base64 encoded string
 * @returns {Uint8Array} Converted array
 */
function urlBase64ToUint8Array(base64String) {
  if (typeof window === 'undefined') {
    throw new Error('This function must be called in a browser environment');
  }

  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Convert Uint8Array to URL-safe base64 string (no padding)
 * @param {Uint8Array} buffer - Buffer to convert
 * @returns {string} URL-safe base64 string
 */
function arrayBufferToUrlBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Request notification permission from the user
 * @returns {Promise<NotificationPermission>} Permission result
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications');
  }

  return await Notification.requestPermission();
}

/**
 * Subscribe to push notifications
 * @param {string} vapidPublicKey - VAPID public key from environment
 * @returns {Promise<PushSubscription>} Push subscription
 */
export async function subscribeToPush(vapidPublicKey) {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported');
  }

  if (!('PushManager' in window)) {
    throw new Error('Push notifications are not supported');
  }

  // Wait for service worker to be ready (with timeout)
  const registration = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Service worker not ready. Please build and run in production mode to test push notifications.')), 5000)
    )
  ]);

  // Check if already subscribed
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    // Subscribe to push notifications
    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey
    });
  }

  return subscription;
}

/**
 * Save push subscription to PocketBase
 * @param {PushSubscription} subscription - Push subscription object
 * @returns {Promise<Object>} Created subscription record
 */
export async function savePushSubscription(subscription) {
  const userId = pb.authStore.record?.id;

  if (!userId) {
    throw new Error('User must be authenticated to subscribe');
  }

  const subscriptionData = {
    user: userId,
    endpoint: subscription.endpoint,
    p256dh: arrayBufferToUrlBase64(subscription.getKey('p256dh')),
    auth: arrayBufferToUrlBase64(subscription.getKey('auth'))
  };

  // Check if subscription already exists
  const existing = await pb.collection('push_subscriptions').getFullList({
    filter: `user="${userId}" && endpoint="${subscription.endpoint}"`
  });

  if (existing.length > 0) {
    // Update existing subscription
    return await pb.collection('push_subscriptions').update(existing[0].id, subscriptionData);
  }

  // Create new subscription
  return await pb.collection('push_subscriptions').create(subscriptionData);
}

/**
 * Unsubscribe from push notifications
 * @returns {Promise<boolean>} Success status
 */
export async function unsubscribeFromPush() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    const userId = pb.authStore.record?.id;

    // Remove from PocketBase
    if (userId) {
      const existing = await pb.collection('push_subscriptions').getFullList({
        filter: `user="${userId}" && endpoint="${subscription.endpoint}"`
      });

      for (const sub of existing) {
        await pb.collection('push_subscriptions').delete(sub.id);
      }
    }

    // Unsubscribe from push manager
    return await subscription.unsubscribe();
  }

  return false;
}

/**
 * Check if user is subscribed to push notifications
 * @returns {Promise<boolean>} Subscription status
 */
export async function isSubscribed() {
  if (!('serviceWorker' in navigator)) return false;
  if (!('PushManager' in window)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
}

/**
 * Get user's push subscriptions from PocketBase
 * @returns {Promise<Array>} List of subscriptions
 */
export async function getUserSubscriptions() {
  const userId = pb.authStore.record?.id;

  if (!userId) {
    return [];
  }

  return await pb.collection('push_subscriptions').getFullList({
    filter: `user="${userId}"`
  });
}

