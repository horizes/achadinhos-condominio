"use client";

import { publicAsset } from "@/lib/site-path";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  adminApi,
  ApiError,
  type AdminSeller,
  type ApiProvider,
  type ApiCertificate,
  type CertTipo,
  type CertTier,
} from "@/lib/api";
import { CertSeal } from "@/components/cert-seal";
import { Icon } from "@/components/icons";
import { cn, tierLabel } from "@/lib/utils";
import { SignaturePad } from "@/components/admin/signature-pad";
import { CertificateViewer } from "@/components/certificate/certificate-viewer";

// "AAAA-MM-DD" da data de hoje (no fuso local).
function todayISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// hoje + 12 meses, em "AAAA-MM-DD".
function inOneYearISO(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function formatDateBR(iso: string): string {
  const ymd = (iso ?? "").slice(0, 10);
  const [y, m, d] = ymd.split("-");
  if (!y || !m || !d) return ymd;
  return `${d}/${m}/${y}`;
}

type CertStatus = { label: string; tone: "ok" | "warn" | "danger" };

function statusOf(cert: ApiCertificate): CertStatus {
  if (cert.revoked) return { label: "Revogado", tone: "danger" };
  const today = todayISO();
  if (cert.valid_until.slice(0, 10) < today) return { label: "Vencido", tone: "warn" };
  return { label: "Ativo", tone: "ok" };
}

interface FormState {
  tipo: CertTipo;
  owner_id: string;
  tier: CertTier;
  responsavel_nome: string;
  responsavel_cpf: string;
  issued_at: string;
  valid_until: string;
}

function emptyForm(): FormState {
  return {
    tipo: "empresa",
    owner_id: "",
    tier: "ouro",
    responsavel_nome: "",
    responsavel_cpf: "",
    issued_at: todayISO(),
    valid_until: inOneYearISO(),
  };
}

const TIPO_OPTIONS: ReadonlyArray<{ v: CertTipo; l: string }> = [
  { v: "empresa", l: "Empresa" },
  { v: "afiliado", l: "Afiliado de serviço" },
];

const TIER_OPTIONS: ReadonlyArray<{ v: CertTier; l: string }> = [
  { v: "blue", l: "Blue" },
  { v: "ouro", l: "Top" },
  { v: "black", l: "Black" },
];

export function CertificadosSection() {
  const [certs, setCerts] = useState<ApiCertificate[]>([]);
  const [sellers, setSellers] = useState<AdminSeller[]>([]);
  const [providers, setProviders] = useState<ApiProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [signature, setSignature] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ blob: Blob; fileName: string } | null>(null);
  // Certificado exibido no painel "Prévia do selo" (clicado na tabela).
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [c, s, p] = await Promise.all([
        adminApi.listCertificates(),
        adminApi.listSellers(),
        adminApi.listProviders(),
      ]);
      setCerts(c);
      setSellers(s);
      setProviders(p);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Lista de titulares (empresas ou afiliados) conforme o tipo selecionado, e
  // um índice id -> {name, categoria} para o help da categoria.
  const owners = form.tipo === "empresa" ? sellers : providers;
  const ownersById = useMemo(() => {
    const map = new Map<string, { name: string; categoria?: string }>();
    for (const s of sellers) map.set(s.id, { name: s.name, categoria: s.category?.label });
    for (const p of providers) map.set(p.id, { name: p.name, categoria: p.category?.label });
    return map;
  }, [sellers, providers]);

  function openCreate() {
    setForm(emptyForm());
    setSignature(null);
    setFormError(null);
    setFormOpen(true);
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Trocar o tipo limpa o titular selecionado (a lista de opções muda).
  function selectTipo(t: CertTipo) {
    setForm((prev) => ({ ...prev, tipo: t, owner_id: "" }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.owner_id) {
      setFormError(form.tipo === "empresa" ? "Selecione a empresa." : "Selecione o afiliado.");
      return;
    }
    if (form.responsavel_nome.trim().length < 2) {
      setFormError("Informe o nome do responsável.");
      return;
    }
    if (!form.issued_at || !form.valid_until) {
      setFormError("Informe as datas de emissão e validade.");
      return;
    }
    if (form.valid_until < form.issued_at) {
      setFormError("A validade não pode ser anterior à emissão.");
      return;
    }
    setSubmitting(true);
    try {
      const cert = await adminApi.createCertificate({
        tipo: form.tipo,
        owner_id: form.owner_id,
        tier: form.tier,
        responsavel_nome: form.responsavel_nome.trim(),
        responsavel_cpf: form.responsavel_cpf.trim() || undefined,
        issued_at: form.issued_at,
        valid_until: form.valid_until,
        signature_png: signature ?? undefined,
      });
      setFormOpen(false);
      // Gera o PDF na hora (assinatura ainda em memória) e abre o preview.
      const { buildCertificateBlob, certificateFileName } = await import(
        "@/components/certificate/generate"
      );
      const blob = await buildCertificateBlob({
        tipo: cert.tipo,
        tier: cert.tier,
        empresaNome: cert.empresa_nome,
        categoria: cert.categoria,
        responsavelNome: cert.responsavel_nome,
        code: cert.code,
        issuedAt: cert.issued_at,
        validUntil: cert.valid_until,
        signatureDataUrl: signature,
      });
      setPreview({ blob, fileName: certificateFileName(cert.empresa_nome, cert.code) });
      await refresh();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Não foi possível emitir o certificado.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleView(cert: ApiCertificate) {
    setBusyId(cert.id);
    try {
      const { buildCertificateBlob, certificateFileName } = await import(
        "@/components/certificate/generate"
      );
      const blob = await buildCertificateBlob({
        tipo: cert.tipo,
        tier: cert.tier,
        empresaNome: cert.empresa_nome,
        categoria: cert.categoria,
        responsavelNome: cert.responsavel_nome,
        code: cert.code,
        issuedAt: cert.issued_at,
        validUntil: cert.valid_until,
        signatureUrl: cert.signature_url || undefined,
      });
      setPreview({ blob, fileName: certificateFileName(cert.empresa_nome, cert.code) });
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Não foi possível gerar o PDF.");
    } finally {
      setBusyId(null);
    }
  }

  function handleVerify(cert: ApiCertificate) {
    window.open(publicAsset(`/verificar/?c=${encodeURIComponent(cert.code)}`), "_blank", "noopener");
  }

  async function handleToggleRevoke(cert: ApiCertificate) {
    const next = !cert.revoked;
    if (next && !window.confirm(`Revogar o certificado de "${cert.empresa_nome}"?`)) return;
    setBusyId(cert.id);
    try {
      await adminApi.revokeCertificate(cert.id, next);
      await refresh();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : "Não foi possível atualizar.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(cert: ApiCertificate) {
    if (!window.confirm(`Excluir o certificado de "${cert.empresa_nome}"? Esta ação não pode ser desfeita.`))
      return;
    setBusyId(cert.id);
    try {
      await adminApi.deleteCertificate(cert.id);
      await refresh();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : "Não foi possível excluir.");
    } finally {
      setBusyId(null);
    }
  }

  const selectedOwner = form.owner_id ? ownersById.get(form.owner_id) : undefined;

  // Certificado da prévia: o selecionado na tabela ou o último emitido.
  const previewCert = useMemo(() => {
    if (certs.length === 0) return null;
    if (selectedId) {
      const found = certs.find((c) => c.id === selectedId);
      if (found) return found;
    }
    return [...certs].sort((a, b) =>
      (b.created_at ?? b.issued_at).localeCompare(a.created_at ?? a.issued_at),
    )[0];
  }, [certs, selectedId]);

  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <div>
          <h2 className="admin-section-title">Certificados</h2>
          <p className="admin-section-sub">{certs.length} certificado(s) emitido(s)</p>
        </div>
        {!formOpen && (
          <button type="button" className="admin-new-btn" onClick={openCreate}>
            <Icon.Plus size={16} />
            Emitir certificado
          </button>
        )}
      </div>

      {formOpen && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form-title">Emitir certificado</div>
          {formError && <div className="prof-alert error" role="alert">{formError}</div>}

          {/* Tipo de titular */}
          <div className="prof-field">
            <label className="prof-label">Tipo</label>
            <div className="auth-seg-group">
              {TIPO_OPTIONS.map(({ v, l }) => (
                <button
                  key={v}
                  type="button"
                  className={cn("auth-seg-btn", form.tipo === v && "active")}
                  onClick={() => selectTipo(v)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Nível do certificado */}
          <div className="prof-field">
            <label className="prof-label">Nível</label>
            <div className="auth-seg-group">
              {TIER_OPTIONS.map(({ v, l }) => (
                <button
                  key={v}
                  type="button"
                  className={cn("auth-seg-btn", form.tier === v && "active")}
                  onClick={() => update("tier", v)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="prof-field">
            <label className="prof-label">{form.tipo === "empresa" ? "Empresa" : "Afiliado"}</label>
            <select
              className={cn("prof-input", form.owner_id && "filled")}
              value={form.owner_id}
              onChange={(e) => update("owner_id", e.target.value)}
            >
              <option value="">
                {form.tipo === "empresa"
                  ? "Selecione a empresa cadastrada…"
                  : "Selecione o afiliado cadastrado…"}
              </option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                  {o.category?.label ? ` — ${o.category.label}` : ""}
                </option>
              ))}
            </select>
            {selectedOwner?.categoria && (
              <span className="prof-help">Categoria/segmento: {selectedOwner.categoria}</span>
            )}
          </div>

          <div className="prof-row-fields">
            <div className="prof-field">
              <label className="prof-label">Responsável</label>
              <input
                className="prof-input"
                type="text"
                value={form.responsavel_nome}
                onChange={(e) => update("responsavel_nome", e.target.value)}
                placeholder="Nome de quem assina"
              />
            </div>
            <div className="prof-field">
              <label className="prof-label">CPF do responsável</label>
              <input
                className="prof-input"
                type="text"
                inputMode="numeric"
                maxLength={14}
                value={form.responsavel_cpf}
                onChange={(e) => update("responsavel_cpf", e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>
          </div>

          <div className="prof-row-fields">
            <div className="prof-field">
              <label className="prof-label">Data de emissão</label>
              <div className="prof-native">
                <input
                  className={cn("prof-input", form.issued_at && "filled")}
                  type="date"
                  value={form.issued_at}
                  onChange={(e) => update("issued_at", e.target.value)}
                />
                {!form.issued_at && <span className="prof-native-ph">dd/mm/aaaa</span>}
              </div>
            </div>
            <div className="prof-field">
              <label className="prof-label">Válido até</label>
              <div className="prof-native">
                <input
                  className={cn("prof-input", form.valid_until && "filled")}
                  type="date"
                  value={form.valid_until}
                  onChange={(e) => update("valid_until", e.target.value)}
                />
                {!form.valid_until && <span className="prof-native-ph">dd/mm/aaaa</span>}
              </div>
            </div>
          </div>

          <div className="prof-field">
            <label className="prof-label">Assinatura do responsável</label>
            <SignaturePad onChange={setSignature} />
          </div>

          <div className="admin-form-actions">
            <button type="button" className="admin-new-btn ghost" onClick={() => setFormOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="admin-new-btn" disabled={submitting}>
              <Icon.Award size={16} />
              {submitting ? "Emitindo…" : "Emitir e ver PDF"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="admin-empty">Carregando…</div>
      ) : loadError ? (
        <div className="prof-alert error" role="alert">{loadError}</div>
      ) : certs.length === 0 ? (
        <div className="admin-empty">Nenhum certificado emitido ainda.</div>
      ) : (
        <div className="admin-cert-layout">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Titular</th>
                  <th scope="col">Nível</th>
                  <th scope="col">Validade</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="admin-table-col-actions">Ações</th>
                </tr>
              </thead>
              <tbody>
                {certs.map((cert) => {
                  const st = statusOf(cert);
                  const busy = busyId === cert.id;
                  return (
                    <tr
                      key={cert.id}
                      className={cn(
                        "admin-cert-row",
                        previewCert?.id === cert.id && "selected",
                      )}
                      onClick={() => setSelectedId(cert.id)}
                    >
                      <td>
                        <div className="admin-table-product-name">{cert.empresa_nome}</div>
                        <span className="admin-table-code">{cert.code}</span>
                      </td>
                      <td>
                        <CertSeal tier={cert.tier} linked={false} />
                      </td>
                      <td>{formatDateBR(cert.valid_until)}</td>
                      <td>
                        <span className={cn("cert-badge", st.tone)}>{st.label}</span>
                      </td>
                      <td className="admin-table-col-actions">
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="admin-icon-btn"
                            onClick={() => handleView(cert)}
                            disabled={busy}
                            aria-label="Ver / baixar PDF"
                            title="Ver / baixar PDF"
                          >
                            <Icon.Download size={15} />
                          </button>
                          <button
                            type="button"
                            className="admin-icon-btn"
                            onClick={() => handleVerify(cert)}
                            aria-label="Abrir verificação"
                            title="Abrir página de verificação"
                          >
                            <Icon.QrCode size={15} />
                          </button>
                          <button
                            type="button"
                            className="admin-icon-btn"
                            onClick={() => handleToggleRevoke(cert)}
                            disabled={busy}
                            aria-label={cert.revoked ? "Reativar" : "Revogar"}
                            title={cert.revoked ? "Reativar certificado" : "Revogar certificado"}
                          >
                            {cert.revoked ? <Icon.Check size={15} /> : <Icon.Lock size={15} />}
                          </button>
                          <button
                            type="button"
                            className="admin-icon-btn danger"
                            onClick={() => handleDelete(cert)}
                            disabled={busy}
                            aria-label="Excluir"
                            title="Excluir"
                          >
                            <Icon.Trash size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Prévia do selo — certificado selecionado ou o último emitido */}
          <aside className="admin-cert-preview" aria-label="Prévia do selo">
            <div className="admin-cert-preview-label">Prévia do selo</div>
            {previewCert ? (
              <>
                <div className="admin-cert-preview-seal" aria-hidden="true">
                  <Icon.Award size={38} />
                  <span className="admin-cert-preview-tier">{tierLabel(previewCert.tier)}</span>
                </div>
                <div className="admin-cert-preview-name">{previewCert.empresa_nome}</div>
                <div className="admin-cert-preview-sub">
                  <CertSeal tier={previewCert.tier} linked={false} />
                  <span className="admin-cert-preview-code">{previewCert.code}</span>
                </div>
                <div className="admin-cert-preview-brand">Achadinhos</div>
              </>
            ) : (
              <div className="admin-cert-preview-empty">
                Emita um certificado para ver a prévia do selo.
              </div>
            )}
          </aside>
        </div>
      )}

      {preview && (
        <CertificateViewer
          blob={preview.blob}
          fileName={preview.fileName}
          onClose={() => setPreview(null)}
        />
      )}
    </section>
  );
}
