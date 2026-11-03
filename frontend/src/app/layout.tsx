import { publicAsset } from "@/lib/site-path";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { RegisterPWA } from "@/components/register-pwa";
import { AuthProvider } from "@/contexts/auth-context";
import {
  JsonLd,
  organizationSchema,
  websiteSchema,
} from "@/components/seo/json-ld";
import "./globals.css";
import "./executive.css";
import { PreviewBanner } from "@/components/preview-banner";

const manrope = localFont({
  src: "../../public/fonts/Manrope-variable.ttf",
  variable: "--font-manrope",
  weight: "200 800",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://achadinhoscondominio.com.br"),
  title: {
    default: "Achadinhos do Condomínio",
    template: "%s · Achadinhos do Condomínio",
  },
  description:
    "Marketplace que conecta síndicos a prestadores de serviço de condomínio. Orçamento em 1 toque, prestadores verificados, shopping com produtos para o condomínio.",
  applicationName: "Achadinhos do Condomínio",
  manifest: publicAsset("/manifest.webmanifest"),
  alternates: {
    canonical: "/",
  },
  appleWebApp: {
    capable: true,
    title: "Achadinhos",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: publicAsset("/brand/app-icon.svg"), sizes: "any", type: "image/svg+xml" },
      { url: publicAsset("/icon-logo-achadinhos-do-condominio-192.png"), sizes: "192x192", type: "image/png" },
      { url: publicAsset("/icon-logo-achadinhos-do-condominio.png"), sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: publicAsset("/icons/apple-touch-icon.png"), sizes: "180x180", type: "image/png" },
    ],
    shortcut: publicAsset("/brand/app-icon.svg"),
  },
  openGraph: {
    title: "Achadinhos do Condomínio",
    description:
      "Marketplace que conecta síndicos a prestadores de serviço. Orçamento em 1 toque.",
    url: "/",
    siteName: "Achadinhos do Condomínio",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: publicAsset("/icon-logo-achadinhos-do-condominio.png"),
        width: 512,
        height: 512,
        alt: "Achadinhos do Condomínio",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Achadinhos do Condomínio",
    description:
      "Marketplace que conecta síndicos a prestadores de serviço e fornecedores para condomínios.",
    images: [publicAsset("/icon-logo-achadinhos-do-condominio.png")],
  },
  robots: {
    index: process.env.NEXT_PUBLIC_PREVIEW !== "true",
    follow: process.env.NEXT_PUBLIC_PREVIEW !== "true",
  },
};

export const viewport: Viewport = {
  themeColor: "#071735",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${manrope.variable}`}
    >
      <body>
        <PreviewBanner />
        <JsonLd data={[organizationSchema, websiteSchema]} />
        <AuthProvider>
          <RegisterPWA />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
