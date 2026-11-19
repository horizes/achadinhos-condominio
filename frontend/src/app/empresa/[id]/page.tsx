import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { sellersApi } from "@/lib/api";
import { JsonLd, sellerLocalBusinessSchema } from "@/components/seo/json-ld";
import { EmpresaPageScreen } from "./empresa-page-screen";
import { EmpresaDynamicScreen } from "./empresa-dynamic-screen";

export const dynamic = "force-static";
export const dynamicParams = false;

// Casca para empresas criadas depois do build (autocadastro da empresa
// free): sempre exportada, lê o id da URL e busca a empresa no navegador. O
// servidor Go serve esta página para qualquer /empresa/<id>/ sem página
// própria (internal/static). Também cobre o build sem acesso à API.
const FALLBACK_ID = "_unavailable";

export async function generateStaticParams() {
  const params = [{ id: FALLBACK_ID }];
  try {
    const sellers = await sellersApi.list();
    params.push(...sellers.map((s) => ({ id: s.id })));
  } catch {
    /* swallow — só a casca */
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (id === FALLBACK_ID) return { title: "Empresa" };
  try {
    const { seller } = await sellersApi.get(id);
    // Spec: "gera link com prévia (foto, nome, nota)" — previews de WhatsApp/
    // redes usam o rating/nota deste perfil, direto do sistema.
    const rating = seller.rating ?? 0;
    const reviewsCount = seller.reviews_count ?? 0;
    const cat = seller.category?.label ?? "Empresa";
    const ratingBit =
      reviewsCount > 0 && rating > 0
        ? `★ ${rating.toFixed(1).replace(".", ",")} · ${reviewsCount} ${reviewsCount === 1 ? "avaliação" : "avaliações"} · `
        : "";
    const rawDesc =
      `${ratingBit}${cat} para condomínios no Achadinhos do Condomínio.` +
      ((seller.description ?? "").trim() ? ` ${(seller.description ?? "").trim()}` : "");
    const desc = rawDesc.length > 200 ? `${rawDesc.slice(0, 197)}…` : rawDesc;
    return {
      title: seller.name,
      description: desc,
      alternates: { canonical: `/empresa/${id}` },
      openGraph: {
        title: seller.name,
        description: desc,
        url: `/empresa/${id}`,
        type: "website",
        siteName: "Achadinhos do Condomínio",
        images: seller.logo_url
          ? [{ url: seller.logo_url, alt: seller.name }]
          : undefined,
      },
      twitter: {
        card: seller.logo_url ? "summary_large_image" : "summary",
        title: seller.name,
        description: desc,
      },
    };
  } catch {
    return { title: "Empresa", robots: { index: false } };
  }
}

export default async function EmpresaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (id === FALLBACK_ID) return <EmpresaDynamicScreen />;
  let seller;
  try {
    const res = await sellersApi.get(id);
    seller = res.seller;
  } catch {
    notFound();
  }
  return (
    <>
      <JsonLd data={sellerLocalBusinessSchema(seller)} />
      <EmpresaPageScreen seller={seller} />
    </>
  );
}
