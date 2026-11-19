"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { APP_CONTENT } from "@/lib/app-content";
import { sellersApi, getImageUrl, type AdminSeller } from "@/lib/api";
import { splitByUniverse } from "@/lib/universes";
import { Icon } from "../icons";
import { CertSeal } from "../cert-seal";

interface UniverseCardsProps {
  onSeller: (s: AdminSeller) => void;
}

function DestaqueRow({
  sellers,
  onSeller,
}: { sellers: AdminSeller[]; onSeller: (s: AdminSeller) => void }) {
  // Faixa com os destaques do universo (logo + nome), rolagem lateral.
  if (sellers.length === 0) {
    return (
      <div className="destaque-logo-empty">
        Destaques em breve
      </div>
    );
  }
  return (
    <div className="destaque-logo-row" aria-label="Destaques do universo">
      {sellers.slice(0, 10).map((s) => (
        <button
          key={s.id}
          type="button"
          className="destaque-logo-btn"
          onClick={() => onSeller(s)}
          title={s.name}
          aria-label={s.name}
        >
          <span className="destaque-avatar">
            {s.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={getImageUrl(s.logo_url)} alt="" loading="lazy" decoding="async" />
            ) : (
              <span className="destaque-avatar-fallback">
                {s.name.charAt(0).toUpperCase()}
              </span>
            )}
          </span>
          <span className="destaque-logo-name">{s.name}</span>
          <CertSeal tier={s.cert_tier} linked={false} />
        </button>
      ))}
    </div>
  );
}

// Seção "Destaques top 10" — dois cartões de universo (Construção e
// Condomínio), cada um com os destaques do seu universo.
export function UniverseCards({ onSeller }: UniverseCardsProps) {
  const u = APP_CONTENT.universes;
  const [destaques, setDestaques] = useState<AdminSeller[]>([]);

  useEffect(() => {
    void sellersApi
      .list({ highlight: true })
      .then(setDestaques)
      .catch(() => {});
  }, []);

  const { condominio, construcao } = splitByUniverse(destaques);

  return (
    <section aria-label="Destaques top 10">
      <div className="destaques-pill-wrap">
        <h2 className="destaques-pill">Destaques top 10</h2>
      </div>
      <div className="destaques-grid">
        {/* Achadinhos da Construção — o topo do card leva para /construcao */}
        <div className="destaque-card destaque-card--construcao">
          <Link href="/construcao" className="destaque-card-link">
            <span className="destaque-card-top">
              <span className="destaque-tag">{u.construcao.universeLabel}</span>
              <span className="destaque-icon" aria-hidden="true">
                <Icon.Building size={17} />
              </span>
            </span>
            <span className="destaque-title">
              Achadinhos <span className="destaque-gold">da Construção</span>
            </span>
            <span className="destaque-sub">{u.construcao.tagline}</span>
          </Link>
          <DestaqueRow sellers={construcao} onSeller={onSeller} />
        </div>

        {/* Achadinhos do Condomínio — o universo atual */}
        <div className="destaque-card destaque-card--condominio" aria-current="page">
          <span className="destaque-card-top">
            <span className="destaque-tag">Universo dos Achadinhos</span>
            <span className="destaque-here">Você está aqui</span>
            <span className="destaque-icon" aria-hidden="true">
              <Icon.Home size={17} />
            </span>
          </span>
          <span className="destaque-title">Achadinhos do Condomínio</span>
          <span className="destaque-sub">
            Serviços, afiliados e produtos de confiança para o seu condomínio
          </span>
          <DestaqueRow sellers={condominio} onSeller={onSeller} />
        </div>
      </div>
    </section>
  );
}
