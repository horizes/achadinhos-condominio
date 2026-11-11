"use client";

import { useEffect, useMemo, useState } from "react";
import { eventsApi, type ApiEvent } from "@/lib/api";
import { Icon } from "../icons";
import { cn } from "@/lib/utils";

interface EventsScreenProps {
  onBack: () => void;
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const DOW = ["D", "S", "T", "Q", "Q", "S", "S"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function keyOf(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

export function EventsScreen({ onBack }: EventsScreenProps) {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-11
  const [selectedKey, setSelectedKey] = useState(
    keyOf(today.getFullYear(), today.getMonth(), today.getDate()),
  );

  useEffect(() => {
    let alive = true;
    setLoading(true);
    void eventsApi
      .list()
      .then((list) => {
        if (alive) setEvents(list);
      })
      .catch(() => {
        if (alive) setEvents([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Mapa "AAAA-MM-DD" -> eventos (ordenados por hora).
  const byDay = useMemo(() => {
    const map = new Map<string, ApiEvent[]>();
    for (const ev of events) {
      const k = ev.event_date.slice(0, 10);
      const arr = map.get(k);
      if (arr) arr.push(ev);
      else map.set(k, [ev]);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a.event_time.localeCompare(b.event_time));
    }
    return map;
  }, [events]);

  const todayKey = keyOf(today.getFullYear(), today.getMonth(), today.getDate());
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const leadingBlanks = new Date(viewYear, viewMonth, 1).getDay(); // 0=Dom

  const cells: Array<number | null> = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }
  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  const selectedEvents = byDay.get(selectedKey) ?? [];
  const selectedLabel = (() => {
    const [y, m, d] = selectedKey.split("-").map(Number);
    return `${d} de ${MESES[m - 1].toLowerCase()}`;
  })();

  return (
    <div className="screen">
      <div className="screen-header">
        <button type="button" className="screen-back" onClick={onBack} aria-label="Voltar">
          <Icon.ChevLeft size={16} />
        </button>
        <div className="screen-title">Calendário</div>
        <div className="screen-actions" />
      </div>

      <div className="screen-body">
        <div className="cal-card">
          <div className="cal-nav">
            <button type="button" className="cal-nav-btn" onClick={prevMonth} aria-label="Mês anterior">
              <Icon.ChevLeft size={18} />
            </button>
            <div className="cal-nav-label">
              {MESES[viewMonth]} {viewYear}
            </div>
            <button type="button" className="cal-nav-btn" onClick={nextMonth} aria-label="Próximo mês">
              <Icon.ChevRight size={18} />
            </button>
          </div>

          <div className="cal-grid">
            {DOW.map((d, i) => (
              <div key={`dow-${i}`} className="cal-dow">
                {d}
              </div>
            ))}
            {cells.map((d, i) => {
              if (d === null) return <div key={`b-${i}`} className="cal-cell empty" />;
              const k = keyOf(viewYear, viewMonth, d);
              const hasEvent = byDay.has(k);
              return (
                <button
                  key={k}
                  type="button"
                  className={cn(
                    "cal-cell",
                    hasEvent && "has-event",
                    k === todayKey && "today",
                    k === selectedKey && "selected",
                  )}
                  onClick={() => setSelectedKey(k)}
                >
                  {d}
                  {hasEvent && <span className="cal-dot" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="cal-day-title">{selectedLabel}</div>

        {loading ? (
          <div className="admin-empty">Carregando…</div>
        ) : selectedEvents.length === 0 ? (
          <div className="empty-state">
            <Icon.Calendar size={46} />
            <div className="empty-state-title">Nenhum evento neste dia</div>
            <div className="empty-state-sub">Toque em um dia marcado para ver os eventos</div>
          </div>
        ) : (
          <div className="cal-event-list">
            {selectedEvents.map((ev) => (
              <div key={ev.id} className="cal-event-card">
                <div className="cal-event-time">{ev.event_time || "—"}</div>
                <div className="cal-event-body">
                  <div className="cal-event-title">{ev.title}</div>
                  {ev.location && <div className="cal-event-loc">📍 {ev.location}</div>}
                  {ev.description && <div className="cal-event-desc">{ev.description}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
