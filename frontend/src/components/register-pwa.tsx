"use client";

import { useEffect } from "react";

// Minimal type for the auto-registered Serwist instance.
interface SerwistGlobal {
  register: () => Promise<unknown>;
}

declare global {
  interface Window {
    serwist?: SerwistGlobal;
  }
}

export function RegisterPWA() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_PREVIEW === "true") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      // In dev, clear any stale SW left over from a previous production build.
      void navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => { void r.unregister().catch(() => {}); });
      }).catch(() => {});
      return;
    }

    if (window.serwist) {
      // Privacy settings or an unavailable worker must not break the app.
      try {
        void Promise.resolve(window.serwist.register()).catch(() => {});
      } catch {
        // Browsing the site continues without offline installation.
      }
    }
  }, []);
  return null;
}
