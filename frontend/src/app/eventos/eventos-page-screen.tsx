"use client";

import { useRouter } from "next/navigation";
import { EventsScreen } from "@/components/screens/events-screen";

// /eventos — calendário completo de eventos do condomínio + o mural de
// banners como parte da tela.
export function EventosPageScreen() {
  const router = useRouter();

  return (
    <main className="route-page eventos-page">
      <h1 className="sr-only">Eventos do condomínio</h1>
      <EventsScreen onBack={() => router.push("/")} />
    </main>
  );
}
