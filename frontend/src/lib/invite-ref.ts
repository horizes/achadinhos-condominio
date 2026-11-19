// Captura do link pessoal de indicação: "?convite=<user-id>" (spec: "Link
// pessoal de cada usuário; o app registra quem indicou quem"). O valor fica
// guardado neste aparelho e, no cadastro, vira o campo `referral` — o
// backend o grava em users.referred_by. Inválido é ignorado silenciosamente.
const KEY = "achadinhos.convite";
const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function captureInviteRefFromUrl(): void {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const v = (params.get("convite") ?? "").trim();
    if (UUID_RE.test(v)) window.localStorage.setItem(KEY, v);
  } catch {
    /* armazenamento indisponível — o cadastro segue sem indicar */
  }
}

export function getInviteRef(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const v = window.localStorage.getItem(KEY);
    return v && UUID_RE.test(v) ? v : undefined;
  } catch {
    return undefined;
  }
}
