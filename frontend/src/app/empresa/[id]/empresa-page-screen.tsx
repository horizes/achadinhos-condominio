"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  externalHref,
  getImageUrl,
  isPdf,
  isVideo,
  type AdminSeller,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useFavorites } from "@/hooks/use-favorites";
import { useToast } from "@/hooks/use-toast";
import { useWhatsappHistory } from "@/hooks/use-whatsapp-history";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn, tierLabel, isPublicCategory } from "@/lib/utils";
import { Icon } from "@/components/icons";
import { APP_CONTENT } from "@/lib/app-content";
import { shareProfile } from "@/lib/share-profile";
import { downloadSeloArt } from "@/lib/selo-art";
import { SellerDetail } from "@/components/screens/seller-detail";
import { useSellerData } from "@/components/screens/use-seller-data";
import { PortfolioViewer } from "@/components/screens/portfolio-viewer";
import { PdfThumbnail } from "@/components/screens/pdf-thumbnail";
import { VideoThumbnail } from "@/components/screens/video-thumbnail";
import { EntityPageShell, SectionHead, Stars } from "@/components/web/entity-page";

// /empresa/[id] — página de verdade no desktop (Claude Design "Paginas
// Empresa e Produto", 2a): top-nav, breadcrumb, conteúdo + painel de ação
// fixo, rodapé. No mobile (<768px) continua o overlay SellerDetail.
export function EmpresaPageScreen({ seller }: { seller: AdminSeller }) {
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { isAuthenticated } = useAuth();
  const { toggle: toggleFavRaw, isFav } = useFavorites();
  const { toast, showToast } = useToast();
  const { record } = useWhatsappHistory();
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  const data = useSellerData(seller, record);
  const { full, products, portfolio, reviews, avgRating, ratingDist, categoryLabel } = data;
  const { canReview, myTags, toggleTag } = data;

  const fav = isFav(seller.id);
  const toggleFav = () => {
    const added = toggleFavRaw(seller.id, "seller");
    showToast(added ? "Empresa salva ✦" : "Removido dos favoritos");
  };

  const profileUrl = `/empresa/${full.id}`;
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}${profileUrl}` : profileUrl;
  const shareIt = () => {
    void shareProfile({
      title: full.name,
      text: `Veja a empresa ${full.name} no Achadinhos do Condomínio`,
      url: shareUrl,
    }).then((mode) => {
      if (mode === "whatsapp") {
        showToast("Abrindo o WhatsApp…");
        return;
      }
      showToast(mode === "cancelled" ? "Compartilhamento cancelado" : "Compartilhado ✦");
    });
  };
  const downloadSelo = () => {
    void downloadSeloArt({
      companyName: full.name,
      tier: full.cert_tier,
      profileUrl: shareUrl,
    }).catch(() => showToast("Não consegui gerar a arte agora."));
  };

  const tier = tierLabel(full.cert_tier);
  const mainCat = full.category ?? full.categories?.[0];
  const socials = [
    { key: "instagram", label: "Instagram", value: full.instagram, icon: <Icon.Instagram size={15} /> },
    { key: "facebook", label: "Facebook", value: full.facebook, icon: <Icon.Facebook size={15} /> },
    { key: "tiktok", label: "TikTok", value: full.tiktok, icon: <Icon.TikTok size={15} /> },
    { key: "youtube", label: "YouTube", value: full.youtube, icon: <Icon.YouTube size={15} /> },
  ].filter((s) => (s.value ?? "").trim() !== "");

  const fmtBRL = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  // Máscara de CNPJ/CPF para a ficha (o banco guarda só dígitos).
  const fmtDoc = (doc: string) => {
    const d = doc.replace(/\D+/g, "");
    if (d.length === 14) return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
    if (d.length === 11) return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
    return doc;
  };

  return (
    <main className="route-page entity-page">
      <EntityPageShell
        crumbs={[
          { label: "Início", href: "/" },
          { label: "Empresas", href: "/" },
          ...(mainCat ? [{ label: mainCat.label, ...(isPublicCategory(mainCat) ? { href: `/categoria/${mainCat.id}` } : {}) }] : []),
          { label: full.name },
        ]}
      >
        <div className="entity-grid entity-grid--seller">
          {/* ── Coluna de conteúdo ── */}
          <div className="entity-main">
            <header className="entity-hero">
              <div className="entity-hero-logo">
                <div className="entity-hero-logo-box">
                  {full.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={getImageUrl(full.logo_url)} alt={full.name} loading="eager" decoding="async" />
                  ) : (
                    <span>{full.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
              </div>
              <div className="entity-hero-text">
                <div className="entity-eyebrow">{categoryLabel}</div>
                <h1 className="entity-h1">{full.name}</h1>
                <div className="entity-hero-meta">
                  {tier && <span className="entity-chip entity-chip--cert">Certificado {tier}</span>}
                  {full.partner && <span className="entity-chip">Parceira homologada</span>}
                  {(tier || full.partner) && <span className="entity-vsep" aria-hidden />}
                  <span className="entity-rating-inline">
                    <Stars value={avgRating} />
                    <strong>{avgRating > 0 ? avgRating.toFixed(1).replace(".", ",") : "—"}</strong>
                    <span>
                      · {reviews.length} {reviews.length === 1 ? "avaliação" : "avaliações"}
                    </span>
                  </span>
                </div>
              </div>
            </header>

            {full.description?.trim() && (
              <section>
                <SectionHead title="Sobre" />
                <div className="entity-prose">
                  {full.description
                    .split(/\n{2,}/)
                    .filter((p) => p.trim())
                    .map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                </div>
              </section>
            )}

            {/* Spec: "O que conferimos nesta empresa" — itens da certificação.
                Critérios reais ainda não definidos — placeholders explícitos. */}
            <section aria-label="O que conferimos nesta empresa">
              <SectionHead title="O que conferimos nesta empresa" />
              <ul className="cert-criteria" style={{ listStyle: "none", margin: 0 }}>
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
            </section>

            {products.length > 0 && (
              <section>
                <SectionHead title="Produtos & serviços" aside={`${products.length}`} />
                <div className="entity-products">
                  {products.map((p) => (
                    <Link key={p.id} href={`/produto/${p.id}`} className="entity-product-card">
                      <div className="entity-product-thumb">
                        {p.photos && p.photos.length > 0 ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={getImageUrl(p.photos[0].url)} alt={p.name} loading="lazy" decoding="async" />
                        ) : (
                          <span>{p.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="entity-product-name">{p.name}</div>
                      <div className="entity-product-price">
                        {p.price > 0 ? fmtBRL(p.price) : "Sob consulta"}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {portfolio.length > 0 && (
              <section>
                <SectionHead
                  title="Portfólio"
                  aside={`${portfolio.length} ${portfolio.length === 1 ? "peça" : "peças"}`}
                />
                <div className="entity-portfolio">
                  {portfolio.map((url) => (
                    <button
                      key={url}
                      type="button"
                      className="entity-portfolio-item"
                      onClick={() => setViewerUrl(url)}
                    >
                      <span className="entity-portfolio-frame">
                        {isVideo(url) ? (
                          <VideoThumbnail url={url} />
                        ) : isPdf(url) ? (
                          <PdfThumbnail url={getImageUrl(url)} />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={getImageUrl(url)} alt="Portfólio" loading="lazy" decoding="async" />
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section>
              <SectionHead
                title="Avaliações"
                aside={
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="entity-eyebrow-muted">{reviews.length}</span>
                    <button
                      type="button"
                      className="btn-eval-gold"
                      onClick={() =>
                        document.getElementById("avaliar-form")?.scrollIntoView({ behavior: "smooth", block: "center" })
                      }
                    >
                      <Icon.Star size={14} /> Avaliar
                    </button>
                  </span>
                }
              />

              {reviews.length > 0 && (
                <div className="entity-rating-summary">
                  <div className="entity-rating-big">
                    <div className="entity-rating-big-num">
                      {avgRating.toFixed(1).replace(".", ",")}
                    </div>
                    <div className="entity-rating-big-count">
                      {reviews.length} {reviews.length === 1 ? "avaliação" : "avaliações"}
                    </div>
                  </div>
                  <div className="entity-rating-bars">
                    {ratingDist.map((d) => (
                      <div key={d.stars} className="entity-rating-bar-row">
                        <span>{d.stars}</span>
                        <span className="entity-rating-bar">
                          <span style={{ width: `${d.pct}%` }} />
                        </span>
                        <span className="entity-rating-pct">{d.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="entity-reviews-grid">
                <div className="entity-review-list">
                  {reviews.map((r) => (
                    <article key={r.id} className="entity-review">
                      <div className="entity-review-avatar">
                        {(r.user?.name ?? "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="entity-review-body">
                        <div className="entity-review-head">
                          <span className="entity-review-user">
                            {r.user?.name ?? "Usuário"}
                            {r.verified && (
                              <span className="review-verified" title="Cliente verificado — contratou pelo app">
                                <Icon.Check size={10} /> cliente verificado
                              </span>
                            )}
                          </span>
                          <span className="entity-review-date">
                            {new Date(r.created_at).toLocaleDateString("pt-BR")}
                          </span>
                          <Stars value={r.rating} size={11} className="entity-review-stars" />
                        </div>
                        {r.text && <p className="entity-review-text">{r.text}</p>}
                        {r.tags && r.tags.length > 0 && (
                          <div className="review-tags">
                            {r.tags.map((t) => (
                              <span key={t} className="review-tag">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                  {reviews.length === 0 && (
                    <div className="entity-review-empty">Seja o primeiro a avaliar esta empresa.</div>
                  )}
                </div>

                {isAuthenticated ? (
                  canReview === false ? (
                    <div className="entity-review-form sr-gate" id="avaliar-form">
                      <Icon.Award size={18} />
                      <div>
                        <strong>Só quem contratou pode avaliar.</strong>
                        <span>
                          Faça um pedido de orçamento com esta empresa e, após o serviço, avalie por
                          aqui — o app pede a avaliação quando o pedido for concluído.
                        </span>
                        <Link href={`/orcamento?empresa=${full.id}`} className="sr-gate-cta">
                          Pedir orçamento →
                        </Link>
                      </div>
                    </div>
                  ) : canReview === null ? (
                    <div className="entity-review-form entity-review-login" id="avaliar-form">
                      Verificando se você pode avaliar…
                    </div>
                  ) : (
                  <div className="entity-review-form" id="avaliar-form">
                    <div className="entity-eyebrow-muted">Avaliar esta empresa</div>
                    <div className="entity-review-form-stars">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => data.setMyRating(n)}
                          aria-label={`${n} estrela(s)`}
                          className={cn(n <= data.myRating && "active")}
                        >
                          <Icon.Star size={24} filled={n <= data.myRating} />
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
                      rows={3}
                      placeholder="Comentário (opcional)"
                      value={data.reviewText}
                      onChange={(e) => data.setReviewText(e.target.value)}
                    />
                    <button
                      type="button"
                      className="ebtn ebtn-ghost"
                      onClick={data.submitReview}
                      disabled={data.myRating < 1 || data.sending}
                    >
                      {data.sending ? "Enviando…" : "Enviar avaliação"}
                    </button>
                    {data.reviewMsg && (
                      <div className="entity-review-msg" role="status">
                        {data.reviewMsg.startsWith("Avaliação enviada") && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src="/brand/mascote-dourado-v2.png" alt="" className="sr-mascot-celebrate" />
                        )}
                        <span>{data.reviewMsg}</span>
                      </div>
                    )}
                  </div>
                  )) : (
                  <div className="entity-review-form entity-review-login">
                    Entre como síndico para avaliar — só quem contratou pelo app pode avaliar.{" "}
                    <Link href="/login">Entrar</Link>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* ── Painel de ação ── */}
          <aside className="entity-panel">
            <div className="entity-card">
              <div className="entity-eyebrow-muted">Falar com a empresa</div>
              <div className="entity-actions">
                <Link
                  href={`/orcamento?empresa=${full.id}`}
                  className="ebtn ebtn-primary"
                  style={{ textDecoration: "none", textAlign: "center", boxSizing: "border-box" }}
                >
                  Pedir orçamento
                </Link>
                {full.whatsapp?.trim() && (
                  <button type="button" className="ebtn ebtn-wa" onClick={data.openWhatsapp}>
                    <Icon.Whatsapp size={16} /> Falar no WhatsApp
                  </button>
                )}
                {full.link && (
                  <button type="button" className="ebtn ebtn-ghost" onClick={data.openSite}>
                    <Icon.ExternalLink size={14} /> Visitar o site
                  </button>
                )}
                <button
                  type="button"
                  className="ebtn ebtn-neutral"
                  onClick={toggleFav}
                  aria-pressed={fav}
                >
                  <Icon.Heart size={15} filled={fav} className="entity-heart" />
                  {fav ? "Nos favoritos" : "Salvar nos favoritos"}
                </button>
                <button type="button" className="ebtn ebtn-neutral" onClick={shareIt}>
                  <Icon.Share size={15} /> Compartilhar perfil
                </button>
              </div>
            </div>

            <div className="entity-card">
              <div className="entity-eyebrow-muted" style={{ marginBottom: 6 }}>Ficha</div>
              <dl className="entity-sheet">
                {full.document && (
                  <div className="entity-sheet-row">
                    <dt>{full.document_type === "cpf" ? "CPF" : "CNPJ"}</dt>
                    <dd className="tnum">{fmtDoc(full.document)}</dd>
                  </div>
                )}
                <div className="entity-sheet-row">
                  <dt>{full.categories && full.categories.length > 1 ? "Categorias" : "Categoria"}</dt>
                  <dd>{categoryLabel}</dd>
                </div>
                {tier && (
                  <div className="entity-sheet-row">
                    <dt>Certificação</dt>
                    <dd>{tier} · ativa</dd>
                  </div>
                )}
                {socials.length > 0 && (
                  <div className="entity-sheet-row entity-sheet-row--last">
                    <dt>Redes</dt>
                    <dd className="entity-socials">
                      {socials.map((s) => (
                        <a
                          key={s.key}
                          href={externalHref(s.value!)}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={s.label}
                          title={s.label}
                        >
                          {s.icon}
                        </a>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {tier && (
              <div className="entity-cert">
                <div className="entity-cert-head">
                  <span className="entity-cert-icon"><Icon.Award size={18} /></span>
                  <span className="entity-cert-title">Certificação {tier}</span>
                </div>
                <p>Documentação, referências e vistoria conferidas pela equipe do Achadinhos.</p>
                <Link href="/verificar" className="entity-cert-link">Verificar certificado →</Link>
                {/* Spec: "Selo para divulgar" — a empresa baixa a arte para
                    postar nas redes, com link para o perfil. */}
                <button type="button" className="ebtn ebtn-ghost" style={{ marginTop: 10, width: "100%", justifyContent: "center" }} onClick={downloadSelo}>
                  <Icon.Download size={15} /> Baixar selo para divulgar
                </button>
              </div>
            )}
          </aside>
        </div>
      </EntityPageShell>

      {/* Mobile: overlay antigo, montado só no cliente para não duplicar no SSR. */}
      {mounted && !isDesktop && (
        <SellerDetail
          seller={seller}
          onBack={() => router.push("/")}
          isFav={fav}
          onToggleFav={toggleFav}
          onRecordContact={record}
          onProduct={(p) => router.push(`/produto/${p.id}`)}
        />
      )}

      <PortfolioViewer url={viewerUrl} onClose={() => setViewerUrl(null)} />

      <div className={cn("toast", toast && "show")}>
        <Icon.Sparkle />
        {toast}
      </div>
    </main>
  );
}
