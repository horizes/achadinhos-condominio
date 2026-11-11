# syntax=docker/dockerfile:1.7

# ============================================================
# Stage 1 — frontend build (Bun + Next.js static export)
# ============================================================
FROM oven/bun:1.2-alpine AS frontend
WORKDIR /app

# Bake the API base URL into the static bundle. We point at production by
# default so generateStaticParams/generateMetadata can fetch the catalog at
# build time. Same-origin client calls keep working because the host matches.
ARG NEXT_PUBLIC_API_URL=https://achadinhoscondominio.com.br/api/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NODE_ENV=production

COPY frontend/package.json frontend/bun.lock ./
RUN bun install --frozen-lockfile

COPY frontend/ ./
RUN bun run build

# generateStaticParams engole erros e cai num placeholder `_unavailable` — se
# a API de produção estiver fora/bloqueando o build, o export sai sem nenhuma
# página de empresa/produto e sem URLs no sitemap. Em vez de exigir empresas
# no sitemap (falha com banco zerado), verifica que a API responde
# /categories com a lista canônica. Falha alto quando a API está fora.
RUN bun -e 'const r = await fetch(process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "") + "/categories"); if (!r.ok) { console.error("ERRO: API inacessivel no build — HTTP " + r.status); process.exit(1); } const j = await r.json(); if (!JSON.stringify(j).includes("manutencao")) { console.error("ERRO: catalogo de categorias vazio/inesperado no build"); process.exit(1); }'

# After `output: "export"`, the bundle lives in /app/out

# ============================================================
# Stage 2 — backend build (Go) with embedded frontend
# ============================================================
FROM golang:1.25-alpine AS backend
WORKDIR /src
RUN apk add --no-cache git

COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ ./

# Replace the placeholder web/ with the real Next export so embed.FS picks it up.
RUN rm -rf internal/static/web && mkdir -p internal/static/web
COPY --from=frontend /app/out/. ./internal/static/web/

RUN CGO_ENABLED=0 GOOS=linux go build \
    -trimpath -ldflags="-s -w" \
    -o /out/api ./cmd/api && \
    CGO_ENABLED=0 GOOS=linux go build \
    -trimpath -ldflags="-s -w" \
    -o /out/seed ./cmd/seed

# ============================================================
# Stage 3 — runtime
# ============================================================
FROM alpine:3.20 AS runtime
RUN apk add --no-cache ca-certificates tzdata curl && \
    addgroup -S app && adduser -S app -G app

WORKDIR /app
COPY --from=backend /out/api /app/api
COPY --from=backend /out/seed /app/seed
COPY --from=backend /src/migrations /app/migrations

# Persistent uploads directory; volume should be mounted here.
RUN mkdir -p /app/uploads && chown -R app:app /app

USER app
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS http://localhost:8080/health || exit 1

ENTRYPOINT ["/app/api"]
