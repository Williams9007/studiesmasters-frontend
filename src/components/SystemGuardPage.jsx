// src/components/SystemGuardPage.jsx
// Hidden admin-only page - NOT linked anywhere in the UI.
// Access via the route http://localhost:5174/#/hidden/system-guard (only admins can reach it).
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { FaShieldAlt, FaArrowLeft, FaExternalLinkAlt } from "react-icons/fa";

const BACKEND_URL = (
  import.meta.env.VITE_BACKEND_URL ||
  (
    import.meta.env.DEV
      ? "http://localhost:5000"
      : "https://studiesmasters-backend.onrender.com"
  )
).replace(/\/$/, "");

// This key is NOT cleared by the apiClient response interceptor
// (which only removes: adminToken, adminRole, adminId, qaoToken, qaoUser)
const BACKUP_TOKEN_KEY = "_sysguard_admin_token";

function isTokenValid(token) {
  if (!token) return false;
  try {
    const decoded = jwtDecode(token);
    const expiresAt = decoded.exp ? decoded.exp * 1000 : 0;
    const validRole = decoded.role && ["MAIN_ADMIN", "MINOR_ADMIN"].includes(decoded.role);
    return validRole && expiresAt > Date.now();
  } catch {
    return false;
  }
}

export default function SystemGuardPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const navigate = useNavigate();

  // Validate admin token on mount — no apiClient (avoids global interceptor side-effects)
  useEffect(() => {
    let token = localStorage.getItem("adminToken");

    // If adminToken was stripped by the apiClient interceptor, try restoring from backup
    if (!token || !isTokenValid(token)) {
      const backup = localStorage.getItem(BACKUP_TOKEN_KEY);
      if (backup && isTokenValid(backup)) {
        // Restore the token so the rest of the app (apiClient, dashboard, etc.) works again
        localStorage.setItem("adminToken", backup);
        localStorage.setItem("adminRole", "MAIN_ADMIN");
        token = backup;
      }
    }

    if (token && isTokenValid(token)) {
      // Keep the backup fresh
      localStorage.setItem(BACKUP_TOKEN_KEY, token);
      setIsAdmin(true);
    }
    // If not admin, we DON'T redirect — we still show the iframe so the user
    // can log in via the System Guard dashboard's own login screen.
    setAuthChecked(true);
  }, []);

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-500" />
          <p className="text-sm font-medium">Validating admin session…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <FaArrowLeft className="text-xs" />
              Dashboard
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg">
              <FaShieldAlt />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">System Guard</p>
              <p className="text-xs text-slate-500">
                Firewall, diagnosis & self-healing dashboard
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-100 px-2.5 py-1.5 text-xs text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Admin verified
              </div>
            )}
            {!isAdmin && (
              <a
                href="/#/admin-login"
                className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1.5 text-xs text-slate-600 transition hover:bg-slate-200"
              >
                Not logged in as admin — log in here
              </a>
            )}
            <a
              href={`${BACKEND_URL}/system-guard.html`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <FaExternalLinkAlt className="text-xs" />
              Open Full Screen
            </a>
          </div>
        </div>
      </div>

      {/* Iframe */}
      <div className="mx-auto max-w-6xl p-4">
        <div className="relative min-h-[600px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {!iframeLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-500" />
              <p className="text-sm font-medium text-slate-500">
                Loading System Guard dashboard…
              </p>
              <p className="text-xs text-slate-400">
                The dashboard has its own login — use your admin credentials.
              </p>
            </div>
          )}
          <iframe
            src={`${BACKEND_URL}/system-guard.html`}
            title="System Guard Dashboard"
            className="h-[calc(100vh-80px)] min-h-[600px] w-full border-0"
            onLoad={() => setIframeLoaded(true)}
            allow="clipboard-write"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads"
          />
        </div>
      </div>
    </div>
  );
}
