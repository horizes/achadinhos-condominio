"use client";

import Link from "next/link";
import { Icon } from "../icons";

// Item 7 da spec: dois cartões lado a lado na tela inicial —
// "Faça seu cadastro" (síndico/condomínio) e "Quero ser Afiliado" (empresa).
export function SignupDuo() {
  return (
    <section className="duo-cards" aria-label="Cadastre-se">
      <Link href="/cadastro" className="duo-card navy">
        <span className="duo-card-icon" aria-hidden="true">
          <Icon.User size={18} />
        </span>
        <span className="duo-card-title">Faça seu cadastro</span>
        <span className="duo-card-desc">
          Para você receber as novidades do universo condominial e se manter
          atualizado.
        </span>
      </Link>

      <Link href="/cadastro/afiliado" className="duo-card gold">
        <span className="duo-card-icon" aria-hidden="true">
          <Icon.Building size={18} />
        </span>
        <span className="duo-card-title">Quero ser Afiliado</span>
        <span className="duo-card-desc">
          Sua empresa vista pelos condomínios da região.
        </span>
      </Link>
    </section>
  );
}
