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
