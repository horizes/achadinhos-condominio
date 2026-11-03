"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Icon } from "@/components/icons";

interface SignaturePadProps {
  // Chamado quando o traço muda: recebe o PNG data URL ou null (vazio).
  onChange: (dataUrl: string | null) => void;
  height?: number;
}

// Bloco de assinatura desenhada à mão (mouse/dedo). Exporta um PNG transparente
// via onChange. Lida com telas de alta densidade (devicePixelRatio).
export function SignaturePad({ onChange, height = 160 }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const hasInk = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [empty, setEmpty] = useState(true);

  // Ajusta a resolução do canvas ao tamanho exibido (retina-friendly).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#102B50";
  }, []);

  function pos(e: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    drawing.current = true;
    last.current = pos(e);
    canvasRef.current?.setPointerCapture(e.pointerId);
  }

  function move(e: PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !last.current) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    hasInk.current = true;
  }

  function end() {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    if (hasInk.current) {
      setEmpty(false);
      onChange(canvasRef.current?.toDataURL("image/png") ?? null);
    }
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasInk.current = false;
    setEmpty(true);
    onChange(null);
  }

  return (
    <div className="sig-pad">
      <canvas
        ref={canvasRef}
        className="sig-canvas"
        style={{ height }}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        onPointerCancel={end}
      />
      <div className="sig-pad-foot">
        <span className="sig-hint">{empty ? "Assine no quadro acima" : "Assinatura registrada"}</span>
        <button type="button" className="sig-clear" onClick={clear} disabled={empty}>
          <Icon.Trash size={13} />
          Limpar
        </button>
      </div>
    </div>
  );
}
