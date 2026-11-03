# Achadinhos do Condomínio — Executive Navy & Gold

Projeto original: https://github.com/oyaga/achadinhos (commit 629d310).

## Identidade compartilhada

- Azul-marinho: `#071735`.
- Azul executivo: `#102B50`.
- Dourado champagne: `#C6A15B`.
- Branco: `#FFFFFF`; fundo alternativo: `#F4F6F8`.
- Manrope variável local, a mesma fonte da apresentação institucional. Licença OFL incluída.
- Mascote dourado oficial com transparência, inteiro, à direita do nome.
- Logos Blue, Top e Black da plataforma, preservadas.

Os tokens do CSS original continuam com os mesmos nomes para que os componentes existentes mantenham os estados, variantes e hierarquia. `frontend/src/app/executive.css` complementa a identidade sem substituir a navegação ou os componentes funcionais. `BrandSignature` centraliza a marca nas páginas públicas, autenticação, agendamento e rodapé. Os ícones de instalação usam a mesma arte dourada com fundo navy.

## Funções preservadas

Backend Go, banco, migrações, autenticação, APIs, permissões e regras de negócio não foram alterados. O catálogo, busca, filtros, favoritos, WhatsApp, shopping, eventos, blog, perfil, cadastro de empresas, certificados/QR, agenda, painel administrativo e PWA continuam utilizando os componentes e serviços originais.

A atualização do PDF altera cores e a imagem da marca, mantendo os dados, assinatura e QR de verificação. A arte original do mascote não foi redesenhada.

## Executar

```powershell
cd frontend
npm ci
$env:NEXT_PUBLIC_API_URL = "http://localhost:8080/api/v1"
npm run dev
```

Para integração completa, configure o backend conforme `backend/README.md` e as variáveis de `.env.example`. O frontend não substitui o backend nem copia os dados da produção. Não publique `.env` ou credenciais.

## Publicação

Esta cópia deve ser mantida em `horizes/achadinhos-condominio`, separada do sistema de contratos `horizes/Achadinhos`. O workflow publica a imagem na conta do próprio repositório; o webhook de redeploy só é executado por disparo manual. Configurar hospedagem/segredos de produção é uma etapa separada da publicação do código no GitHub.

Os arquivos `public/sw.js` e `public/swe-worker-*.js` são gerados pelo build. O código-fonte do worker continua em `src/app/sw.ts`.
