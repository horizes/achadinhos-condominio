"use client";

import { useEffect, useState } from "react";
import {
  categoriesApi,
  sellersApi,
  getImageUrl,
  type ApiCategory,
  type AdminSeller,
} from "@/lib/api";
import type { CategoryId } from "@/lib/types";
import { isPublicCategory } from "@/lib/utils";
import { Icon } from "../icons";

interface AllCategoriesScreenProps {
  onBack: () => void;
  onSelect: (id: CategoryId) => void;
  onSeller?: (s: AdminSeller) => void;
}

export function AllCategoriesScreen({
  onBack,
  onSelect,
  onSeller,
}: AllCategoriesScreenProps) {
  const [cats, setCats] = useState<ApiCategory[]>([]);
  const [sellers, setSellers] = useState<AdminSeller[]>([]);

  useEffect(() => {
    void categoriesApi
      .list()
      .then((cats) => setCats(cats.filter(isPublicCategory)))
      .catch(() => {});
    void sellersApi.list().then(setSellers).catch(() => {});
  }, []);

  const logos = sellers.filter((s) => s.logo_url);

  return (
    <div className="screen">
      <div className="screen-header gold-tint">
        <button
          type="button"
          className="screen-back"
          onClick={onBack}
          aria-label="Voltar"
        >
          <Icon.ChevLeft size={16} />
        </button>
        <div className="screen-title">Categorias</div>
      </div>
      <div className="screen-body">
        {cats.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 32,
              color: "var(--ink-500)",
              fontSize: 13,
            }}
          >
            Carregando…
          </div>
        ) : (
          <div className="all-cats">
            {cats.map((c) => {
              const iconKey = c.icon as keyof typeof Icon;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const I = Icon[iconKey] as
                | ((props: { size?: number }) => any)
                | undefined;
              return (
                <button
                  type="button"
                  key={c.id}
                  className="all-cat"
                  onClick={() => onSelect(c.id as CategoryId)}
                  style={{ textAlign: "left" }}
                >
                  <div className="all-cat-icon">{I ? <I /> : null}</div>
                  <div className="all-cat-label">{c.label}</div>
                  <div className="all-cat-count">{c.count} afiliados</div>
                </button>
              );
            })}
          </div>
        )}

        <div className="cats-mid-msg">
          Além de fornecedores de produtos e equipamentos essenciais para o
          dia a dia dos condomínios.
          <br />
          <br />
          <strong>
            Aqui o condomínio não arrisca.
            <br />
            Aqui ele escolhe com segurança.
          </strong>
        </div>

        {logos.length > 0 && (
          <section className="cats-logos-section">
            <h3 className="cats-logos-title">Empresas parceiras</h3>
            <div className="cats-logos">
              {logos.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="cats-logo"
                  onClick={() => onSeller?.(s)}
                  title={s.name}
                  aria-label={s.name}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getImageUrl(s.logo_url!)} alt={s.name} loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="cats-closing">
          <p>
            O Achadinhos reúne, em um único ecossistema, tudo o que um
            condomínio precisa para funcionar com eficiência, praticidade e
            tranquilidade. Mais do que divulgar empresas, o Achadinhos cria
            conexão entre necessidade e solução.
          </p>
          <div className="cats-closing-eyebrow">
            Experiência e Relacionamento
          </div>
          <p>
            O Achadinhos também leva interação, experiência e presença de marca
            para dentro dos condomínios, fortalecendo a imagem dos fornecedores
            no universo condominial.
          </p>
        </section>
      </div>
    </div>
  );
}
