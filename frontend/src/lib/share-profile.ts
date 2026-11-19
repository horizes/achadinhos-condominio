// Compartilhamento de perfil (spec: "link com prévia (foto, nome, nota)").
// Usa o compartilhamento nativo do aparelho quando existe (prévia vem das
// Open Graph tags de /empresa/[id]); senão, abre o WhatsApp com o link.
export async function shareProfile(opts: {
  title: string;
  text: string;
  url: string;
}): Promise<"shared" | "cancelled" | "whatsapp"> {
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  if (nav && typeof nav.share === "function") {
    try {
      await nav.share({ title: opts.title, text: opts.text, url: opts.url });
      return "shared";
    } catch (err) {
      // AbortError = o usuário desistiu de compartilhar — não forçamos WA.
      if ((err as DOMException | null)?.name === "AbortError") return "cancelled";
      // Falha real → cai no WhatsApp.
    }
  }
  if (typeof window !== "undefined") {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${opts.text} ${opts.url}`)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }
  return "whatsapp";
}
