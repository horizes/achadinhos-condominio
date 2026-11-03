"use client";

import { BrandSignature } from "@/components/brand-signature";

// Página pública de agendamento (estilo Calendly):
//   01 Escolha o dia → 02 Escolha o horário → 03 Seus dados → confirmação.
// Os slots chegam em ISO com offset de Brasília; o agrupamento por dia e os
// rótulos de hora usam o texto do próprio ISO (slice), para exibir sempre o
// horário de Brasília independentemente do fuso do visitante.

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  agendaApi,
  ApiError,
  type AgendaBooking,
  type AgendaPublicInfo,
} from "@/lib/api";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { formatPhone, isValidPhone } from "@/lib/phone";

const HORIZON_DAYS = 21; // ~3 semanas de slots buscadas de uma vez

const WEEKDAY_ABBR = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"] as const;
const MONTH_ABBR = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
] as const;

type Phase = "loading" | "unavailable" | "load-error" | "ready" | "success";

interface DayTile {
  key: string; // "AAAA-MM-DD"
  dow: string;
  dayNum: string;
  month: string;
  hasSlots: boolean;
}

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dateFromKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// "2026-07-06" -> "segunda-feira, 6 de julho"
function longDate(key: string): string {
  return dateFromKey(key).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// 60 -> "1h" · 90 -> "1h30" · 30 -> "30 min"
function durationLabel(min: number): string {
  if (!min || min <= 0) return "";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const rest = min % 60;
  return rest === 0 ? `${h}h` : `${h}h${String(rest).padStart(2, "0")}`;
}

// Rótulo "HH:MM" extraído do ISO com offset (hora de Brasília, sem conversão).
function timeLabel(iso: string): string {
  return iso.slice(11, 16);
}

const EMAIL_RE = /^\S+@\S+\.\S+$/;

interface AgendarScreenProps {
  slug: string;
}

export function AgendarScreen({ slug }: AgendarScreenProps) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [info, setInfo] = useState<AgendaPublicInfo | null>(null);
  // slots agrupados por dia ("AAAA-MM-DD" → ISOs ordenados)
  const [slotsByDay, setSlotsByDay] = useState<Record<string, string[]>>({});
  const [reloadingSlots, setReloadingSlots] = useState(false);

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [booking, setBooking] = useState<AgendaBooking | null>(null);

  const fetchSlots = useCallback(async (): Promise<Record<string, string[]>> => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + HORIZON_DAYS);
    const slots = await agendaApi.slots(slug, toYMD(from), toYMD(to));
    const grouped: Record<string, string[]> = {};
    for (const iso of [...slots].sort()) {
      const key = iso.slice(0, 10);
      (grouped[key] ??= []).push(iso);
    }
    return grouped;
  }, [slug]);

  // Bootstrap: dados da agenda + slots de ~3 semanas.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await agendaApi.get(slug);
        if (cancelled) return;
        setInfo(data);
        if (!data.active || !data.connected) {
          setPhase("unavailable");
          return;
        }
        const grouped = await fetchSlots();
        if (cancelled) return;
        setSlotsByDay(grouped);
        setPhase("ready");
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && (err.status === 409 || err.status === 404)) {
          // 409 not_connected (slots) ou agenda inexistente.
          setPhase("unavailable");
        } else {
          setPhase("load-error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, fetchSlots]);

  // Recarrega os slots (usado quando alguém reservou o horário primeiro).
  const reloadSlots = useCallback(async () => {
    setReloadingSlots(true);
    try {
      const grouped = await fetchSlots();
      setSlotsByDay(grouped);
      setSelectedSlot(null);
      setSelectedDay((day) => (day && grouped[day]?.length ? day : null));
    } catch {
      // mantém os slots atuais; o próximo submit reporta de novo
    } finally {
      setReloadingSlots(false);
    }
  }, [fetchSlots]);

  // Próximos dias do horizonte — os sem slot ficam desabilitados.
  const dayTiles = useMemo<DayTile[]>(() => {
    const tiles: DayTile[] = [];
    const cursor = new Date();
    for (let i = 0; i < HORIZON_DAYS; i++) {
      const key = toYMD(cursor);
      tiles.push({
        key,
        dow: WEEKDAY_ABBR[cursor.getDay()],
        dayNum: String(cursor.getDate()).padStart(2, "0"),
        month: MONTH_ABBR[cursor.getMonth()],
        hasSlots: (slotsByDay[key]?.length ?? 0) > 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return tiles;
  }, [slotsByDay]);

  const dayTimes = selectedDay ? (slotsByDay[selectedDay] ?? []) : [];

  function pickDay(key: string) {
    setSelectedDay(key);
    setSelectedSlot(null);
    setFormError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!selectedSlot) {
      setFormError("Escolha um dia e um horário antes de confirmar.");
      return;
    }
    if (name.trim().length < 2) {
      setFormError("Informe seu nome completo.");
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setFormError("Informe um e-mail válido — o convite será enviado para ele.");
      return;
    }
    if (!isValidPhone(whatsapp)) {
      setFormError("Informe um WhatsApp válido, com DDD.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await agendaApi.book(slug, {
        start: selectedSlot,
        name: name.trim(),
        email: email.trim(),
        whatsapp,
        notes: notes.trim(),
      });
      setBooking(result);
      setPhase("success");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setFormError(
          "Esse horário acabou de ser reservado por outra pessoa. Escolha outro — atualizamos a lista para você.",
        );
        void reloadSlots();
      } else if (err instanceof ApiError && err.status === 422) {
        setFormError(err.message || "Confira os dados informados e tente de novo.");
      } else {
        setFormError(
          "Não foi possível confirmar o agendamento. Tente novamente em instantes.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  const chips = info ? (
    <div className="agd-chips">
      <span className="agd-chip">
        <Icon.Clock size={13} />
        {durationLabel(info.duration_min)} por sessão
      </span>
      <span className="agd-chip">
        <Icon.Globe size={13} />
        Google Meet
      </span>
      <span className="agd-chip">
        <Icon.Pin size={13} />
        Horário de Brasília
      </span>
    </div>
  ) : null;

  return (
    <main className="agd-page">
      {/* Hero navy compacto */}
      <header className="agd-hero">
        <div className="agd-hero-inner">
          <Link href="/" className="agd-brand" aria-label="Achadinhos do Condomínio — início">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <BrandSignature className="agd-brand-logo" tone="light" />
          </Link>
          {phase === "loading" ? (
            <div className="agd-hero-skel" aria-hidden>
              <span className="agd-skel agd-skel-name" />
              <span className="agd-skel agd-skel-title" />
            </div>
          ) : (
            <>
              <h1 className="agd-name">{info?.display_name ?? "Agenda"}</h1>
              {info?.title ? <p className="agd-title">{info.title}</p> : null}
              {phase !== "unavailable" && phase !== "load-error" ? chips : null}
            </>
          )}
        </div>
      </header>

      <div className="agd-main">
        {phase === "loading" && (
          <section className="agd-card" aria-busy="true" aria-label="Carregando agenda">
            <span className="agd-skel agd-skel-eyebrow" />
            <div className="agd-skel-grid" aria-hidden>
              {Array.from({ length: 7 }).map((_, i) => (
                <span className="agd-skel agd-skel-day" key={i} />
              ))}
            </div>
            <span className="agd-skel agd-skel-eyebrow" />
            <div className="agd-skel-grid" aria-hidden>
              {Array.from({ length: 4 }).map((_, i) => (
                <span className="agd-skel agd-skel-pill" key={i} />
              ))}
            </div>
          </section>
        )}

        {phase === "unavailable" && (
          <section className="agd-card agd-state">
            <div className="agd-state-icon">
              <Icon.Calendar size={26} />
            </div>
            <h2 className="agd-state-title">Agenda indisponível no momento</h2>
            <p className="agd-state-text">
              Os agendamentos estão pausados por aqui. Volte em breve ou fale com a
              gente pelo site do Achadinhos do Condomínio.
            </p>
            <Link href="/" className="agd-cta agd-cta-inline">
              Ir para o Achadinhos
            </Link>
          </section>
        )}

        {phase === "load-error" && (
          <section className="agd-card agd-state">
            <div className="agd-state-icon">
              <Icon.X size={26} />
            </div>
            <h2 className="agd-state-title">Não conseguimos carregar a agenda</h2>
            <p className="agd-state-text">
              Verifique sua conexão e tente de novo.
            </p>
            <button
              type="button"
              className="agd-cta agd-cta-inline"
              onClick={() => window.location.reload()}
            >
              Tentar novamente
            </button>
          </section>
        )}

        {phase === "success" && booking && (
          <section className="agd-card agd-success" aria-live="polite">
            <div className="agd-success-check">
              <Icon.Check size={30} />
            </div>
            <h2 className="agd-success-title">Agendamento confirmado!</h2>
            <p className="agd-success-when">
              {longDate(booking.start.slice(0, 10))}
              <br />
              <strong>
                {timeLabel(booking.start)} – {timeLabel(booking.end)}
              </strong>{" "}
              · Horário de Brasília
            </p>
            {booking.meet_link ? (
              <a
                className="agd-cta agd-cta-inline"
                href={booking.meet_link}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon.ExternalLink size={15} />
                Abrir link do Google Meet
              </a>
            ) : null}
            <p className="agd-success-note">
              <Icon.Mail size={14} />
              O convite com o link da reunião foi enviado para <strong>{email.trim()}</strong>.
            </p>
          </section>
        )}

        {phase === "ready" && (
          <form className="agd-card" onSubmit={handleSubmit} noValidate>
            {/* 01 · Dia */}
            <fieldset className="agd-step">
              <legend className="agd-eyebrow">01 · Escolha o dia</legend>
              {dayTiles.some((t) => t.hasSlots) ? (
                <div className={cn("agd-days", reloadingSlots && "agd-dim")}>
                  {dayTiles.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      className="agd-day"
                      disabled={!t.hasSlots}
                      aria-pressed={selectedDay === t.key}
                      onClick={() => pickDay(t.key)}
                      aria-label={`${longDate(t.key)}${t.hasSlots ? "" : " — sem horários"}`}
                    >
                      <span className="agd-day-dow">{t.dow}</span>
                      <span className="agd-day-num">{t.dayNum}</span>
                      <span className="agd-day-mon">{t.month}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="agd-hint">
                  Nenhum horário livre nas próximas semanas. Volte em breve!
                </p>
              )}
            </fieldset>

            {/* 02 · Horário */}
            <fieldset className="agd-step">
              <legend className="agd-eyebrow">02 · Escolha o horário</legend>
              {!selectedDay ? (
                <p className="agd-hint">Escolha um dia acima para ver os horários.</p>
              ) : dayTimes.length === 0 ? (
                <p className="agd-hint">
                  Esse dia ficou sem horários livres. Escolha outro dia.
                </p>
              ) : (
                <>
                  <p className="agd-step-context">{longDate(selectedDay)}</p>
                  <div className={cn("agd-times", reloadingSlots && "agd-dim")}>
                    {dayTimes.map((iso) => (
                      <button
                        key={iso}
                        type="button"
                        className="agd-time"
                        aria-pressed={selectedSlot === iso}
                        onClick={() => {
                          setSelectedSlot(iso);
                          setFormError(null);
                        }}
                      >
                        {timeLabel(iso)}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </fieldset>

            {/* 03 · Dados */}
            <fieldset className="agd-step">
              <legend className="agd-eyebrow">03 · Seus dados</legend>
              <div className="agd-fields">
                <div className="prof-field">
                  <label className="prof-label" htmlFor="agd-name">
                    Nome completo
                  </label>
                  <input
                    id="agd-name"
                    className="prof-input"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Como devemos te chamar?"
                  />
                </div>
                <div className="agd-fields-row">
                  <div className="prof-field">
                    <label className="prof-label" htmlFor="agd-email">
                      E-mail
                    </label>
                    <input
                      id="agd-email"
                      className="prof-input"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="voce@exemplo.com.br"
                    />
                  </div>
                  <div className="prof-field">
                    <label className="prof-label" htmlFor="agd-whatsapp">
                      WhatsApp
                    </label>
                    <input
                      id="agd-whatsapp"
                      className="prof-input"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel-national"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                      placeholder="(11) 98765-4321"
                    />
                  </div>
                </div>
                <div className="prof-field">
                  <label className="prof-label" htmlFor="agd-notes">
                    Sobre o que vamos falar?
                  </label>
                  <textarea
                    id="agd-notes"
                    className="prof-textarea"
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Conte em poucas palavras o assunto da conversa (opcional)"
                  />
                </div>
              </div>
            </fieldset>

            {formError && (
              <div className="prof-alert error" role="alert">
                {formError}
              </div>
            )}

            <div className="agd-summary" aria-live="polite">
              {selectedSlot && selectedDay ? (
                <>
                  <Icon.Calendar size={15} />
                  <span>
                    {longDate(selectedDay)}, às <strong>{timeLabel(selectedSlot)}</strong>
                  </span>
                </>
              ) : (
                <span className="agd-hint">
                  Escolha o dia e o horário para confirmar.
                </span>
              )}
            </div>

            <button
              type="submit"
              className="agd-cta"
              disabled={submitting || !selectedSlot}
            >
              <Icon.Check size={16} />
              {submitting ? "Confirmando…" : "Confirmar agendamento"}
            </button>
            <p className="agd-consent">
              Ao confirmar, você concorda com os{" "}
              <Link href="/termos">Termos de Uso</Link> e a{" "}
              <Link href="/privacidade">Política de Privacidade</Link>; usamos
              seus dados só para criar a reunião e enviar o convite.
            </p>
          </form>
        )}

        <footer className="agd-foot">
          <Link href="/" className="auth-tertiary-link">
            Uma iniciativa do <strong>Achadinhos do Condomínio</strong>
          </Link>
        </footer>
      </div>
    </main>
  );
}
