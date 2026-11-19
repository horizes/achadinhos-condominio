"use client";

import { useState } from "react";
import Link from "next/link";
import { APP_CONTENT } from "@/lib/app-content";
import { Icon } from "../../components/icons";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════════════
// Tela "Achadinhos Indica" — LOJA DE INDICAÇÕES (spec):
//   Cabeçalho azul-marinho (voltar · rótulo · título "Indica" em dourado ·
//   frase · mascote à direita) + busca "Buscar produto…" + categorias em
//   rolagem lateral (Todos, Limpeza, Segurança, Piscina, Jardim, Iluminação,
//   Manutenção — [ajustar a lista]) + ordenar (Melhor avaliados / Menor preço)
//   + grade 2 colunas + aviso fixo de links de afiliado.
//
// Sem catálogo real cadastrado ([regras para a equipe: produtos cadastrados
// pelo painel]), a grade exibe estado vazio honesto — NENHUM produto é
// inventado. O botão da home leva ao achadinhosindica.com.br (loja real).
// ═══════════════════════════════════════════════════════════════════════════

const CATEGORIAS = [
  "Todos",
  "Limpeza",
  "Segurança",
  "Piscina",
  "Jardim",
  "Iluminação",
  "Manutenção", // [ajustar a lista] — a definir pelo painel
] as const;

const ORDENAR = ["Melhor avaliados", "Menor preço"] as const;

export function IndicaScreen() {
  const i = APP_CONTENT.indica;
  const [query, setQuery] = useState("");
  const [categoria, setCategoria] = useState<(typeof CATEGORIAS)[number]>("Todos");
  const [ordem, setOrdem] = useState<(typeof ORDENAR)[number]>("Melhor avaliados");
  void query; // usado pela busca quando houver catálogo
  void categoria;
  void ordem;

  return (
    <div className="universe-screen">
      {/* Cabeçalho */}
      <header className="universe-hero">
        <div className="universe-topbar">
          <Link href="/" className="universe-back" aria-label="Voltar para o início">
            <Icon.ChevLeft size={18} />
          </Link>
          <span className="universe-kicker">{i.lojaLabel}</span>
          <span className="universe-logo-tile" aria-hidden="true">
            {/* Mascote à direita do título (spec) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/mascote-dourado-v2.png"
              alt=""
              style={{ width: 44, height: 44, objectFit: "contain" }}
            />
          </span>
        </div>
        <h1 className="universe-title">
          Achadinhos <em>{i.titleGold}</em>
        </h1>
        <p className="universe-sub">{i.subtitle}</p>
        <label className="universe-search">
          <Icon.Search size={17} />
          <input
            placeholder="Buscar produto…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar produto"
          />
        </label>
      </header>

      <div className="universe-body">
        {/* Categorias (rolagem lateral) */}
        <div className="ind-chips-scroll" role="tablist" aria-label="Categorias">
          {CATEGORIAS.map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={categoria === c}
              className={cn("ind-chip", categoria === c && "active")}
              onClick={() => setCategoria(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Ordenar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 0 10px" }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--spec-ink-soft)" }}>
            Ordenar:
          </span>
          {ORDENAR.map((o) => (
            <button
              key={o}
              type="button"
              className={cn("ind-chip ind-chip--sm", ordem === o && "active")}
              onClick={() => setOrdem(o)}
            >
              {o}
            </button>
          ))}
        </div>

        {/* Grade (vazia até o painel cadastrar produtos) */}
        <div className="universe-empty" style={{ marginTop: 6 }}>
          <Icon.Cart size={28} style={{ color: "var(--spec-ink-soft)" }} />
          <p>
            <strong>Em breve</strong> — os primeiros produtos do Achadinhos Indica
            chegam aqui assim que forem cadastrados pelo painel. Enquanto isso, a
            seleção de ofertas continua na{" "}
            <a href={i.url} style={{ color: "var(--spec-gold-dark)", fontWeight: 800 }}>
              loja oficial do Achadinhos Indica
            </a>
            .
          </p>
        </div>

        {/* Aviso fixo no rodapé (texto exato da spec) */}
        <div className="ind-footer-note" role="note">
          <Icon.Check size={13} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{i.footerNote}</span>
        </div>
      </div>
    </div>
  );
}
