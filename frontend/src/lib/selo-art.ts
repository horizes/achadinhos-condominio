// "Selo para divulgar" (spec, funções de engajamento): o fornecedor
// certificado baixa uma arte "Certificado Achadinhos" para postar nas redes,
// com o nome, o selo e o link para o perfil. Gerado no aparelho (canvas),
// a partir de dados reais — nada é inventado nem pré-renderizado.
export async function downloadSeloArt(opts: {
  companyName: string;
  tier: string | undefined;
  profileUrl: string;
}): Promise<void> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas não suportado neste aparelho.");

  const NAVY = "#071735";
  const NAVY2 = "#0f2350";
  const GOLD = "#e0bc72";
  const GOLD2 = "#e3c68a";
  const CREAM = "#f6efe0";

  // Fundo
  const g = ctx.createLinearGradient(0, 0, 0, 1080);
  g.addColorStop(0, NAVY2);
  g.addColorStop(0.45, NAVY);
  g.addColorStop(1, "#050f24");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1080, 1080);

  // Moldura dourada
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 10;
  ctx.strokeRect(46, 46, 1080 - 92, 1080 - 92);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(224,188,114,0.55)";
  ctx.strokeRect(64, 64, 1080 - 128, 1080 - 128);

  // Mascote (mesma arte usada no app)
  await new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const h = 330;
      const w = (img.width / img.height) * h;
      ctx.drawImage(img, (1080 - w) / 2, 108, w, h);
      resolve();
    };
    img.onerror = () => resolve(); // nunca trava o download por causa da imagem
    img.src = "/brand/mascote-dourado-v2.png";
  });

  ctx.textAlign = "center";

  // Eyebrow
  ctx.fillStyle = GOLD2;
  ctx.font = "600 34px Manrope, sans-serif";
  ctx.fillText("C E R T I F I C A D O", 540, 552);

  // Nome da certificação
  ctx.fillStyle = CREAM;
  ctx.font = "800 84px Manrope, sans-serif";
  ctx.fillText("ACHADINHOS", 540, 652);

  // Selo (pílula com o nível)
  const tier = (opts.tier ?? "").trim();
  const tierLabel = tier ? `CERTIFICADO ${tier.toUpperCase()}` : "CERTIFICADO ACHADINHOS";
  ctx.font = "800 44px Manrope, sans-serif";
  const tw = ctx.measureText(tierLabel).width + 120;
  const px = (1080 - tw) / 2;
  ctx.fillStyle = GOLD;
  roundRect(ctx, px, 690, tw, 84, 42);
  ctx.fill();
  ctx.fillStyle = NAVY;
  ctx.fillText(tierLabel, 540, 745);

  // Nome da empresa (2 linhas no máx)
  ctx.fillStyle = CREAM;
  ctx.font = "700 40px Manrope, sans-serif";
  wrapText(ctx, opts.companyName, 540, 858, 860, 52);

  // Rodapé: link do perfil
  ctx.fillStyle = "rgba(246, 239, 224, 0.82)";
  ctx.font = "600 25px Manrope, sans-serif";
  const short = opts.profileUrl.replace(/^https?:\/\//, "");
  ctx.fillText(short, 540, 985);
  ctx.fillStyle = GOLD;
  ctx.font = "700 19px Manrope, sans-serif";
  ctx.fillText("A C H A D I N H O S   D O   C O N D O M Í N I O", 540, 1017);

  await new Promise<void>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const a = document.createElement("a");
        const slug = opts.companyName
          .toLowerCase()
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        a.href = URL.createObjectURL(blob);
        a.download = `selo-achadinhos-${slug || "empresa"}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
      }
      resolve();
    }, "image/png");
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  lines.slice(0, 2).forEach((l, i) => ctx.fillText(l, cx, y + i * lineHeight));
}
