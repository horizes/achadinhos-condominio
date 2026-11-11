// Lightweight, typed wrapper around fetch for the Achadinhos backend.
//
// - Reads the base URL from NEXT_PUBLIC_API_URL.
// - Auto-injects Authorization: Bearer <token> when available.
// - On 401, transparently tries POST /auth/refresh once. If that fails,
//   wipes the auth storage and emits a window event ("auth:logout") so
//   the React tree can reset.
// - localStorage is intentionally used (PWA must work offline). XSS risk
//   is acknowledged for this phase.

const STORAGE_ACCESS = "achadinhos.auth.access";
const STORAGE_REFRESH = "achadinhos.auth.refresh";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

// ============== Types ==============

// Contas com login: síndicos e empresas free (sign-up público) e admins
// (internos). A conta "empresa" é dona de uma empresa (myCompanyApi).
export type UserRole = "sindico" | "admin" | "empresa";

export type AccountType = "pessoa" | "empresa";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string | null;
  avatar_url?: string | null;
  // Tipo de conta: pessoa física (CPF) ou empresa/administradora (CNPJ).
  account_type?: AccountType | null;
  company_name?: string | null; // razão social (empresa)
  document_type?: "cpf" | "cnpj" | null;
  document?: string | null;
  cpf?: string | null;
  condo_name?: string | null;
  condo_role?: string | null;
  // Endereço (persistido no backend).
  cep?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface ApiErrorPayload {
  status: number;
  code?: string;
  message: string;
  details?: unknown;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.name = "ApiError";
    this.status = payload.status;
    this.code = payload.code;
    this.details = payload.details;
  }
}

// ============== Token storage helpers ==============

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(STORAGE_ACCESS);
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(STORAGE_REFRESH);
  } catch {
    return null;
  }
}

export function setTokens(access: string, refresh: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_ACCESS, access);
    window.localStorage.setItem(STORAGE_REFRESH, refresh);
  } catch {
    // ignore
  }
}

export function clearTokens(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_ACCESS);
    window.localStorage.removeItem(STORAGE_REFRESH);
  } catch {
    // ignore
  }
}

function emitLogout(): void {
  if (!isBrowser()) return;
  try {
    window.dispatchEvent(new Event("auth:logout"));
  } catch {
    // ignore
  }
}

// ============== Core request ==============

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  // If true, do not attempt to attach Authorization header even if a token exists.
  skipAuth?: boolean;
  // If true, do not attempt 401 -> refresh -> retry. Used internally by refresh itself.
  skipRefresh?: boolean;
  // Allow callers to opt out of JSON parsing (rare).
  parseAs?: "json" | "text" | "none";
  // Extra headers (Content-Type is auto-set when body is provided).
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

async function rawRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = "GET",
    body,
    skipAuth = false,
    parseAs = "json",
    headers: extraHeaders,
    signal,
  } = options;

  const url = path.startsWith("http")
    ? path
    : `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...extraHeaders,
  };

  if (body !== undefined && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const init: RequestInit = {
    method,
    headers,
    signal,
  };
  if (body !== undefined) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  let res: Response;
  try {
    if (process.env.NEXT_PUBLIC_PREVIEW === "true") {
      const { previewResponse } = await import("./preview-data");
      res = await previewResponse(path, { method, body }, getAccessToken());
    } else {
      res = await fetch(url, init);
    }
  } catch (err) {
    throw new ApiError({
      status: 0,
      code: "network_error",
      message:
        err instanceof Error
          ? `Falha de conexão: ${err.message}`
          : "Falha de conexão com o servidor",
    });
  }

  if (res.status === 204) {
    return undefined as T;
  }

  if (!res.ok) {
    let payload: Partial<ApiErrorPayload> = {};
    try {
      const text = await res.text();
      if (text) {
        try {
          const parsed = JSON.parse(text) as Record<string, unknown>;
          payload = {
            code: typeof parsed.code === "string" ? parsed.code : undefined,
            message:
              typeof parsed.message === "string"
                ? parsed.message
                : typeof parsed.error === "string"
                  ? (parsed.error as string)
                  : undefined,
            details: parsed.details,
          };
        } catch {
          payload = { message: text };
        }
      }
    } catch {
      // ignore body read error
    }

    throw new ApiError({
      status: res.status,
      code: payload.code,
      message:
        payload.message ?? defaultErrorMessage(res.status),
      details: payload.details,
    });
  }

  if (parseAs === "none") return undefined as T;
  if (parseAs === "text") return (await res.text()) as unknown as T;
  // json
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

function defaultErrorMessage(status: number): string {
  if (status === 0) return "Sem conexão com o servidor";
  if (status === 400) return "Requisição inválida";
  if (status === 401) return "Sessão expirada. Entre novamente.";
  if (status === 403) return "Você não tem permissão para essa ação";
  if (status === 404) return "Não encontrado";
  if (status === 409) return "Conflito (recurso já existe)";
  if (status === 422) return "Dados inválidos";
  if (status >= 500) return "Erro no servidor. Tente novamente em alguns instantes.";
  return `Erro ${status}`;
}

// Single-flight refresh: if multiple requests get 401 at the same time, only
// one network refresh fires; the others await the same promise.
let inflightRefresh: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (inflightRefresh) return inflightRefresh;
  const refresh = getRefreshToken();
  if (!refresh) return null;

  inflightRefresh = (async () => {
    try {
      const data = await rawRequest<AuthResponse>("/auth/refresh", {
        method: "POST",
        body: { refresh_token: refresh },
        skipAuth: true,
        skipRefresh: true,
      });
      setTokens(data.access_token, data.refresh_token);
      return data.access_token;
    } catch {
      clearTokens();
      emitLogout();
      return null;
    } finally {
      inflightRefresh = null;
    }
  })();

  return inflightRefresh;
}

export async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  try {
    return await rawRequest<T>(path, options);
  } catch (err) {
    if (
      err instanceof ApiError &&
      err.status === 401 &&
      !options.skipRefresh &&
      !options.skipAuth &&
      getRefreshToken()
    ) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return rawRequest<T>(path, { ...options, skipRefresh: true });
      }
    }
    throw err;
  }
}

// ============== Domain helpers ==============

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AddressPayload {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface RegisterSindicoPayload {
  // "pessoa" (física, CPF) ou "empresa" (administradora, CNPJ). Default pessoa.
  account_type?: AccountType;
  name: string;
  email: string;
  password: string;
  cpf?: string; // pessoa
  cnpj?: string; // empresa
  company_name?: string; // razão social (empresa)
  phone: string;
  address: AddressPayload;
  condo_name?: string;
  condo_role?: "morador" | "sindico" | "conselho";
}

// Autocadastro da empresa free (sem certificado): cria o login do
// responsável e a empresa, que aparece no site na hora, sem selo.
export interface RegisterEmpresaPayload {
  name: string; // responsável
  email: string;
  password: string;
  company_name: string;
  category_ids: string[]; // a primeira é a principal
  whatsapp: string;
  document_type: "cpf" | "cnpj";
  document: string;
  description?: string;
  link?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
}

export const auth = {
  async registerEmpresa(
    payload: RegisterEmpresaPayload,
  ): Promise<AuthResponse & { seller: AdminSeller }> {
    return request<AuthResponse & { seller: AdminSeller }>("/auth/register/empresa", {
      method: "POST",
      body: payload,
      skipAuth: true,
    });
  },
  async registerSindico(payload: RegisterSindicoPayload): Promise<AuthResponse> {
    return request<AuthResponse>("/auth/register/sindico", {
      method: "POST",
      body: payload,
      skipAuth: true,
    });
  },
  async login(payload: LoginPayload): Promise<AuthResponse> {
    return request<AuthResponse>("/auth/login", {
      method: "POST",
      body: payload,
      skipAuth: true,
    });
  },
  async refresh(refreshToken: string): Promise<AuthResponse> {
    return request<AuthResponse>("/auth/refresh", {
      method: "POST",
      body: { refresh_token: refreshToken },
      skipAuth: true,
      skipRefresh: true,
    });
  },
  // Best-effort logout. Backends differ; we just discard tokens locally.
  async logout(): Promise<void> {
    try {
      await request<void>("/auth/logout", {
        method: "POST",
        parseAs: "none",
      });
    } catch {
      // ignore — server may not have this endpoint or token may already be invalid
    }
  },
};

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export const me = {
  async get(): Promise<User> {
    return request<User>("/me");
  },
  async update(patch: Partial<User>): Promise<User> {
    return request<User>("/me", {
      method: "PATCH",
      body: patch,
    });
  },
  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    return request<void>("/me/password", {
      method: "PATCH",
      body: payload,
      parseAs: "none",
    });
  },
};

export interface ProductPhoto {
  id: string;
  product_id: string;
  url: string;
  position: number;
  created_at?: string;
}

export interface PortfolioPhoto {
  id: string;
  url: string;
  position: number;
}

/** Normalises a user-typed link into an absolute href (prepends https:// when missing). */
export function externalHref(url: string): string {
  const u = (url ?? "").trim();
  if (!u) return "";
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

export function getImageUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
  const host = base.replace(/\/api\/v1\/?.*$/, "");
  return `${host}${path}`;
}

/** True when the given path or URL points to a PDF file. */
export function isPdf(path: string): boolean {
  return /\.pdf(\?|$)/i.test(path ?? "");
}

/** True when the URL is a YouTube/Vimeo link (embedded video). */
export function isVideoLink(path: string): boolean {
  return /(?:youtube\.com\/|youtu\.be\/|vimeo\.com\/)/i.test(path ?? "");
}

/** True when the URL points to an uploaded video file. */
export function isVideoFile(path: string): boolean {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(path ?? "");
}

/** True for any video — uploaded file or external link. */
export function isVideo(path: string): boolean {
  return isVideoFile(path) || isVideoLink(path);
}

/**
 * Converts a YouTube/Vimeo watch URL into its embeddable player URL. Returns the
 * original URL when no known pattern matches.
 */
export function videoEmbedUrl(url: string): string {
  const u = url ?? "";
  let m = u.match(/youtu\.be\/([\w-]+)/i);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  m = u.match(/youtube\.com\/(?:watch\?v=|embed\/|shorts\/)([\w-]+)/i);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (m) return `https://player.vimeo.com/video/${m[1]}`;
  return u;
}

export interface PagedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiCategory {
  id: string;
  label: string;
  short: string;
  icon: string;
  badge?: string;
  desc?: string;
  count: number;
}

export interface ApiProvider {
  id: string;
  name: string;
  category_id: string;
  category?: ApiCategory;
  avatar: string;
  logo_url?: string;
  rating: number;
  reviews_count: number;
  badge?: string;
  cert_tier?: string;
  verified: boolean;
  distance_label: string;
  price_label: string;
  response_time_label: string;
  description: string;
  services: string[];
  years_active: number;
  jobs_done: number;
  whatsapp: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  site?: string;
  highlight: boolean;
  owner_user_id?: string;
  document_type?: string;
  document?: string;
  portfolio_photos?: PortfolioPhoto[];
  created_at?: string;
}

export interface ApiReview {
  id: string;
  provider_id: string;
  user_id: string;
  user?: { id: string; name: string; email: string };
  rating: number;
  text: string;
  helpful_count: number;
  tags: string[];
  verified: boolean;
  created_at: string;
}

export interface ApiProduct {
  id: string;
  // Omitted by the backend when the product is sold by Achadinhos itself.
  seller_id?: string;
  name: string;
  category: string;
  price: number;
  old_price?: number | null;
  rating: number;
  reviews_count: number;
  tag?: string;
  badge?: string;
  stock: string;
  whatsapp_override?: string;
  link_override?: string;
  manufacturer?: string;
  description?: string;
  highlight?: boolean;
  photos?: ProductPhoto[];
  seller?: {
    id: string;
    name: string;
    avatar?: string;
    description?: string;
    whatsapp?: string;
    link?: string;
    partner?: boolean;
  };
  created_at?: string;
}

export type FavoriteTargetType = "provider" | "product" | "seller";

export interface ApiFavorite {
  id: string;
  user_id: string;
  target_type: FavoriteTargetType;
  target_id: string;
  created_at: string;
}

// ============== Admin panel ==============

export interface AdminSeller {
  id: string;
  name: string;
  category_id?: string;
  category?: ApiCategory;
  // Todas as categorias da empresa (multi-categoria). A principal continua em
  // category_id/category.
  categories?: ApiCategory[];
  avatar?: string;
  logo_url?: string;
  description?: string;
  whatsapp: string;
  link?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  partner: boolean;
  highlight?: boolean;
  rating?: number;
  reviews_count?: number;
  cert_tier?: CertTier | "";
  // Empresa free: se cadastrou sozinha pelo site (sem certificado até o admin
  // emitir um) e edita os próprios dados em /minha-empresa.
  self_registered?: boolean;
  document_type?: string;
  document?: string;
  portfolio_photos?: PortfolioPhoto[];
  created_at?: string;
  // Dados internos do contrato — só chegam nas rotas /admin.
  contrato_inicio?: string;
  contrato_vigencia_meses?: string;
  valor_mensal?: string;
  valor_anual?: string;
}

export interface SellerReview {
  id: string;
  rating: number;
  text: string;
  created_at: string;
  user?: { id: string; name: string };
}

export interface AdminSellerPayload {
  name: string;
  category_id: string;
  // Todas as categorias (a primeira é a principal). Se omitido, vale
  // [category_id].
  category_ids?: string[];
  description?: string;
  whatsapp: string;
  link?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  partner?: boolean;
  highlight?: boolean;
  document_type: "cpf" | "cnpj";
  document: string;
  contrato_inicio?: string;
  contrato_vigencia_meses?: string;
  valor_mensal?: string;
  valor_anual?: string;
}

export interface AdminProviderPayload {
  name: string;
  category_id: string;
  description: string;
  services?: string[];
  whatsapp: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  site?: string;
  years_active?: number;
  jobs_done?: number;
  price_label?: string;
  response_time_label?: string;
  distance_label?: string;
  coverage?: "bairro" | "cidade" | "regiao";
  radius_km?: number;
  verified?: boolean;
  highlight?: boolean;
  badge?: string;
  document_type: "cpf" | "cnpj";
  document: string;
}

export interface AdminProductPayload {
  name: string;
  category: string;
  price: number;
  old_price?: number | null;
  // Empty string means "sold by Achadinhos" — no seller link.
  seller_id?: string;
  tag?: string;
  badge?: string;
  stock?: string;
  link?: string;
  manufacturer?: string;
  description?: string;
  highlight?: boolean;
}

// Multipart upload of a single image file under the "file" field.
async function uploadImage<T>(path: string, file: File): Promise<T> {
  const token = getAccessToken();
  const formData = new FormData();
  formData.append("file", file);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });
  if (!res.ok) {
    let msg = `Erro ${res.status}`;
    try {
      const j = (await res.json()) as { message?: string };
      if (j.message) msg = j.message;
    } catch {}
    throw new ApiError({ status: res.status, message: msg });
  }
  return res.json() as Promise<T>;
}

export interface AdminSindico {
  id: string;
  name: string;
  email: string;
  phone?: string;
  condo_name?: string;
  condo_role?: string;
  // Conta de administradora (CNPJ): razão social da empresa.
  company_name?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  created_at?: string;
}

// ── Fichas de cadastro de empresas ──
export type FichaStatus = "pendente" | "concluido";

export interface FichaCadastro {
  id: string;
  status: FichaStatus;
  responsavel_nome: string;
  responsavel_email: string;
  // Dados do responsável (preenchidos no formulário)
  resp_cpf: string;
  resp_nascimento: string;
  resp_endereco: string;
  resp_telefone: string;
  resp_cargo: string;
  // Dados da empresa
  razao_social: string;
  cnpj: string;
  empresa_endereco: string;
  instagram: string;
  facebook: string;
  linkedin: string;
  tiktok: string;
  site: string;
  contrato_inicio: string;
  contrato_vigencia_meses: string;
  valor_mensal: string;
  valor_anual: string;
  observacoes: string;
  submitted_at?: string | null;
  created_at: string;
  updated_at: string;
}

// Campos que o responsável preenche no formulário público.
export type FichaFillPayload = Pick<
  FichaCadastro,
  | "resp_cpf"
  | "resp_nascimento"
  | "resp_endereco"
  | "resp_telefone"
  | "resp_cargo"
  | "razao_social"
  | "cnpj"
  | "empresa_endereco"
  | "instagram"
  | "facebook"
  | "linkedin"
  | "tiktok"
  | "site"
  | "observacoes"
>;

export interface CreateFichaResult {
  ficha: FichaCadastro;
  link: string;
  email_enabled: boolean;
}

// ── Eventos do condomínio ──
export interface ApiEventDay {
  id: string;
  event_id: string;
  day: string; // ISO; use .slice(0,10) para a data "AAAA-MM-DD"
  time: string; // "HH:MM"
  banner_url: string; // imagem do dia (vazio = usa o banner do evento)
}

export interface ApiEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  event_date: string; // ISO; espelho do 1º dia — use .slice(0,10)
  event_time: string; // "HH:MM"
  // Destaque no slider da home + banner (vazio quando sem banner).
  highlight: boolean;
  banner_url: string;
  // Todas as datas do evento (um evento pode ocupar vários dias).
  days?: ApiEventDay[];
  created_at?: string;
}

// ── Anúncios (banners gerenciados pelo admin) ──
export type BannerPlacement = "hero" | "eventos";

export interface ApiBanner {
  id: string;
  title: string;
  subtitle: string;
  link_url: string;
  image_url: string;
  placement: BannerPlacement;
  position: number;
  active: boolean;
  // Período de exibição (ISO ou null). Fora dele o banner não sai na listagem
  // pública, mas o admin continua vendo ("fora do período").
  starts_at: string | null;
  ends_at: string | null;
  created_at?: string;
}

export interface AdminBannerPayload {
  title?: string;
  subtitle?: string;
  link_url?: string;
  placement: BannerPlacement;
  position?: number;
  active?: boolean;
  // "YYYY-MM-DD"; string vazia limpa a data no PATCH.
  starts_at?: string;
  ends_at?: string;
}

export type BlogPostFormat = "traditional" | "presentation";
export interface ApiBlogPost {
  id: string; title: string; slug: string; excerpt: string;
  format: BlogPostFormat; content_html: string; cover_url: string; pdf_url: string;
  published: boolean; published_at: string | null; created_at: string; updated_at: string;
}
export interface BlogPostPayload {
  title: string; slug: string; excerpt: string; format: BlogPostFormat;
  content_html: string; published: boolean;
}

export interface AdminEventDayPayload {
  id?: string; // presente = atualiza o dia existente (mantém a imagem)
  day: string; // "AAAA-MM-DD"
  time: string; // "HH:MM"
}

export interface AdminEventPayload {
  title: string;
  description: string;
  location: string;
  // Datas do evento (>= 1). event_date/event_time viram espelho do 1º dia
  // no backend.
  days: AdminEventDayPayload[];
  highlight?: boolean;
}

// ── Certificados de empresa qualificada ──
export type CertTipo = "empresa" | "afiliado";
export type CertTier = "blue" | "ouro" | "black";

export interface ApiCertificate {
  id: string;
  code: string;
  tipo: CertTipo;
  tier: CertTier;
  seller_id?: string | null;
  provider_id?: string | null;
  empresa_nome: string;
  categoria: string;
  responsavel_nome: string;
  responsavel_cpf: string;
  signature_url: string;
  issued_at: string; // ISO; use .slice(0,10)
  valid_until: string; // ISO; use .slice(0,10)
  revoked: boolean;
  created_at?: string;
  seller?: AdminSeller;
  provider?: ApiProvider;
}

export interface AdminCertificatePayload {
  tipo: CertTipo;
  owner_id: string; // id do seller (empresa) ou provider (afiliado)
  tier: CertTier;
  responsavel_nome: string;
  responsavel_cpf?: string;
  issued_at?: string; // "AAAA-MM-DD" (default: hoje)
  valid_until?: string; // "AAAA-MM-DD" (default: +12 meses)
  signature_png?: string; // data URL "data:image/png;base64,..."
}

// Resposta pública da verificação por código (GET /certificates/:code).
export interface CertificateVerification {
  code: string;
  tipo: CertTipo;
  tier: CertTier;
  empresa_nome: string;
  categoria: string;
  responsavel_nome: string;
  issued_at: string;
  valid_until: string;
  revoked: boolean;
  valid: boolean;
  // owner é o titular genérico (empresa ou afiliado); seller mantido por compat.
  owner?: { id: string; name: string; logo_url?: string; type: "seller" | "provider" };
  seller?: { id: string; name: string; logo_url?: string };
}

export const adminApi = {
  // ── Síndicos (read-only) ──
  async listSindicos(): Promise<AdminSindico[]> {
    const res = await request<{ data: AdminSindico[] }>("/admin/sindicos");
    return res.data ?? [];
  },

  // ── Empresas (sellers) ──
  async listSellers(): Promise<AdminSeller[]> {
    const res = await request<{ data: AdminSeller[] }>("/admin/sellers");
    return res.data ?? [];
  },
  async createSeller(payload: AdminSellerPayload): Promise<AdminSeller> {
    return request<AdminSeller>("/admin/sellers", { method: "POST", body: payload });
  },
  async updateSeller(id: string, payload: Partial<AdminSellerPayload>): Promise<AdminSeller> {
    return request<AdminSeller>(`/admin/sellers/${id}`, { method: "PATCH", body: payload });
  },
  async deleteSeller(id: string): Promise<void> {
    return request<void>(`/admin/sellers/${id}`, { method: "DELETE", parseAs: "none" });
  },
  // Converte uma empresa em afiliado, preservando logo e portfólio. Retorna o
  // novo prestador (com novo id). Avaliações não são transferidas.
  async convertSellerToProvider(id: string, payload: AdminProviderPayload): Promise<ApiProvider> {
    return request<ApiProvider>(`/admin/sellers/${id}/convert`, { method: "POST", body: payload });
  },
  async uploadSellerLogo(id: string, file: File): Promise<{ logo_url: string }> {
    return uploadImage(`/admin/sellers/${id}/logo`, file);
  },
  async uploadSellerPortfolio(id: string, file: File): Promise<PortfolioPhoto> {
    return uploadImage(`/admin/sellers/${id}/portfolio`, file);
  },
  async addSellerPortfolioLink(id: string, url: string): Promise<PortfolioPhoto> {
    return request<PortfolioPhoto>(`/admin/sellers/${id}/portfolio/link`, {
      method: "POST",
      body: { url },
    });
  },
  async deleteSellerPortfolio(id: string, photoId: string): Promise<void> {
    return request<void>(`/admin/sellers/${id}/portfolio/${photoId}`, {
      method: "DELETE",
      parseAs: "none",
    });
  },

  // ── Prestadores (providers) ──
  async listProviders(): Promise<ApiProvider[]> {
    const res = await request<{ data: ApiProvider[] }>("/admin/providers");
    return res.data ?? [];
  },
  async createProvider(payload: AdminProviderPayload): Promise<ApiProvider> {
    return request<ApiProvider>("/admin/providers", { method: "POST", body: payload });
  },
  async updateProvider(id: string, payload: Partial<AdminProviderPayload>): Promise<ApiProvider> {
    return request<ApiProvider>(`/admin/providers/${id}`, { method: "PATCH", body: payload });
  },
  async deleteProvider(id: string): Promise<void> {
    return request<void>(`/admin/providers/${id}`, { method: "DELETE", parseAs: "none" });
  },
  // Converte um afiliado em empresa, preservando logo e portfólio. Retorna a
  // nova empresa (com novo id). Avaliações não são transferidas.
  async convertProviderToSeller(id: string, payload: AdminSellerPayload): Promise<AdminSeller> {
    return request<AdminSeller>(`/admin/providers/${id}/convert`, { method: "POST", body: payload });
  },
  async uploadProviderLogo(id: string, file: File): Promise<{ logo_url: string }> {
    return uploadImage(`/admin/providers/${id}/logo`, file);
  },
  async uploadProviderPortfolio(id: string, file: File): Promise<PortfolioPhoto> {
    return uploadImage(`/admin/providers/${id}/portfolio`, file);
  },
  async addProviderPortfolioLink(id: string, url: string): Promise<PortfolioPhoto> {
    return request<PortfolioPhoto>(`/admin/providers/${id}/portfolio/link`, {
      method: "POST",
      body: { url },
    });
  },
  async deleteProviderPortfolio(id: string, photoId: string): Promise<void> {
    return request<void>(`/admin/providers/${id}/portfolio/${photoId}`, {
      method: "DELETE",
      parseAs: "none",
    });
  },

  // ── Fichas de cadastro de empresas ──
  async listFichas(): Promise<FichaCadastro[]> {
    const res = await request<{ data: FichaCadastro[] }>("/admin/fichas");
    return res.data ?? [];
  },
  async createFicha(payload: {
    responsavel_nome: string;
    responsavel_email: string;
  }): Promise<CreateFichaResult> {
    return request<CreateFichaResult>("/admin/fichas", {
      method: "POST",
      body: payload,
    });
  },
  async resendFicha(id: string): Promise<{ link: string; email_enabled: boolean }> {
    return request<{ link: string; email_enabled: boolean }>(
      `/admin/fichas/${id}/resend`,
      { method: "POST" },
    );
  },
  async deleteFicha(id: string): Promise<void> {
    return request<void>(`/admin/fichas/${id}`, { method: "DELETE", parseAs: "none" });
  },

  // ── Eventos do condomínio ──
  async listEvents(): Promise<ApiEvent[]> {
    const res = await request<{ data: ApiEvent[] }>("/admin/events");
    return res.data ?? [];
  },
  async createEvent(payload: AdminEventPayload): Promise<ApiEvent> {
    return request<ApiEvent>("/admin/events", { method: "POST", body: payload });
  },
  async updateEvent(id: string, payload: Partial<AdminEventPayload>): Promise<ApiEvent> {
    return request<ApiEvent>(`/admin/events/${id}`, { method: "PATCH", body: payload });
  },
  async deleteEvent(id: string): Promise<void> {
    return request<void>(`/admin/events/${id}`, { method: "DELETE", parseAs: "none" });
  },
  async uploadEventBanner(id: string, file: File): Promise<{ banner_url: string }> {
    return uploadImage(`/admin/events/${id}/banner`, file);
  },
  async deleteEventBanner(id: string): Promise<void> {
    return request<void>(`/admin/events/${id}/banner`, { method: "DELETE", parseAs: "none" });
  },
  async uploadEventDayBanner(eventId: string, dayId: string, file: File): Promise<{ banner_url: string }> {
    return uploadImage(`/admin/events/${eventId}/days/${dayId}/banner`, file);
  },
  async deleteEventDayBanner(eventId: string, dayId: string): Promise<void> {
    return request<void>(`/admin/events/${eventId}/days/${dayId}/banner`, {
      method: "DELETE",
      parseAs: "none",
    });
  },

  // ── Anúncios (banners do slide principal e do widget de eventos) ──
  async listBanners(): Promise<ApiBanner[]> {
    const res = await request<{ data: ApiBanner[] }>("/admin/banners");
    return res.data ?? [];
  },
  async createBanner(payload: AdminBannerPayload): Promise<ApiBanner> {
    return request<ApiBanner>("/admin/banners", { method: "POST", body: payload });
  },
  async updateBanner(id: string, payload: Partial<AdminBannerPayload>): Promise<ApiBanner> {
    return request<ApiBanner>(`/admin/banners/${id}`, { method: "PATCH", body: payload });
  },
  async deleteBanner(id: string): Promise<void> {
    return request<void>(`/admin/banners/${id}`, { method: "DELETE", parseAs: "none" });
  },
  async uploadBannerImage(id: string, file: File): Promise<{ image_url: string }> {
    return uploadImage(`/admin/banners/${id}/image`, file);
  },
  // Regrava as posições conforme a ordem dos ids (drag-and-drop do Mural).
  async reorderBanners(ids: string[]): Promise<void> {
    return request<void>("/admin/banners/reorder", {
      method: "PUT",
      body: { ids },
      parseAs: "none",
    });
  },

  async listBlogPosts(): Promise<ApiBlogPost[]> {
    const res = await request<{ data: ApiBlogPost[] }>("/admin/blog"); return res.data ?? [];
  },
  async createBlogPost(payload: BlogPostPayload): Promise<ApiBlogPost> {
    return request<ApiBlogPost>("/admin/blog", { method: "POST", body: payload });
  },
  async updateBlogPost(id: string, payload: Partial<BlogPostPayload>): Promise<ApiBlogPost> {
    return request<ApiBlogPost>(`/admin/blog/${id}`, { method: "PATCH", body: payload });
  },
  async deleteBlogPost(id: string): Promise<void> {
    return request<void>(`/admin/blog/${id}`, { method: "DELETE", parseAs: "none" });
  },
  async uploadBlogCover(id: string, file: File): Promise<{ cover_url: string }> {
    return uploadImage(`/admin/blog/${id}/cover`, file);
  },
  async uploadBlogPDF(id: string, file: File): Promise<{ pdf_url: string }> {
    return uploadImage(`/admin/blog/${id}/pdf`, file);
  },
  async uploadBlogContentImage(file: File): Promise<{ url: string }> {
    return uploadImage("/admin/blog/content-image", file);
  },

  // ── Certificados ──
  async listCertificates(): Promise<ApiCertificate[]> {
    const res = await request<{ data: ApiCertificate[] }>("/admin/certificates");
    return res.data ?? [];
  },
  async createCertificate(payload: AdminCertificatePayload): Promise<ApiCertificate> {
    return request<ApiCertificate>("/admin/certificates", { method: "POST", body: payload });
  },
  async revokeCertificate(id: string, revoked: boolean): Promise<ApiCertificate> {
    return request<ApiCertificate>(`/admin/certificates/${id}`, {
      method: "PATCH",
      body: { revoked },
    });
  },
  async deleteCertificate(id: string): Promise<void> {
    return request<void>(`/admin/certificates/${id}`, { method: "DELETE", parseAs: "none" });
  },

  // ── Produtos ──
  async listProducts(): Promise<ApiProduct[]> {
    const res = await request<{ data: ApiProduct[] }>("/admin/products");
    return res.data ?? [];
  },
  async createProduct(payload: AdminProductPayload): Promise<ApiProduct> {
    return request<ApiProduct>("/admin/products", { method: "POST", body: payload });
  },
  async updateProduct(id: string, payload: Partial<AdminProductPayload>): Promise<ApiProduct> {
    return request<ApiProduct>(`/admin/products/${id}`, { method: "PATCH", body: payload });
  },
  async deleteProduct(id: string): Promise<void> {
    return request<void>(`/admin/products/${id}`, { method: "DELETE", parseAs: "none" });
  },
  async uploadProductPhoto(productId: string, file: File): Promise<ProductPhoto> {
    return uploadImage(`/admin/products/${productId}/photos`, file);
  },
  async deleteProductPhoto(productId: string, photoId: string): Promise<void> {
    return request<void>(`/admin/products/${productId}/photos/${photoId}`, {
      method: "DELETE",
      parseAs: "none",
    });
  },

};

export const categoriesApi = {
  async list(): Promise<ApiCategory[]> {
    return request<ApiCategory[]>("/categories");
  },
};

// Public ficha de cadastro — acessada pelo link com token (sem login).
export const fichasApi = {
  async getByToken(token: string): Promise<FichaCadastro> {
    const res = await request<{ ficha: FichaCadastro }>(
      `/fichas/${encodeURIComponent(token)}`,
      { skipAuth: true },
    );
    return res.ficha;
  },
  async submit(token: string, payload: FichaFillPayload): Promise<{ status: FichaStatus }> {
    return request<{ status: FichaStatus }>(`/fichas/${encodeURIComponent(token)}`, {
      method: "POST",
      body: payload,
      skipAuth: true,
    });
  },
};

// Eventos do condomínio (leitura pública). Um evento com várias datas é
// EXPANDIDO em uma entrada por dia (data/hora/imagem daquele dia), então o
// widget da home, a tela de eventos e o carrossel mostram cada dia sem
// precisar conhecer a estrutura de dias. O id das entradas extras ganha o
// sufixo do dia só para as keys do React continuarem únicas.
export const eventsApi = {
  async list(): Promise<ApiEvent[]> {
    const res = await request<{ data: ApiEvent[] }>("/events");
    return (res.data ?? []).flatMap((ev) => {
      const days = ev.days?.length ? ev.days : null;
      if (!days) return [ev];
      return days.map((d, i) => ({
        ...ev,
        id: i === 0 ? ev.id : `${ev.id}:${d.id}`,
        event_date: d.day,
        event_time: d.time,
        banner_url: d.banner_url || ev.banner_url,
      }));
    });
  },
};

// Anúncios ativos (slide principal e widget de eventos) — público, sem login.
export const bannersApi = {
  async list(placement?: BannerPlacement): Promise<ApiBanner[]> {
    const qs = placement ? `?placement=${placement}` : "";
    const res = await request<{ data: ApiBanner[] }>(`/banners${qs}`, { skipAuth: true });
    return res.data ?? [];
  },
};

export const blogApi = {
  async list(): Promise<ApiBlogPost[]> {
    const res = await request<{ data: ApiBlogPost[] }>("/blog", { skipAuth: true }); return res.data ?? [];
  },
  async get(slug: string): Promise<ApiBlogPost> {
    return request<ApiBlogPost>(`/blog/${encodeURIComponent(slug)}`, { skipAuth: true });
  },
};

// Verificação pública de certificados (acessada pelo QR code, sem login).
export const certificatesApi = {
  async verify(code: string): Promise<CertificateVerification> {
    return request<CertificateVerification>(
      `/certificates/${encodeURIComponent(code)}`,
      { skipAuth: true },
    );
  },
};

// Área da empresa free logada (role=empresa): os próprios dados, logo e
// portfólio. Selo, "Parceira" e destaque só o admin muda.
export type MyCompanyPatch = Partial<
  Pick<
    AdminSellerPayload,
    | "name"
    | "category_ids"
    | "description"
    | "whatsapp"
    | "link"
    | "instagram"
    | "facebook"
    | "tiktok"
    | "youtube"
  >
>;

export const myCompanyApi = {
  async get(): Promise<AdminSeller> {
    return request<AdminSeller>("/me/empresa");
  },
  async update(patch: MyCompanyPatch): Promise<AdminSeller> {
    return request<AdminSeller>("/me/empresa", { method: "PATCH", body: patch });
  },
  async uploadLogo(file: File): Promise<{ logo_url: string }> {
    return uploadImage("/me/empresa/logo", file);
  },
  async uploadPortfolio(file: File): Promise<PortfolioPhoto> {
    return uploadImage("/me/empresa/portfolio", file);
  },
  async addPortfolioLink(url: string): Promise<PortfolioPhoto> {
    return request<PortfolioPhoto>("/me/empresa/portfolio/link", {
      method: "POST",
      body: { url },
    });
  },
  async deletePortfolio(photoId: string): Promise<void> {
    return request<void>(`/me/empresa/portfolio/${photoId}`, {
      method: "DELETE",
      parseAs: "none",
    });
  },
};

export const sellersApi = {
  // Public seller listing. Filter with { highlight } and/or { category }.
  async list(params?: { highlight?: boolean; category?: string }): Promise<AdminSeller[]> {
    const qs = new URLSearchParams();
    if (params?.highlight) qs.set("highlight", "true");
    if (params?.category) qs.set("category", params.category);
    const query = qs.toString();
    const res = await request<{ data: AdminSeller[] }>(
      `/sellers${query ? `?${query}` : ""}`,
    );
    return res.data ?? [];
  },
  // Full seller profile + its products.
  async get(id: string): Promise<{ seller: AdminSeller; products: ApiProduct[] }> {
    return request<{ seller: AdminSeller; products: ApiProduct[] }>(`/sellers/${id}`);
  },
  // Public list of reviews for a seller.
  async listReviews(id: string): Promise<SellerReview[]> {
    const res = await request<{ data: SellerReview[] }>(`/sellers/${id}/reviews`);
    return res.data ?? [];
  },
  // Create or update the current user's review for a seller (requires auth).
  async createReview(
    id: string,
    payload: { rating: number; text: string },
  ): Promise<SellerReview> {
    return request<SellerReview>(`/sellers/${id}/reviews`, {
      method: "POST",
      body: payload,
    });
  },
};

export const providersApi = {
  async list(params?: {
    category?: string;
    highlight?: boolean;
    q?: string;
    sort?: string;
    limit?: number;
    offset?: number;
  }): Promise<PagedResponse<ApiProvider>> {
    const qs = new URLSearchParams();
    if (params?.category) qs.set("category", params.category);
    if (params?.highlight) qs.set("highlight", "true");
    if (params?.q) qs.set("q", params.q);
    if (params?.sort) qs.set("sort", params.sort);
    if (params?.limit != null) qs.set("limit", String(params.limit));
    if (params?.offset != null) qs.set("offset", String(params.offset));
    const query = qs.toString();
    return request<PagedResponse<ApiProvider>>(query ? `/providers?${query}` : "/providers");
  },
  async get(id: string): Promise<ApiProvider> {
    return request<ApiProvider>(`/providers/${id}`);
  },
  async listReviews(id: string): Promise<{ data: ApiReview[]; limit: number; offset: number }> {
    return request(`/providers/${id}/reviews`);
  },
  async createReview(id: string, payload: { rating: number; text?: string; tags?: string[] }): Promise<ApiReview> {
    return request<ApiReview>(`/providers/${id}/reviews`, { method: "POST", body: payload });
  },
};

export const productsApi = {
  async list(params?: {
    category?: string;
    highlight?: boolean;
    q?: string;
    sort?: string;
    limit?: number;
    offset?: number;
  }): Promise<PagedResponse<ApiProduct>> {
    const qs = new URLSearchParams();
    if (params?.category && params.category !== "all") qs.set("category", params.category);
    if (params?.highlight) qs.set("highlight", "true");
    if (params?.q) qs.set("q", params.q);
    if (params?.sort) qs.set("sort", params.sort);
    if (params?.limit != null) qs.set("limit", String(params.limit));
    if (params?.offset != null) qs.set("offset", String(params.offset));
    const query = qs.toString();
    return request<PagedResponse<ApiProduct>>(query ? `/products?${query}` : "/products");
  },
  async get(id: string): Promise<{ product: ApiProduct; related_products: ApiProduct[] }> {
    return request(`/products/${id}`);
  },
};

export const favoritesApi = {
  async list(type?: FavoriteTargetType): Promise<ApiFavorite[]> {
    const path = type ? `/favorites?type=${type}` : "/favorites";
    return request<ApiFavorite[]>(path);
  },
  async add(targetType: FavoriteTargetType, targetId: string): Promise<ApiFavorite> {
    return request<ApiFavorite>("/favorites", {
      method: "POST",
      body: { target_type: targetType, target_id: targetId },
    });
  },
  async remove(targetType: FavoriteTargetType, targetId: string): Promise<void> {
    return request<void>("/favorites", {
      method: "DELETE",
      body: { target_type: targetType, target_id: targetId },
      parseAs: "none",
    });
  },
};
