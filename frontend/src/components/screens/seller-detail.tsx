"use client";

import { useState } from "react";
import Link from "next/link";
import {
  getImageUrl,
  isPdf,
  isVideo,
  type AdminSeller,
  type ApiProduct,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { APP_CONTENT } from "@/lib/app-content";
import { shareProfile } from "@/lib/share-profile";
import { CertSeal } from "../cert-seal";
import type { ContactInput } from "@/hooks/use-whatsapp-history";
import { Icon } from "../icons";
import { PortfolioViewer } from "./portfolio-viewer";
import { PdfThumbnail } from "./pdf-thumbnail";
import { VideoThumbnail } from "./video-thumbnail";
import { SocialLinks } from "./social-links";
import { useSellerData } from "./use-seller-data";

interface SellerDetailProps {
  seller: AdminSeller;
  onBack: () => void;
  isFav: boolean;
  onToggleFav: (id: string) => void;
  onRecordContact: (input: ContactInput) => void;
  /** Abre a tela do produto (mesma usada no Shopping). */
  onProduct?: (p: ApiProduct) => void;
}

// SellerDetail is the public profile screen for an empresa (seller). It mirrors
// the prestador detail, minus the prestador-only bits (rating, serviços).
export function SellerDetail({
  seller,
  onBack,
  isFav,
  onToggleFav,
  onRecordContact,
  onProduct,
}: SellerDetailProps) {
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const { isAuthenticated } = useAuth();
  const { toast, showToast } = useToast();
  const {
    full,
    products,
    portfolio,
    reviews,
    avgRating,
    ratingDist,
    myRating,
    setMyRating,
    reviewText,
    setReviewText,
    sending,
    reviewMsg,
    submitReview,
    categoryLabel,
    openWhatsapp,
    openSite,
    canReview,
    myTags,
    toggleTag,
  } = useSellerData(seller, onRecordContact);

  const sellerUrl =
    typeof window !== "undefined" ? `${window.location.origin}/empresa/${full.id}` : `/empresa/${full.id}`;
  const shareIt = () => {
    void shareProfile({
      title: full.name,
      text: `Veja a empresa ${full.name} no Achadinhos do Condomínio`,
      url: sellerUrl,
    }).then((mode) => {
      if (mode === "whatsapp") return;
      showToast(mode === "shared" ? "Compartilhado ✦" : "Compartilhamento cancelado");
    });
  };

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
        <div className="screen-title">Empresa</div>
        <div className="screen-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={shareIt}
            aria-label="Compartilhar perfil"
            title="Compartilhar perfil"
          >
            <Icon.Share size={18} />
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => onToggleFav(seller.id)}
            aria-label="Favoritar"
          >
            <Icon.Heart size={18} filled={isFav} />
          </button>
        </div>
      </div>

      <div className="screen-body" style={{ paddingBottom: 100 }}>
        <div className="pd-hero">
          <div style={{ position: "relative", zIndex: 1 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.18em",
                color: "var(--gold-300)",
                textTransform: "uppercase",
              }}
            >
              {categoryLabel}
            </div>
          </div>
        </div>

        <div className="pd-card">
          <div className="pd-top">
            <div className="pd-avatar">
              {full.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getImageUrl(full.logo_url)}
                  alt={full.name}
                  className="pd-avatar-img"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                full.name.charAt(0).toUpperCase()
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="pd-name">
                {full.name}
                <CertSeal tier={full.cert_tier} style={{ marginLeft: 6 }} />
              </div>
              <div className="pd-cat">
                {categoryLabel}
                {full.partner && " · Parceira homologada"}
              </div>
              <div className="pd-rating-row">
                <Icon.Star size={12} />
                <strong>{avgRating.toFixed(1).replace(".", ",")}</strong>
                <span>· {reviews.length} avaliações</span>
              </div>
            </div>
          </div>
          <div className="pd-stats">
            <div className="pd-stat">
              <div className="pd-stat-num">
                {avgRating > 0 ? avgRating.toFixed(1).replace(".", ",") : "—"}
              </div>
              <div className="pd-stat-label">Avaliação</div>
            </div>
            <div className="pd-stat">
              <div className="pd-stat-num">{reviews.length}</div>
              <div className="pd-stat-label">Avaliações</div>
            </div>
            <div className="pd-stat">
              <div className="pd-stat-num">{products.length}</div>
              <div className="pd-stat-label">Produtos</div>
            </div>
          </div>
        </div>

        {full.description?.trim() && (
          <div className="pd-section">
            <h3>Sobre</h3>
            <div className="pd-desc">{full.description}</div>
          </div>
        )}

        {/* Spec: "O que conferimos nesta empresa" — itens da certificação.
            Os critérios reais estão pendentes ([critérios reais a definir]),
            então exibimos placeholders explícitos, nunca critérios inventados. */}
        <div className="cert-criteria" aria-label="O que conferimos nesta empresa">
          <h4>O que conferimos nesta empresa</h4>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {APP_CONTENT.certCriteria.map((item, i) => (
              <li key={i}>
                <Icon.Check size={13} style={{ color: "var(--success, #2e7d5b)", flexShrink: 0, marginTop: 2 }} />
                <span>
                  <span className="cert-tbd">a definir</span>
                  {item.replace(/^\[|\]$/g, "")}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {products.length > 0 && (
          <div className="pd-section">
            <h3>Produtos &amp; serviços</h3>
            <div className="pd-products">
              {products.map((p) => {
                // Clique abre a tela do produto; sem handler (fallback), abre
                // o link externo do produto/da loja quando existir.
                const externalLink = p.link_override || full.link || "";
                const open = onProduct
                  ? () => onProduct(p)
                  : externalLink
                    ? () => window.open(externalLink, "_blank", "noopener,noreferrer")
                    : undefined;
                return (
                  <div
                    key={p.id}
                    className={cn("pd-product", open && "pd-product--clickable")}
                    onClick={open}
                    role={open ? "button" : undefined}
                    tabIndex={open ? 0 : undefined}
                    onKeyDown={
                      open
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              open();
                            }
                          }
                        : undefined
                    }
                  >
                    <div className="pd-product-thumb">
                      {p.photos && p.photos.length > 0 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={getImageUrl(p.photos[0].url)}
                          alt={p.name}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span className="pd-product-letter">
                          {p.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="pd-product-name">{p.name}</div>
                    <div className="pd-product-price">
                      {p.price > 0
                        ? p.price.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })
                        : "Sob consulta"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {full.document && (
          <div className="pd-section">
            <h3>{full.document_type === "cpf" ? "CPF" : "CNPJ"}</h3>
            <div className="pd-desc">{full.document}</div>
          </div>
        )}

        {portfolio.length > 0 && (
          <div className="pd-section">
            <h3>Portfólio</h3>
            <div className="pd-portfolio">
              {portfolio.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setViewerUrl(url)}
                  className="pd-portfolio-item"
                >
                  {isVideo(url) ? (
                    <VideoThumbnail url={url} />
                  ) : isPdf(url) ? (
                    <PdfThumbnail url={getImageUrl(url)} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={getImageUrl(url)} alt="Portfólio" loading="lazy" decoding="async" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <SocialLinks
          data={{
            instagram: full.instagram,
            facebook: full.facebook,
            tiktok: full.tiktok,
            youtube: full.youtube,
            site: full.link,
          }}
        />

        {/* Avaliações */}
        <div className="pd-section">
          <div className="pd-eval-head">
            <h3 style={{ margin: 0 }}>
              Avaliações{" "}
              <span
                style={{ color: "var(--ink-400)", fontWeight: 400, fontSize: 13 }}
              >
                ({reviews.length})
              </span>
            </h3>
            {/* Spec: botão dourado "Avaliar" à direita do título */}
            <button
              type="button"
              className="btn-eval-gold"
              onClick={() =>
                document.getElementById("avaliar-form")?.scrollIntoView({ behavior: "smooth", block: "center" })
              }
            >
              <Icon.Star size={14} /> Avaliar
            </button>
          </div>

          {reviews.length > 0 && (
            <div className="rating-summary" style={{ marginBottom: 14 }}>
              <div className="rating-big">
                <div className="rating-big-num">
                  {avgRating.toFixed(1).replace(".", ",")}
                </div>
                <div className="rating-big-stars">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Icon.Star
                      key={i}
                      size={11}
                      filled={i <= Math.round(avgRating)}
                    />
                  ))}
                </div>
                <div className="rating-big-count">
                  {reviews.length} avaliações
                </div>
              </div>
              <div className="rating-bars">
                {ratingDist.map((d) => (
                  <div key={d.stars} className="rating-bar-row">
                    <span>{d.stars}</span>
                    <div className="rating-bar">
                      <div
                        className="rating-bar-fill"
                        style={{ width: `${d.pct}%` }}
                      />
                    </div>
                    <span style={{ width: 22, textAlign: "right" }}>
                      {d.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isAuthenticated ? (
            canReview === false ? (
              <div className="sr-gate" id="avaliar-form">
                <Icon.Award size={18} />
                <div>
                  <strong>Só quem contratou pode avaliar.</strong>
                  <span>
                    Faça um pedido de orçamento com esta empresa e, após o serviço, avalie por aqui —
                    o app pede a avaliação quando o pedido for concluído.
                  </span>
                  <Link href={`/orcamento?empresa=${full.id}`} className="sr-gate-cta">
                    Pedir orçamento →
                  </Link>
                </div>
              </div>
            ) : canReview === null ? (
              <div className="sr-login" id="avaliar-form">Verificando se você pode avaliar…</div>
            ) : (
            <div className="sr-form" id="avaliar-form">
              <div className="sr-stars">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMyRating(n)}
                    aria-label={`${n} estrela(s)`}
                  >
                    <Icon.Star size={26} filled={n <= myRating} />
                  </button>
                ))}
              </div>
              <div className="sr-tags-label">O que se destacou?</div>
              <div className="sr-tags" role="group" aria-label="O que se destacou">
                {APP_CONTENT.reviewTags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={cn("sr-tag", myTags.includes(t) && "active")}
                    aria-pressed={myTags.includes(t)}
                    onClick={() => toggleTag(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <textarea
                className="prof-textarea"
                rows={3}
                placeholder="Comentário (opcional)"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />
              <button
                type="button"
                className="sr-submit"
                onClick={submitReview}
                disabled={myRating < 1 || sending}
              >
                {sending ? "Enviando…" : "Enviar avaliação"}
              </button>
              {reviewMsg && (
                <div className="sr-msg" role="status">
                  {reviewMsg.startsWith("Avaliação enviada") && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src="/brand/mascote-dourado-v2.png" alt="" className="sr-mascot-celebrate" />
                  )}
                  <span>{reviewMsg}</span>
                </div>
              )}
            </div>
            )
          ) : (
            <div className="sr-login">
              Entre como síndico para avaliar — só quem contratou pelo app pode avaliar.
            </div>
          )}

          {(showAllReviews ? reviews : reviews.slice(0, 3)).map((r) => (
            <div key={r.id} className="review">
              <div className="review-head">
                <div className="review-avatar">
                  {(r.user?.name ?? "?").charAt(0).toUpperCase()}
                </div>
                <div className="review-user-info">
                  <div className="review-user">
                    {r.user?.name ?? "Usuário"}
                    {r.verified && (
                      <span className="review-verified" title="Cliente verificado — contratou pelo app">
                        <Icon.Check size={10} /> cliente verificado
                      </span>
                    )}
                  </div>
                  <div className="review-meta">
                    {new Date(r.created_at).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <div className="review-stars">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Icon.Star key={i} size={11} filled={i <= r.rating} />
                  ))}
                </div>
              </div>
              {r.text && <div className="review-text">{r.text}</div>}
              {r.tags && r.tags.length > 0 && (
                <div className="review-tags">
                  {r.tags.map((t) => (
                    <span key={t} className="review-tag">{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {reviews.length > 3 && (
            <button type="button" className="see-all see-all--center" onClick={() => setShowAllReviews((v) => !v)}>
              {showAllReviews ? "Ver menos" : `Ver todas as avaliações (${reviews.length})`}
              <Icon.ChevRight size={12} />
            </button>
          )}
          {reviews.length === 0 && (
            <div className="sr-empty">
              Seja o primeiro a avaliar esta empresa.
            </div>
          )}
        </div>
      </div>

      <div className="sticky-cta">
        {/* Barra fixa do rodapé (spec): ★ Avaliar (contorno) e Pedir orçamento
            (contorno), com o WhatsApp como ação principal em verde. */}
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            document.getElementById("avaliar-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          <Icon.Star size={14} /> Avaliar
        </button>
        <Link
          className="btn-secondary"
          href={`/orcamento?empresa=${seller.id}`}
          style={{ textDecoration: "none" }}
        >
          Pedir orçamento
        </Link>
        <button type="button" className="btn-whatsapp" onClick={openWhatsapp}>
          <Icon.Whatsapp size={16} /> WhatsApp
        </button>
      </div>

      <PortfolioViewer url={viewerUrl} onClose={() => setViewerUrl(null)} />
      {toast && (
        <div className="toast show">
          <Icon.Sparkle />
          {toast}
        </div>
      )}
    </div>
  );
}
