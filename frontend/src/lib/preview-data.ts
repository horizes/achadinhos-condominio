// Compiled into the GitHub Pages preview only. Never contacts the production API.
import { publicAsset } from "./site-path";

const categories = [
  { id: "manutencao", label: "Manutenção", short: "Manutenção", icon: "CatTools", count: 2 },
  { id: "limpeza", label: "Limpeza", short: "Limpeza", icon: "CatClean", count: 1 },
  { id: "seguranca", label: "Segurança", short: "Segurança", icon: "Shield", count: 1 },
  { id: "jardim", label: "Jardinagem", short: "Jardim", icon: "Leaf", count: 1 },
];
const providers = [
  { id: "demo-manutencao", name: "Manutenção Exemplo", category_id: "manutencao", avatar: "ME", cert_tier: "blue" },
  { id: "demo-limpeza", name: "Limpeza Exemplo", category_id: "limpeza", avatar: "LE", cert_tier: "ouro" },
  { id: "demo-seguranca", name: "Segurança Exemplo", category_id: "seguranca", avatar: "SE", cert_tier: "black" },
].map((p, i) => ({ ...p, category: categories.find(c => c.id === p.category_id),
  rating: 4.8 + (i % 2) * .1, reviews_count: 12 + i * 8, badge: "VERIFICADO",
  verified: true, highlight: true, description: "Empresa fictícia para explorar a nova apresentação do catálogo. Não representa um fornecedor real.",
  services: ["Atendimento ao condomínio", "Serviços especializados"], years_active: 5 + i,
  jobs_done: 50 + i * 10, whatsapp: "", distance_label: "Campinas · SP",
  price_label: "Sob consulta", response_time_label: "Em até 2h", portfolio_photos: [],
}));
const sellers = [
  { id: "demo-empresa", name: "Empresa Demonstração", category_id: "manutencao", category: categories[0],
    categories: [categories[0]], avatar: "ED", description: "Perfil fictício para conhecer os cartões, produtos e detalhes da plataforma.",
    whatsapp: "", link: "", partner: true, highlight: true, rating: 4.9, reviews_count: 18,
    cert_tier: "black", portfolio_photos: [] },
];
const products = [
  { id: "demo-kit", name: "Kit de manutenção · exemplo", category: "manutencao", price: 120, old_price: 150 },
  { id: "demo-limpeza-kit", name: "Kit de limpeza · exemplo", category: "limpeza", price: 89.9, old_price: null },
].map(p => ({ ...p, seller_id: sellers[0].id, seller: sellers[0], rating: 4.8, reviews_count: 8,
  description: "Produto fictício. Os valores servem apenas para testar a apresentação visual.",
  photos: [], stock: "Demonstração", highlight: true, whatsapp_override: "", link_override: "" }));
const user = { id: "demo-admin", name: "Equipe Demonstração", email: "demo@achadinhos.test", role: "admin",
  account_type: "pessoa", condo_name: "Condomínio Demonstração", phone: "", city: "Campinas", state: "SP" };
const nextDay = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
const events = [{ id: "demo-evento", title: "Encontro de demonstração", description: "Evento fictício para visualizar a agenda.",
  location: "Ambiente de testes", event_date: nextDay, event_time: "14:00", highlight: true, banner_url: "", days: [] }];
const posts = [{ id: "demo-post", slug: "bem-vindo-a-previa", title: "Conheça o Universo Achadinhos", excerpt: "Uma prévia da nova experiência da plataforma.",
  format: "traditional", content_html: "<p>Esta página demonstra o visual do blog. Nenhum cadastro, reserva ou pagamento real é realizado nesta prévia.</p>",
  cover_url: "", pdf_url: "", published: true, published_at: "2026-11-03T12:00:00Z", created_at: "2026-11-03T12:00:00Z", updated_at: "2026-11-03T12:00:00Z" }];
const settings = { slug: "ligia", display_name: "Equipe Achadinhos · demonstração", title: "Vamos conversar?",
  duration_min: 30, timezone: "America/Sao_Paulo", connected: false, google_connected: false,
  active: true, buffer_min: 0, lead_time_min: 60, horizon_days: 21,
  work_hours: { "1": [{ start: "09:00", end: "17:00" }] } };

export async function previewResponse(path: string, options: { method: string; body?: unknown }, token: string | null): Promise<Response> {
  const url = new URL(path, "https://preview.invalid");
  const p = url.pathname;
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  const fail = (message: string, status = 400) => json({ message, code: "preview_only" }, status);
  const payload = typeof options.body === "string" ? JSON.parse(options.body) : options.body as Record<string, unknown> | undefined;
  const auth = { user, access_token: "preview-demo-access", refresh_token: "preview-demo-refresh" };
  if (p === "/auth/login") {
    return payload?.email === user.email && payload?.password === "demonstracao"
      ? json(auth) : fail("Nesta prévia, use demo@achadinhos.test e a senha demonstracao. Não use sua senha real.", 401);
  }
  if (p === "/auth/refresh") return payload?.refresh_token === auth.refresh_token ? json(auth) : fail("Entre com a conta de demonstração.", 401);
  if (p === "/auth/logout") return new Response(null, { status: 204 });
  if (p === "/me" && options.method === "GET") return token === auth.access_token ? json(user) : fail("Entre com a conta de demonstração.", 401);
  if (p.startsWith("/admin/") && token !== auth.access_token) return fail("Entre com a conta de demonstração.", 401);
  if (p.startsWith("/favorites")) {
    // Local preview favorites use the same optimistic UI without a real account.
    if (options.method !== "GET") return json({ target_id: p.split("/").at(-1) });
    return json([]);
  }
  if (options.method !== "GET") return fail("Prévia visual: esta ação não grava dados nem envia mensagens. Use o sistema completo para operações reais.");
  const filter = <T extends { name: string; category_id?: string; category?: unknown }>(items: T[]) => items.filter(item =>
    (!url.searchParams.get("q") || item.name.toLowerCase().includes(url.searchParams.get("q")!.toLowerCase())) &&
    (!url.searchParams.get("category") || item.category_id === url.searchParams.get("category") || item.category === url.searchParams.get("category")));
  const paged = <T,>(items: T[]) => ({ data: items, total: items.length, limit: 20, offset: 0 });
  if (p === "/categories") return json(categories);
  if (p === "/providers") return json(paged(filter(providers)));
  if (p === "/products") return json(paged(filter(products)));
  if (p === "/sellers") return json({ data: filter(sellers) });
  if (p === "/events") return json({ data: events });
  if (p === "/banners") return json({ data: [] });
  if (p === "/blog") return json({ data: posts });
  if (p.startsWith("/blog/")) return json(posts[0]);
  if (/\/reviews$/.test(p)) return json({ data: [], limit: 20, offset: 0 });
  if (p.startsWith("/providers/")) return providers.some(x => p.endsWith(x.id)) ? json(providers.find(x => p.endsWith(x.id))) : fail("Perfil de teste não encontrado.", 404);
  if (p.startsWith("/products/")) return products.some(x => p.endsWith(x.id)) ? json({ product: products.find(x => p.endsWith(x.id)), related_products: products.filter(x => !p.endsWith(x.id)) }) : fail("Produto de teste não encontrado.", 404);
  if (p.startsWith("/sellers/")) return json({ seller: sellers[0], products });
  if (p === "/agenda/ligia") return json(settings);
  if (p.endsWith("/slots")) return json({ slots: [] });
  if (p === "/admin/agenda") return json({ ...settings, public_url: publicAsset("/agendar/ligia/") });
  if (p === "/admin/products") return json({ data: products });
  if (p === "/admin/providers") return json({ data: providers });
  if (p === "/admin/sellers") return json({ data: sellers });
  if (p === "/admin/events") return json({ data: events });
  if (p === "/admin/blog") return json({ data: posts });
  if (p.startsWith("/admin/")) return json({ data: [], total: 0 });
  if (p === "/me/empresa") return json(sellers[0]);
  return fail("Esta informação depende do backend do sistema completo.", 404);
}
