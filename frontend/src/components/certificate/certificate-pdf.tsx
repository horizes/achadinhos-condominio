/* eslint-disable jsx-a11y/alt-text */
// Documento PDF do "Certificado de Empresa Qualificada", em A4 retrato.
//
// Usa as fontes nativas do PDF (Times-Italic para os títulos serifados em
// itálico, Helvetica para o corpo) — assim não dependemos de baixar nenhuma
// fonte em runtime e o PDF é 100% vetorial e funciona offline. Para trocar por
// Fraunces/Inter de verdade, registre os .ttf via Font.register e troque as
// referências de fontFamily abaixo.
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Svg,
  Path,
  Circle,
  Ellipse,
  Line,
  Defs,
  LinearGradient,
  Stop,
} from "@react-pdf/renderer";

export interface CertificateDocData {
  tipo?: "empresa" | "afiliado";
  tier?: "blue" | "ouro" | "black";
  empresaNome: string;
  categoria?: string;
  responsavelNome: string;
  code: string;
  issuedLabel: string; // "dd/mm/aaaa"
  validLabel: string; // "dd/mm/aaaa"
  qrDataUrl: string; // PNG data URL do QR
  signatureDataUrl?: string | null; // PNG data URL da assinatura desenhada
  logoDataUrl?: string | null; // PNG data URL do logo oficial (emblema laranja)
  mascotDataUrl?: string | null; // PNG data URL do mascote (rasterizado do SVG)
}

// Paleta e textos por nível (tier) do certificado.
const TIER = {
  blue: {
    label: "BLUE",
    name: "Blue",
    light: "#bfdbfe",
    main: "#2563eb",
    dark: "#1e40af",
    sentence: "Atende aos requisitos mínimos do Achadinhos do Condomínio.",
  },
  ouro: {
    label: "TOP",
    name: "Top",
    light: "#E6D5B3",
    main: "#C6A15B",
    dark: "#a8884a",
    sentence: "Atende aos requisitos padrão do Achadinhos do Condomínio.",
  },
  black: {
    label: "BLACK",
    name: "Black",
    light: "#C6A15B",
    main: "#3a3320",
    dark: "#071735",
    sentence:
      "Aprovado em avaliação rigorosa, conduzida diretamente pela equipe especializada do Achadinhos do Condomínio.",
  },
} as const;

const C = {
  bg: "#F4F6F8",
  navy: "#071735",
  navy2: "#102B50",
  gold: "#C6A15B",
  goldLight: "#E6D5B3",
  ink: "#071735",
  amber: "#C6A15B",
  cream: "#F4F6F8",
};

const s = StyleSheet.create({
  page: { backgroundColor: C.bg, position: "relative", fontFamily: "Helvetica" },
  fill: { position: "absolute", top: 0, left: 0 },
  outerFrame: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    borderWidth: 2.5,
    borderColor: C.navy,
    borderRadius: 16,
  },
  goldFrame: {
    position: "absolute",
    top: 28,
    left: 28,
    right: 28,
    bottom: 28,
    borderWidth: 1.2,
    borderColor: C.gold,
    borderRadius: 12,
  },
  content: {
    position: "absolute",
    top: 46,
    left: 50,
    right: 50,
    bottom: 44,
    alignItems: "center",
  },
  header: {
    width: "100%",
    backgroundColor: C.navy,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  headerLogo: { width: 34, height: 34, marginRight: 10 },
  headerBrand: { fontFamily: "Helvetica-Bold", color: C.goldLight, fontSize: 15, letterSpacing: 3 },
  headerSub: { color: C.cream, fontSize: 7, letterSpacing: 2, marginTop: 2, opacity: 0.85 },
  kicker: { color: C.gold, fontSize: 9, letterSpacing: 4, marginTop: 26, fontFamily: "Helvetica-Bold" },
  title: { color: C.navy, fontFamily: "Times-Italic", fontSize: 31, marginTop: 8, textAlign: "center" },
  body: {
    color: C.ink,
    fontSize: 11.5,
    lineHeight: 1.7,
    textAlign: "center",
    marginTop: 18,
    maxWidth: 400,
  },
  empresa: { fontFamily: "Times-BoldItalic", fontSize: 14, color: C.navy },
  strong: { fontFamily: "Helvetica-Bold", color: C.navy2 },
  sealWrap: { marginTop: 18, width: 132, alignItems: "center", justifyContent: "center" },
  sealLabel: {
    position: "absolute",
    top: 80,
    left: 0,
    right: 0,
    textAlign: "center",
    color: C.navy,
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    letterSpacing: 2,
  },
  sealTop: {
    position: "absolute",
    top: 97,
    left: 0,
    right: 0,
    textAlign: "center",
    color: C.gold,
    fontFamily: "Helvetica-Bold",
    fontSize: 5.5,
    letterSpacing: 1.5,
  },
  infoGrid: {
    marginTop: 22,
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  infoCell: { width: "48%", marginBottom: 10 },
  infoCellFull: { width: "100%", marginBottom: 2, alignItems: "center" },
  infoLabel: { color: C.gold, fontSize: 7, letterSpacing: 1.5, fontFamily: "Helvetica-Bold" },
  infoValue: { color: C.ink, fontSize: 10.5, marginTop: 2 },
  codeValue: { color: C.navy, fontSize: 12, marginTop: 2, fontFamily: "Helvetica-Bold", letterSpacing: 1 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  sign: { width: 230, alignItems: "center" },
  signImg: { width: 150, height: 46, objectFit: "contain", marginBottom: 2 },
  signLine: { width: 200, borderTopWidth: 1, borderTopColor: C.navy, marginTop: 2 },
  signName: { color: C.navy, fontSize: 9.5, fontFamily: "Helvetica-Bold", marginTop: 4 },
  signRole: { color: C.ink, fontSize: 7.5, marginTop: 1, opacity: 0.8 },
  // Mascote da marca (moeda dourada acenando) entre a assinatura e o QR.
  mascotWrap: { alignItems: "center", justifyContent: "flex-end" },
  mascotImg: { width: 58, height: 74, objectFit: "contain" },
  qrWrap: { alignItems: "center", width: 110 },
  qrImg: { width: 72, height: 72 },
  qrCaption: { color: C.ink, fontSize: 6.5, marginTop: 3, textAlign: "center", opacity: 0.8 },
});

// Filete dourado com losango central, usado como divisor sob o título.
function GoldDivider() {
  return (
    <Svg width={180} height={12} viewBox="0 0 180 12" style={{ marginTop: 12 }}>
      <Line x1="6" y1="6" x2="78" y2="6" stroke={C.gold} strokeWidth={1} />
      <Line x1="102" y1="6" x2="174" y2="6" stroke={C.gold} strokeWidth={1} />
      <Path d="M90 1 L95 6 L90 11 L85 6 Z" fill={C.gold} />
    </Svg>
  );
}

// Ornamento de quina (bracket dourado com losango). `corner` decide a orientação.
function Corner({ corner }: { corner: "tl" | "tr" | "bl" | "br" }) {
  const B = 46;
  const m = 6; // offset do vértice: View em 22 + 6 = 28pt, alinhando o ornamento ao canto da moldura dourada
  // Pontos do "L" conforme a quina.
  const x = corner === "tl" || corner === "bl" ? m : B - m;
  const y = corner === "tl" || corner === "tr" ? m : B - m;
  const hx2 = corner === "tl" || corner === "bl" ? B : 0; // direção horizontal
  const vy2 = corner === "tl" || corner === "tr" ? B : 0; // direção vertical
  const pos: Record<string, number> = {};
  if (corner === "tl") {
    pos.top = 22;
    pos.left = 22;
  } else if (corner === "tr") {
    pos.top = 22;
    pos.right = 22;
  } else if (corner === "bl") {
    pos.bottom = 22;
    pos.left = 22;
  } else {
    pos.bottom = 22;
    pos.right = 22;
  }
  const inset = 8; // linha interna paralela
  const ix = corner === "tl" || corner === "bl" ? x + inset : x - inset;
  const iy = corner === "tl" || corner === "tr" ? y + inset : y - inset;
  return (
    <View style={{ position: "absolute", width: B, height: B, ...pos }}>
      <Svg width={B} height={B} viewBox={`0 0 ${B} ${B}`}>
        <Line x1={x} y1={y} x2={hx2} y2={y} stroke={C.gold} strokeWidth={1.2} />
        <Line x1={x} y1={y} x2={x} y2={vy2} stroke={C.gold} strokeWidth={1.2} />
        <Line x1={ix} y1={iy} x2={hx2} y2={iy} stroke={C.gold} strokeWidth={0.6} />
        <Line x1={ix} y1={iy} x2={ix} y2={vy2} stroke={C.gold} strokeWidth={0.6} />
        <Path d={`M${x} ${y - 4} L${x + 4} ${y} L${x} ${y + 4} L${x - 4} ${y} Z`} fill={C.gold} />
      </Svg>
    </View>
  );
}

// Selo circular "APROVADO" com escudo + check, colorido conforme o nível.
function ApprovedSeal({ tier }: { tier: (typeof TIER)[keyof typeof TIER] }) {
  return (
    <View style={s.sealWrap}>
      <Svg width={132} height={132} viewBox="0 0 132 132">
        <Defs>
          <LinearGradient id="tierRing" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={tier.light} />
            <Stop offset="0.5" stopColor={tier.main} />
            <Stop offset="1" stopColor={tier.dark} />
          </LinearGradient>
        </Defs>
        <Circle cx="66" cy="66" r="62" fill="none" stroke="url(#tierRing)" strokeWidth={6} />
        <Circle cx="66" cy="66" r="52" fill="none" stroke={tier.main} strokeWidth={1.2} />
        <Circle cx="66" cy="66" r="49" fill={C.bg} />
        {/* Escudo com check, na metade superior do selo */}
        <Path
          d="M66 26 L83 32 L83 49 C83 60 75 67 66 71 C57 67 49 60 49 49 L49 32 Z"
          fill="url(#tierRing)"
          stroke={tier.dark}
          strokeWidth={1}
        />
        <Path
          d="M59 48 l5 5 l12 -13"
          fill="none"
          stroke={C.bg}
          strokeWidth={3.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <Text style={s.sealLabel}>APROVADO</Text>
      <Text style={[s.sealTop, { color: tier.dark }]}>NÍVEL {tier.label}</Text>
    </View>
  );
}

// Fundo guilloché sutil (elipses concêntricas finas) sobre o papel bege.
function Guilloche() {
  const cx = 297.64;
  const cy = 360;
  const rings = Array.from({ length: 18 }, (_, i) => 14 + i * 16);
  // Altura um tiquinho menor que o A4 (841.89) de propósito: como fundo, se a
  // SVG tiver exatamente a altura da página o react-pdf a considera "maior que
  // a altura disponível" e empurra para uma 2ª página. 838 cabe com folga.
  return (
    <Svg width={595.28} height={838} viewBox="0 0 595.28 841.89" style={s.fill}>
      {rings.map((r, i) => (
        <Ellipse
          key={i}
          cx={cx}
          cy={cy}
          rx={r}
          ry={r * 0.62}
          fill="none"
          stroke={C.navy}
          strokeWidth={0.4}
          opacity={0.045}
        />
      ))}
    </Svg>
  );
}

export function CertificateDocument({ data }: { data: CertificateDocData }) {
  const categoria = (data.categoria ?? "").trim() || "—";
  const isEmpresa = data.tipo !== "afiliado";
  const tier = TIER[data.tier ?? "ouro"] ?? TIER.ouro;
  const titulo = isEmpresa
    ? "Certificado de Empresa Qualificada"
    : "Certificado de Afiliado Qualificado";
  return (
    <Document
      title={`Certificado ${data.code}`}
      author="Achadinhos do Condomínio"
      subject={`${titulo} — ${data.empresaNome}`}
    >
      <Page size="A4" style={s.page}>
        <Guilloche />
        <View style={s.outerFrame} />
        <View style={s.goldFrame} />
        <Corner corner="tl" />
        <Corner corner="tr" />
        <Corner corner="bl" />
        <Corner corner="br" />

        <View style={s.content}>
          {/* Faixa superior azul-marinho com o logo oficial + emissor */}
          <View style={s.header}>
            {data.logoDataUrl ? (
              <Image src={data.logoDataUrl} style={s.headerLogo} />
            ) : (
              <Svg width={26} height={26} viewBox="0 0 24 24" style={{ marginRight: 10 }}>
                <Path
                  d="M3 11 L12 4 L21 11 L21 20 a1 1 0 0 1 -1 1 h-5 v-6 h-6 v6 H4 a1 1 0 0 1 -1 -1 Z"
                  fill="none"
                  stroke={C.goldLight}
                  strokeWidth={1.6}
                  strokeLinejoin="round"
                />
                <Circle cx="12" cy="13" r="1.5" fill={C.goldLight} />
              </Svg>
            )}
            <View style={{ alignItems: "center" }}>
              <Text style={s.headerBrand}>ACHADINHOS DO CONDOMÍNIO</Text>
              <Text style={s.headerSub}>PLATAFORMA DE SERVIÇOS E COMÉRCIO PARA CONDOMÍNIOS</Text>
            </View>
          </View>

          <Text style={s.kicker}>CERTIFICADO OFICIAL · NÍVEL {tier.label}</Text>
          <Text style={s.title}>{titulo}</Text>
          <GoldDivider />

          <Text style={s.body}>
            Certificamos que {isEmpresa ? "a empresa" : "o(a) afiliado(a)"}{" "}
            <Text style={s.empresa}>{data.empresaNome}</Text> foi submetido(a) a processo de
            avaliação e qualificação, estando <Text style={s.strong}>APROVADO(A) e APTO(A)</Text>{" "}
            a prestar serviços aos condomínios parceiros da plataforma Achadinhos do Condomínio.{" "}
            Nível <Text style={s.strong}>{tier.name}</Text>: {tier.sentence}
          </Text>

          <ApprovedSeal tier={tier} />

          <View style={s.infoGrid}>
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>{isEmpresa ? "EMPRESA" : "AFILIADO"}</Text>
              <Text style={s.infoValue}>{data.empresaNome}</Text>
            </View>
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>NÍVEL</Text>
              <Text style={s.infoValue}>{tier.name}</Text>
            </View>
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>CATEGORIA / SEGMENTO</Text>
              <Text style={s.infoValue}>{categoria}</Text>
            </View>
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>DATA DE EMISSÃO</Text>
              <Text style={s.infoValue}>{data.issuedLabel}</Text>
            </View>
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>VÁLIDO ATÉ</Text>
              <Text style={s.infoValue}>{data.validLabel}</Text>
            </View>
            <View style={s.infoCellFull}>
              <Text style={s.infoLabel}>CÓDIGO DE VERIFICAÇÃO</Text>
              <Text style={s.codeValue}>{data.code}</Text>
            </View>
          </View>

          <View style={s.footer}>
            <View style={s.sign}>
              {data.signatureDataUrl ? <Image src={data.signatureDataUrl} style={s.signImg} /> : null}
              <View style={s.signLine} />
              <Text style={s.signName}>Achadinhos do Condomínio</Text>
              <Text style={s.signRole}>Coordenação de Credenciamento</Text>
              {data.responsavelNome ? (
                <Text style={s.signRole}>Responsável: {data.responsavelNome}</Text>
              ) : null}
            </View>
            {data.mascotDataUrl ? (
              <View style={s.mascotWrap}>
                <Image src={data.mascotDataUrl} style={s.mascotImg} />
              </View>
            ) : null}
            <View style={s.qrWrap}>
              <Image src={data.qrDataUrl} style={s.qrImg} />
              <Text style={s.qrCaption}>Verifique a autenticidade</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
