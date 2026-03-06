import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { EditorState, StickerLayer } from "@/pages/EditorPage";
import { RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";

interface StickersPanelProps {
  state: EditorState;
  onUpdate: (updates: Partial<EditorState>) => void;
}

const EMOJI_CATEGORIES: Record<string, string[]> = {
  "🔥 Popular": [
    "🔥",
    "✨",
    "💫",
    "⭐",
    "🌟",
    "💥",
    "🎉",
    "🎊",
    "🎈",
    "🎁",
    "🏆",
    "🥇",
  ],
  "😀 Faces": [
    "😍",
    "🥰",
    "😎",
    "🤩",
    "😂",
    "🥹",
    "😭",
    "🤯",
    "🥳",
    "😏",
    "🤔",
    "😴",
  ],
  "❤️ Hearts": [
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🖤",
    "🤍",
    "💕",
    "💞",
    "💓",
    "💗",
  ],
  "🌈 Nature": [
    "🌸",
    "🌺",
    "🌻",
    "🌹",
    "🍀",
    "🌿",
    "🌊",
    "⛅",
    "🌙",
    "☀️",
    "🌈",
    "❄️",
  ],
  "🎵 Music": [
    "🎵",
    "🎶",
    "🎸",
    "🎹",
    "🎤",
    "🎧",
    "🥁",
    "🎺",
    "🎻",
    "🎼",
    "🎙️",
    "📻",
  ],
  "🎬 Video": [
    "🎬",
    "📽️",
    "🎥",
    "📸",
    "🎞️",
    "📺",
    "🎭",
    "🎪",
    "🎨",
    "🖼️",
    "✏️",
    "🖌️",
  ],
};

export default function StickersPanel({ state, onUpdate }: StickersPanelProps) {
  const [activeCategory, setActiveCategory] = useState("🔥 Popular");
  const [selected, setSelected] = useState<string | null>(null);

  const addSticker = (emoji: string) => {
    const sticker: StickerLayer = {
      id: `sticker-${Date.now()}`,
      emoji,
      x: 0.3 + Math.random() * 0.4,
      y: 0.3 + Math.random() * 0.4,
      size: 48,
      rotation: (Math.random() - 0.5) * 30,
      startTime: state.currentTime,
      duration: Math.min(5, state.totalDuration - state.currentTime) || 5,
    };
    onUpdate({ stickerLayers: [...state.stickerLayers, sticker] });
    setSelected(sticker.id);
  };

  const updateSticker = (id: string, updates: Partial<StickerLayer>) => {
    onUpdate({
      stickerLayers: state.stickerLayers.map((s) =>
        s.id === id ? { ...s, ...updates } : s,
      ),
    });
  };

  const removeSticker = (id: string) => {
    onUpdate({ stickerLayers: state.stickerLayers.filter((s) => s.id !== id) });
    if (selected === id) setSelected(null);
  };

  const selectedSticker = state.stickerLayers.find((s) => s.id === selected);

  return (
    <div className="p-3 space-y-4">
      {/* Category tabs */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-1.5 min-w-max pb-1">
          {Object.keys(EMOJI_CATEGORIES).map((cat) => (
            <button
              type="button"
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors font-medium",
                activeCategory === cat
                  ? "bg-gradient-to-r from-amber-500 to-rose-500 text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Emoji grid */}
      <div className="grid grid-cols-6 gap-2">
        {(EMOJI_CATEGORIES[activeCategory] ?? []).map((emoji) => (
          <button
            type="button"
            key={emoji}
            onClick={() => addSticker(emoji)}
            className="aspect-square flex items-center justify-center text-2xl bg-muted hover:bg-accent rounded-xl transition-all hover:scale-110 active:scale-95"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Active stickers */}
      {state.stickerLayers.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Active Stickers
          </h3>
          {state.stickerLayers.map((sticker) => (
            <button
              type="button"
              key={sticker.id}
              onClick={() =>
                setSelected(sticker.id === selected ? null : sticker.id)
              }
              className={cn(
                "w-full flex items-center gap-3 rounded-xl p-2.5 border transition-all text-left",
                selected === sticker.id
                  ? "bg-amber-400/10 border-amber-400/50"
                  : "bg-muted/50 border-border/30 hover:border-amber-400/30",
              )}
            >
              <span className="text-2xl">{sticker.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground">
                  Size: {sticker.size}px
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Rotation: {Math.round(sticker.rotation)}°
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeSticker(sticker.id);
                }}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </button>
          ))}
        </div>
      )}

      {/* Selected sticker controls */}
      {selectedSticker && (
        <div className="bg-muted/50 rounded-xl p-3 border border-border/30 space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Edit Sticker
          </h3>

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground w-10">Size</span>
            <Slider
              value={[selectedSticker.size]}
              onValueChange={([v]) =>
                updateSticker(selectedSticker.id, { size: v })
              }
              min={16}
              max={120}
              step={4}
              className="flex-1"
            />
            <span className="text-[10px] text-muted-foreground w-10 text-right">
              {selectedSticker.size}px
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground w-10">
              Rotate
            </span>
            <Slider
              value={[selectedSticker.rotation]}
              onValueChange={([v]) =>
                updateSticker(selectedSticker.id, { rotation: v })
              }
              min={-180}
              max={180}
              step={5}
              className="flex-1"
            />
            <span className="text-[10px] text-muted-foreground w-10 text-right">
              {Math.round(selectedSticker.rotation)}°
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              updateSticker(selectedSticker.id, { rotation: 0, size: 48 })
            }
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>
      )}

      {state.stickerLayers.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          <p className="text-sm">Tap an emoji above to add it to your canvas</p>
        </div>
      )}
    </div>
  );
}
