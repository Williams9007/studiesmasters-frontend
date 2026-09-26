// src/utils/backendUrl.js
// Single source of truth for the backend base URL.
//
// WHY THIS EXISTS
//   Every module used to inline `import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"`.
//   That silent localhost fallback is a production trap: Vite bakes the value in at
//   BUILD time, and a build host (Render) that has no VITE_BACKEND_URL set silently
//   produced a bundle calling http://localhost:5000 — every admin Moodle panel
//   request then failed with ERR_CONNECTION_REFUSED in the browser, with nothing
//   wrong on the backend at all.
//
//   So: development falls back to localhost (convenient), production falls back to
//   the known backend URL and WARNS loudly if it is still wrong. It never silently
//   ships a localhost URL to real users.
const PRODUCTION_BACKEND = "https://studiesmasters-backend.onrender.com";

const configured = (
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL || // tolerated alias
  ""
).trim();

export const BACKEND_URL = (
  configured || (import.meta.env.DEV ? "http://localhost:5000" : PRODUCTION_BACKEND)
).replace(/\/$/, "");

// Fail fast in the console so a misconfigured build is obvious immediately,
// instead of surfacing later as a wall of ERR_CONNECTION_REFUSED errors.
if (import.meta.env.PROD && BACKEND_URL.includes("localhost")) {
  console.error(
    "[StudiesMasters] VITE_BACKEND_URL is not set for this production build. " +
      `Set it to ${PRODUCTION_BACKEND} in the build environment.`
  );
}

export const API_BASE_URL = `${BACKEND_URL}/api`;
export default BACKEND_URL;
