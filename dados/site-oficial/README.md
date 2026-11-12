# Dados do site oficial (achadinhoscondominio.com.br) — completo, PRIVADO

Snapshot completo do que está em produção hoje (**2026-11-12**), para recriação manual da nossa versão. **Acessível apenas a quem tem acesso a este repositório privado. Contém dados sensíveis (CNPJ/CPF de responsáveis e assinaturas digitais). Não exportar, não distribuir.**

## Arquivos

| Arquivo | Registros | O que tem |
|---|---|---|
| `sellers.csv` | 21 | 19 ativos + 2 soft-deletados (`deleted_at` preenchido). Inclui CNPJ, valor mensal/anual, vigência, contrato |
| `seller_categories.csv` | 35 | Vínculo N:N empresa ↔ categorias (múltiplas) |
| `categories.csv` | 83 | Lista canônica completa de categorias |
| `products.csv` | 51 | Produtos com preços, fotos, badges |
| `product_photos.csv` | 65 | Fotos dos produtos |
| `portfolio_photos.csv` | 24 | Fotos/PDFs do portfólio das empresas |
| `certificates.csv` | 21 | Certificados emitidos com responsável e assinatura (dados pessoais de responsável) |
| `fichas_cadastro.csv` | 6 | Fichas de "Cadastro de empresas" — com **CNPJ e CPF**, e-mail e telefone de responsáveis (dados sensíveis) |
| `events.csv` | 5 | Eventos do calendário |
| `banners.csv` | 1 | Banner principal (no ar atualmente é o evento "Imersão Condominial") |
| `providers.csv` | 2 | Prestadores (um soft-deletado) |
| `uploads.tar` | 119 arquivos, 184 MB | Tudo de `/uploads` da produção: 53 produtos, 35 logos, 17 portfólio, 16 assinaturas, 3 banners de eventos |

## Regras de uso

- **Não abrir, copiar, ou enviar para terceiros** — especialmente `fichas_cadastro.csv` e `certificates.csv`.
- **Não commitar em repositórios públicos** — este repo é privado justamente por conter dados pessoais.
- Para recriar manualmente: use o README antigo do snapshot público como guia, mas com os arquivos **completos** neste repositório.
- Ao terminar a adaptação manual e o deploy, considerar apagar estas fichas (ou devolver as variáveis).
