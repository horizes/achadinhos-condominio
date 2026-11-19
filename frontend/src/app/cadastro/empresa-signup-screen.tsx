"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { getInviteRef } from "@/lib/invite-ref";
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
import { cn } from "@/lib/utils";
import { formatCPF, formatCNPJ, isValidCPF, isValidCNPJ, stripDocument } from "@/lib/document";
import { isValidPhone, stripPhone } from "@/lib/phone";

type AccountErrors = Partial<
  Record<"name" | "email" | "password" | "passwordConfirm" | "document" | "accepted", string>
>;

// Autocadastro da empresa free (3º card de /cadastro): cria o login do
// responsável e a empresa, que entra no site na hora — sem selo nem
// certificado, que só o admin emite. Depois ela edita tudo em /minha-empresa.
export function EmpresaSignupScreen({ onBack }: { onBack?: () => void }) {
  const router = useRouter();
  const { registerEmpresa, isAuthenticated, isLoading } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [docType, setDocType] = useState<"cnpj" | "cpf">("cnpj");
  const [document, setDocument] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [company, setCompany] = useState<EmpresaFieldsValue>(EMPTY_EMPRESA_FIELDS);

  const [errors, setErrors] = useState<AccountErrors>({});
  const [companyErrors, setCompanyErrors] = useState<EmpresaFieldsErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !submitting) router.replace("/");
  }, [isAuthenticated, isLoading, router, submitting]);

  function validate(): boolean {
    const e: AccountErrors = {};
    if (name.trim().length < 2) e.name = "Informe o nome do responsável.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = "Informe um e-mail válido.";
    if (password.length < 8) e.password = "A senha precisa ter pelo menos 8 caracteres.";
    if (passwordConfirm !== password) e.passwordConfirm = "As senhas não conferem.";
    const doc = stripDocument(document);
    if (docType === "cnpj" ? !isValidCNPJ(doc) : !isValidCPF(doc)) {
      e.document = docType === "cnpj" ? "CNPJ inválido." : "CPF inválido.";
    }
    if (!accepted) e.accepted = "É preciso aceitar os termos para continuar.";
    const ce = validateEmpresaFields(company, isValidPhone);
    setErrors(e);
    setCompanyErrors(ce);
    return Object.keys(e).length === 0 && Object.keys(ce).length === 0;
  }

  async function handleSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setServerError(null);
    if (!validate()) return;
    const { name: companyName, ...rest } = empresaFieldsToPayload(company, stripPhone);
    setSubmitting(true);
    try {
      await registerEmpresa({
        name: name.trim(),
        email: email.trim(),
        password,
        company_name: companyName,
        document_type: docType,
        document: stripDocument(document),
        referral: getInviteRef(),
        ...rest,
      });
      router.replace("/minha-empresa");
    } catch (err) {
      setSubmitting(false);
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setServerError(
            err.message === "company_name_taken"
              ? "Já existe uma empresa com esse nome no site. Use outro nome ou fale com a nossa equipe."
              : err.message === "document_taken"
                ? "Esse CPF/CNPJ já tem uma empresa no site. Fale com a nossa equipe para assumir o perfil."
                : "Esse e-mail já tem uma conta. Tente entrar.",
          );
        } else if (err.status === 422 || err.status === 400) {
          setServerError("Confira os dados e tente novamente.");
        } else if (err.status === 0) {
          setServerError("Não consegui falar com o servidor. Verifique sua conexão.");
        } else {
          setServerError("Não foi possível concluir o cadastro agora.");
        }
      } else {
        setServerError("Erro inesperado. Tente novamente.");
      }
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
          <div className="auth-eyebrow">Cadastrar minha empresa</div>
          <h1 className="auth-title">
            Sua empresa no <em>Achadinhos</em>
          </h1>
          <p className="auth-subtitle">
            Cadastre grátis e apareça para síndicos e condomínios. Os selos Blue,
            Top e Black vêm com a Certificação Achadinhos.
          </p>

          {serverError && (
            <div className="auth-error" role="alert">
              <Icon.Sparkle size={14} />
              <span>{serverError}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-note">
              <Icon.Sparkle size={16} />
              <span>
                Sua empresa entra no site <strong>sem selo de certificação</strong>. Para
                ganhar o selo, conheça a{" "}
                <Link href="/certificacao">Certificação Achadinhos</Link>.
              </span>
            </div>

            <div className="auth-label">Dados da empresa</div>
            <EmpresaFields
              value={company}
              onChange={setCompany}
              errors={companyErrors}
              disabled={submitting}
            />

            <div>
              <div className="auth-label">Documento da empresa</div>
              <div className="auth-seg-group" role="group" aria-label="Tipo de documento">
                {(
                  [
                    { id: "cnpj", label: "CNPJ" },
                    { id: "cpf", label: "CPF (MEI / autônomo)" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={cn("auth-seg-btn", docType === t.id && "active")}
                    onClick={() => {
                      setDocType(t.id);
                      setDocument("");
                    }}
                    disabled={submitting}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><Icon.Building size={18} /></span>
                <input
                  className={cn("auth-input", errors.document && "invalid")}
                  type="text"
                  inputMode="numeric"
                  placeholder={docType === "cnpj" ? "00.000.000/0000-00" : "000.000.000-00"}
                  aria-label={docType === "cnpj" ? "CNPJ" : "CPF"}
                  value={document}
                  onChange={(e) =>
                    setDocument(docType === "cnpj" ? formatCNPJ(e.target.value) : formatCPF(e.target.value))
                  }
                  disabled={submitting}
                />
              </div>
              {errors.document && <div className="auth-field-error" role="alert">{errors.document}</div>}
            </div>

            <div className="auth-label">Seu acesso</div>
            <div>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><Icon.User size={18} /></span>
                <input
                  className={cn("auth-input", errors.name && "invalid")}
                  type="text"
                  autoComplete="name"
                  placeholder="Nome do responsável"
                  aria-label="Nome do responsável"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitting}
                />
              </div>
              {errors.name && <div className="auth-field-error" role="alert">{errors.name}</div>}
            </div>
            <div>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><Icon.AtSign size={18} /></span>
                <input
                  className={cn("auth-input", errors.email && "invalid")}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="E-mail de acesso"
                  aria-label="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                />
              </div>
              {errors.email && <div className="auth-field-error" role="alert">{errors.email}</div>}
            </div>
            <div>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><Icon.Lock size={18} /></span>
                <input
                  className={cn("auth-input has-suffix", errors.password && "invalid")}
                  type={showPwd ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Crie uma senha (mín. 8)"
                  aria-label="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            <div>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><Icon.Lock size={18} /></span>
                <input
                  className={cn("auth-input", errors.passwordConfirm && "invalid")}
                  type={showPwd ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Confirme a senha"
                  aria-label="Confirmar senha"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  disabled={submitting}
                />
              </div>
              {errors.passwordConfirm && (
                <div className="auth-field-error" role="alert">{errors.passwordConfirm}</div>
              )}
            </div>

            <label className="auth-checkbox" style={{ marginTop: 6 }}>
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
              <span className="auth-checkbox-box">{accepted && <Icon.Check size={12} />}</span>
              <span className="auth-checkbox-text">
                Aceito os <Link href="/termos"><strong>termos de uso</strong></Link> e a{" "}
                <Link href="/privacidade"><strong>política de privacidade</strong></Link>.
              </span>
            </label>
            {errors.accepted && <div className="auth-field-error" role="alert">{errors.accepted}</div>}

            <button type="submit" className="auth-cta" disabled={submitting} aria-busy={submitting}>
              {submitting ? (
                <>
                  <span className="auth-spinner" aria-hidden />
                  Cadastrando sua empresa…
                </>
              ) : (
                <>Cadastrar empresa</>
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
