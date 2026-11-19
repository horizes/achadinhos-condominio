import type { Metadata } from "next";
import { IndicaScreen } from "./indica-screen";

export const metadata: Metadata = {
  title: "Achadinhos Indica | Produtos e equipamentos com o menor custo",
  description:
    "Produtos e equipamentos para o seu condomínio: melhor avaliação e menor custo, com links de afiliado para Mercado Livre, Amazon e Shopee.",
};

export default function IndicaPage() {
  return <IndicaScreen />;
}
