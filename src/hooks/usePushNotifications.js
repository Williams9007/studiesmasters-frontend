// src/hooks/usePushNotifications.js
import { useState, useEffect, useCallback } from "react";
import apiClient from "../utils/apiClient";

const PUBLIC_VAPID_KEY = null; // Will be fetched from the backend

/**
 * urlBase64ToUint8Array
 * Converts the base64 VAPID public key into a Uint8Array that
 * PushManager.subscribe() expects.
 */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * usePushNotifications
 * Manages the entire push notification lifecycle:
 *   - Requests Notification permission
 *   - Fetches the VAPID public key from the backend
 *   - Subscribes the browser via the Service Worker
 *   - Saves the subscription to the backend (works even when logged out)
 *   - Unsubscribes on demand
 *
 * The subscription is stored on the backend keyed by the browser's
 * endpoint URL, so it persists across sessions and works even when
 * the user is not logged in.
 */
export default function usePushNotifications() {
  const [permission, setPermission] = useState(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default"
  );
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check for existing subscription on mount
  useEffect(() => {
    const checkSubscription = async () => {
      if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

      try {
        const sw = await navigator.serviceWorker.ready;
        const existing = await sw.pushManager.getSubscription();
        if (existing) {
          setSubscription(existing);
        }
      } catch (err) {
        console.warn("Push check failed:", err);
      }
    };

    checkSubscription();
  }, []);

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Request notification permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        throw new Error("Notification permission not granted");
      }

      // 2. Ensure service worker is ready
      if (!("serviceWorker" in navigator)) {
        throw new Error("Service Worker not supported");
      }

      const sw = await navigator.serviceWorker.ready;

      // 3. Fetch the VAPID public key from the backend
      const { data } = await apiClient.get("/notifications/vapidPublicKey");
      const vapidPublicKey = data.key;

      // 4. Subscribe via PushManager
      const sub = await sw.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      setSubscription(sub);

      // 5. Save the subscription to the backend (no auth required)
      await apiClient.post("/notifications/subscribe", sub);

      return { success: true, subscription: sub };
    } catch (err) {
      setError(err.message || "Failed to subscribe to push notifications");
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Unsubscribe from push notifications
  const unsubscribeFromPush = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!subscription) {
        return { success: true };
      }

      // 1. Unsubscribe from the browser
      await subscription.unsubscribe();

      // 2. Remove from the backend
      await apiClient.post("/notifications/unsubscribe", {
        endpoint: subscription.endpoint,
      });

      setSubscription(null);
      return { success: true };
    } catch (err) {
      setError(err.message || "Failed to unsubscribe");
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [subscription]);

  // Toggle subscription
  const togglePush = useCallback(async () => {
    if (subscription) {
      return unsubscribeFromPush();
    } else {
      return subscribeToPush();
    }
  }, [subscription, subscribeToPush, unsubscribeFromPush]);

  return {
    permission,
    subscription,
    isSubscribed: !!subscription,
    loading,
    error,
    subscribe: subscribeToPush,
    unsubscribe: unsubscribeFromPush,
    toggle: togglePush,
  };
}
