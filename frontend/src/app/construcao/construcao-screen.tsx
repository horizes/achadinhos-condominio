"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  sellersApi,
  providersApi,
  getImageUrl,
  type AdminSeller,
} from "@/lib/api";
import { adaptProvider } from "@/lib/adapters";
import type { Provider } from "@/lib/types";
import { APP_CONTENT } from "@/lib/app-content";
import { CertSeal } from "../../components/cert-seal";
import { Icon } from "../../components/icons";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════════════
// Tela "Achadinhos da Construção" — aberta pelo cartão na tela inicial.
// Spec: cabeçalho azul-marinho (voltar · rótulo UNIVERSO DOS ACHADINHOS ·
// título com "Construção" em dourado · frase · logo do universo à direita) +
// busca só dentro deste universo + "O que você precisa?" (grade 3×3) +
// lista filtrada + CTA final "Quero ser afiliado".
// ═══════════════════════════════════════════════════════════════════════════

const AFFILIATE_PRESENTATION = "https://achadinhosindica.com.br/apresentacao.html";

type Subcat = {
  id: string;
  label: string;
  icon: keyof typeof Icon;
  keywords: string[];
};

const SUBCATEGORIAS: Subcat[] = [
  { id: "moveis-planejados", label: "Móveis planejados", icon: "Box",
    keywords: ["moveis planejados", "planejado", "marcenaria", "planejamento de moveis"] },
  { id: "marmoraria", label: "Marmoraria", icon: "CatMaintenance",
    keywords: ["marmorar", "marmore", "mármore", "granito", "quartzito"] },
  { id: "cacambas", label: "Caçambas", icon: "Trash",
    keywords: ["cacamba", "caçamba", "entulho", "remoção de entulho", "remocao"] },
  { id: "arquitetos", label: "Arquitetos", icon: "CatFacilities",
    keywords: ["arquitet"] },
  { id: "designers", label: "Designers de interiores", icon: "Sparkle",
    keywords: ["design de inter", "designer de inter", "interiores", "decorador"] },
  { id: "engenheiros", label: "Engenheiros", icon: "CatElectric",
    keywords: ["engenh"] },
  // "Móveis para piscina" exige termo de mobiliário para piscina — a palavra
  // solta "piscina" nunca entra aqui (uma empresa de limpeza/manutenção de
  // piscinas não é construção).
  { id: "piscina", label: "Móveis para piscina", icon: "CatPlumbing",
    keywords: ["moveis piscina", "moveis para piscina", "moveis de piscina",
      "solarium", "espreguicadeira", "espreguiçadeira", "cadeira piscina",
      "mesa piscina", "sombra piscina"] },
  { id: "decoracao", label: "Móveis e decoração", icon: "CatShopping",
    keywords: ["decora", "mobili", "moveis", "restauracao de moveis"] },
  { id: "imobiliarias", label: "Imobiliárias — venda e locação", icon: "Building",
    keywords: ["imobiliar", "locação", "locacao", "venda de im", "corretor"] },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/* combining diacritical marks U+0300-U+036F are stripped so "mármore"
   matches the keyword "marmore" */

interface UnifiedRow {
  id: string;
  kind: "seller" | "provider";
  name: string;
  category: string;
  desc: string;
  logoUrl?: string;
  rating: number;
  reviews: number;
  certTier?: string | null;
  partner: boolean;
  whatsapp?: string;
  servicesText: string;
}

function sellerToRow(s: AdminSeller): UnifiedRow {
  const cats = (s.categories?.length ? s.categories : s.category ? [s.category] : [])
    .map((c) => c.label)
    .join(" ");
  return {
    id: s.id,
    kind: "seller",
    name: s.name,
    category: cats || "Empresa parceira",
    desc: s.description ?? "",
    logoUrl: s.logo_url || undefined,
    rating: s.rating ?? 0,
    reviews: s.reviews_count ?? 0,
    certTier: s.cert_tier ?? null,
    partner: Boolean(s.partner),
    whatsapp: s.whatsapp ?? undefined,
    servicesText: `${cats} ${s.description ?? ""}`,
  };
}

function providerToRow(p: Provider): UnifiedRow {
  return {
    id: p.id,
    kind: "provider",
    name: p.name,
    category: p.catLabel,
    desc: p.desc,
    logoUrl: p.logoUrl,
    rating: p.rating ?? 0,
    reviews: p.reviews ?? 0,
    certTier: p.certTier ?? null,
    partner: false,
    whatsapp: p.whatsapp,
    servicesText: `${p.catLabel} ${(p.services ?? []).join(" ")} ${p.desc}`,
  };
}

export function ConstrucaoScreen() {
  const u = APP_CONTENT.universes.construcao;
  const [query, setQuery] = useState("");
  const [activeSubcat, setActiveSubcat] = useState<string | null>(null);
  const [rows, setRows] = useState<UnifiedRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void Promise.allSettled([
      sellersApi.list(),
      providersApi.list({ limit: 100 }),
    ]).then(([sRes, pRes]) => {
      const sellers = sRes.status === "fulfilled" ? sRes.value.map(sellerToRow) : [];
      const providers =
        pRes.status === "fulfilled" ? pRes.value.data.map(adaptProvider).map(providerToRow) : [];
      setRows([...sellers, ...providers]);
      setLoaded(true);
    });
  }, []);

  const activeDef = SUBCATEGORIAS.find((s) => s.id === activeSubcat) ?? null;

  // O universo da Construção tem seus próprios fornecedores — toda linha exibida
  // aqui precisa bater com PELO MENOS UM dos 9 grupos de palavras-chave da
  // construção; caso contrário não aparece no universo (spec: o universo tem
  // "suas próprias subcategorias e fornecedores").
  const inUniverso = (haystack: string) =>
    SUBCATEGORIAS.some((s) => s.keywords.some((k) => haystack.includes(normalize(k))));

  const visible = useMemo(() => {
    const q = normalize(query.trim());
    return rows.filter((r) => {
      const haystack = normalize(`${r.name} ${r.category} ${r.servicesText}`);
      if (!inUniverso(haystack)) return false;
      if (activeDef && !activeDef.keywords.some((k) => haystack.includes(normalize(k)))) {
        return false;
      }
      if (q && !haystack.includes(q)) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, activeDef, query]);

  const certCount = useMemo(() => visible.filter((r) => r.certTier).length, [visible]);

  return (
    <div className="universe-screen">
      {/* Cabeçalho do universo */}
      <header className="universe-hero">
        <div className="universe-topbar">
          <Link href="/" className="universe-back" aria-label="Voltar para o início">
            <Icon.ChevLeft size={18} />
          </Link>
          <span className="universe-kicker">{u.universeLabel}</span>
          <span className="universe-logo-tile" aria-hidden="true">
            <Icon.Building size={26} />
          </span>
        </div>
        <h1 className="universe-title">
          Achadinhos da <em>Construção</em>
        </h1>
        <p className="universe-sub">{u.subtitle}</p>
        <label className="universe-search">
          <Icon.Search size={17} />
          <input
            placeholder={u.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar na construção"
          />
          {query && (
            <button type="button" className="universe-back" style={{ width: 28, height: 28, border: "none" }} onClick={() => setQuery("")} aria-label="Limpar busca">
              <Icon.X size={14} />
            </button>
          )}
        </label>
      </header>

      <div className="universe-body">
        {/* O que você precisa? */}
        <h2 className="universe-h2">O que você precisa?</h2>
        <div className="subcat-grid" role="group" aria-label="Subcategorias da construção">
          {SUBCATEGORIAS.map((s) => {
            const SubIcon = Icon[s.icon];
            const active = activeSubcat === s.id;
            return (
              <button
                key={s.id}
                type="button"
                className={cn("subcat-btn", active && "active")}
                aria-pressed={active}
                onClick={() => setActiveSubcat((prev) => (prev === s.id ? null : s.id))}
              >
                <span className="subcat-btn-icon" aria-hidden="true">
                  <SubIcon size={19} />
                </span>
                <span className="subcat-btn-name">{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Resultados */}
        <div className="universe-results" aria-live="polite">
          <div className="universe-count">
            {activeDef
              ? `${certCount} certificado${certCount === 1 ? "" : "s"} em ${activeDef.label}${query ? ` · “${query}”` : ""}`
              : loaded
                ? `${visible.length} empresa${visible.length === 1 ? "" : "s"} na construção`
                : "Carregando…"}
          </div>

          {loaded && visible.length === 0 && (
            <div className="universe-empty">
              <Icon.Building size={28} style={{ color: "var(--spec-ink-soft)" }} />
              <p>
                Ainda não temos {activeDef ? `profissional certificado para “${activeDef.label}”` : "empresas na construção"}
                {query ? ` com “${query}”` : ""}. Seja um dos primeiros parceiros do universo.
              </p>
              <a href={AFFILIATE_PRESENTATION} target="_blank" rel="noopener noreferrer" className="universe-cta-link">
                Quero ser afiliado
              </a>
            </div>
          )}

          {visible.map((r) => (
            <div key={`${r.kind}-${r.id}`} className="provider" style={{ marginTop: 8 }}>
              <div className="provider-avatar">
                {r.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getImageUrl(r.logoUrl)}
                    alt=""
                    className="provider-avatar-img"
                    loading="lazy"
                  />
                ) : (
                  r.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="provider-info">
                <div className="provider-name">
                  {r.name}
                  {r.certTier && <CertSeal tier={r.certTier as "black" | "ouro" | "blue"} />}
                  {r.partner && <span className="provider-badge">Parceira</span>}
                </div>
                <div className="provider-cat">
                  {r.category}
                  {r.rating > 0 && (
                    <>
                      {" "}· <Icon.Star size={10} /> {r.rating.toFixed(1).replace(".", ",")} ({r.reviews})
                    </>
                  )}
                </div>
              </div>
              {r.kind === "seller" ? (
                <Link className="quote-chip" href={`/empresa/${r.id}`} aria-label={`Ver ${r.name}`}>
                  Ver empresa
                </Link>
              ) : r.whatsapp ? (
                <a
                  className="quote-chip"
                  href={`https://wa.me/55${r.whatsapp}?text=${encodeURIComponent(
                    "Olá! Encontrei vocês no Achadinhos do Condomínio. Posso pedir um orçamento?",
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon.Whatsapp size={12} /> Orçamento
                </a>
              ) : null}
            </div>
          ))}
        </div>

        {/* CTA final — pessoa vai para o WhatsApp do time; recebe o link da
            apresentação do plano (que traz o botão Agendar reunião). */}
        <div className="universe-cta">
          <h3>
            {u.ctaTitle}{" "}
            <span style={{ color: "var(--spec-gold)" }}>Construção?</span>
          </h3>
          <p>{u.ctaBody} — profissionais e empresas certificadas aparecem primeiro aqui.</p>
          <a href={AFFILIATE_PRESENTATION} target="_blank" rel="noopener noreferrer">
            <Icon.Whatsapp size={14} /> {u.ctaButton}
          </a>
        </div>
      </div>
    </div>
  );
}

