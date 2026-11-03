"use client";

import { BrandSignature } from "@/components/brand-signature";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { SindicoSignupScreen, type AccountKind } from "./sindico-signup-screen";
import { EmpresaSignupScreen } from "./empresa-signup-screen";

// Tela de escolha do cadastro na casca 2a do login (barra navy, cartão com
// moldura de filete duplo, logo centralizado): três cards — Morador/síndico
// (navy), Empresa/afiliado (dourado, conta de administradora) e Cadastrar
// minha empresa (empresa free, sem certificado), lado a lado no desktop.
// Escolher um card abre o formulário já no modo certo; o "voltar" do
// formulário retorna pra cá.
export function CadastroScreen() {
  const [kind, setKind] = useState<AccountKind | "empresa-free" | null>(null);

  if (kind === "empresa-free") {
    return <EmpresaSignupScreen onBack={() => setKind(null)} />;
  }
  if (kind) {
    return (
      <SindicoSignupScreen
        initialAccountType={kind}
        onBack={() => setKind(null)}
      />
    );
  }

  return (
    <main className="login-page">
      <header className="login-bar">
        <Link href="/" className="login-bar-home">
          <Icon.ChevLeft size={14} />
          Início
        </Link>
        <span className="login-bar-area">Criar conta</span>
        <Link href="/login" className="login-bar-signup">
          <span className="login-bar-signup-long">
            Já tem conta? <strong>Entrar</strong>
          </span>
          <span className="login-bar-signup-short">
            <strong>Entrar</strong>
          </span>
        </Link>
      </header>

      <div className="login-main">
        <div className="login-card login-card--wide login-card--3">
          <div className="login-frame">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <BrandSignature className="login-logo" tone="ink" />

            <div className="login-ornament" aria-hidden>
              <span className="login-ornament-line" />
              <i className="login-ornament-dot" />
              <span className="login-ornament-text">Criar conta</span>
              <i className="login-ornament-dot" />
              <span className="login-ornament-line" />
            </div>

            <h1 className="login-title">
              Como você quer <em>entrar?</em>
            </h1>
            <p className="login-subtitle">
              Escolha o tipo de conta para começar seu cadastro.
            </p>

            <div className="auth-choice-grid auth-choice-grid--3">
              <button
                type="button"
                className="auth-choice-card"
                onClick={() => setKind("pessoa")}
              >
                <span className="auth-choice-card-icon">
                  <Icon.User size={26} />
                </span>
                <span className="auth-choice-card-title">Morador ou síndico</span>
                <span className="auth-choice-card-desc">
                  Para encontrar e contratar serviços para o seu condomínio.
                </span>
                <span className="auth-choice-card-cta">
                  Continuar <Icon.ChevRight size={16} />
                </span>
              </button>

              <button
                type="button"
                className="auth-choice-card gold"
                onClick={() => setKind("empresa")}
              >
                <span className="auth-choice-card-icon">
                  <Icon.Building size={26} />
                </span>
                <span className="auth-choice-card-title">Empresa / afiliado</span>
                <span className="auth-choice-card-desc">
                  Para oferecer serviços e produtos aos condomínios parceiros.
                </span>
                <span className="auth-choice-card-cta">
                  Continuar <Icon.ChevRight size={16} />
                </span>
              </button>

              <button
                type="button"
                className="auth-choice-card"
                onClick={() => setKind("empresa-free")}
              >
                <span className="auth-choice-card-icon">
                  <Icon.Plus size={26} />
                </span>
                <span className="auth-choice-card-title">Cadastrar minha empresa</span>
                <span className="auth-choice-card-desc">
                  Grátis: sua empresa aparece no site para os condomínios. O selo
                  vem com a Certificação Achadinhos.
                </span>
                <span className="auth-choice-card-cta">
                  Cadastrar <Icon.ChevRight size={16} />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
