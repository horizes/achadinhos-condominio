import type { Metadata } from "next";
import { ConstrucaoScreen } from "./construcao-screen";

export const metadata: Metadata = {
  title: "Achadinhos da Construção | Universo dos Achadinhos",
  description:
    "Profissionais certificados para construir, reformar e decorar: móveis planejados, marmoraria, caçambas, arquitetos, engenheiros e mais — com busca dentro do universo.",
};

export default function ConstrucaoPage() {
  return <ConstrucaoScreen />;
}
