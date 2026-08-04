import { useState, useEffect } from "react";

/**
 * NotificationPrompt
 * A floating banner that automatically appears when the user first visits
 * the site. It asks them to allow push notifications. If they dismiss it,
 * it won't show again for 7 days (stored in localStorage).
 *
 * This uses the browser's native Notification.requestPermission() API
 * directly — no service worker or backend needed for the permission prompt.
 */
export default function NotificationPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if:
    // 1. Browser doesn't support notifications
    // 2. Permission already granted or denied
    // 3. User dismissed within the last 7 days
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "default") return;

    const dismissed = localStorage.getItem("notif_prompt_dismissed");
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedAt < sevenDays) return;
    }

    // Show the prompt after a 3-second delay (let user see the page first)
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleAllow = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        // Show a test notification
        new Notification("StudiesMasters", {
          body: "You'll now receive important updates and reminders!",
          icon: "/favicon.png",
        });
      }
    } catch (err) {
      console.warn("Notification permission error:", err);
    }
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("notif_prompt_dismissed", String(Date.now()));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[9999] flex justify-center px-4 pt-4 animate-slideDown">
      <div className="flex w-full max-w-lg items-start gap-3 rounded-2xl border border-blue-200 bg-white p-4 shadow-2xl shadow-blue-900/10">
        {/* Bell icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 text-sm">Stay Updated!</h3>
          <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
            Allow notifications to receive class reminders, announcements, and important updates — even when you're not on the app.
          </p>

          {/* Buttons */}
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleAllow}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
            >
              Allow Notifications
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 active:scale-95"
            >
              Not Now
            </button>
          </div>
        </div>

        {/* Close X */}
        <button
          onClick={handleDismiss}
          className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Close"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
