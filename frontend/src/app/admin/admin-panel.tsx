"use client";

import { publicAsset } from "@/lib/site-path";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { ProdutosSection } from "./produtos-section";
import { NegociosSection } from "./negocios-section";
import { LeadsSection } from "./leads-section";
import { CadastroEmpresasSection } from "./cadastro-empresas-section";
import { EventosSection } from "./eventos-section";
import { MuralSection } from "./mural-section";
import { CertificadosSection } from "./certificados-section";
import { AgendaSection } from "./agenda-section";
import { BlogSection } from "./blog-section";

type AdminTab =
  | "produtos"
  | "negocios"
  | "cadastro"
  | "certificados"
  | "eventos"
  | "mural"
  | "agenda"
  | "blog"
  | "leads";

const TABS: Array<{ id: AdminTab; label: string; icon: keyof typeof Icon }> = [
  { id: "produtos", label: "Produtos", icon: "CatShopping" },
  { id: "negocios", label: "Empresas e afiliados", icon: "CatPartners" },
  { id: "cadastro", label: "Cadastro de empresas", icon: "Building" },
  { id: "certificados", label: "Certificados", icon: "Award" },
  { id: "eventos", label: "Eventos", icon: "Calendar" },
  { id: "mural", label: "Mural", icon: "Tag" },
  { id: "agenda", label: "Agenda", icon: "Clock" },
  { id: "blog", label: "Blog", icon: "Tag" },
  { id: "leads", label: "Leads do site", icon: "User" },
];

export function AdminPanel() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [tab, setTab] = useState<AdminTab>("produtos");

  const isAdmin = isAuthenticated && user?.role === "admin";

  // O callback do OAuth do Google redireciona para /admin?agenda=conectada —
  // abre direto a aba Agenda (a section mostra o aviso de sucesso).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("agenda")) setTab("agenda");
  }, []);

  // Bounce non-admins once the auth bootstrap has settled.
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace("/login");
    }
  }, [isLoading, isAdmin, router]);

  if (isLoading) {
    return (
      <main className="admin-shell">
        <div className="admin-gate">
          <span className="auth-spinner" aria-hidden />
          <span>Carregando painel…</span>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="admin-shell">
        <div className="admin-gate">
          <Icon.Lock size={28} />
          <span>Acesso restrito à administração.</span>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div className="admin-header-brand">
          <img className="admin-header-mascot" src={publicAsset("/brand/mascote-dourado.png")} alt="Mascote dourado Achadinhos" width={72} height={82} />
          <div>
            <div className="admin-header-title">Painel Admin</div>
            <div className="admin-header-sub">Achadinhos do Condomínio</div>
          </div>
        </div>
        <div className="admin-header-user">
          <span className="admin-header-email">{user?.email}</span>
          <button type="button" className="admin-logout" onClick={() => router.push("/")}>
            <Icon.Home size={15} />
            Ver site
          </button>
          <button type="button" className="admin-logout" onClick={logout}>
            <Icon.LogOut size={15} />
            Sair
          </button>
        </div>
      </header>

      <nav className="admin-tabs" role="tablist">
        {TABS.map((t) => {
          const I = Icon[t.icon];
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={cn("admin-tab", tab === t.id && "active")}
              onClick={() => setTab(t.id)}
            >
              <I size={16} />
              {t.label}
            </button>
          );
        })}
      </nav>

      <div className="admin-content">
        {tab === "produtos" && <ProdutosSection />}
        {tab === "negocios" && <NegociosSection />}
        {tab === "cadastro" && <CadastroEmpresasSection />}
        {tab === "certificados" && <CertificadosSection />}
        {tab === "eventos" && <EventosSection />}
        {tab === "mural" && <MuralSection onGoEventos={() => setTab("eventos")} />}
        {tab === "agenda" && <AgendaSection />}
        {tab === "blog" && <BlogSection />}
        {tab === "leads" && <LeadsSection />}
      </div>
    </main>
  );
}
