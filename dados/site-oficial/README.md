# Dados do site oficial (achadinhoscondominio.com.br)

Snapshot das **19 empresas ativas** com perfil público no site oficial, extraído do banco de produção em **2026-11-12** para facilitar a recriação da nossa versão. Contém somente dados que já são públicos no site. **Sem dados pessoais de pessoas físicas.**

## Arquivos

| Arquivo | Registros | O que tem |
|---|---|---|
| `sellers.csv` | 19 | Empresas: nome, descrição, logo, link/whatsapp, redes, tier de certificado, categoria, rating, reviews, CNPJ da empresa |
| `seller_categories.csv` | 25 | Vínculo N:N empresa ↔ categoria |
| `categories.csv` | 50 | Lista completa de categorias (label, ícone, descrição, badge) |
| `products.csv` | 48 | Produtos com preços e badges |
| `product_photos.csv` | 50 | Fotos dos produtos |
| `portfolio_photos.csv` | 20 | PDFs do portfólio das empresas |
| `certificates.csv` | 15 | Certificados emitidos (código, tier, validade, empresa) sem CPF/nome de responsável |
| `events.csv` | 1 | Evento da Imersão Condominial |

## Imagens e arquivos grandes

O `uploads-sem-assinaturas.tar.gz` (179 MB, contém logos, fotos de produtos/portfólio, banners e a assinatura de e-mail) não vai no repositório: o GitHub bloqueia LFS em forks públicos. Está disponível para download como **asset da release `v1.0.0-nossa-versao`**:

<https://github.com/horizes/achadinhos-condominio/releases/download/v1.0.0-nossa-versao/uploads-sem-assinaturas.tar.gz>

## Revisão dos dados pessoais

Removidos para preservar a privacidade (a versão pública do site tampouco exibe):

- Nomes e CPFs de responsáveis legais (`fichas_cadastro`)
- Assinatura digital (pasta `signatures` de `uploads.tar`)
- Cadastro pessoal

CNPJ e dados de empresas são públicos por natureza (registro público de CNPJs).

## Como usar na recriação

1. Registre os sellers em `sellers.csv` pelas telas de cadastro (admin → Empresas → Nova empresa), mantendo `category_id` conforme `categories.csv`.
2. As logos e demais imagens estão em `uploads.tar.gz` extraída na raiz do app (`./uploads`) — os caminhos nos CSVs já apontam para `/uploads/logos/<nome>.png` etc.
3. `seller_categories.csv` relaciona empresas a várias categorias; o admin do site atual permite múltiplas categorias (multi-select).
4. `certificates.csv` é informativo — se você quiser reemitir os certificados na nossa versão, os códigos e tiers estão ali, mas CPFs/responsáveis precisam ser preenchidos novamente na tela de emissão (`Certificação`).

## Avisos

- Os dados são de autoria das empresas citadas, usadas no site oficial público. Se qualquer empresa pedir remoção de dados desta pasta, remova o arquivo correspondente e faça um commit de remoção.
- O `.env` e segredos obviamente não fazem parte deste snapshot.
