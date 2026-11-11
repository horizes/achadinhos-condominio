import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como o Achadinhos do Condomínio coleta, usa e protege seus dados, em conformidade com a LGPD.",
  alternates: { canonical: "/privacidade" },
};

// Página estática exigida pela LGPD: política pública, no mesmo domínio, linkada no rodapé do site.
export default function PrivacidadePage() {
  return (
    <main className="legal-page">
      <div className="legal-container">
        <Link href="/" className="legal-back">
          ← Voltar ao Achadinhos
        </Link>
        <div className="legal-eyebrow">Achadinhos do Condomínio</div>
        <h1>Política de Privacidade</h1>
        <p className="legal-updated">Última atualização: 5 de julho de 2026</p>

        <p>
          O <strong>Achadinhos do Condomínio</strong> (
          <a href="https://achadinhoscondominio.com.br">achadinhoscondominio.com.br</a>) é uma
          plataforma que conecta moradores e síndicos a empresas e afiliados que prestam
          serviços e vendem produtos para condomínios. Esta política explica quais dados
          coletamos, por que coletamos e como você pode exercer seus direitos, em
          conformidade com a Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018).
        </p>

        <h2>1. Dados que coletamos</h2>
        <ul>
          <li>
            <strong>Conta:</strong> nome, e-mail, CPF ou CNPJ, telefone, condomínio e
            endereço, fornecidos por você no cadastro.
          </li>
          <li>
            <strong>Uso do app:</strong> favoritos, avaliações e histórico de contatos
            iniciados pelo app (ex.: conversas de orçamento via WhatsApp), armazenados
            para melhorar sua experiência.
          </li>
          <li>
            <strong>Empresas e afiliados:</strong> dados cadastrais e de portfólio
            enviados na ficha de cadastro e usados no perfil público e na Certificação
            Achadinhos.
          </li>
        </ul>

        <h2>2. Como usamos os dados</h2>
        <ul>
          <li>Operar a plataforma: perfis, busca, favoritos, avaliações e certificação.</li>
          <li>Enviar e-mails transacionais (boas-vindas, ficha de cadastro, convites).</li>
          <li>Cumprir obrigações legais e prevenir fraudes.</li>
        </ul>
        <p>Não vendemos seus dados pessoais nem os usamos para publicidade de terceiros.</p>

        <h2>3. Compartilhamento</h2>
        <p>
          Compartilhamos dados apenas com os provedores necessários para operar o serviço
          — hospedagem e envio de e-mail transacional — e quando
          você inicia um contato com uma empresa ou afiliado (ex.: abrir uma conversa de
          orçamento no WhatsApp, que leva seu nome e mensagem ao prestador escolhido).
        </p>

        <h2>4. Armazenamento e segurança</h2>
        <p>
          Os dados ficam em servidores com acesso restrito, tráfego criptografado (HTTPS)
          e senhas armazenadas com hash.
        </p>

        <h2>5. Seus direitos (LGPD)</h2>
        <p>
          Você pode solicitar acesso, correção, portabilidade ou exclusão dos seus dados,
          além de revogar consentimentos, entrando em contato pelo e-mail{" "}
          <a href="mailto:contato@achadinhoscondominio.com.br">
            contato@achadinhoscondominio.com.br
          </a>
          . Responderemos nos prazos da LGPD.
        </p>

        <h2>6. Cookies e armazenamento local</h2>
        <p>
          Usamos apenas o armazenamento essencial ao funcionamento (sessão de login,
          preferências e cache do aplicativo PWA). Não usamos cookies de rastreamento ou
          publicidade.
        </p>

        <h2>7. Alterações</h2>
        <p>
          Podemos atualizar esta política; a versão vigente estará sempre nesta página,
          com a data de atualização no topo.
        </p>

        <div className="legal-footer-links">
          <Link href="/termos">Termos de Uso</Link>
          <Link href="/">Página inicial</Link>
        </div>
      </div>
    </main>
  );
}
