import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description:
    "Condições de uso da plataforma Achadinhos do Condomínio: contas, certificação e responsabilidades.",
  alternates: { canonical: "/termos" },
};

export default function TermosPage() {
  return (
    <main className="legal-page">
      <div className="legal-container">
        <Link href="/" className="legal-back">
          ← Voltar ao Achadinhos
        </Link>
        <div className="legal-eyebrow">Achadinhos do Condomínio</div>
        <h1>Termos de Uso</h1>
        <p className="legal-updated">Última atualização: 5 de julho de 2026</p>

        <p>
          Ao usar o <strong>Achadinhos do Condomínio</strong> (
          <a href="https://achadinhoscondominio.com.br">achadinhoscondominio.com.br</a>)
          você concorda com estes termos. Se não concordar, não utilize a plataforma.
        </p>

        <h2>1. O serviço</h2>
        <p>
          O Achadinhos é uma vitrine que conecta moradores e síndicos a empresas e
          afiliados que atendem condomínios, com busca, perfis, produtos, avaliações,
          eventos do condomínio e a Certificação
          Achadinhos. A contratação de serviços e a compra de produtos acontecem
          diretamente entre você e a empresa/afiliado — não somos parte do contrato,
          não processamos pagamentos e não garantimos a execução dos serviços.
        </p>

        <h2>2. Contas</h2>
        <ul>
          <li>Forneça informações verdadeiras e mantenha sua senha em sigilo.</li>
          <li>Você é responsável pela atividade realizada com a sua conta.</li>
          <li>
            Podemos suspender contas que violem estes termos, a lei ou prejudiquem a
            comunidade.
          </li>
        </ul>

        <h2>3. Certificação Achadinhos</h2>
        <p>
          Os selos (Blue, Top e Black) refletem a análise documental e de
          reputação feita pela nossa equipe na data de emissão do certificado, com
          validade indicada no próprio certificado. Eles são um indicador de confiança —
          não uma garantia de resultado ou fiança dos serviços prestados.
        </p>


        <h2>4. Conteúdo de usuários</h2>
        <p>
          Avaliações e comentários devem ser verdadeiros e respeitosos. É proibido
          conteúdo ilegal, ofensivo, difamatório ou spam. Podemos remover conteúdo que
          viole estas regras. Ao publicar, você nos autoriza a exibir esse conteúdo na
          plataforma.
        </p>

        <h2>5. Empresas e afiliados</h2>
        <p>
          Dados cadastrais, portfólio e preços exibidos nos perfis são de
          responsabilidade da empresa/afiliado. Informações como preço "sob consulta",
          prazos e condições devem ser confirmadas diretamente com o prestador.
        </p>

        <h2>6. Propriedade intelectual</h2>
        <p>
          A marca Achadinhos do Condomínio, o design e o software da plataforma são
          protegidos. Logotipos e materiais das empresas pertencem aos seus titulares.
        </p>

        <h2>7. Limitação de responsabilidade</h2>
        <p>
          A plataforma é fornecida "como está". Na máxima extensão permitida em lei, não
          respondemos por danos decorrentes de negociações, contratos ou serviços
          firmados entre usuários e empresas/afiliados, nem por indisponibilidades
          temporárias do serviço.
        </p>

        <h2>8. Contato e foro</h2>
        <p>
          Dúvidas sobre estes termos:{" "}
          <a href="mailto:contato@achadinhoscondominio.com.br">
            contato@achadinhoscondominio.com.br
          </a>
          . Estes termos são regidos pelas leis brasileiras.
        </p>

        <div className="legal-footer-links">
          <Link href="/privacidade">Política de Privacidade</Link>
          <Link href="/">Página inicial</Link>
        </div>
      </div>
    </main>
  );
}
