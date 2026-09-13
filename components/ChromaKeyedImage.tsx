"use client";

import { useEffect, useRef } from "react";
import { getKeyedImage } from "@/lib/chromaKey";

interface Props {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

/** Draws a chroma-keyed sticker into a canvas sized to fill its container,
 *  preserving the source aspect ratio ("contain" fit, transparent margins). */
export default function ChromaKeyedImage({ src, alt, className, style }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    async function render() {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const keyed = await getKeyedImage(src);
      if (cancelled) return;

      const draw = () => {
        const rect = container.getBoundingClientRect();
        const cw = Math.max(1, rect.width);
        const ch = Math.max(1, rect.height);
        canvas.width = cw * dpr;
        canvas.height = ch * dpr;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const scale = Math.min(
          (cw * dpr) / keyed.width,
          (ch * dpr) / keyed.height
        );
        const drawW = keyed.width * scale;
        const drawH = keyed.height * scale;
        const dx = (cw * dpr - drawW) / 2;
        const dy = (ch * dpr - drawH) / 2;
        ctx.drawImage(keyed.canvas, dx, dy, drawW, drawH);
      };

      draw();

      const observer = new ResizeObserver(draw);
      observer.observe(container);
      return () => observer.disconnect();
    }

    let cleanup: (() => void) | undefined;
    render().then((fn) => {
      cleanup = fn;
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [src]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={style}
      role="img"
      aria-label={alt}
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
}
