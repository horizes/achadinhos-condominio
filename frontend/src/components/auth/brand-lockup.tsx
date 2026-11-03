
import { BrandSignature } from "@/components/brand-signature";
// Logo oficial (horizontal) usado no topo das telas de auth, planos,
// certificação e verificação. Substitui o lockup antigo desenhado em CSS
// (quadrado dourado + ícone de casa + texto).
export function BrandLockup() {
  return (
    <div className="auth-brand">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <BrandSignature className="auth-brand-logo" tone="ink" />
    </div>
  );
}
