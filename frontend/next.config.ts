import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

// Muda a cada build: invalida a cópia pré-cacheada da home no update do SW.
const preview = process.env.NEXT_PUBLIC_PREVIEW === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const buildRevision = Date.now().toString(36);

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development" || preview,
  // O HTML da home no precache: navegação para "/" (inclusive o "voltar" do
  // PWA no iOS) sai do cache na hora, sem depender da rede — e é o alvo do
  // fallback de navegação do sw.ts quando outra página falha ao carregar.
  additionalPrecacheEntries: [{ url: "/", revision: buildRevision }],
  // O default do Serwist ("**/*") joga TODO o public/ no precache do service
  // worker. A lista é por extensão (o glob não aceita negação); sw.js e
  // swe-worker-*.js já são ignorados pelo próprio Serwist.
  globPublicPatterns: ["**/*.{png,ico,svg,webmanifest}"],
});

const nextConfig: NextConfig = {
  basePath,
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default withSerwist(nextConfig);
