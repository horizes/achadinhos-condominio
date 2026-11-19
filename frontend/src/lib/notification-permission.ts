// Permissão de notificações do navegador — spec: "Pedido de permissão de
// notificações DEPOIS DO CADASTRO, não na abertura". Pedida uma única vez,
// só quando o navegador ainda não decidiu; se o usuário dispensar, nunca
// pedimos de novo (o sino no app continua funcionando por HTTP).
const KEY = "achadinhos.notif_permission_asked";

export function requestPermissionAfterSignup(): void {
  if (typeof window === "undefined") return;
  if (typeof Notification === "undefined") return;
  try {
    if (Notification.permission !== "default") return;
    if (window.localStorage.getItem(KEY) === "1") return;
    window.localStorage.setItem(KEY, "1");
    void Notification.requestPermission();
  } catch {
    /* ambiente sem permissão Web Push — o sino in-app segue funcionando */
  }
}
