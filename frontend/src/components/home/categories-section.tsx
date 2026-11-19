"use client";

import { useEffect, useState } from "react";
import { categoriesApi, type ApiCategory } from "@/lib/api";
import type { CategoryId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { isPublicCategory } from "@/lib/utils";
import { Icon } from "../icons";

interface CategoriesSectionProps {
  active: CategoryId;
  onSelect: (id: CategoryId) => void;
  onSeeAll: () => void;
}

// onSeeAll mantido na interface por compatibilidade, mas o botão "Ver todas"
// funciona sem sair da página (expande/recolhe a grade).
export function CategoriesSection({
  active,
  onSelect,
}: CategoriesSectionProps) {
  const [cats, setCats] = useState<ApiCategory[]>([]);
  // "Ver todas" troca a faixa lateral por uma grade completa aqui mesmo,
  // sem navegar para outra tela. O mesmo botão liga/desliga o modo.
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    void categoriesApi
      .list()
      .then(setCats)
      .catch(() => {});
  }, []);

  // Spec (item 7 da home): seis categorias específicas na home —
  // Limpeza, Portaria, Elevadores, Jardinagem, Pintura, Jurídico —
  // rolagem lateral, com "Ver todas" no fim.
  const SPEC_CATEGORIES: { id: CategoryId; label: string }[] = [
    { id: "limpeza", label: "Limpeza" },
    { id: "portaria", label: "Portaria" },
    { id: "manutencao-elevadores", label: "Elevadores" },
    { id: "jardinagem", label: "Jardinagem" },
    { id: "pintura-predial", label: "Pintura" },
    { id: "juridico", label: "Jurídico" },
  ];

  const byId = new Map(cats.map((c) => [c.id, c]));
  const pinned = SPEC_CATEGORIES.filter((s) => byId.has(s.id)).map(
    (s) => byId.get(s.id)!,
  );
  // Grade completa: todas as categorias públicas (mesma lista usada em /categorias).
  const all = cats.filter(isPublicCategory);

  const renderCatButton = (c: ApiCategory, i: number, className?: string) => {
    const iconKey = c.icon as keyof typeof Icon;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const IconCmp = Icon[iconKey] as ((props: { size?: number }) => any) | undefined;
    return (
      <button
        type="button"
        key={c.id}
        className={cn("cat fade-up", active === c.id && "active", className)}
        onClick={() => onSelect(c.id as CategoryId)}
        style={{ animationDelay: `${100 + i * 30}ms` }}
        role="listitem"
      >
        <span className="cat-icon">{IconCmp ? <IconCmp /> : null}</span>
        <span className="cat-label">{c.short}</span>
      </button>
    );
  };

  if (showAll) {
    return (
      <div className="section">
        <div className="section-title">
          <h2>Categorias</h2>
          <button
            type="button"
            className="see-all"
            onClick={() => setShowAll(false)}
          >
            Ver menos <Icon.ChevDown />
          </button>
        </div>
        <div
          className="all-cats"
          role="list"
          aria-label="Todas as categorias"
          style={{ padding: "0 22px 12px" }}
        >
          {all.map((c, i) => {
            const iconKey = c.icon as keyof typeof Icon;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const IconCmp = Icon[iconKey] as ((props: { size?: number }) => any) | undefined;
            return (
              <button
                type="button"
                key={c.id}
                className="all-cat"
                onClick={() => onSelect(c.id as CategoryId)}
                style={{ textAlign: "left" }}
              >
                <div className="all-cat-icon">{IconCmp ? <IconCmp /> : null}</div>
                <div className="all-cat-label">{c.label}</div>
                <div className="all-cat-count">{c.count} afiliados</div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="section-title">
        <h2>Categorias</h2>
        <button type="button" className="see-all" onClick={() => setShowAll(true)}>
          Ver todas <Icon.ChevRight />
        </button>
      </div>
      <div className="cats cats--pinned" role="list" aria-label="Categorias principais">
        {pinned.map((c, i) => renderCatButton(c, i))}
        <button type="button" className="cat cat--see-all" onClick={() => setShowAll(true)}>
          <span className="cat-icon"><Icon.ChevRight /></span>
          <span className="cat-label">Ver todas</span>
        </button>
      </div>
    </div>
  );
}
