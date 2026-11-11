"use client";

import { useEffect, useRef, useState } from "react";
import { providersApi, productsApi, sellersApi, eventsApi, getImageUrl, type AdminSeller, type ApiEvent } from "@/lib/api";
import { adaptProvider, adaptProduct } from "@/lib/adapters";
import type { Provider, Product } from "@/lib/types";
import { badgeLabel, cn } from "@/lib/utils";
import { CertSeal } from "../cert-seal";
import { Icon } from "../icons";

type SlideProvider = { kind: "provider"; data: Provider };
type SlideSeller   = { kind: "seller";   data: AdminSeller };
type SlideProduct  = { kind: "product";  data: Product  };
type SlideEvent    = { kind: "event";    data: ApiEvent };
type Slide = SlideProvider | SlideSeller | SlideProduct | SlideEvent;

interface HeroSliderProps {
  onProvider: (p: Provider) => void;
  onProduct:  (p: Product)  => void;
  onSeller:   (s: AdminSeller) => void;
  onWhatsapp?: (p: Provider) => void;
  onEvent?:   () => void;
}

// "AAAA-MM-DD" local de hoje, para comparar com event_date sem fuso.
function todayYmd(): string {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${m}-${d}`;
}

export function HeroSlider({ onProvider, onProduct, onSeller, onWhatsapp, onEvent }: HeroSliderProps) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch data
  useEffect(() => {
    void Promise.allSettled([
      providersApi.list({ highlight: true, sort: "rating", limit: 3 }),
      sellersApi.list({ highlight: true }),
      productsApi.list({ highlight: true, limit: 3 }),
      eventsApi.list(),
    ]).then(([provRes, sellRes, prodRes, evRes]) => {
      const provSlides: SlideProvider[] =
        provRes.status === "fulfilled"
          ? provRes.value.data.map((p) => ({ kind: "provider", data: adaptProvider(p) }))
          : [];
      const sellSlides: SlideSeller[] =
        sellRes.status === "fulfilled"
          ? sellRes.value.map((s) => ({ kind: "seller", data: s }))
          : [];
      const prodSlides: SlideProduct[] =
        prodRes.status === "fulfilled"
          ? prodRes.value.data.map((p) => ({ kind: "product", data: adaptProduct(p) }))
          : [];
      // Eventos: só destacados e futuros (hoje inclusive), os 3 mais próximos.
      const today = todayYmd();
      const evSlides: SlideEvent[] =
        evRes.status === "fulfilled"
          ? evRes.value
              .filter((ev) => ev.highlight && ev.event_date.slice(0, 10) >= today)
              .sort((a, b) =>
                `${a.event_date.slice(0, 10)} ${a.event_time}`.localeCompare(
                  `${b.event_date.slice(0, 10)} ${b.event_time}`,
                ),
              )
              .slice(0, 3)
              .map((ev) => ({ kind: "event", data: ev }))
          : [];
      setSlides([...sellSlides, ...provSlides, ...prodSlides, ...evSlides]);
    });
  }, []);

  // Auto-advance
  function startTimer() {
    stopTimer();
    timerRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % Math.max(slides.length, 1));
    }, 4000);
  }
  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
  }

  // Manual navigation pauses the auto-advance (mirrors the dots' behaviour); the
  // timer resumes when the pointer leaves the slider (onMouseLeave).
  function goTo(i: number) {
    stopTimer();
    const n = slides.length;
    setActive(((i % n) + n) % n);
  }
  const next = () => goTo(active + 1);
  const prev = () => goTo(active - 1);

  const counter =
    `${String(active + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;

  useEffect(() => {
    if (slides.length > 1) startTimer();
    return stopTimer;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  // Sync scroll position when active changes
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const child = track.children[active] as HTMLElement | undefined;
    if (child) {
      track.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
    }
  }, [active]);

  // Detect scroll-driven slide change
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let timeout: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const idx = Math.round(track.scrollLeft / track.offsetWidth);
        setActive(idx);
      }, 80);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => { track.removeEventListener("scroll", onScroll); clearTimeout(timeout); };
  }, []);

  if (slides.length === 0) return <div className="hero-slider-skeleton" />;

  return (
    <div
      className="section"
      onMouseEnter={stopTimer}
      onMouseLeave={() => slides.length > 1 && startTimer()}
    >
      <div className="hero-slider">
        {/* Track */}
        <div className="hero-slider-track" ref={trackRef}>
          {slides.map((slide, i) =>
            slide.kind === "provider" ? (
              <ProviderSlide
                key={slide.data.id}
                provider={slide.data}
                index={i}
                onClick={() => onProvider(slide.data)}
                onWhatsapp={onWhatsapp ? () => onWhatsapp(slide.data) : undefined}
              />
            ) : slide.kind === "seller" ? (
              <SellerSlide
                key={slide.data.id}
                seller={slide.data}
                index={i}
                onClick={() => onSeller(slide.data)}
              />
            ) : slide.kind === "event" ? (
              <EventSlide
                key={slide.data.id}
                event={slide.data}
                index={i}
                onClick={() => onEvent?.()}
              />
            ) : (
              <ProductSlide
                key={slide.data.id}
                product={slide.data}
                index={i}
                onClick={() => onProduct(slide.data)}
              />
            )
          )}
        </div>

        {slides.length > 1 && (
          <>
            {/* Contador 01 / 04 */}
            <div className="hero-slider-count">{counter}</div>

            {/* Setas prev / next */}
            <button
              type="button"
              className="hero-slider-nav prev"
              onClick={prev}
              aria-label="Slide anterior"
            >
              <Icon.ChevLeft size={18} />
            </button>
            <button
              type="button"
              className="hero-slider-nav next"
              onClick={next}
              aria-label="Próximo slide"
            >
              <Icon.ChevRight size={18} />
            </button>

            {/* Progresso segmentado */}
            <div className="hero-progress" aria-label="Slides">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={cn("hero-progress-seg", i === active && "active")}
                  onClick={() => goTo(i)}
                  aria-label={`Ir para o slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Provider slide ────────────────────────────────────────────────────────────

function ProviderSlide({ provider: p, onClick, onWhatsapp }: { provider: Provider; index: number; onClick: () => void; onWhatsapp?: () => void }) {
  return (
    <div className="hero hero-slide" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}>
      <div className="hero-slide-content">
        <div className="hero-tag">
          <Icon.Crown size={11} /> Destaque do dia
        </div>
        <div className="hero-title">
          {p.name}
          <CertSeal tier={p.certTier} style={{ marginLeft: 8, verticalAlign: "middle" }} />
        </div>
        {p.desc?.trim() && <div className="hero-meta hero-meta--desc">{p.desc}</div>}
        <div className="hero-meta">
          <div className="hero-rating"><Icon.Star size={11} /> {p.rating.toFixed(1).replace(".", ",")}</div>
          <span className="hero-divider" />
          <span>{p.reviews} avaliações</span>
          <span className="hero-divider" />
          <span>{p.distance}</span>
        </div>
        {p.badge && <div className="hero-badge">{badgeLabel(p.badge)}</div>}
        <div className="hero-slide-cta">
          <button
            type="button"
            className="hero-cta-btn primary"
            onClick={(e) => { e.stopPropagation(); onClick(); }}
          >
            Ver perfil
          </button>
          {onWhatsapp && (
            <button
              type="button"
              className="hero-cta-btn ghost"
              onClick={(e) => { e.stopPropagation(); onWhatsapp(); }}
            >
              <Icon.Whatsapp size={15} /> WhatsApp
            </button>
          )}
        </div>
      </div>
      <div className="hero-slide-media">
        {p.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={getImageUrl(p.logoUrl)}
            alt={p.name}
            className="hero-product-img"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="hero-avatar-ring">
            <span className="hero-avatar-letter">{p.avatar}</span>
          </div>
        )}
        <div className="hero-slide-cat">{p.catLabel}</div>
      </div>
    </div>
  );
}

// ── Seller slide ──────────────────────────────────────────────────────────────

function SellerSlide({ seller: s, onClick }: { seller: AdminSeller; index: number; onClick: () => void }) {
  return (
    <div className="hero hero-slide" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}>
      <div className="hero-slide-content">
        <div className="hero-tag">
          <Icon.Crown size={11} /> Empresa em destaque
        </div>
        <div className="hero-title">{s.name}</div>
        <div className="hero-meta hero-meta--desc">
          {s.description?.trim() || "Empresa parceira"}
        </div>
        {s.partner && <div className="hero-badge">Parceira</div>}
      </div>
      <div className="hero-slide-media">
        {s.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={getImageUrl(s.logo_url)} alt={s.name} className="hero-product-img" loading="lazy" decoding="async" />
        ) : (
          <div className="hero-avatar-ring">
            <span className="hero-avatar-letter">{s.name.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Event slide ───────────────────────────────────────────────────────────────

// "2026-07-20" -> "domingo, 20 de julho" (data por extenso, sem fuso).
function formatEventLongDate(iso: string): string {
  const ymd = iso.slice(0, 10);
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function EventSlide({ event: ev, onClick }: { event: ApiEvent; index: number; onClick: () => void }) {
  return (
    <div className="hero hero-slide" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}>
      <div className="hero-slide-content">
        <div className="hero-tag">
          <Icon.Calendar size={11} /> Evento
        </div>
        <div className="hero-title">{ev.title}</div>
        <div className="hero-meta hero-event-meta">
          <span className="hero-event-date">{formatEventLongDate(ev.event_date)}</span>
          {ev.event_time && (
            <>
              <span className="hero-divider" />
              <span>{ev.event_time}</span>
            </>
          )}
          {ev.location && (
            <>
              <span className="hero-divider" />
              <span className="hero-event-place">{ev.location}</span>
            </>
          )}
        </div>
        <div className="hero-slide-cta">
          <button
            type="button"
            className="hero-cta-btn primary"
            onClick={(e) => { e.stopPropagation(); onClick(); }}
          >
            Ver eventos
          </button>
        </div>
      </div>
      <div className="hero-slide-media">
        {ev.banner_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={getImageUrl(ev.banner_url)}
            alt={ev.title}
            className="hero-event-banner"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="hero-event-placeholder">
            <Icon.Calendar size={28} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Product slide ─────────────────────────────────────────────────────────────

function ProductSlide({ product: p, onClick }: { product: Product; index: number; onClick: () => void }) {
  const photo = p.photos?.[0];
  const hasPrice = p.price > 0;
  return (
    <div className="hero hero-slide hero-slide--product" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}>
      <div className="hero-slide-content">
        <div className="hero-tag hero-tag--product">
          <Icon.Box size={11} /> Shopping em destaque
        </div>
        <div className="hero-title hero-title--product">{p.name}</div>
        {hasPrice ? (
          <div className="hero-price-row">
            {p.oldPrice && (
              <span className="hero-old-price">
                R$ {p.oldPrice.toFixed(2).replace(".", ",")}
              </span>
            )}
            <span className="hero-price">
              R$ {p.price.toFixed(2).replace(".", ",")}
            </span>
          </div>
        ) : p.desc?.trim() ? (
          <div className="hero-meta hero-meta--desc">{p.desc}</div>
        ) : null}
        <div className="hero-meta">
          <div className="hero-rating"><Icon.Star size={11} /> {p.rating.toFixed(1).replace(".", ",")}</div>
          <span className="hero-divider" />
          <span>{p.reviews} avaliações</span>
          {p.badge && <><span className="hero-divider" /><span className="hero-oferta">{p.badge}</span></>}
        </div>
      </div>
      <div className="hero-slide-media">
        {photo ? (
          <img
            src={getImageUrl(photo.url)}
            alt={p.name}
            className="hero-product-img"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="hero-product-placeholder">
            <Icon.Box size={28} />
          </div>
        )}
      </div>
    </div>
  );
}
