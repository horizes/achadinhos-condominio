"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { notificationsApi, type ApiNotification } from "@/lib/api";
import { publicAsset } from "@/lib/site-path";
import { Icon } from "../icons";

// Cabeçalho do app — o MESMO componente no celular e no desktop (spec: "Achadinhos do
// Condomínio — especificação do app", item 1 da tela inicial). No desktop os
// links de navegação (Blog/Eventos/Construção/Indica/Certificação), o botão de
// instalar e a conta aparecem na MESMA barra, mantendo o visual de app dentro
// de uma coluna central — sem quebrar a estética do mockup.

function greetingFor(hour: number): string {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function firstName(name: string | undefined | null): string {
  if (!name) return "";
  const t = name.trim();
  return t ? t.split(/\s+/)[0] : "";
}

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return "agora mesmo";
  const m = Math.floor(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `há ${d}d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

interface HeaderProps {
  onSearchClick: () => void;
  onProfile?: () => void;
}

export function Header({ onSearchClick, onProfile }: HeaderProps) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { canInstall, promptInstall } = useInstallPrompt();
  const [greeting, setGreeting] = useState("Olá");
  useEffect(() => {
    const updateGreeting = () => setGreeting(greetingFor(new Date().getHours()));
    updateGreeting();
    const interval = window.setInterval(updateGreeting, 60_000);
    return () => window.clearInterval(interval);
  }, []);
  const name = firstName(user?.name);
  const bullet = name ? `, ${name}` : "";

  // Sino de notificações (spec: "ponto dourado quando houver novidade").
  // Contadores e itens vêm do backend — só eventos reais (pedido recebido,
  // pedido respondido/fechado). Sem login, o sino leva para /login.
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<ApiNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  const refreshUnread = useCallback(() => {
    if (!isAuthenticated) {
      setUnread(0);
      return;
    }
    void notificationsApi
      .unreadCount()
      .then((r) => setUnread(r.unread))
      .catch(() => {
        /* silencioso — o ponto dourado só some com confirmação do servidor */
      });
  }, [isAuthenticated]);

  useEffect(() => {
    refreshUnread();
    const t = window.setInterval(refreshUnread, 60_000);
    const onFocus = () => refreshUnread();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshUnread]);

  useEffect(() => {
    if (!notifOpen) return;
    const onClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNotifOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [notifOpen]);

  const toggleNotif = () => {
    const next = !notifOpen;
    setNotifOpen(next);
    if (!next) return;
    void notificationsApi
      .list()
      .then((r) => {
        setNotifs(r.data ?? []);
        setUnread(0);
        if (r.unread > 0) void notificationsApi.markAllRead();
      })
      .catch(() => setNotifs([]));
  };

  const markAll = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
    setUnread(0);
    void notificationsApi.markAllRead();
  };

  const openNotif = (n: ApiNotification) => {
    setNotifOpen(false);
    if (n.link) router.push(n.link);
  };

  return (
    <header className="header home-mobile-header app-header">
      <div className="app-inner">
        {/* Linha pequena: wordmark à esquerda; no desktop, nav + ações na mesma faixa */}
        <div className="app-header-row">
          <div className="app-wordmark">
            <span className="app-wordmark-line1">ACHADINHOS</span>
            <span className="app-wordmark-line2">DO CONDOMÍNIO</span>
          </div>

          {/* Desktop: links de navegação + instalação + conta */}
          <nav className="app-desktop-nav" aria-label="Navegação">
            <Link href="/blog" className="app-nav-link">
              Blog
            </Link>
            <Link href="/eventos" className="app-nav-link">
              Eventos
            </Link>
            <Link href="/construcao" className="app-nav-link">
              Construção
            </Link>
            <Link href="/indica" className="app-nav-link">
              Indica
            </Link>
            <Link href="/certificacao" className="app-nav-link">
              Certificação
            </Link>
          </nav>

          <div className="app-header-actions">
            {canInstall && (
              <button
                type="button"
                className="app-install-btn"
                onClick={() => void promptInstall()}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={publicAsset("/icons/icon.png")}
                  alt=""
                  width={16}
                  height={16}
                  style={{ borderRadius: 4 }}
                />
                Instalar app
              </button>
            )}

            {isAuthenticated ? (
              <div className="notif-anchor" ref={notifRef}>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={unread > 0 ? `Notificações — ${unread} novidade${unread === 1 ? "" : "s"}` : "Notificações"}
                  aria-expanded={notifOpen}
                  aria-haspopup="dialog"
                  onClick={toggleNotif}
                >
                  <Icon.Bell size={19} />
                  {unread > 0 && <span className="nav-dot-gold" aria-hidden="true" />}
                </button>
                {notifOpen && (
                  <div className="notif-panel" role="dialog" aria-label="Notificações">
                    <div className="notif-panel-head">
                      <strong>Notificações</strong>
                      {notifs.some((n) => !n.read_at) && (
                        <button type="button" className="notif-mark-all" onClick={markAll}>
                          Marcar todas como lidas
                        </button>
                      )}
                    </div>
                    {notifs.length === 0 ? (
                      <div className="notif-empty">
                        <Icon.Sparkle size={16} />
                        <p>
                          Você está em dia.
                          <br />
                          Nenhuma novidade do seu condomínio por aqui.
                        </p>
                      </div>
                    ) : (
                      <ul className="notif-list">
                        {notifs.map((n) => (
                          <li key={n.id}>
                            <button
                              type="button"
                              className={n.read_at ? "notif-item" : "notif-item unread"}
                              onClick={() => openNotif(n)}
                            >
                              <span className="notif-item-icon" aria-hidden="true">
                                {n.type.startsWith("orcamento") ? (
                                  <Icon.Building size={15} />
                                ) : (
                                  <Icon.Bell size={15} />
                                )}
                              </span>
                              <span className="notif-item-body">
                                <span className="notif-item-title">{n.title}</span>
                                {n.body ? <span className="notif-item-sub">{n.body}</span> : null}
                                <span className="notif-item-time">{timeAgo(n.created_at)}</span>
                              </span>
                              {!n.read_at && <span className="notif-unread-dot" aria-hidden="true" />}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="icon-btn" aria-label="Notificações — entre para ver">
                <Icon.Bell size={19} />
              </Link>
            )}

            {isAuthenticated && user ? (
              <AccountMenu
                name={user.name}
                email={user.email}
                onLogout={logout}
                onProfile={onProfile ?? (() => router.push("/perfil"))}
              />
            ) : (
              <Link href="/login" className="app-entrar-btn">
                Entrar
              </Link>
            )}
          </div>
        </div>

        {/* Saudação pelo horário + título com "segurança" em dourado,
            mascote grande à direita. */}
        <div className="app-hero">
          <div className="app-hero-text">
            <div className="greeting-hi">
              {greeting}
              {bullet}! Que bom te ver por aqui.
            </div>
            <h1 className="app-title">
              Aqui você não arrisca,
              <br />
              você escolhe <em>com segurança!</em>
            </h1>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/mascote-dourado-v2.png"
            alt="Mascote do Achadinhos acenando"
            className="app-hero-mascot"
            width={158}
            height={164}
          />
        </div>

        {/* Busca com botão de filtros dourado */}
        <div className="search-wrap">
          <button
            type="button"
            className="search"
            onClick={onSearchClick}
            aria-label="Abrir busca"
          >
            <Icon.Search size={18} />
            <span className="search-ph">Buscar serviços ou empresas…</span>
            <Icon.Filter size={16} />
          </button>
        </div>

        {/* Atalhos do app: Construção (dourado) e Indica (branco) */}
        <div className="app-shortcuts">
          <Link href="/construcao" className="shortcut-construcao">
            <span className="shortcut-icon" aria-hidden="true">
              <Icon.Building size={20} />
            </span>
            <span className="shortcut-body">
              <span className="shortcut-title">Achadinhos da Construção</span>
              <span className="shortcut-desc">Arquitetos, marmoraria, planejados e mais</span>
            </span>
            <Icon.ChevRight size={18} className="shortcut-chev" />
          </Link>

          <Link href="/indica" className="shortcut-indica">
            <span className="shortcut-icon shortcut-icon-white" aria-hidden="true">
              <Icon.Cart size={20} />
            </span>
            <span className="shortcut-body">
              <span className="shortcut-title">
                Achadinhos <span className="gold-word">Indica</span>
              </span>
              <span className="shortcut-desc">Produtos e equipamentos com o menor custo</span>
            </span>
            <Icon.ChevRight size={18} className="shortcut-chev" />
          </Link>
        </div>
      </div>
    </header>
  );
}

// =============== Account dropdown (mesmo comportamento do desktop-nav) ===============

interface AccountMenuProps {
  name: string;
  email: string;
  onLogout: () => void;
  onProfile?: () => void;
}

function AccountMenu({ name, email, onLogout, onProfile }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="top-nav-account" ref={ref}>
      <button
        type="button"
        className="top-nav-account-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="top-nav-avatar" style={{ width: 32, height: 32, fontSize: 14 }}>
          {initial}
        </span>
        <span className="top-nav-account-name">{name}</span>
        <Icon.ChevDown size={14} />
      </button>

      {open && (
        <div className="top-nav-account-menu" role="menu">
          <div className="top-nav-account-menu-header">
            <div className="top-nav-account-menu-name">{name}</div>
            <div className="top-nav-account-menu-mail">{email}</div>
          </div>
          {onProfile && (
            <button
              type="button"
              className="top-nav-account-menu-item"
              onClick={() => {
                setOpen(false);
                onProfile();
              }}
              role="menuitem"
            >
              <Icon.User size={15} /> Meu Perfil
            </button>
          )}
          <div className="top-nav-account-menu-sep" role="separator" />
          <button
            type="button"
            className="top-nav-account-menu-item danger"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            role="menuitem"
          >
            <Icon.LogOut size={15} /> Sair
          </button>
        </div>
      )}
    </div>
  );
}
