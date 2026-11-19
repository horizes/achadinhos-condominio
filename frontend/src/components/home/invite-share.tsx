"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { APP_CONTENT } from "@/lib/app-content";
import { Icon } from "../icons";

// Seção "Convide e ganhe" (item 10 da spec): "Traga seu condomínio para o
// Achadinhos", botão "Compartilhar convite" (WhatsApp com link pessoal),
// mascote ao lado. O link pessoal carrega ?convite=<id do usuário> na home —
// quem recebe vira indicador vinculado (registrado pelo app quando houver
// backend de convite; o vínculo fica sinalizado na URL).
export function InviteShare() {
  const { user } = useAuth();
  // O mascote "comemora" (pulinho) quando o usuario toca em compartilhar o convite.
  const [celebrate, setCelebrate] = useState(false);
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const ref = user?.id ? `?convite=${encodeURIComponent(user.id)}` : "";
  const link = `${origin}/${ref}`;
  const shareText = `${APP_CONTENT.invite.shareText} ${link}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <section className="invite-share" aria-label="Convide e ganhe">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/mascote-dourado-v2.png"
        alt=""
        aria-hidden="true"
        className={celebrate ? "invite-mascot celebrate" : "invite-mascot"}
      />
      <div className="invite-body">
        <h2 className="invite-title">{APP_CONTENT.invite.title}</h2>
        <p className="invite-note">{APP_CONTENT.invite.benefitNote}</p>
        <a
          className="invite-btn"
          href={origin ? waUrl : undefined}
          aria-disabled={!origin}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            setCelebrate(false);
            // Re-aplica a animação mesmo em cliques seguidos.
            window.requestAnimationFrame(() => setCelebrate(true));
          }}
        >
          <Icon.Whatsapp size={15} /> {APP_CONTENT.invite.button}
        </a>
      </div>
    </section>
  );
}
