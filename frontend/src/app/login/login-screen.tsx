"use client";

import { publicAsset } from "@/lib/site-path";

import { BrandSignature } from "@/components/brand-signature";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

// Ícones da faixa de credibilidade (variante 2a do Claude Design). Não
// existem em icons.tsx, então ficam inline aqui.
function SealIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="9" r="6" />
      <path d="m9 14.5-1.5 7L12 19l4.5 2.5L15 14.5" />
      <path d="m9.5 9 1.7 1.7L15 7" />
    </svg>
  );
}
function BuildingIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" />
      <path d="M11 21v-3h2v3" />
    </svg>
  );
}
function QrIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3M21 14v7M17 21h4M14 21h.01" />
    </svg>
  );
}

// Destino depois do login: admin vai ao painel; empresa free, à área dela.
function homeForRole(role?: string): string {
  if (role === "admin") return "/admin";
  if (role === "empresa") return "/minha-empresa";
  return "/";
}

export function LoginScreen() {
  const router = useRouter();
  const { login, user, isAuthenticated, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);

  // If already authenticated and the auth bootstrap finished, bounce home
  // (admins go straight to the admin panel).
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(homeForRole(user?.role));
    }
  }, [isAuthenticated, isLoading, user, router]);

  function validate(): boolean {
    let ok = true;
    setEmailError(null);
    setPwdError(null);
    if (!email.trim()) {
      setEmailError("Informe seu e-mail.");
      ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("E-mail inválido.");
      ok = false;
    }
    if (!password) {
      setPwdError("Informe sua senha.");
      ok = false;
    }
    return ok;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const loggedIn = await login(email.trim(), password);
      router.replace(homeForRole(loggedIn.role));
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401 || err.status === 403) {
          setServerError("E-mail ou senha incorretos.");
        } else if (err.status === 0) {
          setServerError(
            "Não consegui falar com o servidor. Verifique sua conexão."
          );
        } else {
          setServerError(err.message || "Não foi possível entrar agora.");
        }
      } else {
        setServerError("Erro inesperado. Tente novamente.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <header className="login-bar">
        <Link href="/" className="login-bar-home">
          <Icon.ChevLeft size={14} />
          Início
        </Link>
        <span className="login-bar-area">Área do morador</span>
        <Link href="/cadastro" className="login-bar-signup">
          <span className="login-bar-signup-long">
            Não tem conta? <strong>Cadastre-se</strong>
          </span>
          <span className="login-bar-signup-short">
            <strong>Criar</strong>
          </span>
        </Link>
      </header>

      <div className="login-main">
        <div className="login-card">
          <div className="login-frame">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <BrandSignature className="login-logo" tone="ink" />

            <div className="login-ornament" aria-hidden>
              <span className="login-ornament-line" />
              <i className="login-ornament-dot" />
              <span className="login-ornament-text">Acessar conta</span>
              <i className="login-ornament-dot" />
              <span className="login-ornament-line" />
            </div>

            <h1 className="login-title">
              Bem-vindo <em>de volta</em>
            </h1>
            <p className="login-subtitle">
              Entre com seu e-mail e senha pra continuar onde parou.
            </p>

            {serverError && (
              <div className="auth-error" role="alert">
                <Icon.Sparkle size={14} />
                <span>{serverError}</span>
              </div>
            )}

            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <label className="login-field">
                <span className="login-label">E-mail</span>
                <input
                  className={cn("login-input", emailError && "invalid")}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                />
                {emailError && (
                  <span className="auth-field-error" role="alert">{emailError}</span>
                )}
              </label>

              <label className="login-field">
                <span className="login-label-row">
                  <span className="login-label">Senha</span>
                  <span className="login-forgot" aria-disabled>
                    <span className="login-forgot-long">Esqueci minha senha</span>
                    <span className="login-forgot-short">Esqueci</span>
                  </span>
                </span>
                <span className="login-input-wrap">
                  <input
                    className={cn("login-input has-suffix", pwdError && "invalid")}
                    type={showPwd ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    className="login-eye"
                    onClick={() => setShowPwd((v) => !v)}
                    aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPwd ? <Icon.EyeOff size={18} /> : <Icon.Eye size={18} />}
                  </button>
                </span>
                {pwdError && (
                  <span className="auth-field-error" role="alert">{pwdError}</span>
                )}
              </label>

              <label className="login-remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span className="login-check" aria-hidden>
                  {remember && <Icon.Check size={12} />}
                </span>
                <span>
                  Lembrar de mim
                  <span className="login-remember-long"> neste aparelho</span>
                </span>
              </label>

              <button
                type="submit"
                className="login-cta"
                disabled={submitting}
                aria-busy={submitting}
              >
                {submitting ? (
                  <>
                    <span className="auth-spinner" aria-hidden />
                    Entrando…
                  </>
                ) : (
                  <>Entrar</>
                )}
              </button>

              <div className="login-or">ou</div>

              <Link href="/cadastro" className="login-ghost">
                Criar uma conta
              </Link>
            </form>
          </div>
        </div>
      </div>

      <footer className="login-footer">
        <div className="login-footer-row">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={publicAsset("/brand/mascote-dourado.png")}
            alt=""
            className="login-mascot"
            loading="lazy"
            decoding="async"
          />
          <ul className="login-trust">
            <li>
              <span className="login-trust-icon"><SealIcon /></span>
              Empresas certificadas
            </li>
            <li>
              <span className="login-trust-icon"><BuildingIcon /></span>
              Vizinhos do seu condomínio
            </li>
            <li className="login-trust-desktop">
              <span className="login-trust-icon"><QrIcon /></span>
              Certificado verificável
            </li>
          </ul>
        </div>
        <p className="login-terms">
          Ao entrar você concorda com os <Link href="/termos">termos</Link>.
        </p>
      </footer>
    </main>
  );
}
