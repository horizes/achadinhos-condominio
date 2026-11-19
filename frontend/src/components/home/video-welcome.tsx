"use client";

import { APP_CONTENT } from "@/lib/app-content";
import { Icon } from "../icons";

// Seção "Vídeo de boas-vindas" da especificação (item 2 da tela inicial).
// Comportamento especificado: começa sozinho sem som, com legenda; botão
// "Ativar som" no canto superior esquerdo e play no centro; faixa inferior
// "Boas-vindas ao Achadinhos — <nome>" e a duração.
// ENQUANTO o vídeo não existir (spec: [duração], arquivo a entregar),
// exibimos o placeholder aprovado pelo layout — nenhum vídeo é simulado.
export function VideoWelcome() {
  const v = APP_CONTENT.welcomeVideo;
  const hasVideo = Boolean(v.url);

  return (
    <section className="welcome-video" aria-label="Vídeo de boas-vindas">
      <div className="welcome-frame">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/mascote-dourado-v2.png"
          alt=""
          aria-hidden="true"
          className="welcome-mascot"
        />

        <button
          type="button"
          className="welcome-play"
          aria-label={hasVideo ? "Assistir vídeo" : "Vídeo disponível em breve"}
          disabled={!hasVideo}
          onClick={() => {
            if (hasVideo && typeof window !== "undefined") {
              window.open(v.url, "_blank", "noopener,noreferrer");
            }
          }}
        >
          <Icon.Play size={22} />
        </button>

        <div className="welcome-caption">
          <span>
            <strong>{v.caption}</strong> — {v.subtitle}.
          </span>
          <span className="welcome-soon">{hasVideo ? v.durationLabel : "Vídeo em breve"}</span>
        </div>
      </div>
    </section>
  );
}
