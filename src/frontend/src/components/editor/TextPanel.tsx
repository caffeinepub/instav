import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { EditorState, TextLayer } from "@/pages/EditorPage";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";

interface TextPanelProps {
  state: EditorState;
  onUpdate: (updates: Partial<EditorState>) => void;
}

const FONTS = [
  "Inter",
  "Georgia",
  "Impact",
  "Courier New",
  "Arial Black",
  "Trebuchet MS",
];
const ANIMATIONS = [
  "none",
  "fade-in",
  "slide-up",
  "typewriter",
  "bounce",
  "scale-pop",
];
const COLORS = [
  "#ffffff",
  "#000000",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#ec4899",
];

export default function TextPanel({ state, onUpdate }: TextPanelProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const addText = () => {
    const layer: TextLayer = {
      id: `text-${Date.now()}`,
      text: "Your Text Here",
      x: 0.5,
      y: 0.5,
      fontSize: 32,
      fontFamily: "Inter",
      color: "#ffffff",
      bold: false,
      italic: false,
      align: "center",
      animation: "fade-in",
      startTime: state.currentTime,
      duration: Math.min(5, state.totalDuration - state.currentTime) || 5,
    };
    onUpdate({ textLayers: [...state.textLayers, layer] });
    setSelected(layer.id);
  };

  const updateLayer = (id: string, updates: Partial<TextLayer>) => {
    onUpdate({
      textLayers: state.textLayers.map((l) =>
        l.id === id ? { ...l, ...updates } : l,
      ),
    });
  };

  const removeLayer = (id: string) => {
    onUpdate({ textLayers: state.textLayers.filter((l) => l.id !== id) });
    if (selected === id) setSelected(null);
  };

  const selectedLayer = state.textLayers.find((l) => l.id === selected);

  return (
    <div className="p-3 space-y-4">
      <Button
        onClick={addText}
        className="w-full bg-gradient-to-r from-amber-500 to-rose-500 text-white border-0 rounded-xl font-semibold text-sm"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Text Layer
      </Button>

      {state.textLayers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-3xl mb-2">✍️</p>
          <p className="text-sm">No text layers yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {state.textLayers.map((layer) => (
            <button
              type="button"
              key={layer.id}
              onClick={() =>
                setSelected(layer.id === selected ? null : layer.id)
              }
              className={cn(
                "w-full flex items-center gap-3 rounded-xl p-3 border transition-all text-left",
                selected === layer.id
                  ? "bg-amber-400/10 border-amber-400/50"
                  : "bg-muted/50 border-border/30 hover:border-amber-400/30",
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {layer.text}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {layer.fontFamily} · {layer.fontSize}px
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeLayer(layer.id);
                }}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </button>
          ))}
        </div>
      )}

      {selectedLayer && (
        <div className="bg-muted/50 rounded-xl p-3 border border-border/30 space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Edit Text
          </h3>

          <Input
            value={selectedLayer.text}
            onChange={(e) =>
              updateLayer(selectedLayer.id, { text: e.target.value })
            }
            className="bg-muted border-0 rounded-xl text-sm"
            placeholder="Enter text..."
          />

          {/* Font */}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1.5">Font</p>
            <div className="flex flex-wrap gap-1.5">
              {FONTS.map((f) => (
                <button
                  type="button"
                  key={f}
                  onClick={() =>
                    updateLayer(selectedLayer.id, { fontFamily: f })
                  }
                  className={cn(
                    "text-xs px-2 py-1 rounded-lg transition-colors",
                    selectedLayer.fontFamily === f
                      ? "bg-gradient-to-r from-amber-500 to-rose-500 text-white"
                      : "bg-muted text-muted-foreground hover:text-foreground",
                  )}
                  style={{ fontFamily: f }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground w-8">Size</span>
            <Slider
              value={[selectedLayer.fontSize]}
              onValueChange={([v]) =>
                updateLayer(selectedLayer.id, { fontSize: v })
              }
              min={12}
              max={96}
              step={2}
              className="flex-1"
            />
            <span className="text-[10px] text-muted-foreground w-8 text-right">
              {selectedLayer.fontSize}px
            </span>
          </div>

          {/* Style */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                updateLayer(selectedLayer.id, { bold: !selectedLayer.bold })
              }
              className={cn(
                "p-2 rounded-lg transition-colors",
                selectedLayer.bold
                  ? "bg-amber-400/20 text-amber-400"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                updateLayer(selectedLayer.id, { italic: !selectedLayer.italic })
              }
              className={cn(
                "p-2 rounded-lg transition-colors",
                selectedLayer.italic
                  ? "bg-amber-400/20 text-amber-400"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              <Italic className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-border mx-1" />
            {(["left", "center", "right"] as const).map((align) => {
              const Icon =
                align === "left"
                  ? AlignLeft
                  : align === "center"
                    ? AlignCenter
                    : AlignRight;
              return (
                <button
                  type="button"
                  key={align}
                  onClick={() => updateLayer(selectedLayer.id, { align })}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    selectedLayer.align === align
                      ? "bg-amber-400/20 text-amber-400"
                      : "bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>

          {/* Color */}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1.5">Color</p>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => updateLayer(selectedLayer.id, { color: c })}
                  className={cn(
                    "w-7 h-7 rounded-full border-2 transition-transform hover:scale-110",
                    selectedLayer.color === c
                      ? "border-white scale-110"
                      : "border-transparent",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Animation */}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1.5">
              Animation
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ANIMATIONS.map((anim) => (
                <button
                  type="button"
                  key={anim}
                  onClick={() =>
                    updateLayer(selectedLayer.id, { animation: anim })
                  }
                  className={cn(
                    "text-xs px-2 py-1 rounded-lg transition-colors capitalize",
                    selectedLayer.animation === anim
                      ? "bg-gradient-to-r from-amber-500 to-rose-500 text-white"
                      : "bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  {anim}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
