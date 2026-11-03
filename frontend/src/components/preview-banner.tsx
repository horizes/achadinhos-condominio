import Link from "next/link";

export function PreviewBanner() {
  if (process.env.NEXT_PUBLIC_PREVIEW !== "true") return null;
  return <aside className="preview-banner" aria-label="Ambiente de testes">
    <strong>Prévia de testes · dados fictícios</strong>
    <span>Sem cadastros, reservas ou pagamentos reais.</span>
    <Link href="/login">Testar painel</Link>
    <small>Conta demo@achadinhos.test · Senha demonstracao</small>
  </aside>;
}
