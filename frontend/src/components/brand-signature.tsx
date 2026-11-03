import { publicAsset } from "@/lib/site-path";
interface BrandSignatureProps {
  className?: string;
  tone?: "light" | "ink";
}

export function BrandSignature({ className = "", tone = "ink" }: BrandSignatureProps) {
  return (
    <span className={`brand-signature brand-signature--${tone} ${className}`}>
      <span className="brand-signature-wordmark">
        <strong>ACHADINHOS</strong>
        <span>DO CONDOMÍNIO</span>
      </span>
      <img
        src={publicAsset("/brand/mascote-dourado.png")}
        alt="Mascote dourado Achadinhos do Condomínio"
        className="brand-signature-mascot"
        width={102} height={112} decoding="async"
      />
    </span>
  );
}
