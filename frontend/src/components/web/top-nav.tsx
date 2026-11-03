"use client";

import { publicAsset } from "@/lib/site-path";

import { BrandSignature } from "@/components/brand-signature";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { useScrollY } from "@/hooks/use-scroll-y";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { Icon } from "../icons";

interface TopNavProps {
  onSearchClick: () => void;
  onProfile?: () => void;
}

// Desktop-only top navigation. Stays hidden under md breakpoint (CSS).
export function TopNav({ onSearchClick, onProfile }: TopNavProps) {
  const { canInstall, promptInstall } = useInstallPrompt();
  const scrollY = useScrollY();
  const scrolled = scrollY > 8;
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav className={cn("top-nav", scrolled && "scrolled")} aria-label="Navegação principal">
      <div className="top-nav-inner">
        <div className="top-nav-brand">
          <BrandSignature className="top-nav-brand-logo" tone="light" />
        </div>

        <button
          type="button"
          className="top-nav-search"
          onClick={onSearchClick}
          aria-label="Abrir busca"
        >
          <span className="top-nav-search-icon">
            <Icon.Search size={18} />
          </span>
          <span className="top-nav-search-ph">Buscar serviços, afiliados, produtos…</span>
          <span className="top-nav-search-filter">
            <Icon.Filter size={16} />
          </span>
        </button>

        <div className="top-nav-actions">
          <Link href="/blog" className="top-nav-link">
            Blog
          </Link>
          <Link href="/eventos" className="top-nav-link">
            Eventos
          </Link>
          <Link href="/certificacao" className="top-nav-link">
            Certificação
          </Link>

          <button
            type="button"
            className="top-nav-install"
            onClick={() => void promptInstall()}
          >
            <img src={publicAsset("/icons/icon.png")} alt="" width={18} height={18} style={{ borderRadius: 5 }} />
            Instalar app
          </button>

          <span className="top-nav-divider" aria-hidden />

          {isAuthenticated && user ? (
            <AccountMenu
              name={user.name}
              email={user.email}
              onLogout={logout}
              onProfile={onProfile}
            />
          ) : (
            <Link href="/login" className="top-nav-cta">
              Entrar
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

// =============== Account dropdown ===============

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
