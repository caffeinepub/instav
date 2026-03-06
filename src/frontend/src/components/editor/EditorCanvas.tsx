import { cn } from "@/lib/utils";
import type { EditorState } from "@/pages/EditorPage";
import { useEffect, useRef } from "react";

interface EditorCanvasProps {
  state: EditorState;
}

const ASPECT_RATIOS = {
  "9:16": { w: 9, h: 16 },
  "1:1": { w: 1, h: 1 },
  "16:9": { w: 16, h: 9 },
};

export default function EditorCanvas({ state }: EditorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { w, h } = ASPECT_RATIOS[state.aspectRatio];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    const currentClip =
      state.clips.find(
        (c) =>
          c.startTime <= state.currentTime &&
          c.startTime + c.duration > state.currentTime,
      ) ?? state.clips[0];

    if (currentClip?.color) {
      ctx.fillStyle = currentClip.color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Apply filters via CSS filter string
    const { brightness, contrast, saturation, hue } = state.filters;
    canvas.style.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hue}deg)`;

    // Draw stickers
    for (const sticker of state.stickerLayers) {
      if (
        sticker.startTime <= state.currentTime &&
        sticker.startTime + sticker.duration > state.currentTime
      ) {
        ctx.save();
        ctx.translate(sticker.x * canvas.width, sticker.y * canvas.height);
        ctx.rotate((sticker.rotation * Math.PI) / 180);
        ctx.font = `${sticker.size}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(sticker.emoji, 0, 0);
        ctx.restore();
      }
    }

    // Draw text layers
    for (const layer of state.textLayers) {
      if (
        layer.startTime <= state.currentTime &&
        layer.startTime + layer.duration > state.currentTime
      ) {
        ctx.save();
        const fontStyle = `${layer.italic ? "italic " : ""}${layer.bold ? "bold " : ""}${layer.fontSize}px ${layer.fontFamily}`;
        ctx.font = fontStyle;
        ctx.textAlign = layer.align;
        ctx.textBaseline = "middle";

        if (layer.bgColor) {
          const metrics = ctx.measureText(layer.text);
          const padding = 8;
          ctx.fillStyle = layer.bgColor;
          ctx.fillRect(
            layer.x * canvas.width - metrics.width / 2 - padding,
            layer.y * canvas.height - layer.fontSize / 2 - padding,
            metrics.width + padding * 2,
            layer.fontSize + padding * 2,
          );
        }

        ctx.fillStyle = layer.color;
        ctx.fillText(
          layer.text,
          layer.x * canvas.width,
          layer.y * canvas.height,
        );
        ctx.restore();
      }
    }

    // Vignette effect
    if (state.filters.vignette > 0) {
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.3,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.8,
      );
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(1, `rgba(0,0,0,${state.filters.vignette / 100})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Glitch effect
    if (state.effects.includes("glitch")) {
      const glitchAmount = 8;
      for (let i = 0; i < 3; i++) {
        const y = Math.random() * canvas.height;
        const h2 = Math.random() * 20 + 5;
        const offset = (Math.random() - 0.5) * glitchAmount * 2;
        const imageData = ctx.getImageData(0, y, canvas.width, h2);
        ctx.putImageData(imageData, offset, y);
      }
    }

    // Letterbox
    if (state.effects.includes("letterbox")) {
      const barH = canvas.height * 0.1;
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, barH);
      ctx.fillRect(0, canvas.height - barH, canvas.width, barH);
    }
  }, [state]);

  const maxH = 200;
  const canvasH = maxH;
  const canvasW = Math.round((canvasH * w) / h);

  return (
    <div className="flex items-center justify-center w-full h-full bg-black">
      {state.clips.length === 0 ? (
        <div className="text-center text-muted-foreground">
          <div className="text-4xl mb-2">🎬</div>
          <p className="text-sm">Add clips to start editing</p>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          width={canvasW}
          height={canvasH}
          className="rounded-lg shadow-2xl"
          style={{ maxHeight: "100%", maxWidth: "100%" }}
        />
      )}
    </div>
  );
}
