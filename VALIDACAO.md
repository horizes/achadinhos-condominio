# Validação da atualização visual — 03/11/2026

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
