/* StudiesMasters Service Worker
 * Enables offline support, installable PWA behaviour, and push notifications.
 *
 * Strategy:
 *   - Precache the app shell on install
 *   - Cache-first for static assets (JS/CSS/images/fonts)
 *   - Network-first for navigation (HTML) requests with offline fallback
 *   - Bypass cache for API calls (always go to network)
 *   - Handle incoming push events and display notifications
 *   - Handle notification clicks and navigate the user to the right page
 */

const CACHE_NAME = "studiesmasters-v1";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.png",
  "/robots.txt",
];

// Install — precache the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

// Activate — clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — routing strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never cache API calls or Socket.io — always hit the network
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/socket")) {
    return;
  }

  // Navigation requests (HTML pages) — network-first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/index.html")))
    );
    return;
  }

  // Static assets — cache-first, then network (and cache the response)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Only cache same-origin successful responses
        if (response.ok && url.origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});

// ===========================================================================
// PUSH NOTIFICATIONS
// The backend sends a push message via the Web Push protocol. The service
// worker receives it here and displays a notification — even if the user
// is logged out or not actively using the app.
// ===========================================================================

// Handle incoming push messages
self.addEventListener("push", (event) => {
  // Parse the payload sent by the backend
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "StudiesMasters", body: "You have a new notification." };
  }

  const title = data.title || "StudiesMasters";
  const options = {
    body: data.body || "You have a new notification.",
    icon: "/favicon.png",
    badge: "/favicon.png",
    tag: data.tag || "studiesmasters-notification",
    data: {
      url: data.url || "/",
    },
    // Vibrate pattern for mobile devices
    vibrate: [200, 100, 200],
    // Require user interaction to dismiss (stays visible)
    requireInteraction: false,
    actions: [
      { action: "open", actionLabel: "Open", title: "Open" },
      { action: "dismiss", actionLabel: "Dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    // Focus the tab if it's already open, otherwise open a new one
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Handle notification close (user dismissed without clicking)
self.addEventListener("notificationclose", (event) => {
  // Optional: track analytics for dismissed notifications
  // console.log("Notification closed:", event.notification.tag);
});
