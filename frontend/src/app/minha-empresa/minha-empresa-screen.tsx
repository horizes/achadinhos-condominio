"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ApiError,
  getImageUrl,
  isPdf,
  isVideo,
  myCompanyApi,
  quotesApi,
  type AdminSeller,
  type ApiQuoteReceived,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Icon } from "@/components/icons";
import { BrandLockup } from "@/components/auth/brand-lockup";
import {
  EMPTY_EMPRESA_FIELDS,
  EmpresaFields,
  empresaFieldsToPayload,
  validateEmpresaFields,
  type EmpresaFieldsErrors,
  type EmpresaFieldsValue,
} from "@/components/empresa/empresa-fields";
import { tierLabel } from "@/lib/utils";
import { formatPhone, isValidPhone, stripPhone } from "@/lib/phone";

const MAX_PORTFOLIO = 5;

function toFields(s: AdminSeller): EmpresaFieldsValue {
  const ids = (s.categories ?? []).map((c) => c.id);
  if (s.category_id && !ids.includes(s.category_id)) ids.unshift(s.category_id);
  // A principal (category_id) vem primeiro.
  const primary = s.category_id ?? ids[0];
  const ordered = primary ? [primary, ...ids.filter((id) => id !== primary)] : ids;
  return {
    ...EMPTY_EMPRESA_FIELDS,
    companyName: s.name ?? "",
    categoryIds: ordered,
    whatsapp: formatPhone(s.whatsapp ?? ""),
    description: s.description ?? "",
    link: s.link ?? "",
    instagram: s.instagram ?? "",
    facebook: s.facebook ?? "",
    tiktok: s.tiktok ?? "",
    youtube: s.youtube ?? "",
  };
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.message === "company_name_taken") return "Já existe outra empresa com esse nome no site.";
    if (err.status === 0) return "Não consegui falar com o servidor. Verifique sua conexão.";
    if (err.status < 500 && err.message && !/^[a-z_]+$/.test(err.message)) return err.message;
  }
  return fallback;
}

// /minha-empresa — área da empresa free (conta role=empresa): edita os dados
// públicos, a logo e o portfólio da própria empresa. Selo, "Parceira" e
// destaque ficam com o admin (Certificação Achadinhos).
export function MinhaEmpresaScreen() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  const [company, setCompany] = useState<AdminSeller | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fields, setFields] = useState<EmpresaFieldsValue>(EMPTY_EMPRESA_FIELDS);
  const [fieldErrors, setFieldErrors] = useState<EmpresaFieldsErrors>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [videoLink, setVideoLink] = useState("");
  const [quotes, setQuotes] = useState<ApiQuoteReceived[] | null>(null);
  const [quoteBusy, setQuoteBusy] = useState<string | null>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const portfolioInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (user?.role !== "empresa") {
      router.replace(user?.role === "admin" ? "/admin" : "/");
      return;
    }
    myCompanyApi
      .get()
      .then((s) => {
        setCompany(s);
        setFields(toFields(s));
      })
      .catch((err) => setLoadError(errorMessage(err, "Não foi possível carregar sua empresa.")));
    quotesApi
      .received()
      .then(setQuotes)
      .catch(() => setQuotes([]));
  }, [isLoading, isAuthenticated, user?.role, router]);

  async function handleQuoteStatus(id: string, status: "respondido" | "fechado") {
    setQuoteBusy(id);
    try {
      await quotesApi.patchStatus(id, status);
      setQuotes((prev) => (prev ? prev.map((q) => (q.id === id ? { ...q, status } : q)) : prev));
    } catch (err) {
      setNotice({ kind: "error", text: errorMessage(err, "Não foi possível atualizar o pedido agora.") });
    } finally {
      setQuoteBusy(null);
    }
  }

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNotice(null);
    const errs = validateEmpresaFields(fields, isValidPhone);
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    try {
      const updated = await myCompanyApi.update(empresaFieldsToPayload(fields, stripPhone));
      setCompany(updated);
      setFields(toFields(updated));
      setNotice({ kind: "success", text: "Dados salvos. Já estão no site." });
    } catch (err) {
      setNotice({ kind: "error", text: errorMessage(err, "Não foi possível salvar agora.") });
    } finally {
      setSaving(false);
    }
  }

  async function handleLogo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setNotice(null);
    setUploading(true);
    try {
      const { logo_url } = await myCompanyApi.uploadLogo(file);
      setCompany((c) => (c ? { ...c, logo_url } : c));
      setNotice({ kind: "success", text: "Logo atualizada." });
    } catch (err) {
      setNotice({ kind: "error", text: errorMessage(err, "Não foi possível enviar a logo.") });
    } finally {
      setUploading(false);
    }
  }

  async function handlePortfolioFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setNotice(null);
    setUploading(true);
    try {
      const photo = await myCompanyApi.uploadPortfolio(file);
      setCompany((c) =>
        c ? { ...c, portfolio_photos: [...(c.portfolio_photos ?? []), photo] } : c,
      );
    } catch (err) {
      setNotice({ kind: "error", text: errorMessage(err, "Não foi possível enviar o arquivo.") });
    } finally {
      setUploading(false);
    }
  }

  async function handlePortfolioLink() {
    const url = videoLink.trim();
    if (!url) return;
    setNotice(null);
    setUploading(true);
    try {
      const photo = await myCompanyApi.addPortfolioLink(url);
      setCompany((c) =>
        c ? { ...c, portfolio_photos: [...(c.portfolio_photos ?? []), photo] } : c,
      );
      setVideoLink("");
    } catch (err) {
      setNotice({ kind: "error", text: errorMessage(err, "Não foi possível adicionar o vídeo.") });
    } finally {
      setUploading(false);
    }
  }

  async function handleDeletePortfolio(id: string) {
    setNotice(null);
    setUploading(true);
    try {
      await myCompanyApi.deletePortfolio(id);
      setCompany((c) =>
        c ? { ...c, portfolio_photos: (c.portfolio_photos ?? []).filter((p) => p.id !== id) } : c,
      );
    } catch (err) {
      setNotice({ kind: "error", text: errorMessage(err, "Não foi possível remover o item.") });
    } finally {
      setUploading(false);
    }
  }

  const portfolio = company?.portfolio_photos ?? [];
  const tier = tierLabel(company?.cert_tier);
  const busy = saving || uploading;

  return (
    <main className="auth-shell">
      <div className="auth-shell-inner">
        <div className="auth-topbar">
          <Link href="/" className="auth-back" aria-label="Voltar para o início">
            <Icon.ChevLeft size={16} />
          </Link>
          <div className="auth-topbar-right">
            {company && (
              <Link href={`/empresa/${company.id}`} className="auth-tertiary-link">
                Ver minha página
              </Link>
            )}
            <button type="button" className="auth-tertiary-link" onClick={logout}>
              Sair
            </button>
          </div>
        </div>

        <BrandLockup />

        <div className="auth-card">
          <div className="auth-eyebrow">Minha empresa</div>
          <h1 className="auth-title">
            {company ? company.name : <>Sua <em>empresa</em></>}
          </h1>

          {loadError && (
            <div className="auth-error" role="alert">
              <Icon.Sparkle size={14} />
              <span>{loadError}</span>
            </div>
          )}

          {!company && !loadError && (
            <p className="auth-subtitle">
              <span className="auth-spinner" aria-hidden /> Carregando…
            </p>
          )}

          {company && (
            <>
              {tier ? (
                <div className="auth-note">
                  <Icon.Award size={16} />
                  <span>
                    Sua empresa tem o <strong>Certificado {tier}</strong> do Achadinhos.
                  </span>
                </div>
              ) : (
                <div className="auth-note">
                  <Icon.Sparkle size={16} />
                  <span>
                    Sua empresa está no site <strong>sem selo de certificação</strong>. Ganhe
                    destaque e a confiança dos síndicos com a{" "}
                    <Link href="/certificacao">Certificação Achadinhos</Link> — veja os{" "}
                    <Link href="/planos">planos Blue, Top e Black</Link>.
                  </span>
                </div>
              )}

              {notice && (
                <div
                  className={notice.kind === "error" ? "auth-error" : "auth-success"}
                  role={notice.kind === "error" ? "alert" : "status"}
                >
                  {notice.kind === "error" ? <Icon.Sparkle size={14} /> : <Icon.Check size={14} />}
                  <span>{notice.text}</span>
                </div>
              )}

              {/* Pedidos de orçamento recebidos (spec: notificação para o fornecedor) */}
              <section className="my-quotes-received" id="pedidos" aria-label="Pedidos de orçamento recebidos">
                <div className="auth-label">
                  Pedidos de orçamento{" "}
                  <span className="auth-label-hint">({quotes?.length ?? 0})</span>
                </div>
                {quotes === null ? (
                  <p className="auth-subtitle" style={{ margin: 0 }}>
                    <span className="auth-spinner" aria-hidden /> Carregando pedidos…
                  </p>
                ) : quotes.length === 0 ? (
                  <p className="auth-subtitle" style={{ margin: 0 }}>
                    Nenhum pedido recebido ainda. Quando um síndico pedir orçamento para a sua
                    empresa, ele aparece aqui — e você recebe uma notificação.
                  </p>
                ) : (
                  <ul className="my-quotes-received-list">
                    {quotes.map((qq) => (
                      <li key={qq.id} className="my-quote-received-item">
                        <div className="my-quote-received-head">
                          <strong>{qq.service}</strong>
                          <span className={`quote-status-pill ${qq.status}`}>
                            {qq.status === "enviado" ? "Enviado" : qq.status === "respondido" ? "Respondido" : "Fechado"}
                          </span>
                        </div>
                        <p className="my-quote-received-need">{qq.need}</p>
                        <div className="my-quote-received-meta">
                          {qq.requester.name} · {formatPhone(qq.requester.phone)} ·{" "}
                          {new Date(qq.created_at).toLocaleDateString("pt-BR")}
                          {qq.photos > 0 ? ` · ${qq.photos} foto${qq.photos === 1 ? "" : "s"}` : ""}
                        </div>
                        {qq.status !== "fechado" && (
                          <div className="my-quote-received-actions">
                            {qq.status === "enviado" && (
                              <button
                                type="button"
                                className="my-company-btn"
                                disabled={quoteBusy === qq.id}
                                onClick={() => handleQuoteStatus(qq.id, "respondido")}
                              >
                                Marcar como respondido
                              </button>
                            )}
                            <button
                              type="button"
                              className="my-company-btn my-company-btn--gold"
                              disabled={quoteBusy === qq.id}
                              onClick={() => handleQuoteStatus(qq.id, "fechado")}
                            >
                              Fechar pedido
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Logo */}
              <div className="my-company-logo">
                <div className="my-company-logo-img">
                  {company.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={getImageUrl(company.logo_url)} alt={`Logo de ${company.name}`} />
                  ) : (
                    <span>{company.avatar || company.name.charAt(0)}</span>
                  )}
                </div>
                <div className="my-company-logo-side">
                  <div className="auth-label">Logo</div>
                  <button
                    type="button"
                    className="my-company-btn"
                    onClick={() => logoInput.current?.click()}
                    disabled={busy}
                  >
                    {company.logo_url ? "Trocar logo" : "Enviar logo"}
                  </button>
                  <span className="auth-label-hint">JPG, PNG ou WebP até 5 MB. Quadrada fica melhor.</span>
                  <input
                    ref={logoInput}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    onChange={handleLogo}
                  />
                </div>
              </div>

              <form className="auth-form" onSubmit={handleSave} noValidate>
                <EmpresaFields
                  value={fields}
                  onChange={setFields}
                  errors={fieldErrors}
                  disabled={busy}
                />
                <button type="submit" className="auth-cta" disabled={busy} aria-busy={saving}>
                  {saving ? (
                    <>
                      <span className="auth-spinner" aria-hidden />
                      Salvando…
                    </>
                  ) : (
                    <>Salvar dados</>
                  )}
                </button>
              </form>

              {/* Portfólio */}
              <div className="my-company-portfolio">
                <div className="auth-label">
                  Portfólio{" "}
                  <span className="auth-label-hint">
                    ({portfolio.length}/{MAX_PORTFOLIO} · fotos, PDF ou vídeo)
                  </span>
                </div>
                <div className="my-company-portfolio-grid">
                  {portfolio.map((p) => (
                    <div key={p.id} className="my-company-portfolio-item">
                      {isPdf(p.url) || isVideo(p.url) ? (
                        <a href={getImageUrl(p.url)} target="_blank" rel="noreferrer" className="my-company-portfolio-file">
                          {isPdf(p.url) ? "PDF" : <Icon.Play size={20} />}
                        </a>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={getImageUrl(p.url)} alt="" />
                      )}
                      <button
                        type="button"
                        className="my-company-portfolio-del"
                        onClick={() => handleDeletePortfolio(p.id)}
                        disabled={busy}
                        aria-label="Remover do portfólio"
                      >
                        <Icon.Trash size={14} />
                      </button>
                    </div>
                  ))}
                  {portfolio.length < MAX_PORTFOLIO && (
                    <button
                      type="button"
                      className="my-company-portfolio-add"
                      onClick={() => portfolioInput.current?.click()}
                      disabled={busy}
                    >
                      <Icon.Plus size={20} />
                      <span>Adicionar</span>
                    </button>
                  )}
                </div>
                <input
                  ref={portfolioInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4,video/webm,video/quicktime"
                  hidden
                  onChange={handlePortfolioFile}
                />
                {portfolio.length < MAX_PORTFOLIO && (
                  <div className="auth-row-fields" style={{ marginTop: 10 }}>
                    <div className="auth-input-wrap" style={{ flex: 1 }}>
                      <span className="auth-input-icon"><Icon.YouTube size={18} /></span>
                      <input
                        className="auth-input"
                        type="url"
                        placeholder="Link de vídeo do YouTube ou Vimeo"
                        aria-label="Link de vídeo"
                        value={videoLink}
                        onChange={(e) => setVideoLink(e.target.value)}
                        disabled={busy}
                      />
                    </div>
                    <button
                      type="button"
                      className="my-company-btn"
                      onClick={handlePortfolioLink}
                      disabled={busy || !videoLink.trim()}
                    >
                      Adicionar
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
