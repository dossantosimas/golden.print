"use client";

import { useEffect } from "react";

// Observe the server session without extending it just because a tab is open.
export function SessionGuard() {
  useEffect(() => {
    let disposed = false;
    let checking = false;
    let expiryTimer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();

    async function checkSession() {
      if (disposed || checking) return;
      checking = true;
      try {
        const response = await fetch("/api/auth/get-session?disableCookieCache=true&disableRefresh=true", {
          credentials: "same-origin", cache: "no-store", signal: controller.signal,
        });
        if (!response.ok) return;
        const data = await response.json();
        if (disposed) return;
        if (!data?.session) {
          window.location.replace("/login");
          return;
        }
        const expiresAt = new Date(data.session.expiresAt).getTime();
        if (Number.isFinite(expiresAt)) {
          clearTimeout(expiryTimer);
          // Revalidate at the deadline: another tab may have renewed the session.
          expiryTimer = setTimeout(checkSession, Math.max(1000, expiresAt - Date.now()));
        }
      } catch {
        // A temporary connection failure is not evidence of a signed-out session.
      } finally {
        checking = false;
      }
    }

    function onVisible() {
      if (document.visibilityState === "visible") void checkSession();
    }
    void checkSession();
    const interval = setInterval(checkSession, 30_000);
    window.addEventListener("focus", checkSession);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      disposed = true;
      controller.abort();
      clearInterval(interval);
      clearTimeout(expiryTimer);
      window.removeEventListener("focus", checkSession);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return null;
}
