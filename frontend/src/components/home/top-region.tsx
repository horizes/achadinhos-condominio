"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getImageUrl, topRegionApi, type ApiTopRegion } from "@/lib/api";
import { Icon } from "../icons";

// Seção "Destaque do mês" (item 11 da spec): os 3 fornecedores mais
// bem avaliados no MÊS, com medalhas ouro, prata e bronze. O endpoint declara
// o escopo da resposta: "month" (avaliações deste mês) ou "all_time" —
// fallback honesto quando o mês ainda não tem 3 avaliados. Nenhum número é
// inventado; o rótulo do rodapé segue o escopo real.
export function TopRegion() {
  const [data, setData] = useState<ApiTopRegion | null>(null);

  useEffect(() => {
    void topRegionApi
      .get()
      .then(setData)
      .catch(() => setData(null));
  }, []);

  const items = data?.items ?? [];
  if (!data || items.length === 0) return null;

  const medals = ["gold", "silver", "bronze"] as const;
  const positions = ["1º", "2º", "3º"] as const;
  const isMonth = data.scope === "month";

  return (
    <section className="top-region" aria-label="Destaque do mês">
      <div className="section-title">
        <h2>Destaque do mês</h2>
        <span className="see-all" style={{ fontSize: 10.5 }}>
          {isMonth ? "por avaliação do mês" : "por avaliação geral"}
        </span>
      </div>
      <div className="top-region-grid">
        {items.map((s, i) => (
          <Link
            key={s.id}
            href={`/empresa/${s.id}`}
            style={{ textDecoration: "none" }}
            className="top-item"
          >
            <span className={`top-medal ${medals[i]}`}>{positions[i]}</span>
            {s.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getImageUrl(s.logo_url)}
                alt=""
                width={40}
                height={40}
                style={{ borderRadius: 10, objectFit: "contain", background: "#fff" }}
                loading="lazy"
              />
            ) : null}
            <span className="top-info">
              <span className="top-name">{s.name}</span>
              <span className="top-meta">
                <Icon.Star size={11} /> {s.rating.toFixed(1).replace(".", ",")}{" "}
                · {s.reviews_count} {s.reviews_count === 1 ? "avaliação" : "avaliações"}
              </span>
            </span>
            <Icon.ChevRight size={16} style={{ color: "var(--spec-ink-soft)", flexShrink: 0 }} />
          </Link>
        ))}
      </div>
    </section>
  );
}
