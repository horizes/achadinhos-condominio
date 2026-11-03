"use client";

import { publicAsset } from "@/lib/site-path";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { BrandLockup } from "@/components/auth/brand-lockup";

// Página institucional dos planos — mesma linguagem visual da página de
// certificação (classes cert-*). Cada card lista o que o plano inclui;
// as chaves ("blue" | "ouro" | "black") seguem os níveis do certificado
// ("ouro" exibe como Top).
const PLANS = [
  {
    key: "blue",
    name: "Blue",
    tagline: "Para começar com o pé direito",
    desc: "O essencial para aparecer na plataforma com credibilidade.",
    items: [
      "Perfil completo da empresa ou afiliado na plataforma",
      "Documento (CPF/CNPJ) verificado pela equipe Achadinhos",
      "Selo Blue exibido no perfil e nas listagens",
      "Contato direto por WhatsApp para os síndicos",
      "Presença nas categorias e na busca",
    ],
  },
  {
    key: "ouro",
    name: "Top",
    tagline: "Para quem já mostra resultado",
    desc: "Tudo do Blue, com mais visibilidade e prova social.",
    items: [
      "Tudo do plano Blue",
      "Selo Top — nível padrão da certificação",
      "Portfólio comprovado no perfil (fotos, PDFs e vídeos)",
      "Avaliações de clientes em destaque",
      "Prioridade na seção “Recomendados pra você”",
      "Certificado oficial com QR code de verificação",
    ],
  },
  {
    key: "black",
    name: "Black",
    tagline: "O nível máximo de confiança",
    desc: "Tudo do Top, com auditoria aprofundada e presença premium.",
    items: [
      "Tudo do plano Top",
      "Selo Black — excelência comprovada",
      "Auditoria aprofundada e referências verificadas",
      "Destaque na home, na seção “Empresas em destaque”",
      "Certificado premium assinado pela equipe Achadinhos",
    ],
  },
] as const;

export function PlanosScreen() {
  return (
    <main className="cert-page">
      {/* Topbar */}
      <div className="cert-topbar">
        <Link href="/" className="auth-nav-home">
          <Icon.ChevLeft size={14} />
          Início
        </Link>
        <Link href="/certificacao" className="auth-tertiary-link">
          Como funciona a <strong>certificação</strong>
        </Link>
      </div>

      <div className="cert-container">
        <BrandLockup />

        {/* Hero */}
        <section className="cert-hero">
          <div className="cert-hero-text">
            <span className="cert-eyebrow">Planos</span>
            <h1 className="cert-title">
              O que cada plano <em>inclui</em>
            </h1>
            <p className="cert-lead">
              Blue, Top e Black: três níveis para empresas e afiliados crescerem
              dentro do Achadinhos do Condomínio. Quanto mais alto o plano, mais
              visibilidade e mais confiança para os síndicos.
            </p>
            <div className="cert-hero-cta">
              <Link href="/certificacao" className="cert-btn">
                <Icon.Award size={16} /> Conhecer a certificação
              </Link>
              <Link href="/verificar" className="cert-btn ghost">
                Verificar um certificado
              </Link>
            </div>
          </div>
        </section>

        {/* Planos */}
        <section className="cert-section" id="planos">
          <h2 className="cert-h2">Os três planos</h2>
          <p className="cert-sub">
            Compare o que cada nível oferece.
          </p>
          <div className="cert-tier-grid plan-grid">
            {PLANS.map((p) => (
              <div className={`cert-tier-card plan-card ${p.key}`} key={p.key}>
                <img className="plan-official-logo" src={publicAsset(`/brand/${p.key === "blue" ? "plano-blue-3bee747f44aa.png" : p.key === "ouro" ? "plano-top-2743cb2341a5.png" : "plano-black-09d0106dda8f.png"}`)} alt={`Plano ${p.name}`} width={136} height={136} loading="lazy" />
                <div className="cert-tier-tagline">{p.tagline}</div>
                <p className="cert-tier-desc">{p.desc}</p>
                <ul className="plan-list">
                  {p.items.map((item) => (
                    <li key={item}>
                      <Icon.Check size={13} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="cert-verify-cta">
          <div className="cert-verify-icon">
            <Icon.Whatsapp size={28} />
          </div>
          <h2 className="cert-h2">Quer entrar na plataforma?</h2>
          <p className="cert-sub">
            Fale com a equipe do Achadinhos do Condomínio para cadastrar a sua
            empresa e escolher o plano ideal.
          </p>
          <Link href="/cadastro" className="cert-btn">
            Criar conta
          </Link>
        </section>

        <div className="cert-foot">
          <Link href="/" className="auth-tertiary-link">
            Voltar para o <strong>Achadinhos do Condomínio</strong>
          </Link>
        </div>
      </div>
    </main>
  );
}
