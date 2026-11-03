import { publicAsset } from "@/lib/site-path";
// Geração client-side do PDF do certificado. Este módulo importa o
// @react-pdf/renderer e o qrcode no topo, então é SEMPRE carregado via
// `import()` dinâmico (a partir da seção do admin) — assim essas libs ficam
// fora do bundle inicial e nunca rodam no prerender do export estático.
import { pdf } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { getImageUrl } from "@/lib/api";
import { CertificateDocument, type CertificateDocData } from "./certificate-pdf";

// "AAAA-MM-DD" (ou ISO) -> "dd/mm/aaaa"
function formatDateBR(iso: string): string {
  const ymd = (iso ?? "").slice(0, 10);
  const [y, m, d] = ymd.split("-");
  if (!y || !m || !d) return ymd;
  return `${d}/${m}/${y}`;
}

// URL pública da página de verificação (lida pelo QR code). Same-origin.
export function verifyUrl(code: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}${publicAsset("/verificar/")}?c=${encodeURIComponent(code)}`;
}

// Converte uma URL de imagem (ex.: assinatura salva em /uploads) num data URL,
// para embutir no PDF. Retorna null em caso de falha.
async function imageUrlToDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(getImageUrl(url));
    if (!res.ok) return null;
    const blob = await res.blob();
    // O @react-pdf/renderer só decodifica PNG/JPEG; qualquer outra coisa (um
    // HTML de erro servido com 200, SVG, etc.) faria o <Image> estourar na
    // geração. Nesses casos tratamos como "sem assinatura".
    if (!/^image\/(png|jpe?g)$/i.test(blob.type)) return null;
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// Busca um asset PNG/JPEG do próprio site (pasta public/) como data URL.
// Retorna null em caso de falha — o PDF sai sem a imagem, nunca quebra.
async function publicImageToDataUrl(path: string): Promise<string | null> {
  try {
    const res = await fetch(publicAsset(path));
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!/^image\/(png|jpe?g)$/i.test(blob.type)) return null;
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export interface BuildCertificateInput {
  tipo?: "empresa" | "afiliado";
  tier?: "blue" | "ouro" | "black";
  empresaNome: string;
  categoria?: string;
  responsavelNome: string;
  code: string;
  issuedAt: string; // ISO / "AAAA-MM-DD"
  validUntil: string; // ISO / "AAAA-MM-DD"
  // Use signatureDataUrl quando a assinatura ainda está em memória (recém
  // desenhada); senão passe signatureUrl (/uploads/...) para buscar do servidor.
  signatureDataUrl?: string | null;
  signatureUrl?: string | null;
}

export async function buildCertificateBlob(input: BuildCertificateInput): Promise<Blob> {
  const qrDataUrl = await QRCode.toDataURL(verifyUrl(input.code), {
    margin: 1,
    width: 320,
    color: { dark: "#071735", light: "#ffffff" },
  });

  let signatureDataUrl = input.signatureDataUrl ?? null;
  if (!signatureDataUrl && input.signatureUrl) {
    signatureDataUrl = await imageUrlToDataUrl(input.signatureUrl);
  }

  // Logo oficial + mascote da marca. Best-effort: se algum falhar, o PDF sai
  // com o fallback (logo desenhado) / sem o mascote.
  const mascotDataUrl = await publicImageToDataUrl("/brand/mascote-dourado.png");
  const logoDataUrl = mascotDataUrl;

  const data: CertificateDocData = {
    tipo: input.tipo ?? "empresa",
    tier: input.tier ?? "ouro",
    empresaNome: input.empresaNome,
    categoria: input.categoria,
    responsavelNome: input.responsavelNome,
    code: input.code,
    issuedLabel: formatDateBR(input.issuedAt),
    validLabel: formatDateBR(input.validUntil),
    qrDataUrl,
    signatureDataUrl,
    logoDataUrl,
    mascotDataUrl,
  };

  try {
    return await pdf(<CertificateDocument data={data} />).toBlob();
  } catch (err) {
    // A assinatura embutida é a suspeita nº1 de quebrar o @react-pdf/renderer
    // (imagem que ele não consegue decodificar). Se havia uma, refaz o PDF sem
    // ela em vez de falhar tudo — o certificado continua válido (QR + dados).
    if (!data.signatureDataUrl) throw err;
    return await pdf(<CertificateDocument data={{ ...data, signatureDataUrl: null }} />).toBlob();
  }
}

// Nome de arquivo amigável: "certificado-<empresa>-<code>.pdf".
export function certificateFileName(empresaNome: string, code: string): string {
  const slug = empresaNome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `certificado-${slug || "empresa"}-${code}.pdf`;
}

// Entrega o PDF ao usuário da forma que funciona no dispositivo:
//  - iOS/Android com Web Share Nível 2: abre a folha de compartilhamento
//    (permite "Salvar em Arquivos", enviar etc.). É o ÚNICO caminho confiável
//    no PWA iOS — lá o truque <a download> de blob não faz nada.
//  - Desktop / sem Web Share de arquivos: dispara o download via <a download>,
//    revogando a object URL só depois (revogar na hora aborta o download).
// Deve ser chamada DENTRO de um gesto do usuário (clique), exigência do iOS.
export async function saveOrShareCertificate(blob: Blob, fileName: string): Promise<void> {
  const file = new File([blob], fileName, { type: "application/pdf" });
  const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean };
  if (typeof nav.canShare === "function" && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: fileName });
      return;
    } catch (err) {
      // Cancelou a folha de compartilhamento -> não cai no download.
      if (err instanceof DOMException && err.name === "AbortError") return;
      // Outras falhas: segue para o fallback de download abaixo.
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// Atalho: gera o PDF e já entrega (compartilha/baixa). Mantido por compat.
export async function downloadCertificate(input: BuildCertificateInput): Promise<void> {
  const blob = await buildCertificateBlob(input);
  await saveOrShareCertificate(blob, certificateFileName(input.empresaNome, input.code));
}
