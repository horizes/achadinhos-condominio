"use client";

import { getImageUrl, type AdminSeller } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Icon } from "../icons";
import { CertSeal } from "../cert-seal";

interface CompanyCardProps {
  company: AdminSeller;
  onClick: () => void;
  isFav: boolean;
  onToggleFav: () => void;
}

// CompanyCard is the shared list-row card for an empresa — usada na home
// (recomendados, lojas), na tela de categoria, no shopping e nos favoritos.
export function CompanyCard({ company: c, onClick, isFav, onToggleFav, onQuote }: CompanyCardProps & { onQuote?: () => void }) {
  return (
    <div
      className="provider"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="provider-avatar">
        {c.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={getImageUrl(c.logo_url)}
            alt={c.name}
            className="provider-avatar-img"
            loading="lazy"
            decoding="async"
          />
        ) : (
          c.name.charAt(0).toUpperCase()
        )}
      </div>
      <div className="provider-info">
        <div className="provider-name">
          {c.name}
          <CertSeal tier={c.cert_tier} />
          {c.partner && <span className="provider-badge">Parceira</span>}
        </div>
        {onQuote && (
          <button
            type="button"
            className="quote-chip"
            onClick={(e) => {
              e.stopPropagation();
              onQuote();
            }}
          >
            Pedir orçamento
          </button>
        )}
        <div
          className="provider-cat"
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {c.description?.trim() || "Empresa"}
        </div>
        {(c.rating ?? 0) > 0 && (
          <div
            className="provider-cat"
            style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5 }}
          >
            <Icon.Star size={10} />
            {(c.rating ?? 0).toFixed(1).replace(".", ",")} · {c.reviews_count ?? 0} avaliações
          </div>
        )}
      </div>
      <button
        type="button"
        className={cn("provider-fav", isFav && "active")}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFav();
        }}
        aria-label="Favoritar"
      >
        <Icon.Heart size={18} filled={isFav} />
      </button>
    </div>
  );
}
