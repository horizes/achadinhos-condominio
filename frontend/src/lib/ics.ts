// "Adicionar à agenda" (spec — Próximos eventos): gera um arquivo .ics real
// a partir dos dados do evento e baixa no aparelho; em celulares abre no app
// de calendário. Nenhum dado inventado — usa data/hora/local do próprio
// evento.
export function downloadIcs(opts: {
  title: string;
  description?: string;
  location?: string;
  /** ISO date-time (YYYY-MM-DD ou completo). */
  start: string;
  /** "HH:MM" — ausente/vazio = evento de dia inteiro. */
  time?: string;
  /** Duração em minutos (default 60 para eventos com hora). */
  durationMinutes?: number;
}) {
  const icsText = buildIcs(opts);
  const blob = new Blob([icsText], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const slug = opts.title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  a.href = url;
  a.download = `${slug || "evento"}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function stampUtc(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
}

function stampDateOnly(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
}

function escapeIcs(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

export function buildIcs(opts: {
  title: string;
  description?: string;
  location?: string;
  start: string;
  time?: string;
  durationMinutes?: number;
}): string {
  const day = opts.start.slice(0, 10);
  const hasTime = Boolean(opts.time && /^\d{1,2}:\d{2}/.test(opts.time.trim()));
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Achadinhos do Condominio//Agenda//PT",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
  ];
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}@achadinhoscondominio.com.br`;
  lines.push(`UID:${uid}`);
  if (hasTime) {
    // Horário local do condomínio (America/Sao_Paulo).
    const [hh, mm] = opts.time!.split(":").map((x) => Number(x));
    const start = new Date(`${day}T${pad(hh)}:${pad(mm)}:00`);
    const end = new Date(start.getTime() + (opts.durationMinutes ?? 60) * 60_000);
    const tz = "America/Sao_Paulo";
    const fmt = (d: Date) =>
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    lines.push(`DTSTART;TZID=${tz}:${fmt(start)}`);
    lines.push(`DTEND;TZID=${tz}:${fmt(end)}`);
  } else {
    const start = new Date(`${day}T00:00:00Z`);
    const end = new Date(start.getTime() + 86_400_000);
    lines.push(`DTSTART;VALUE=DATE:${stampDateOnly(start)}`);
    lines.push(`DTEND;VALUE=DATE:${stampDateOnly(end)}`);
  }
  lines.push(`SUMMARY:${escapeIcs(opts.title)}`);
  if (opts.location) lines.push(`LOCATION:${escapeIcs(opts.location)}`);
  if (opts.description) lines.push(`DESCRIPTION:${escapeIcs(opts.description)}`);
  lines.push(`DTSTAMP:${stampUtc(new Date())}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}
