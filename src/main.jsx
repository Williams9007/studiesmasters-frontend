import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App.jsx";
import "../styles/globals.css";

// Service Worker handling:
//  - In development: NEVER register a SW. Also proactively unregister any
//    previously-installed one and clear its caches, because a stale SW caches
//    old HTML/JS and causes "Invalid hook call" errors (multiple React copies)
//    and stale code despite Vite rebuilding.
//  - In production: register the PWA service worker.
if ("serviceWorker" in navigator) {
  if (!import.meta.env.PROD) {
    // Dev: kill any leftover service worker + caches from previous sessions
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((reg) => reg.unregister());
    });
    if (window.caches) {
      window.caches.keys().then((keys) => {
        keys.forEach((key) => window.caches.delete(key));
      });
    }
  } else {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("SW registration failed:", err);
      });
    });
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
