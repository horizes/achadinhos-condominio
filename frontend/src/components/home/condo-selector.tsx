"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Icon } from "../icons";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "achadinhos.condo";

export function useSelectedCondo() {
  const [condo, setCondo] = useState<string | null>(null);
  useEffect(() => {
    try {
      setCondo(window.localStorage.getItem(STORAGE_KEY));
    } catch {
      /* indisponível */
    }
  }, []);
  const select = (name: string | null) => {
    setCondo(name);
    try {
      if (name) window.localStorage.setItem(STORAGE_KEY, name);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* indisponível */
    }
  };
  return { condo, select };
}

// Seção 3 da tela inicial (spec "Achadinhos do Condomínio — especificação do
// app"): seletor "Selecione seu condomínio". A spec pede a "lista de condomínios
// cadastrados" e que a escolha fique salva e filtre eventos e fornecedores da
// região. Como a lista completa de condomínios não é pública (é dado dos
// clientes), mostramos: o condomínio do usuário logado (do cadastro) + opção de
// digitar outro. Sem cadastro, o CTA é criar a conta de síndico.
export function CondoSelector() {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const { condo, select } = useSelectedCondo();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const ownCondo = user?.condo_name?.trim() || null;
  const current = condo ?? ownCondo ?? null;

  const save = (name: string | null) => {
    select(name);
    setOpen(false);
    setDraft("");
    showToast(name ? `Condomínio selecionado: ${name}` : "Seleção removida");
  };

  return (
    <section className="condo-selector">
      <button
        type="button"
        className="condo-btn"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <span className="condo-btn-icon" aria-hidden="true">
          <Icon.Building size={18} />
        </span>
        <span className="condo-btn-body">
          <span className="condo-btn-label">Selecione seu condomínio</span>
          <span className="condo-btn-value">
            {current ?? "Escolha o seu condomínio"}
          </span>
        </span>
        <Icon.ChevDown size={16} />
      </button>

      {open && (
        <div
          className="condo-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Selecionar condomínio"
          onClick={() => setOpen(false)}
        >
          <div className="condo-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Selecione seu condomínio</h3>
            <p>
              Sua escolha fica salva neste aparelho e ajuda a mostrar eventos e
              fornecedores da sua região.
            </p>

            {ownCondo && (
              <button
                type="button"
                className={`condo-option ${current === ownCondo ? "active" : ""}`}
                onClick={() => save(ownCondo)}
              >
                <Icon.Check size={16} />
                <span>
                  {ownCondo}
                  <br />
                  <small style={{ fontWeight: 400, opacity: 0.75 }}>
                    Do seu cadastro
                  </small>
                </span>
              </button>
            )}

            <div style={{ marginTop: 10 }}>
              <label
                htmlFor="condo-draft"
                style={{ fontSize: 11, fontWeight: 700, color: "var(--spec-ink-soft)" }}
              >
                {ownCondo ? "Outro condomínio" : "Escreva o nome do seu condomínio"}
              </label>
              <input
                id="condo-draft"
                className="quote-input"
                style={{ marginTop: 5 }}
                placeholder="Ex.: Residencial Jardim das Flores"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                autoFocus={!ownCondo}
              />
              {ownCondo ? null : (
                <button
                  type="button"
                  className="quote-submit"
                  style={{ marginTop: 10 }}
                  disabled={draft.trim().length < 3}
                  onClick={() => save(draft.trim())}
                >
                  Salvar condomínio
                </button>
              )}
              {ownCondo && draft.trim().length >= 3 && (
                <button
                  type="button"
                  className="quote-submit"
                  style={{ marginTop: 10 }}
                  onClick={() => save(draft.trim())}
                >
                  Salvar “{draft.trim()}”
                </button>
              )}
            </div>

            {!isAuthenticated && (
              <div className="condo-empty">
                Ainda não temos seu condomínio por aqui. Cadastre o condomínio e
                ganhe acesso à agenda e às indicações dos vizinhos.{" "}
                <button
                  type="button"
                  onClick={() => router.push("/cadastro/sindico")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--spec-gold-dark)",
                    fontWeight: 800,
                    cursor: "pointer",
                    padding: 0,
                    font: "inherit",
                  }}
                >
                  Cadastrar meu condomínio →
                </button>
              </div>
            )}

            {current && (
              <button
                type="button"
                onClick={() => save(null)}
                style={{
                  marginTop: 12,
                  background: "none",
                  border: "none",
                  color: "var(--spec-ink-soft)",
                  fontSize: 11,
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "center",
                }}
              >
                Limpar seleção
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
