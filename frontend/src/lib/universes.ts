// Classificação de empresas por universo — a fonte da verdade é a tela
// /construcao (SUBCATEGORIAS). Usamos a mesma lógica para distribuir os
// destaques entre os cards da home.
import type { AdminSeller } from "./api";

const CONSTRUCTION_KEYWORDS = [
  "marmore", "marmoreira", "granito", "quartzito", "arquitet", "engenh",
  "design de inter", "designer de inter", "interiores", "decorador",
  "moveis planejados", "marcenaria", "planejado", "moveis", "moveis piscina",
  "solarium", "espreguicadeira", "cadeira piscina", "mesa piscina",
  "cacamba", "entulho", "remocao", "remoção", "decora", "mobili",
  "restauracao de moveis", "locação", "locacao", "locação", "venda de im",
  "imobiliar",
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function isConstructionSeller(s: AdminSeller): boolean {
  const cats = (s.categories ?? []).map((c) => c.label).join(" ");
  const cat = s.category?.label ?? (s.category_id ?? "");
  const text = normalize(`${s.name} ${s.description ?? ""} ${cats} ${cat}`);
  return CONSTRUCTION_KEYWORDS.some((k) => text.includes(normalize(k)));
}

const TIER_SCORE: Record<string, number> = {
  black: 3,
  gold: 2,
  blue: 1,
};

export function destaqueScore(s: AdminSeller): number {
  const tier = TIER_SCORE[(s.cert_tier as string) ?? ""] ?? 0;
  const rating = s.rating ?? 0;
  const reviews = s.reviews_count ?? 0;
  return tier * 10_000 + Math.round(rating * 100) * 100 + reviews;
}

// Top 10 de destaques por universo, ordenados por selo > rating > avaliações.
export function topDestaques(sellers: AdminSeller[]): AdminSeller[] {
  return [...sellers]
    .filter((s) => s.highlight)
    .sort((a, b) => destaqueScore(b) - destaqueScore(a))
    .slice(0, 10);
}

export function splitByUniverse(sellers: AdminSeller[]): {
  condominio: AdminSeller[];
  construcao: AdminSeller[];
} {
  const destacadas = topDestaques(sellers);
  return {
    condominio: destacadas.filter((s) => !isConstructionSeller(s)),
    construcao: destacadas.filter(isConstructionSeller),
  };
}
