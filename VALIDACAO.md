# Validação da atualização visual — 03/11/2026

## Revisão de 16/11/2026

- Calendário inicializado após a hidratação: a data atual deixa de divergir do HTML exportado dias ou meses antes. Dias com identificação completa e estado de seleção acessível.
- Ano do rodapé atualizado no navegador sem divergência na virada do ano. Botão de instalação no desktop exibido somente quando existe um prompt nativo disponível.
- Next.js atualizado para 16.4.6 e dependências compatíveis atualizadas. A auditoria do npm ficou sem alertas altos/críticos; cinco moderados permanecem na cadeia de build do Serwist, cuja resolução sugerida implica troca incompatível de versão.
- Build e TypeScript aprovados; 22 verificações da prévia, incluindo home em 320, 390, 768 e 1440 px, busca, login fictício, oito seções administrativas, páginas públicas e calendário com data simulada em dezembro de 2030. Sem erros JavaScript, assets ausentes ou chamadas fora da prévia nesses testes.
- Nenhuma cobrança, conta real ou mensagem foi criada nesses testes.
- Registro do service worker centralizado em um único componente, com tratamento de falhas quando indisponível. Aliases RSC gerados no build para navegação em hospedagem estática. Breadcrumb de loja não aponta mais para uma categoria interna sem página pública.
- Docker passa a usar Node/npm e o mesmo lockfile utilizado pela validação e pelo GitHub Actions; lockfile Bun também atualizado para quem o utiliza localmente.

- Build de produção do Next.js com TypeScript e exportação de 28 páginas, usando API local com dados fictícios de empresa, prestador e produto.
- 27 verificações de interface em navegador isolado: home em 320, 390, 768, 1024 e 1440 px; busca; persistência de favoritos; mostrar/ocultar senha; páginas de cadastro, planos, certificação, verificação, eventos, blog e detalhes de empresa/produto; nove áreas do painel administrativo.
- Sem erros JavaScript nesses testes. O service worker não é registrado nesse ambiente isolado; instalação, atualização e funcionamento offline do PWA exigem conferência na hospedagem HTTPS.
- Nenhuma alteração em `backend/`, migrações, cliente de API, hooks ou contexto de autenticação. Os dados e serviços originais são utilizados pela interface.
- Não foram feitos testes com contas reais, envios de mensagens/e-mails, novas reservas, alterações de banco ou transações financeiras.
- O backend Go/PostgreSQL e as integrações externas não foram executados neste ambiente. A aprovação dos testes de interface não equivale a uma auditoria completa do backend.

## Conferência após configurar a hospedagem

1. Entrar com os perfis de cliente, empresa e administrador.
2. Buscar empresas, filtrar, favoritar, abrir detalhes e conferir os contatos.
3. Consultar shopping, eventos, blog e páginas criadas após o build.
4. Conferir agenda/Google, notificações e formulário público com uma reserva de teste autorizada.
5. Emitir um certificado de teste e conferir assinatura, PDF e leitura do QR.
6. Instalar/atualizar o PWA em Android/iOS e verificar retorno à home/offline.

Relatório JSON e prévias locais acompanham o pacote de entrega. O export usado nos testes contém dados fictícios e endereço de API local e não deve ser publicado como produção; gere o build com sua configuração real.

## GitHub Pages

A prévia usa `NEXT_PUBLIC_PREVIEW=true`, dados fictícios locais e API de demonstração. O build de produção continua usando o backend original quando essa variável não está ativa. Conta pública de demonstração: `demo@achadinhos.test`, senha `demonstracao`. As operações de cadastro, reservas, envios e pagamentos reais ficam indisponíveis nessa prévia. O registro do service worker foi desativado apenas no build de testes para não manter versões antigas em cache.
