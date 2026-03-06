import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { EditorState } from "@/pages/EditorPage";
import { Circle, Minus, Plus, Square } from "lucide-react";
import { useState } from "react";

interface DesignPanelProps {
  state: EditorState;
  onUpdate: (updates: Partial<EditorState>) => void;
}

const ASPECT_RATIOS = ["9:16", "1:1", "16:9"] as const;

const GRADIENT_PRESETS = [
  { label: "Sunset", value: "linear-gradient(135deg, #f97316, #ec4899)" },
  { label: "Ocean", value: "linear-gradient(135deg, #0ea5e9, #6366f1)" },
  { label: "Forest", value: "linear-gradient(135deg, #10b981, #0d9488)" },
  { label: "Midnight", value: "linear-gradient(135deg, #1e1b4b, #312e81)" },
  { label: "Rose", value: "linear-gradient(135deg, #f43f5e, #fb923c)" },
  { label: "Aurora", value: "linear-gradient(135deg, #8b5cf6, #06b6d4)" },
  { label: "Gold", value: "linear-gradient(135deg, #f59e0b, #fbbf24)" },
  { label: "Noir", value: "linear-gradient(135deg, #111827, #374151)" },
];

const SHAPE_COLORS = [
  "#ffffff",
  "#000000",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#ec4899",
];

export default function DesignPanel({ state, onUpdate }: DesignPanelProps) {
  const [bgColor, setBgColor] = useState("#1a1a2e");
  const [selectedGradient, setSelectedGradient] = useState<string | null>(null);

  const applyBackground = (color: string) => {
    setBgColor(color);
    setSelectedGradient(null);
    onUpdate({
      clips: state.clips.map((c, i) => (i === 0 ? { ...c, color } : c)),
    });
  };

  const applyGradient = (gradient: string) => {
    setSelectedGradient(gradient);
    // For gradient, we store the first color as a fallback
    const colorMatch = gradient.match(/#[0-9a-f]{6}/i);
    if (colorMatch) {
      onUpdate({
        clips: state.clips.map((c, i) =>
          i === 0 ? { ...c, color: colorMatch[0] } : c,
        ),
      });
    }
  };

  return (
    <div className="p-3 space-y-4">
      {/* Aspect ratio */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Canvas Size
        </h3>
        <div className="flex gap-2">
          {ASPECT_RATIOS.map((ratio) => (
            <button
              type="button"
              key={ratio}
              onClick={() => onUpdate({ aspectRatio: ratio })}
              className={cn(
                "flex-1 flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all",
                state.aspectRatio === ratio
                  ? "bg-amber-400/10 border-amber-400/50"
                  : "bg-muted/50 border-border/30 hover:border-amber-400/30",
              )}
            >
              <div
                className={cn(
                  "bg-gradient-to-br from-amber-500/30 to-rose-500/30 rounded border border-amber-400/30",
                  ratio === "9:16"
                    ? "w-5 h-9"
                    : ratio === "1:1"
                      ? "w-7 h-7"
                      : "w-9 h-5",
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium",
                  state.aspectRatio === ratio
                    ? "text-amber-400"
                    : "text-muted-foreground",
                )}
              >
                {ratio}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Background */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Background
        </h3>

        {/* Solid color */}
        <div className="mb-3">
          <p className="text-[10px] text-muted-foreground mb-2">Solid Color</p>
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5 flex-wrap">
              {SHAPE_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => applyBackground(c)}
                  className={cn(
                    "w-7 h-7 rounded-full border-2 transition-transform hover:scale-110",
                    bgColor === c && !selectedGradient
                      ? "border-white scale-110"
                      : "border-transparent",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => applyBackground(e.target.value)}
              className="w-7 h-7 rounded-full cursor-pointer border-0 bg-transparent"
              title="Custom color"
            />
          </div>
        </div>

        {/* Gradients */}
        <div>
          <p className="text-[10px] text-muted-foreground mb-2">Gradients</p>
          <div className="grid grid-cols-4 gap-2">
            {GRADIENT_PRESETS.map((g) => (
              <button
                type="button"
                key={g.label}
                onClick={() => applyGradient(g.value)}
                className={cn(
                  "aspect-square rounded-xl border-2 transition-all hover:scale-105",
                  selectedGradient === g.value
                    ? "border-white scale-105"
                    : "border-transparent",
                )}
                style={{ background: g.value }}
                title={g.label}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Shapes */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Shapes
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Square, label: "Rectangle" },
            { icon: Circle, label: "Circle" },
            { icon: Minus, label: "Line" },
          ].map(({ icon: Icon, label }) => (
            <button
              type="button"
              key={label}
              className="flex flex-col items-center gap-1.5 p-3 bg-muted/50 hover:bg-muted rounded-xl border border-border/30 hover:border-amber-400/30 transition-all"
            >
              <Icon className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Tap a shape to add it to the canvas
        </p>
      </div>

      {/* Image upload */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Add Image
        </h3>
        <label className="flex items-center justify-center gap-2 bg-muted/50 hover:bg-muted rounded-xl p-3 border border-border/30 hover:border-amber-400/30 transition-all cursor-pointer text-sm text-muted-foreground hover:text-foreground">
          <Plus className="w-4 h-4" />
          Upload from Device
          <input type="file" accept="image/*" className="hidden" />
        </label>
      </div>
    </div>
  );
}
