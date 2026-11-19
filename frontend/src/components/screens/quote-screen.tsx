"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { quotesApi, sellersApi, ApiError, type AdminSeller, type ApiQuoteMine } from "@/lib/api";
import { APP_CONTENT } from "@/lib/app-content";
import { cn } from "@/lib/utils";
import { Icon } from "../icons";

// ═══════════════════════════════════════════════════════════════════════════
// Pedido de orçamento (spec, seção "Pedido de orçamento"):
//   1. Escolher serviço (já preenchido quando vem de um perfil).
//   2. Descrever a necessidade, anexar fotos, escolher prazo desejado.
//   3. Condomínio e contato vêm do cadastro.
//   4. Enviar → o fornecedor recebe notificação in-app; o cliente acompanha o
//      status (Enviado, Respondido, Fechado) — a lista "Acompanhe seus
//      pedidos" abaixo mostra os pedidos reais com status do servidor.
//   5. Pedido FECHADO destrava "Avaliar" (regra verificada no backend).
// ═══════════════════════════════════════════════════════════════════════════

const STATUS_LABEL: Record<ApiQuoteMine["status"], string> = {
  enviado: "Enviado",
  respondido: "Respondido",
  fechado: "Fechado",
};

// Lista real dos pedidos do síndico — com o status vindo do servidor.
function MyQuotes({ quotes }: { quotes: ApiQuoteMine[] | null }) {
  if (!quotes || quotes.length === 0) return null;
  return (
    <div className="quote-card quote-my-quotes" style={{ marginTop: 12 }}>
      <h3>Acompanhe seus pedidos</h3>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {quotes.map((qq) => (
          <li
            key={qq.id}
            style={{
              border: "1px solid rgba(7,23,53,0.08)",
              borderRadius: 12,
              padding: "10px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <strong style={{ fontSize: 12.5, color: "var(--spec-ink)" }}>{qq.service}</strong>
              <span className={cn("quote-status-pill", qq.status)} style={{ fontSize: 11, whiteSpace: "nowrap" }}>
                {STATUS_LABEL[qq.status] ?? qq.status}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "var(--spec-ink-soft)" }}>
              {qq.seller?.name ? `Para: ${qq.seller.name} · ` : "Para: indicando o Achadinhos · "}
              {new Date(qq.created_at).toLocaleDateString("pt-BR")}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function QuoteScreen({ initialService }: { initialService?: string } = {}) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const q = APP_CONTENT.quote;

  const [service, setService] = useState(initialService ?? "");
  const [need, setNeed] = useState("");
  // Empresa pré-selecionada via /orcamento?empresa=<id> (quando o pedido
  // chega a partir do perfil de um fornecedor — spec: "já preenchido quando
  // vem de um perfil").
  const [providerId, setProviderId] = useState<string>("");
  const [deadline, setDeadline] = useState<string>("15dias");
  const [photos, setPhotos] = useState<{ id: string; name: string; url: string }[]>([]);
  const [sellers, setSellers] = useState<AdminSeller[]>([]);
  const [sent, setSent] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [myQuotes, setMyQuotes] = useState<ApiQuoteMine[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Serviço/empresa pré-preenchidos via /orcamento?service=…&empresa=<id>
    // (ex.: pedido vindo do perfil de um fornecedor).
    try {
      const params = new URLSearchParams(window.location.search);
      const svc = params.get("service");
      if (svc) setService((prev) => (prev ? prev : svc));
      const emp = params.get("empresa");
      if (emp) setProviderId(emp);
    } catch {
      /* indisponível */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshMine = () => {
    if (!isAuthenticated) return;
    void quotesApi
      .mine()
      .then(setMyQuotes)
      .catch(() => setMyQuotes([]));
  };

  useEffect(() => {
    void sellersApi
      .list()
      .then((list) => setSellers(list.filter((s) => Boolean(s.cert_tier))))
      .catch(() => setSellers([]));
  }, []);

  useEffect(() => {
    refreshMine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const serviceSuggestions = useMemo(
    () =>
      Array.from(
        new Set(
          sellers
            .flatMap((s) =>
              (s.categories ?? (s.category ? [s.category] : [])).map((c) => c.label),
            ),
        ),
      ).slice(0, 8),
    [sellers],
  );

  const canSend = service.trim().length >= 3 && need.trim().length >= 10;
  const chosenProvider = sellers.find((s) => s.id === providerId) ?? null;
  const waLink = chosenProvider
    ? `https://wa.me/55${chosenProvider.whatsapp}?text=${encodeURIComponent(
        `Olá! Encontrei vocês no Achadinhos do Condomínio. Posso pedir um orçamento para "${service.trim()}"?`,
      )}`
    : null;

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files).slice(0, 4 - photos.length)) {
      const url = URL.createObjectURL(file);
      setPhotos((prev) => [...prev, { id: `${Date.now()}-${file.name}`, name: file.name, url }]);
    }
  };

  const submit = async () => {
    setAttempted(true);
    setServerError(null);
    if (!canSend || sending) return;
    if (!isAuthenticated) {
      setServerError("Entre com sua conta para enviar — o fornecedor recebe seus dados de cadastro (nome, condomínio e contato).");
      return;
    }
    setSending(true);
    try {
      await quotesApi.create({
        seller_id: providerId || undefined,
        service: service.trim(),
        need: need.trim(),
        deadline: deadline as "hoje" | "3dias" | "7dias" | "15dias" | "30dias" | "sem_prazo",
        photos: photos.length,
      });
      setSent(true);
      refreshMine();
    } catch (err) {
      setServerError(
        err instanceof ApiError
          ? err.message
          : "Não consegui enviar agora. Verifique sua conexão e tente de novo.",
      );
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="quote-screen">
        <div className="quote-hero">
          <div className="universe-topbar">
            <button type="button" className="universe-back" onClick={() => router.push("/")} aria-label="Voltar para o início">
              <Icon.ChevLeft size={18} />
            </button>
            <div>
              <div className="universe-kicker">PEDIDO DE ORÇAMENTO</div>
            </div>
          </div>
        </div>
        <div className="quote-body">
          <div className="quote-card quote-success">
            <div className="quote-success-icon">
              <Icon.Check size={36} />
            </div>
            <h1 style={{ fontSize: 20, color: "var(--spec-ink)", margin: "0 0 6px" }}>
              Pedido enviado
            </h1>
            <p style={{ fontSize: 12.5, color: "var(--spec-ink-soft)", margin: 0 }}>
              O fornecedor recebe sua solicitação e você acompanha o status por aqui.
            </p>

            <div className="quote-status-row" aria-label="Status do pedido">
              <span className="quote-status-pill done">1 · Enviado</span>
              <span className="quote-status-pill">2 · Respondido</span>
              <span className="quote-status-pill">3 · Fechado</span>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 6 }}>
              {waLink && (
                <a className="invite-btn" href={waLink} target="_blank" rel="noopener noreferrer" style={{ marginTop: 0 }}>
                  <Icon.Whatsapp size={15} /> Falar direto no WhatsApp
                </a>
              )}
              <button type="button" className="quote-submit" style={{ width: "auto", padding: "12px 22px" }} onClick={() => router.push("/")}>
                Voltar ao início
              </button>
            </div>
            <p className="quote-note" style={{ marginTop: 14 }}>
              Após o serviço, o app pede sua avaliação — ela ajuda outros síndicos a escolher.
            </p>
          </div>
          <MyQuotes quotes={myQuotes} />
        </div>
      </div>
    );
  }

  return (
    <div className="quote-screen">
      <div className="quote-hero">
        <div className="universe-topbar">
          <button type="button" className="universe-back" onClick={() => router.back()} aria-label="Voltar">
            <Icon.ChevLeft size={18} />
          </button>
          <div>
            <div className="universe-kicker">PEDIDO DE ORÇAMENTO</div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 17, letterSpacing: "-0.01em" }}>
              Conte o que você precisa
            </div>
          </div>
        </div>
      </div>

      <div className="quote-body">
        {/* 1. Escolher serviço */}
        <div className="quote-card">
          <h3>1 · Qual serviço você precisa?</h3>
          <input
            className="quote-input"
            placeholder="Ex.: Troca de chuveiro, manutenção de elevador…"
            value={service}
            onChange={(e) => setService(e.target.value)}
            autoFocus={!initialService}
          />
          {serviceSuggestions.length > 0 && (
            <div className="quote-chips">
              {serviceSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={cn("quote-chip", service === s && "active")}
                  onClick={() => setService(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {attempted && service.trim().length < 3 && (
            <p className="quote-note" style={{ color: "var(--danger, #c2453a)" }}>
              Informe o serviço desejado.
            </p>
          )}

          <label htmlFor="quote-provider">Empresa (opcional)</label>
          <select
            id="quote-provider"
            className="quote-select"
            value={providerId}
            onChange={(e) => setProviderId(e.target.value)}
          >
            <option value="">Deixar o Achadinhos indicar</option>
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Necessidade, fotos, prazo */}
        <div className="quote-card">
          <h3>2 · Descreva a necessidade</h3>
          <textarea
            className="quote-textarea"
            placeholder={q.needPlaceholder}
            value={need}
            onChange={(e) => setNeed(e.target.value)}
          />
          {attempted && need.trim().length < 10 && (
            <p className="quote-note" style={{ color: "var(--danger, #c2453a)" }}>
              Descreva com um pouco mais de detalhe (mínimo 10 caracteres).
            </p>
          )}

          <label htmlFor="quote-photos">Fotos (opcional, até 4)</label>
          <input
            ref={fileRef}
            id="quote-photos"
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => addPhotos(e.target.files)}
          />
          <button type="button" className="quote-chip" onClick={() => fileRef.current?.click()}>
            <Icon.Plus size={12} /> Adicionar foto
          </button>
          {photos.length > 0 && (
            <div className="quote-photo-row">
              {photos.map((p) => (
                <div key={p.id} className="quote-photo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.name} />
                  <button
                    type="button"
                    aria-label="Remover foto"
                    onClick={() => setPhotos((prev) => prev.filter((x) => x.id !== p.id))}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <label htmlFor="quote-deadline">Prazo desejado</label>
          <select
            id="quote-deadline"
            className="quote-select"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          >
            {q.deadlineOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Condomínio e contato vêm do cadastro */}
        <div className="quote-card">
          <h3>3 · Seus dados vêm do cadastro</h3>
          {isAuthenticated ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: "var(--spec-ink)" }}>
              <div><strong>Nome:</strong> {user?.name}</div>
              <div><strong>Condomínio:</strong> {user?.condo_name ?? "— (complete no cadastro)"}</div>
              <div><strong>Telefone/WhatsApp:</strong> {user?.phone ?? "— (complete no cadastro)"}</div>
              <Link href="/perfil" style={{ color: "var(--spec-gold-dark)", fontWeight: 700, fontSize: 11.5 }}>
                Atualizar meus dados →
              </Link>
            </div>
          ) : (
            <div style={{ fontSize: 12.5, color: "var(--spec-ink-soft)", lineHeight: 1.6 }}>
              Você não está logado. Entre com sua conta ou cadastre o condomínio — é
              assim que o fornecedor recebe seus dados (nome, condomínio e contato).{" "}
              <Link href="/login" style={{ color: "var(--spec-gold-dark)", fontWeight: 800 }}>
                Entrar →
              </Link>
            </div>
          )}
        </div>

        {serverError && (
          <p className="quote-note" role="alert" style={{ color: "var(--danger, #c2453a)", marginTop: 4 }}>
            {serverError}
          </p>
        )}
        <button type="button" className="quote-submit" disabled={(attempted && !canSend) || sending} onClick={() => void submit()}>
          {sending ? "Enviando…" : "Enviar pedido de orçamento"}
        </button>
        <p className="quote-note">
          Ao enviar, você concorda em compartilhar seus dados com o fornecedor escolhido
          para que ele possa retornar com a proposta.
        </p>
        <MyQuotes quotes={myQuotes} />
      </div>
    </div>
  );
}
