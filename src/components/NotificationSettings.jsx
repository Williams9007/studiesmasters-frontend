import { useState, useEffect } from "react";
import usePushNotifications from "../hooks/usePushNotifications";

/**
 * NotificationSettings
 * A compact card that lets users opt in or out of push notifications.
 * Works even when the user is logged out — the subscription is tied to
 * the browser/device, not the account.
 */
export default function NotificationSettings() {
  const { isSubscribed, loading, error, toggle, permission } = usePushNotifications();
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (error) setShowError(true);
    const timer = setTimeout(() => setShowError(false), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  const handleToggle = async () => {
    const result = await toggle();
    if (!result.success) {
      setShowError(true);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900">Push Notifications</h3>
          <p className="text-sm text-slate-500">
            {isSubscribed
              ? "You'll receive notifications on this device even when logged out."
              : "Stay updated with important announcements and reminders."}
          </p>
        </div>

        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative inline-flex h-11 w-18 items-center rounded-full border-2 transition-colors ${
            isSubscribed
              ? "border-blue-600 bg-blue-600"
              : "border-slate-300 bg-slate-200"
          } ${loading ? "opacity-50" : ""}`}
          aria-label={isSubscribed ? "Disable notifications" : "Enable notifications"}
        >
          <span
            className={`inline-block h-7 w-7 transform rounded-full bg-white shadow transition-transform ${
              isSubscribed ? "translate-x-7" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {permission === "denied" && (
        <p className="mt-2 text-xs text-rose-600">
          Notifications are blocked. Go to your browser settings to enable them.
        </p>
      )}

      {showError && error && (
        <p className="mt-2 text-xs text-rose-600">{error}</p>
      )}
    </div>
  );
}
