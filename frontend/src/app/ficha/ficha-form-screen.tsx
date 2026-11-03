"use client";

import { BrandSignature } from "@/components/brand-signature";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  fichasApi,
  ApiError,
  type FichaCadastro,
  type FichaFillPayload,
} from "@/lib/api";
import { Icon } from "@/components/icons";
import { useViaCEP } from "@/hooks/use-via-cep";
import { formatCEP, stripCEP } from "@/lib/cep";
import { formatDocument } from "@/lib/document";
import { formatPhone } from "@/lib/phone";

type Status = "loading" | "ready" | "done" | "invalid";

// Máscara de data DD/MM/AAAA a partir dos dígitos digitados.
function maskDate(v: string): string {
  const d = (v ?? "").replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

const EMPTY: FichaFillPayload = {
  resp_cpf: "",
  resp_nascimento: "",
  resp_endereco: "",
  resp_telefone: "",
  resp_cargo: "",
  razao_social: "",
  cnpj: "",
  empresa_endereco: "",
  instagram: "",
  facebook: "",
  linkedin: "",
  tiktok: "",
  site: "",
  observacoes: "",
};

export function FichaFormScreen() {
  const [status, setStatus] = useState<Status>("loading");
  const [token, setToken] = useState<string>("");
  const [ficha, setFicha] = useState<FichaCadastro | null>(null);
  const [form, setForm] = useState<FichaFillPayload>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // CEP: um lookup por endereço (responsável e empresa), cada um com seu spinner.
  const respCepApi = useViaCEP();
  const empresaCepApi = useViaCEP();
  const [respCep, setRespCep] = useState("");
  const [empresaCep, setEmpresaCep] = useState("");

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token") ?? "";
    setToken(t);
    if (!t) {
      setStatus("invalid");
      return;
    }
    let alive = true;
    (async () => {
      try {
        const f = await fichasApi.getByToken(t);
        if (!alive) return;
        setFicha(f);
        setStatus(f.status === "concluido" ? "done" : "ready");
      } catch {
        if (alive) setStatus("invalid");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  function update<K extends keyof FichaFillPayload>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Consulta o CEP e preenche o campo de endereço correspondente com
  // "rua, bairro, cidade - UF"; o usuário completa número/complemento.
  async function lookupEndereco(kind: "resp" | "empresa", rawCep: string) {
    if (stripCEP(rawCep).length !== 8) return;
    const api = kind === "resp" ? respCepApi : empresaCepApi;
    const res = await api.lookup(rawCep);
    if (!res) return;
    const cidadeUf = res.localidade
      ? `${res.localidade}${res.uf ? ` - ${res.uf}` : ""}`
      : res.uf;
    const endereco = [res.logradouro, res.bairro, cidadeUf].filter(Boolean).join(", ");
    if (endereco) update(kind === "resp" ? "resp_endereco" : "empresa_endereco", endereco);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await fichasApi.submit(token, form);
      setStatus("done");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível enviar a ficha.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-shell-inner">
        <div className="auth-topbar">
          <Link href="/" className="auth-back" aria-label="Voltar para o início">
            <Icon.ChevLeft size={16} />
          </Link>
          <div className="auth-topbar-right">
            <Link href="/" className="auth-tertiary-link">
              Início
            </Link>
          </div>
        </div>

        <div className="ficha-logo-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <BrandSignature className="ficha-logo" tone="ink" />
          <span className="ficha-logo-cap">Ficha de cadastro</span>
        </div>

        {status === "loading" && (
          <div className="auth-card">
            <p className="auth-subtitle">Carregando ficha…</p>
          </div>
        )}

        {status === "invalid" && (
          <div className="auth-card">
            <div className="ficha-state">
              <Icon.Lock size={28} />
              <h1 className="auth-title">Link inválido</h1>
              <p className="auth-subtitle">
                Este link de cadastro não é válido ou expirou. Peça um novo link
                ao administrador.
              </p>
            </div>
          </div>
        )}

        {status === "done" && (
          <div className="auth-card">
            <div className="ficha-state">
              <span className="ficha-state-check">
                <Icon.Check size={26} />
              </span>
              <h1 className="auth-title">Cadastro concluído!</h1>
              <p className="auth-subtitle">
                Recebemos os dados da sua empresa. Obrigado{ficha?.responsavel_nome ? `, ${ficha.responsavel_nome.split(" ")[0]}` : ""}!
              </p>
            </div>
          </div>
        )}

        {status === "ready" && ficha && (
          <div className="auth-card">
            <div className="auth-eyebrow">Achadinhos do Condomínio</div>
            <h1 className="auth-title">
              Ficha de <em>cadastro</em>
            </h1>
            <p className="auth-subtitle">
              Olá{ficha.responsavel_nome ? `, ${ficha.responsavel_nome.split(" ")[0]}` : ""}! Complete os dados do responsável e
              da sua empresa.
            </p>

            {error && (
              <div className="auth-error" role="alert">
                <Icon.Sparkle size={14} />
                <span>{error}</span>
              </div>
            )}

            <form className="ficha-form" onSubmit={handleSubmit}>
              <div className="ficha-form-section">Dados do responsável do contato</div>

              <div className="prof-field">
                <label className="prof-label">Nome</label>
                <input className="prof-input" type="text" value={ficha.responsavel_nome} readOnly />
              </div>
              <div className="prof-field">
                <label className="prof-label">E-mail do responsável</label>
                <input className="prof-input" type="email" value={ficha.responsavel_email} readOnly />
              </div>
              <div className="prof-field">
                <label className="prof-label">CPF</label>
                <input
                  className="prof-input"
                  type="text"
                  inputMode="numeric"
                  value={form.resp_cpf}
                  maxLength={14}
                  onChange={(e) => update("resp_cpf", formatDocument(e.target.value, "cpf"))}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="prof-field">
                <label className="prof-label">Data de nascimento</label>
                <input
                  className="prof-input"
                  type="text"
                  value={form.resp_nascimento}
                  inputMode="numeric"
                  maxLength={10}
                  onChange={(e) => update("resp_nascimento", maskDate(e.target.value))}
                  placeholder="DD/MM/AAAA"
                />
              </div>
              <div className="prof-field">
                <label className="prof-label">CEP</label>
                <div className="prof-input-row">
                  <input
                    className="prof-input"
                    type="text"
                    inputMode="numeric"
                    value={respCep}
                    onChange={(e) => {
                      const v = formatCEP(e.target.value);
                      setRespCep(v);
                      if (stripCEP(v).length === 8) void lookupEndereco("resp", v);
                    }}
                    onBlur={() => void lookupEndereco("resp", respCep)}
                    placeholder="00000-000"
                    style={{ flex: 1 }}
                  />
                  {respCepApi.loading && <span className="prof-cep-spin" aria-hidden />}
                </div>
              </div>
              <div className="prof-field">
                <label className="prof-label">Endereço</label>
                <input
                  className="prof-input"
                  type="text"
                  value={form.resp_endereco}
                  onChange={(e) => update("resp_endereco", e.target.value)}
                  placeholder="Rua, número, bairro, cidade"
                />
              </div>
              <div className="prof-field">
                <label className="prof-label">Telefone</label>
                <input
                  className="prof-input"
                  type="text"
                  inputMode="tel"
                  value={form.resp_telefone}
                  maxLength={16}
                  onChange={(e) => update("resp_telefone", formatPhone(e.target.value))}
                  placeholder="(11) 99999-0000"
                />
              </div>
              <div className="prof-field">
                <label className="prof-label">Cargo / Função</label>
                <input
                  className="prof-input"
                  type="text"
                  value={form.resp_cargo}
                  onChange={(e) => update("resp_cargo", e.target.value)}
                  placeholder="Ex: Diretor comercial"
                />
              </div>

              <div className="ficha-form-section">Dados da empresa</div>

              <div className="prof-field">
                <label className="prof-label">Razão social</label>
                <input
                  className="prof-input"
                  type="text"
                  value={form.razao_social}
                  onChange={(e) => update("razao_social", e.target.value)}
                  placeholder="Nome da empresa"
                />
              </div>
              <div className="prof-field">
                <label className="prof-label">CNPJ</label>
                <input
                  className="prof-input"
                  type="text"
                  inputMode="numeric"
                  value={form.cnpj}
                  maxLength={18}
                  onChange={(e) => update("cnpj", formatDocument(e.target.value, "cnpj"))}
                  placeholder="00.000.000/0001-00"
                />
              </div>
              <div className="prof-field">
                <label className="prof-label">CEP</label>
                <div className="prof-input-row">
                  <input
                    className="prof-input"
                    type="text"
                    inputMode="numeric"
                    value={empresaCep}
                    onChange={(e) => {
                      const v = formatCEP(e.target.value);
                      setEmpresaCep(v);
                      if (stripCEP(v).length === 8) void lookupEndereco("empresa", v);
                    }}
                    onBlur={() => void lookupEndereco("empresa", empresaCep)}
                    placeholder="00000-000"
                    style={{ flex: 1 }}
                  />
                  {empresaCepApi.loading && <span className="prof-cep-spin" aria-hidden />}
                </div>
              </div>
              <div className="prof-field">
                <label className="prof-label">Endereço</label>
                <input
                  className="prof-input"
                  type="text"
                  value={form.empresa_endereco}
                  onChange={(e) => update("empresa_endereco", e.target.value)}
                  placeholder="Endereço da empresa"
                />
              </div>
              <div className="prof-field">
                <label className="prof-label">Instagram</label>
                <input
                  className="prof-input"
                  type="text"
                  value={form.instagram}
                  onChange={(e) => update("instagram", e.target.value)}
                  placeholder="@suaempresa"
                />
              </div>
              <div className="prof-field">
                <label className="prof-label">Facebook</label>
                <input
                  className="prof-input"
                  type="text"
                  value={form.facebook}
                  onChange={(e) => update("facebook", e.target.value)}
                  placeholder="facebook.com/suaempresa"
                />
              </div>
              <div className="prof-field">
                <label className="prof-label">LinkedIn</label>
                <input
                  className="prof-input"
                  type="text"
                  value={form.linkedin}
                  onChange={(e) => update("linkedin", e.target.value)}
                  placeholder="linkedin.com/company/suaempresa"
                />
              </div>
              <div className="prof-field">
                <label className="prof-label">TikTok</label>
                <input
                  className="prof-input"
                  type="text"
                  value={form.tiktok}
                  onChange={(e) => update("tiktok", e.target.value)}
                  placeholder="tiktok.com/@suaempresa"
                />
              </div>
              <div className="prof-field">
                <label className="prof-label">Site</label>
                <input
                  className="prof-input"
                  type="text"
                  value={form.site}
                  onChange={(e) => update("site", e.target.value)}
                  placeholder="www.suaempresa.com.br"
                />
              </div>
              <div className="ficha-form-section">Observações</div>
              <div className="prof-field">
                <textarea
                  className="prof-textarea"
                  rows={4}
                  value={form.observacoes}
                  onChange={(e) => update("observacoes", e.target.value)}
                  placeholder="Informações adicionais (opcional)"
                />
              </div>

              <button type="submit" className="auth-cta" disabled={submitting}>
                {submitting ? "Enviando…" : "Enviar cadastro"}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
