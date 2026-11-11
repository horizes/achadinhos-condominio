"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { eventsApi, bannersApi, getImageUrl, type ApiEvent, type ApiBanner } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Icon } from "../icons";

// Abre o destino de um anúncio: URL absoluta em nova aba, caminho do site na
// própria aba (SPA). Sem link, o clique não faz nada.
export function openBannerLink(router: { push: (p: string) => void }, b: ApiBanner) {
  const link = b.link_url.trim();
  if (!link) return;
  if (/^https?:\/\//i.test(link)) {
    window.open(link, "_blank", "noopener");
  } else if (link.startsWith("/")) {
    router.push(link);
  }
}

// ── Slides do mural (compartilhados entre desktop e mobile) ───────────────────

type MuralSlide =
  | { kind: "hero"; data: ApiBanner }    // banner "Slide principal" do admin
  | { kind: "welcome" }                  // fallback institucional (sem banner hero)
  | { kind: "event"; data: ApiEvent }    // eventos futuros
  | { kind: "ad"; data: ApiBanner };     // anúncios (placement "eventos")

interface EventsWidgetProps {
  onSeeAll: () => void;
  onExplore?: () => void;
}

// "AAAA-MM-DD" local de hoje (sem fuso — mesma regra do hero-slider).
function todayYmd(): string {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${m}-${d}`;
}

// "2026-07-20" -> "dom, 20 jul"
function formatShortDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso.slice(0, 10);
  return new Date(y, m - 1, d)
    .toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })
    .replace(/\./g, "");
}

const MONTH_ABBR = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
] as const;

// "19:00" -> "19h00" (kicker do slide de evento).
function formatTimeKicker(time: string): string {
  const [h, min] = time.split(":");
  if (!h) return time;
  return `${h}h${min ?? "00"}`;
}

// "19:00" -> "19h" · "19:30" -> "19h30" (lista de próximos eventos).
function formatTimeShort(time: string): string {
  const [h, min] = time.split(":");
  if (!h) return time;
  return min && min !== "00" ? `${Number(h)}h${min}` : `${Number(h)}h`;
}

// "03 jul · 19h00 · Salão de festas" (uppercase via CSS).
function eventKicker(ev: ApiEvent): string {
  const ymd = ev.event_date.slice(0, 10);
  const [, m, d] = ymd.split("-").map(Number);
  const parts: string[] = [];
  if (m && d) parts.push(`${String(d).padStart(2, "0")} ${MONTH_ABBR[m - 1]}`);
  if (ev.event_time) parts.push(formatTimeKicker(ev.event_time));
  if (ev.location) parts.push(ev.location);
  return parts.join(" · ");
}

// Período de exibição de um anúncio: "20–31 jul" ou "20 jul – 5 ago".
function formatPeriod(starts: string | null, ends: string | null): string | null {
  const parse = (iso: string | null) => {
    if (!iso) return null;
    const [, m, d] = iso.slice(0, 10).split("-").map(Number);
    return m && d ? { m, d } : null;
  };
  const s = parse(starts);
  const e = parse(ends);
  if (s && e) {
    if (s.m === e.m) return `${s.d}–${e.d} ${MONTH_ABBR[s.m - 1]}`;
    return `${s.d} ${MONTH_ABBR[s.m - 1]} – ${e.d} ${MONTH_ABBR[e.m - 1]}`;
  }
  if (s) return `a partir de ${s.d} ${MONTH_ABBR[s.m - 1]}`;
  if (e) return `até ${e.d} ${MONTH_ABBR[e.m - 1]}`;
  return null;
}

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"] as const;

// Widget "Eventos do condomínio" da home: mural com slide principal (banners do
// admin ou boas-vindas), eventos futuros e anúncios. Desktop = card branco com
// slider em crossfade + painel de calendário fixo; mobile = carrossel compacto.
export function EventsWidget({ onSeeAll, onExplore }: EventsWidgetProps) {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [ads, setAds] = useState<ApiBanner[]>([]);
  const [heroes, setHeroes] = useState<ApiBanner[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void Promise.allSettled([
      eventsApi.list(),
      bannersApi.list("eventos"),
      bannersApi.list("hero"),
    ]).then(([evRes, adRes, heroRes]) => {
      if (evRes.status === "fulfilled") setEvents(evRes.value);
      if (adRes.status === "fulfilled") setAds(adRes.value);
      if (heroRes.status === "fulfilled") setHeroes(heroRes.value);
      setLoaded(true);
    });
  }, []);

  const today = todayYmd();

  const upcoming = useMemo(
    () =>
      events
        .filter((ev) => ev.event_date.slice(0, 10) >= today)
        .sort((a, b) =>
          `${a.event_date.slice(0, 10)} ${a.event_time}`.localeCompare(
            `${b.event_date.slice(0, 10)} ${b.event_time}`,
          ),
        ),
    [events, today],
  );

  const slides = useMemo<MuralSlide[]>(() => {
    const main: MuralSlide[] =
      heroes.length > 0
        ? heroes.map((b) => ({ kind: "hero" as const, data: b }))
        : [{ kind: "welcome" as const }];
    const evSlides: MuralSlide[] = upcoming
      .slice(0, 4)
      .map((ev) => ({ kind: "event" as const, data: ev }));
    const adSlides: MuralSlide[] = ads.map((b) => ({ kind: "ad" as const, data: b }));
    return [...main, ...evSlides, ...adSlides];
  }, [heroes, upcoming, ads]);

  if (!loaded) return null;

  return (
    <>
      <DesktopMural
        slides={slides}
        events={events}
        upcoming={upcoming}
        today={today}
        onSeeAll={onSeeAll}
        onExplore={onExplore}
      />
      <MobileMural
        slides={slides}
        events={events}
        upcoming={upcoming}
        today={today}
        onSeeAll={onSeeAll}
        onExplore={onExplore}
      />
    </>
  );
}

// ══════════════════════════════ DESKTOP (≥768px) ═════════════════════════════

interface MuralLayoutProps {
  slides: MuralSlide[];
  events: ApiEvent[];
  upcoming: ApiEvent[];
  today: string;
  onSeeAll: () => void;
  onExplore?: () => void;
}

function DesktopMural({ slides, events, upcoming, today, onSeeAll, onExplore }: MuralLayoutProps) {
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const n = slides.length;

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
  }
  function startTimer() {
    stopTimer();
    timerRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % Math.max(n, 1));
    }, 4000);
  }
  // Setas e dots reiniciam o autoplay (não só pausam).
  function goTo(i: number) {
    setActive(((i % n) + n) % n);
    if (n > 1) startTimer();
  }

  useEffect(() => {
    if (n > 1) startTimer();
    return stopTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  const counter =
    `${String(active + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}`;

  return (
    <div className="section events-widget-section ew-desktop">
      <div className="ewd-card">
        <div
          className="ewd-slider"
          onMouseEnter={stopTimer}
          onMouseLeave={() => n > 1 && startTimer()}
        >
          {slides.map((slide, i) => (
            <DesktopSlide
              key={slideKey(slide, i)}
              slide={slide}
              active={i === active}
              onSeeAll={onSeeAll}
              onExplore={onExplore}
            />
          ))}

          {n > 1 && (
            <>
              <div className="ewd-counter">{counter}</div>
              <div className="ewd-controls">
                <div className="ewd-dots" aria-label="Slides do mural">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={cn("ewd-dot", i === active && "active")}
                      onClick={() => goTo(i)}
                      aria-label={`Ir para o slide ${i + 1}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="ewd-nav"
                  onClick={() => goTo(active - 1)}
                  aria-label="Slide anterior"
                >
                  <Icon.ChevLeft size={16} />
                </button>
                <button
                  type="button"
                  className="ewd-nav"
                  onClick={() => goTo(active + 1)}
                  aria-label="Próximo slide"
                >
                  <Icon.ChevRight size={16} />
                </button>
              </div>
            </>
          )}
        </div>

        <DesktopCalendar events={events} upcoming={upcoming} today={today} onSeeAll={onSeeAll} />
      </div>
    </div>
  );
}

function slideKey(slide: MuralSlide, i: number): string {
  if (slide.kind === "welcome") return "welcome";
  return `${slide.kind}-${slide.data.id}-${i}`;
}

function DesktopSlide({
  slide,
  active,
  onSeeAll,
  onExplore,
}: {
  slide: MuralSlide;
  active: boolean;
  onSeeAll: () => void;
  onExplore?: () => void;
}) {
  const router = useRouter();

  if (slide.kind === "welcome") {
    return (
      <div className={cn("ewd-slide", active && "active")}>
        <div className="ewd-texture" aria-hidden="true" />
        <div className="ewd-glow" aria-hidden="true" />
        <div className="ewd-chip">
          <Icon.Sparkle size={12} /> Destaque
        </div>
        <div className="ewd-content">
          <div className="ewd-kicker">Bem-vindo ao seu condomínio</div>
          <h3 className="ewd-title">Aqui você não arrisca, você escolhe com segurança.</h3>
          <p className="ewd-desc">
            Serviços, empresas e produtos de confiança — todos verificados pela
            Certificação Achadinhos.
          </p>
          <div className="ewd-ctas">
            <button type="button" className="ewd-cta" onClick={() => onExplore?.()}>
              <Icon.Sparkle size={14} /> Explorar serviços
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (slide.kind === "event") {
    const ev = slide.data;
    return (
      <div className={cn("ewd-slide", active && "active")}>
        {ev.banner_url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getImageUrl(ev.banner_url)} alt="" className="ewd-bg" loading="lazy" decoding="async" />
            <div className="ewd-shade strong" aria-hidden="true" />
          </>
        ) : (
          <>
            <div className="ewd-texture" aria-hidden="true" />
            <div className="ewd-glow" aria-hidden="true" />
          </>
        )}
        <div className="ewd-chip">
          <Icon.Calendar size={12} /> {ev.highlight ? "Evento em destaque" : "Evento"}
        </div>
        <div className="ewd-content">
          <div className="ewd-kicker">{eventKicker(ev)}</div>
          <h3 className="ewd-title">{ev.title}</h3>
          {ev.description.trim() && <p className="ewd-desc">{ev.description}</p>}
          <div className="ewd-ctas">
            <button type="button" className="ewd-cta" onClick={onSeeAll}>
              <Icon.Calendar size={14} /> Ver eventos
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Banner hero (slide principal) ou anúncio do admin.
  const b = slide.data;
  const isAd = slide.kind === "ad";
  const clickable = b.link_url.trim() !== "";
  const period = formatPeriod(b.starts_at, b.ends_at);
  const kicker = isAd
    ? `Patrocinado${period ? ` · ${period}` : ""}`
    : `Destaque do condomínio${period ? ` · ${period}` : ""}`;

  return (
    <div
      className={cn("ewd-slide", isAd && "ewd-slide--ad", active && "active", clickable && "clickable")}
      onClick={clickable ? () => openBannerLink(router, b) : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable && active ? 0 : undefined}
      onKeyDown={(e) => {
        if (clickable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          openBannerLink(router, b);
        }
      }}
    >
      {b.image_url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getImageUrl(b.image_url)} alt="" className="ewd-bg" loading="lazy" decoding="async" />
          <div className="ewd-shade" aria-hidden="true" />
        </>
      ) : (
        <>
          <div className="ewd-texture" aria-hidden="true" />
          <div className="ewd-glow" aria-hidden="true" />
        </>
      )}
      {isAd ? (
        <div className="ewd-chip ghost">
          <Icon.Tag size={12} /> Anúncio
        </div>
      ) : (
        <div className="ewd-chip">
          <Icon.Star size={12} /> Destaque
        </div>
      )}
      <div className="ewd-content">
        <div className="ewd-kicker">{kicker}</div>
        {b.title.trim() && <h3 className="ewd-title">{b.title}</h3>}
        {b.subtitle.trim() && <p className="ewd-desc">{b.subtitle}</p>}
        {clickable && (
          <div className="ewd-ctas">
            <button
              type="button"
              className="ewd-cta"
              onClick={(e) => {
                e.stopPropagation();
                openBannerLink(router, b);
              }}
            >
              Saiba mais
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Painel lateral: calendário navegável por mês + próximos eventos.
// Chips de data no estilo da agenda pública (dia grande, mês e dia da semana
// em destaque), mostrando apenas os dias com eventos próximos.
function agendaDateChips(upcoming: ApiEvent[], today: string, limit = 4) {
  const seen = new Set<string>();
  const chips: ApiEvent[] = [];
  for (const ev of upcoming) {
    const d = (ev.event_date || "").slice(0, 10);
    if (!d || seen.has(d)) continue;
    seen.add(d);
    chips.push(ev);
    if (chips.length >= limit) break;
  }
  return chips;
}

function agendaDateParts(ymd: string) {
  const value = new Date(ymd + "T12:00:00-03:00");
  const day = ymd.slice(8, 10);
  const month = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "America/Sao_Paulo" }).format(value).replace(".", "").toUpperCase();
  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "America/Sao_Paulo" }).format(value).replace(".", "").toUpperCase();
  return { day, month, weekday };
}

function agendaDateChip(ev: ApiEvent, today: string) {
  const ymd = (ev.event_date || "").slice(0, 10);
  const { day, month, weekday } = agendaDateParts(ymd);
  return (
    <div
      key={ymd}
      className={cn("ewd-agenda-date", ymd === today && "is-today")}
      title={ev.title}
    >
      <strong>{day}</strong>
      <span>{month}</span>
      <small>{weekday}</small>
    </div>
  );
}

function DesktopCalendar({
  events,
  upcoming,
  today,
  onSeeAll,
}: {
  events: ApiEvent[];
  upcoming: ApiEvent[];
  today: string;
  onSeeAll: () => void;
}) {
  const chips = agendaDateChips(upcoming, today);

  return (
    <div
      className="ewd-cal"
      onClick={onSeeAll}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSeeAll();
        }
      }}
    >
      <div className="ewd-cal-head">
        <div className="ewd-cal-month">Próximos eventos</div>
      </div>

      {chips.length === 0 ? (
        <div className="ewd-cal-empty">Nenhum evento agendado.</div>
      ) : (
        <div className="ewd-agenda-dates">
          {chips.map((ev) => agendaDateChip(ev, today))}
        </div>
      )}

      {chips.length === 0 ? null : <div className="ewd-cal-divider" aria-hidden="true" />}

      {upcoming.length === 0 ? null : (
        <div className="ewd-cal-next">
          {upcoming.slice(0, 3).map((ev, i) => {
            const ymd = ev.event_date.slice(0, 10);
            const [, m, d] = ymd.split("-").map(Number);
            const meta = [
              ev.event_time ? formatTimeShort(ev.event_time) : "",
              ev.location,
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <div key={ev.id} className="ewd-cal-item">
                <div className={cn("ewd-cal-tile", i === 0 && "first")}>
                  <span className="ewd-cal-tile-month">
                    {m ? MONTH_ABBR[m - 1].toUpperCase() : "—"}
                  </span>
                  <span className="ewd-cal-tile-day">
                    {d ? String(d).padStart(2, "0") : "--"}
                  </span>
                </div>
                <div className="ewd-cal-item-main">
                  <div className="ewd-cal-item-title">{ev.title}</div>
                  {meta && <div className="ewd-cal-item-meta">{meta}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════ MOBILE (<768px) ══════════════════════════════

type MobileSlide = { kind: "calendar" } | MuralSlide;

function MobileMural({ slides, events, upcoming, today, onSeeAll, onExplore }: MuralLayoutProps) {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const mobileSlides = useMemo<MobileSlide[]>(
    () => [{ kind: "calendar" }, ...slides],
    [slides],
  );
  const n = mobileSlides.length;

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
  }
  function startTimer() {
    stopTimer();
    timerRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % Math.max(n, 1));
    }, 5000);
  }
  function goTo(i: number) {
    stopTimer();
    setActive(((i % n) + n) % n);
  }

  useEffect(() => {
    if (n > 1) startTimer();
    return stopTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const child = track.children[active] as HTMLElement | undefined;
    if (child) track.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
  }, [active]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let timeout: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setActive(Math.round(track.scrollLeft / track.offsetWidth));
      }, 80);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => { track.removeEventListener("scroll", onScroll); clearTimeout(timeout); };
  }, []);

  return (
    <div
      className="section events-widget-section ew-mobile"
      onMouseEnter={stopTimer}
      onMouseLeave={() => n > 1 && startTimer()}
    >
      <div className="section-title">
        <h2>Eventos do condomínio</h2>
        <button type="button" className="see-all" onClick={onSeeAll}>
          Ver tudo <Icon.ChevRight size={13} />
        </button>
      </div>

      <div className="events-widget">
        <div className="events-widget-track" ref={trackRef}>
          {mobileSlides.map((slide, i) =>
            slide.kind === "calendar" ? (
              <CalendarSlideMobile
                key="cal"
                events={events}
                upcoming={upcoming}
                today={today}
                onSeeAll={onSeeAll}
              />
            ) : slide.kind === "welcome" ? (
              <WelcomeSlideMobile key="welcome" onExplore={onExplore} />
            ) : slide.kind === "event" ? (
              <EventBannerSlide key={`ev-${slide.data.id}`} event={slide.data} onClick={onSeeAll} />
            ) : (
              <BannerSlideMobile
                key={`${slide.kind}-${slide.data.id}-${i}`}
                banner={slide.data}
                isAd={slide.kind === "ad"}
                onClick={() => openBannerLink(router, slide.data)}
              />
            ),
          )}
        </div>

        {n > 1 && (
          <div className="events-widget-dots" aria-label="Slides de eventos">
            {mobileSlides.map((_, i) => (
              <button
                key={i}
                type="button"
                className={cn("events-widget-dot", i === active && "active")}
                onClick={() => goTo(i)}
                aria-label={`Ir para o slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Slide 1 (mobile): calendário do mês + próximos eventos ────────────────────

function CalendarSlideMobile({
  events,
  upcoming,
  today,
  onSeeAll,
}: {
  events: ApiEvent[];
  upcoming: ApiEvent[];
  today: string;
  onSeeAll: () => void;
}) {
  const chips = agendaDateChips(upcoming, today);

  return (
    <div className="events-widget-slide events-widget-cal" onClick={onSeeAll} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSeeAll(); } }}>
      <div className="ew-cal">
        <div className="ew-cal-month">Próximos eventos</div>
        {chips.length === 0 ? (
          <div className="ew-next-empty">Nenhum evento agendado.</div>
        ) : (
          <div className="ew-agenda-dates">
            {chips.map((ev) => agendaDateChip(ev, today))}
          </div>
        )}
      </div>
      {chips.length === 0 ? null : (
      <div className="ew-next">
        <div className="ew-next-title">Próximos eventos</div>
        {upcoming.length === 0 ? (
          <div className="ew-next-empty">Nenhum evento agendado.</div>
        ) : (
          upcoming.slice(0, 3).map((ev) => (
            <div key={ev.id} className="ew-next-item">
              <span className="ew-next-date">{formatShortDate(ev.event_date)}</span>
              <span className="ew-next-name">{ev.title}</span>
              {ev.event_time && <span className="ew-next-time">{ev.event_time}</span>}
            </div>
          ))
        )}
      </div>
      )}
    </div>
  );
}

// ── Slide de boas-vindas (mobile, fallback sem banner hero) ───────────────────

function WelcomeSlideMobile({ onExplore }: { onExplore?: () => void }) {
  return (
    <div className="events-widget-slide ew-welcome">
      <div className="ew-welcome-kicker">Bem-vindo ao seu condomínio</div>
      <div className="ew-welcome-title">Aqui você não arrisca, você escolhe com segurança.</div>
      <p className="ew-welcome-desc">
        Serviços e empresas verificadas pela Certificação Achadinhos.
      </p>
      <button type="button" className="ew-welcome-cta" onClick={() => onExplore?.()}>
        <Icon.Sparkle size={13} /> Explorar serviços
      </button>
    </div>
  );
}

// ── Slides de banner (evento, anúncio ou slide principal) — mobile ────────────

function EventBannerSlide({ event: ev, onClick }: { event: ApiEvent; onClick: () => void }) {
  return (
    <div className="events-widget-slide events-widget-banner" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}>
      {ev.banner_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={getImageUrl(ev.banner_url)} alt={ev.title} className="ew-banner-img" loading="lazy" decoding="async" />
      ) : (
        <div className="ew-fallback" aria-hidden="true">
          <Icon.Calendar size={56} className="ew-fallback-icon" />
        </div>
      )}
      <div className="ew-banner-overlay">
        <div className="ew-banner-date">
          <Icon.Calendar size={11} /> {formatShortDate(ev.event_date)}
          {ev.event_time ? ` · ${ev.event_time}` : ""}
        </div>
        <div className="ew-banner-title">{ev.title}</div>
      </div>
    </div>
  );
}

function BannerSlideMobile({
  banner: b,
  isAd,
  onClick,
}: {
  banner: ApiBanner;
  isAd: boolean;
  onClick: () => void;
}) {
  const clickable = b.link_url.trim() !== "";
  return (
    <div
      className={cn("events-widget-slide events-widget-banner", clickable && "clickable")}
      onClick={onClick}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={(e) => { if (clickable && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onClick(); } }}
    >
      {b.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={getImageUrl(b.image_url)} alt={b.title || (isAd ? "Anúncio" : "Destaque")} className="ew-banner-img" loading="lazy" decoding="async" />
      ) : (
        <div className={cn("ew-fallback", isAd && "ad")} aria-hidden="true">
          <Icon.Tag size={56} className="ew-fallback-icon" />
        </div>
      )}
      {isAd && <span className="ew-ad-tag">Publicidade</span>}
      {(b.title.trim() || b.subtitle.trim()) && (
        <div className="ew-banner-overlay">
          {b.title.trim() && <div className="ew-banner-title">{b.title}</div>}
          {b.subtitle.trim() && <div className="ew-banner-sub">{b.subtitle}</div>}
        </div>
      )}
    </div>
  );
}
