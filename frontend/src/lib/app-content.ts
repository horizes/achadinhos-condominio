// ═══════════════════════════════════════════════════════════════════════════
// Conteúdo configurável do app (spec "Achadinhos do Condomínio — a especificação
// do app", 12/nov/2026). Onde a spec marca [colchetes], o valor fica aqui,
// centralizado — hoje editável só pelo código; no futuro, pelo painel admin.
// Todos os textos abaixo seguem EXATAMENTE a especificação — não inventar.
// ═══════════════════════════════════════════════════════════════════════════

export const APP_CONTENT = {
  // ── Vídeo de boas-vindas ──
  // [duração] do vídeo e [nome da empresa] a confirmar. Enquanto o arquivo não
  // chegar, mostramos o placeholder aprovado pelo layout (botão de play) —
  // nenhum vídeo é simulado/mentido.
  welcomeVideo: {
    // URL do vídeo (mp4 ou youtu.be/…). Vazia = placeholder "em breve".
    url: "",
    caption: "Boas-vindas ao Achadinhos",
    durationLabel: "[duração a definir]", // ex.: "1 minuto"
    subtitle: "explica como o app funciona",
  } as const,

  // ── Universos ──
  universes: {
    construcao: {
      label: "Achadinhos da Construção",
      tagline: "Arquitetos, marmoraria, planejados e mais",
      universeLabel: "UNIVERSO DOS ACHADINHOS",
      titleGold: "Construção",
      subtitle: "Profissionais certificados para construir, reformar e decorar.",
      searchPlaceholder: "Buscar na construção…",
      ctaTitle: "É DA CONSTRUÇÃO?",
      ctaBody: "Coloque sua empresa no Achadinhos da Construção",
      ctaButton: "Quero ser afiliado",
    } as const,
  },

  // ── Achadinhos Indica (produtos com link de afiliado) ──
  indica: {
    entryButton:
      "Achadinhos Indica — Produtos e equipamentos com o menor custo",
    url: "https://achadinhosindica.com.br",
    lojaLabel: "LOJA DE INDICAÇÕES",
    titleGold: "Indica",
    subtitle:
      "Produtos e equipamentos para o seu condomínio: melhor avaliação e menor custo.",
    footerNote:
      "Links de afiliado: o Achadinhos pode receber uma comissão quando você compra pelos links, sem custo extra para você. Preço e estoque são da loja e podem mudar.",
  } as const,

  // ── Convide e ganhe ──
  invite: {
    title: "Traga seu condomínio para o Achadinhos",
    shareText:
      "Traga seu condomínio para o Achadinhos! Ache aqui fornecedores certificados de confiança:",
    benefitNote: "Benefício da indicação: [a definir]",
    button: "Compartilhar convite",
  } as const,

  // ── Certificação Achadinhos ──
  // [critérios reais a definir] — itens exibidos como "o que conferimos nesta
  // empresa" no perfil. Placeholders explícitos, nunca inventados.
  certCriteria: [
    "[Critério da certificação — a definir]",
    "[Critério da certificação — a definir]",
    "[Critério da certificação — a definir]",
    "[Critério da certificação — a definir]",
  ] as string[],

  // ── Avaliação (spec: janela "Avaliar") — etiquetas rápidas ──
  reviewTags: [
    "Pontual",
    "Limpo",
    "Caprichoso",
    "Bom preço",
    "Educado",
    "Rápido",
  ] as string[],

  // ── Pedido de orçamento ──
  quote: {
    servicesLabel: "Qual serviço você precisa?",
    needLabel: "Descreva a necessidade",
    needPlaceholder: "Ex.: porta da garagem com defeito, vazamento na cobertura…",
    deadlineOptions: [
      { value: "hoje", label: "O quanto antes" },
      { value: "3dias", label: "Em até 3 dias" },
      { value: "7dias", label: "Em até 1 semana" },
      { value: "15dias", label: "Em até 15 dias" },
      { value: "30dias", label: "Em até 30 dias" },
      { value: "sem_prazo", label: "Sem prazo, só quero orçamento" },
    ] as const,
    statuses: ["Enviado", "Respondido", "Fechado"] as const,
  } as const,
} as const;

export type AppContent = typeof APP_CONTENT;
