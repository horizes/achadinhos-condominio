import type { Metadata } from "next";
import { QuoteScreen } from "@/components/screens/quote-screen";

export const metadata: Metadata = {
  title: "Pedido de orçamento | Achadinhos do Condomínio",
  description:
    "Conte o que você precisa no seu condomínio: serviço, descrição, fotos e prazo. O fornecedor certificado recebe seu pedido e você acompanha o status.",
};

export default function OrcamentoPage() {
  return <QuoteScreen />;
}
