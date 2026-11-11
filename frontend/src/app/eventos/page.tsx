import type { Metadata } from "next";
import { EventosPageScreen } from "./eventos-page-screen";

export const metadata: Metadata = {
  title: "Eventos do condomínio",
  description:
    "Eventos e assembleias do seu condomínio no Achadinhos do Condomínio.",
  alternates: { canonical: "/eventos" },
  robots: { index: false, follow: true },
};

export default function EventosPage() {
  return <EventosPageScreen />;
}
