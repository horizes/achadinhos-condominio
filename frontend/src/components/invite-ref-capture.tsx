"use client";

import { useEffect } from "react";
import { captureInviteRefFromUrl } from "@/lib/invite-ref";

// Componente sem UI: roda uma vez por navegação e guarda ?convite=<id> do
// link de indicação. Montado uma vez no layout raiz.
export function InviteRefCapture() {
  useEffect(() => {
    captureInviteRefFromUrl();
  }, []);
  return null;
}
