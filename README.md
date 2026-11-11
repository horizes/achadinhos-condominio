# Achadinhos do Condomínio

Marketplace para o mercado condominial, atualizado com a identidade **Executive Navy & Gold** usada na plataforma Achadinhos Indica.

Base original: [oyaga/achadinhos](https://github.com/oyaga/achadinhos), commit `629d310`. O histórico original foi preservado na cópia local.

## Estrutura

- `frontend/`: Next.js 16, React 19, páginas públicas, painel administrativo e PWA.
- `backend/`: API Go, autenticação, agenda, certificados e integrações.
- `backend/migrations/`: migrações do PostgreSQL.
- `project/`: protótipos originais de referência; não substituem o frontend de produção.
- `Dockerfile` e `docker-compose.yml`: aplicação integrada com backend e PostgreSQL.

## Identidade visual

Azul-marinho `#071735`, azul executivo `#102B50`, dourado `#C6A15B`, branco e cinza `#F4F6F8`. Fonte Manrope servida localmente, mascote dourado oficial à direita do nome e logos Blue, Top e Black da plataforma. A navegação e os serviços existentes foram mantidos.

Detalhes em [IDENTIDADE-VISUAL.md](IDENTIDADE-VISUAL.md), incluindo arquivos e publicação.

## Desenvolvimento

```sh
cd frontend
npm ci
npm run dev
```

Configure `NEXT_PUBLIC_API_URL` para o backend desejado (padrão de desenvolvimento: `http://localhost:8080/api/v1`). Para o backend e banco, siga [backend/README.md](backend/README.md) e `.env.example`.

## Produção

O frontend é exportado e incorporado ao servidor Go no build Docker. A aplicação completa precisa do backend e PostgreSQL; GitHub Pages sozinho não executa essas funções. O Dockerfile mantém o fluxo original de geração das páginas de empresas e produtos consultando a API configurada durante o build.

O workflow publica no registro de imagens da conta do próprio repositório. Redeploy via Portainer só ocorre por disparo manual e com o segredo configurado. Não inclui credenciais de produção.

Validação e limites em [VALIDACAO.md](VALIDACAO.md).

## Prévia no GitHub Pages

Endereço: https://horizes.github.io/achadinhos-condominio/

A prévia é estática e usa dados fictícios. Para explorar o painel: `demo@achadinhos.test`, senha `demonstracao`. Não use dados ou senhas reais. Ações que exigem banco, envio de mensagens, reservas ou pagamentos não são executadas.

O workflow `.github/workflows/pages.yml` compila com `NEXT_PUBLIC_PREVIEW=true` e `NEXT_PUBLIC_BASE_PATH=/achadinhos-condominio`. Essas opções são exclusivas da prévia; o build normal mantém a API Go original.
## Integração Achadinhos Indica para o marketplace

Quando um contrato no Achadinhos Indica é finalizado (adesão confirmada e plano ativado), o Indica envia automaticamente os dados da empresa para este marketplace via POST /api/v1/integracoes/indica/finalizado, autenticada por assinatura HMAC-SHA256 do corpo (segredo compartilhado INDICA_WEBHOOK_SECRET).

O cadastro é criado ou atualizado como seller (empresa parceira), usando a categoria deduzida do segmento informado e o plano BLUE/TOP/BLACK como cert_tier, seguindo o mesmo padrão dos cadastros existentes.

Ativação em produção:
1. Defina INDICA_WEBHOOK_SECRET (openssl rand -hex 48) no .env usado pelo Docker.
2. No Achadinhos Indica, aponte marketplace-integration.php para a URL pública desta rota com o mesmo segredo.
3. Sem INDICA_WEBHOOK_SECRET a rota responde 503 (não interfere no restante do site).
