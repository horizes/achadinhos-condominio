"use client";

import { useEffect, useState } from "react";
import { statsApi } from "@/lib/api";

// Seção "Prova social" (item 6 da spec): três números REAIS vindos do sistema —
// (1) empresas certificadas, (2) nota média dos parceiros, (3) condomínios na
// rede. Vem do endpoint /api/v1/stats (público, anônimo, agregados apenas).
export function ProofSocial() {
  const [stats, setStats] = useState<{
    certified: number | null;
    rating: number | null;
    condominios: number | null;
  }>({
    certified: null,
    rating: null,
    condominios: null,
  });

  useEffect(() => {
    let alive = true;
    void statsApi
      .get()
      .then((s) => {
        if (!alive) return;
        setStats({
          certified: s.certified_companies,
          rating: s.average_rating,
          condominios: s.condominios,
        });
      })
      .catch(() => {
        if (!alive) return;
        setStats({ certified: null, rating: null, condominios: null });
      });
    return () => {
      alive = false;
    };
  }, []);

  const fmtRating = (r: number | null) =>
    r == null ? "—" : r.toFixed(1).replace(".", ",");

  return (
    <section className="proof-social" aria-label="Números do Achadinhos">
      <div className="proof-cell">
        <div className="proof-num">{stats.certified ?? "—"}</div>
        <div className="proof-label">Empresas certificadas</div>
      </div>
      <div className="proof-cell">
        <div className="proof-num gold">{fmtRating(stats.rating)}</div>
        <div className="proof-label">Nota média dos parceiros</div>
      </div>
      <div className="proof-cell">
        <div className="proof-num">{stats.condominios ?? "—"}</div>
        <div className="proof-label">Condomínios na rede</div>
      </div>
    </section>
  );
}
