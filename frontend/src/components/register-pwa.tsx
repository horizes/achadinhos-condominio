"use client";

import { useEffect } from "react";

// Minimal type for the auto-registered Serwist instance.
interface SerwistGlobal {
  register: () => void;
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
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => { void r.unregister(); });
      });
      return;
    }

    if (window.serwist) {
      window.serwist.register();
    }
  }, []);
  return null;
}
