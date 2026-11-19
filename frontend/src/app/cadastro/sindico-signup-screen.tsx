"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { getInviteRef } from "@/lib/invite-ref";
import { useAuth, type RegisterSindicoPayload } from "@/contexts/auth-context";
import { Icon } from "@/components/icons";
import { BrandLockup } from "@/components/auth/brand-lockup";
import { cn } from "@/lib/utils";
import { formatCPF, formatCNPJ, isValidCPF, isValidCNPJ, stripDocument } from "@/lib/document";
import { formatPhone, isValidPhone, stripPhone } from "@/lib/phone";
import { formatCEP, isValidCEP, stripCEP } from "@/lib/cep";
import { useViaCEP } from "@/hooks/use-via-cep";

export type AccountKind = "pessoa" | "empresa";

interface FormState {
  accountType: AccountKind;
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
  cpf: string;
  cnpj: string;
  companyName: string;
  phone: string;
  condoName: string;
  condoRole: "morador" | "sindico" | "conselho" | "";
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  accepted: boolean;
}

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  passwordConfirm?: string;
  cpf?: string;
  cnpj?: string;
  companyName?: string;
  phone?: string;
  condoName?: string;
  condoRole?: string;
  cep?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  accepted?: string;
}

const CONDO_ROLES: Array<{ id: "morador" | "sindico" | "conselho"; label: string }> = [
  { id: "morador", label: "Morador" },
  { id: "sindico", label: "Síndico" },
  { id: "conselho", label: "Conselho" },
];

interface SindicoSignupScreenProps {
  /** Modo inicial vindo da tela de escolha (/cadastro). */
  initialAccountType?: AccountKind;
  /** Papel já marcado no condomínio (ex.: /cadastro/sindico chega em "sindico"). */
  initialCondoRole?: FormState["condoRole"];
  /** Quando presente, o botão de voltar retorna à tela de escolha. */
  onBack?: () => void;
}

export function SindicoSignupScreen({
  initialAccountType,
  initialCondoRole,
  onBack,
}: SindicoSignupScreenProps = {}) {
  const router = useRouter();
  const { registerSindico, isAuthenticated, isLoading } = useAuth();
  const { lookup: lookupCEP, loading: cepLoading } = useViaCEP();
  const cepLookedRef = useRef<string>("");

  const [form, setForm] = useState<FormState>({
    accountType: initialAccountType ?? "pessoa",
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
    cpf: "",
    cnpj: "",
    companyName: "",
    phone: "",
    condoName: "",
    condoRole: initialCondoRole ?? "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    accepted: false,
  });
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCEPBlur() {
    const raw = stripCEP(form.cep);
    if (!isValidCEP(raw) || cepLookedRef.current === raw) return;
    cepLookedRef.current = raw;
    const result = await lookupCEP(raw);
    if (result) {
      setForm((prev) => ({
        ...prev,
        street: result.logradouro || prev.street,
        neighborhood: result.bairro || prev.neighborhood,
        city: result.localidade || prev.city,
        state: result.uf || prev.state,
        complement: result.complemento || prev.complement,
      }));
    }
  }

  function validate(): boolean {
    const next: FieldErrors = {};
    const isEmpresa = form.accountType === "empresa";
    if (!form.name.trim())
      next.name = isEmpresa ? "Informe o nome do responsável." : "Informe seu nome completo.";
    if (!form.email.trim()) next.email = "Informe um e-mail.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      next.email = "E-mail inválido.";
    if (!form.password) next.password = "Crie uma senha.";
    else if (form.password.length < 8) next.password = "Mínimo de 8 caracteres.";
    if (!form.passwordConfirm) next.passwordConfirm = "Confirme sua senha.";
    else if (form.password !== form.passwordConfirm)
      next.passwordConfirm = "As senhas não conferem.";
    if (isEmpresa) {
      if (!form.companyName.trim()) next.companyName = "Informe a razão social.";
      if (!form.cnpj) next.cnpj = "Informe o CNPJ.";
      else if (!isValidCNPJ(stripDocument(form.cnpj))) next.cnpj = "CNPJ inválido.";
    } else {
      if (!form.cpf) next.cpf = "Informe seu CPF.";
      else if (!isValidCPF(stripDocument(form.cpf))) next.cpf = "CPF inválido.";
    }
    if (!form.phone) next.phone = "Informe seu telefone.";
    else if (!isValidPhone(stripPhone(form.phone))) next.phone = "Telefone inválido.";
    if (!isEmpresa) {
      if (!form.condoName.trim()) next.condoName = "Informe o nome do condomínio.";
      if (!form.condoRole) next.condoRole = "Selecione seu papel no condomínio.";
    }
    if (!form.cep) next.cep = "Informe o CEP.";
    else if (!isValidCEP(stripCEP(form.cep))) next.cep = "CEP inválido (8 dígitos).";
    if (!form.street.trim()) next.street = "Informe a rua.";
    if (!form.number.trim()) next.number = "Informe o número.";
    if (!form.neighborhood.trim()) next.neighborhood = "Informe o bairro.";
    if (!form.city.trim()) next.city = "Informe a cidade.";
    if (!form.state.trim() || form.state.length !== 2) next.state = "UF inválida (2 letras).";
    if (!form.accepted) next.accepted = "Você precisa aceitar os termos.";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    const isEmpresa = form.accountType === "empresa";
    const payload: RegisterSindicoPayload = {
      account_type: form.accountType,
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      phone: stripPhone(form.phone),
      condo_name: form.condoName.trim(),
      address: {
        cep: stripCEP(form.cep),
        street: form.street.trim(),
        number: form.number.trim(),
        complement: form.complement.trim(),
        neighborhood: form.neighborhood.trim(),
        city: form.city.trim(),
        state: form.state.trim().toUpperCase(),
      },
    };
    if (isEmpresa) {
      payload.cnpj = stripDocument(form.cnpj);
      payload.company_name = form.companyName.trim();
    } else {
      payload.cpf = stripDocument(form.cpf);
      payload.condo_role = form.condoRole as "morador" | "sindico" | "conselho";
    }
    // Quem indicou este aparelho (?convite=<user-id>) — registrado no cadastro.
    payload.referral = getInviteRef();

    setSubmitting(true);
    try {
      await registerSindico(payload);
      router.replace("/");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setServerError("Esse e-mail, CPF ou CNPJ já tem uma conta. Tente entrar.");
        } else if (err.status === 422) {
          setServerError(err.message || "Confira os dados e tente novamente.");
        } else if (err.status === 0) {
          setServerError("Não consegui falar com o servidor. Verifique sua conexão.");
        } else {
          setServerError(err.message || "Não foi possível criar sua conta agora.");
        }
      } else {
        setServerError("Erro inesperado. Tente novamente.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-shell-inner">
        <div className="auth-topbar">
          {onBack ? (
            <button
              type="button"
              className="auth-back"
              onClick={onBack}
              aria-label="Voltar para a escolha do tipo de conta"
            >
              <Icon.ChevLeft size={16} />
            </button>
          ) : (
            <Link href="/" className="auth-back" aria-label="Voltar para o início">
              <Icon.ChevLeft size={16} />
            </Link>
          )}
          <div className="auth-topbar-right">
            <Link href="/" className="auth-tertiary-link">
              Início
            </Link>
            <Link className="auth-tertiary-link" href="/login">
              Já tem conta? <strong>Entrar</strong>
            </Link>
          </div>
        </div>

        <BrandLockup />

        <div className="auth-card">
          <div className="auth-eyebrow">
            {form.accountType === "empresa" ? "Administradora de condomínios" : "Síndico ou morador"}
          </div>
          <h1 className="auth-title">
            Crie sua <em>conta</em>
          </h1>
          <p className="auth-subtitle">
            Em menos de 2 minutos você já pode pedir orçamentos pros melhores
            afiliados da sua região.
          </p>

          {serverError && (
            <div className="auth-error" role="alert">
              <Icon.Sparkle size={14} />
              <span>{serverError}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Account type */}
            <div>
              <div className="auth-label">Tipo de conta</div>
              <div className="auth-seg-group" role="group" aria-label="Tipo de conta">
                {(
                  [
                    { id: "pessoa", label: "Síndico / Morador" },
                    { id: "empresa", label: "Administradora" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={cn("auth-seg-btn", form.accountType === t.id && "active")}
                    onClick={() => update("accountType", t.id)}
                    disabled={submitting}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Aviso da ficha de cadastro (handoff desktop, modo empresa) */}
            {form.accountType === "empresa" && (
              <div className="auth-note">
                <Icon.Sparkle size={16} />
                <span>
                  Após criar a conta, você recebe uma <strong>ficha de cadastro</strong>{" "}
                  para completar os dados da empresa e solicitar a certificação.
                </span>
              </div>
            )}

            {/* Razão social (empresa) */}
            {form.accountType === "empresa" && (
              <div>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><Icon.Building size={18} /></span>
                  <input
                    className={cn("auth-input", errors.companyName && "invalid")}
                    type="text"
                    placeholder="Razão social da administradora"
                    aria-label="Razão social"
                    value={form.companyName}
                    onChange={(e) => update("companyName", e.target.value)}
                    disabled={submitting}
                  />
                </div>
                {errors.companyName && <div className="auth-field-error" role="alert">{errors.companyName}</div>}
              </div>
            )}

            {/* Name */}
            <div>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><Icon.User size={18} /></span>
                <input
                  className={cn("auth-input", errors.name && "invalid")}
                  type="text"
                  autoComplete="name"
                  placeholder={
                    form.accountType === "empresa" ? "Nome do responsável" : "Seu nome completo"
                  }
                  aria-label={form.accountType === "empresa" ? "Nome do responsável" : "Nome completo"}
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  disabled={submitting}
                />
              </div>
              {errors.name && <div className="auth-field-error" role="alert">{errors.name}</div>}
            </div>

            {/* Email */}
            <div>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><Icon.AtSign size={18} /></span>
                <input
                  className={cn("auth-input", errors.email && "invalid")}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  aria-label="E-mail"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  disabled={submitting}
                />
              </div>
              {errors.email && <div className="auth-field-error" role="alert">{errors.email}</div>}
            </div>

            {/* Password */}
            <div>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><Icon.Lock size={18} /></span>
                <input
                  className={cn("auth-input has-suffix", errors.password && "invalid")}
                  type={showPwd ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Crie uma senha (mín. 8)"
                  aria-label="Senha"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  disabled={submitting}
                />
                <button
                  type="button"
                  className="auth-input-suffix"
                  onClick={() => setShowPwd((v) => !v)}
                  aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPwd ? <Icon.EyeOff size={18} /> : <Icon.Eye size={18} />}
                </button>
              </div>
              {errors.password && <div className="auth-field-error" role="alert">{errors.password}</div>}
            </div>

            {/* Password confirm */}
            <div>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><Icon.Lock size={18} /></span>
                <input
                  className={cn("auth-input", errors.passwordConfirm && "invalid")}
                  type={showPwd ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Confirme sua senha"
                  aria-label="Confirmar senha"
                  value={form.passwordConfirm}
                  onChange={(e) => update("passwordConfirm", e.target.value)}
                  disabled={submitting}
                />
              </div>
              {errors.passwordConfirm && <div className="auth-field-error" role="alert">{errors.passwordConfirm}</div>}
            </div>

            {/* CPF (pessoa) / CNPJ (empresa) */}
            {form.accountType === "empresa" ? (
              <div>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><Icon.Building size={18} /></span>
                  <input
                    className={cn("auth-input", errors.cnpj && "invalid")}
                    type="text"
                    inputMode="numeric"
                    placeholder="00.000.000/0000-00"
                    aria-label="CNPJ"
                    value={form.cnpj}
                    onChange={(e) => update("cnpj", formatCNPJ(e.target.value))}
                    disabled={submitting}
                    maxLength={18}
                  />
                </div>
                {errors.cnpj && <div className="auth-field-error" role="alert">{errors.cnpj}</div>}
              </div>
            ) : (
              <div>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><Icon.User size={18} /></span>
                  <input
                    className={cn("auth-input", errors.cpf && "invalid")}
                    type="text"
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    aria-label="CPF"
                    value={form.cpf}
                    onChange={(e) => update("cpf", formatCPF(e.target.value))}
                    disabled={submitting}
                    maxLength={14}
                  />
                </div>
                {errors.cpf && <div className="auth-field-error" role="alert">{errors.cpf}</div>}
              </div>
            )}

            {/* Phone */}
            <div>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><Icon.Bell size={18} /></span>
                <input
                  className={cn("auth-input", errors.phone && "invalid")}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(11) 90000-0000"
                  aria-label="Telefone"
                  value={form.phone}
                  onChange={(e) => update("phone", formatPhone(e.target.value))}
                  disabled={submitting}
                  maxLength={16}
                />
              </div>
              {errors.phone && <div className="auth-field-error" role="alert">{errors.phone}</div>}
            </div>

            {/* Condo name */}
            <div>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><Icon.BrandHouse size={18} /></span>
                <input
                  className={cn("auth-input", errors.condoName && "invalid")}
                  type="text"
                  placeholder={
                    form.accountType === "empresa"
                      ? "Condomínio que administra (opcional)"
                      : "Nome do condomínio"
                  }
                  aria-label="Nome do condomínio"
                  value={form.condoName}
                  onChange={(e) => update("condoName", e.target.value)}
                  disabled={submitting}
                />
              </div>
              {errors.condoName && <div className="auth-field-error" role="alert">{errors.condoName}</div>}
            </div>

            {/* Condo role (pessoa apenas — empresa entra como administradora) */}
            {form.accountType !== "empresa" && (
              <div>
                <div className="auth-label">Seu papel no condomínio</div>
                <div className="auth-seg-group" role="group" aria-label="Papel no condomínio">
                  {CONDO_ROLES.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      className={cn("auth-seg-btn", form.condoRole === r.id && "active")}
                      onClick={() => update("condoRole", r.id)}
                      disabled={submitting}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                {errors.condoRole && <div className="auth-field-error" role="alert">{errors.condoRole}</div>}
              </div>
            )}

            {/* CEP */}
            <div>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><Icon.Pin size={18} /></span>
                <input
                  className={cn("auth-input has-suffix", errors.cep && "invalid")}
                  type="text"
                  inputMode="numeric"
                  placeholder="CEP (00000-000)"
                  aria-label="CEP"
                  value={form.cep}
                  onChange={(e) => update("cep", formatCEP(e.target.value))}
                  onBlur={() => { void handleCEPBlur(); }}
                  disabled={submitting}
                  maxLength={9}
                />
                {cepLoading && (
                  <span className="auth-input-suffix" style={{ pointerEvents: "none" }}>
                    <span className="auth-spinner" aria-hidden />
                  </span>
                )}
              </div>
              {errors.cep && <div className="auth-field-error" role="alert">{errors.cep}</div>}
            </div>

            {/* Street + Number */}
            <div className="auth-row-fields">
              <div style={{ flex: 2 }}>
                <div className="auth-input-wrap">
                  <input
                    className={cn("auth-input", errors.street && "invalid")}
                    type="text"
                    placeholder="Rua / Avenida"
                    aria-label="Rua"
                    value={form.street}
                    onChange={(e) => update("street", e.target.value)}
                    disabled={submitting}
                  />
                </div>
                {errors.street && <div className="auth-field-error" role="alert">{errors.street}</div>}
              </div>
              <div style={{ flex: 1 }}>
                <div className="auth-input-wrap">
                  <input
                    className={cn("auth-input", errors.number && "invalid")}
                    type="text"
                    placeholder="Nº"
                    aria-label="Número"
                    value={form.number}
                    onChange={(e) => update("number", e.target.value)}
                    disabled={submitting}
                  />
                </div>
                {errors.number && <div className="auth-field-error" role="alert">{errors.number}</div>}
              </div>
            </div>

            {/* Complement */}
            <div>
              <div className="auth-input-wrap">
                <input
                  className="auth-input"
                  type="text"
                  placeholder="Complemento (opcional)"
                  aria-label="Complemento"
                  value={form.complement}
                  onChange={(e) => update("complement", e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Neighborhood */}
            <div>
              <div className="auth-input-wrap">
                <input
                  className={cn("auth-input", errors.neighborhood && "invalid")}
                  type="text"
                  placeholder="Bairro"
                  aria-label="Bairro"
                  value={form.neighborhood}
                  onChange={(e) => update("neighborhood", e.target.value)}
                  disabled={submitting}
                />
              </div>
              {errors.neighborhood && <div className="auth-field-error" role="alert">{errors.neighborhood}</div>}
            </div>

            {/* City + State */}
            <div className="auth-row-fields">
              <div style={{ flex: 2 }}>
                <div className="auth-input-wrap">
                  <input
                    className={cn("auth-input", errors.city && "invalid")}
                    type="text"
                    placeholder="Cidade"
                    aria-label="Cidade"
                    value={form.city}
                    onChange={(e) => update("city", e.target.value)}
                    disabled={submitting}
                  />
                </div>
                {errors.city && <div className="auth-field-error" role="alert">{errors.city}</div>}
              </div>
              <div style={{ flex: 1 }}>
                <div className="auth-input-wrap">
                  <input
                    className={cn("auth-input", errors.state && "invalid")}
                    type="text"
                    placeholder="UF"
                    aria-label="Estado (UF)"
                    value={form.state}
                    onChange={(e) => update("state", e.target.value.toUpperCase().slice(0, 2))}
                    disabled={submitting}
                    maxLength={2}
                  />
                </div>
                {errors.state && <div className="auth-field-error" role="alert">{errors.state}</div>}
              </div>
            </div>

            {/* Terms */}
            <label className="auth-checkbox" style={{ marginTop: 6 }}>
              <input
                type="checkbox"
                checked={form.accepted}
                onChange={(e) => update("accepted", e.target.checked)}
              />
              <span className="auth-checkbox-box">
                {form.accepted && <Icon.Check size={12} />}
              </span>
              <span className="auth-checkbox-text">
                Aceito os <strong>termos de uso</strong> e a{" "}
                <strong>política de privacidade</strong>.
              </span>
            </label>
            {errors.accepted && <div className="auth-field-error" role="alert">{errors.accepted}</div>}

            <button
              type="submit"
              className="auth-cta"
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? (
                <>
                  <span className="auth-spinner" aria-hidden />
                  Criando sua conta…
                </>
              ) : (
                <>Criar conta</>
              )}
            </button>
          </form>

          <div className="auth-footer-line">
            Já tem conta? <Link href="/login">Entrar</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
