import { cn } from "@/lib/utils";
import type { EditorState } from "@/pages/EditorPage";

interface EffectsPanelProps {
  state: EditorState;
  onUpdate: (updates: Partial<EditorState>) => void;
}

const EFFECTS = [
  {
    id: "confetti",
    label: "Confetti",
    emoji: "🎊",
    desc: "Animated confetti burst",
  },
  {
    id: "light-leaks",
    label: "Light Leaks",
    emoji: "🌟",
    desc: "Cinematic light leak overlay",
  },
  {
    id: "glitch",
    label: "Glitch",
    emoji: "⚡",
    desc: "Digital glitch distortion",
  },
  {
    id: "vignette-pulse",
    label: "Vignette Pulse",
    emoji: "🔮",
    desc: "Pulsing vignette effect",
  },
  {
    id: "particle-burst",
    label: "Particle Burst",
    emoji: "✨",
    desc: "Sparkling particle explosion",
  },
  {
    id: "letterbox",
    label: "Letterbox",
    emoji: "🎬",
    desc: "Cinematic black bars",
  },
  {
    id: "film-grain",
    label: "Film Grain",
    emoji: "📽️",
    desc: "Vintage film grain texture",
  },
  {
    id: "chromatic",
    label: "Chromatic",
    emoji: "🌈",
    desc: "Chromatic aberration split",
  },
];

export default function EffectsPanel({ state, onUpdate }: EffectsPanelProps) {
  const toggleEffect = (effectId: string) => {
    const current = state.effects;
    const updated = current.includes(effectId)
      ? current.filter((e) => e !== effectId)
      : [...current, effectId];
    onUpdate({ effects: updated });
  };

  return (
    <div className="p-3 space-y-4">
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Motion Graphics
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {EFFECTS.map((effect) => {
            const isActive = state.effects.includes(effect.id);
            return (
              <button
                type="button"
                key={effect.id}
                onClick={() => toggleEffect(effect.id)}
                className={cn(
                  "flex items-center gap-3 rounded-xl p-3 border transition-all text-left",
                  isActive
                    ? "bg-gradient-to-r from-amber-500/20 to-rose-500/20 border-amber-400/50"
                    : "bg-muted/50 border-border/30 hover:border-amber-400/30 hover:bg-muted",
                )}
              >
                <span className="text-2xl">{effect.emoji}</span>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-xs font-semibold truncate",
                      isActive ? "text-amber-400" : "text-foreground",
                    )}
                  >
                    {effect.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {effect.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {state.effects.length > 0 && (
        <div className="bg-muted/50 rounded-xl p-3 border border-border/30">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Active Effects
          </p>
          <div className="flex flex-wrap gap-1.5">
            {state.effects.map((effectId) => {
              const effect = EFFECTS.find((e) => e.id === effectId);
              return effect ? (
                <span
                  key={effectId}
                  className="flex items-center gap-1 text-xs bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-400 border border-amber-400/30 rounded-full px-2.5 py-1"
                >
                  {effect.emoji} {effect.label}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}

      {state.effects.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <p className="text-3xl mb-2">🎭</p>
          <p className="text-sm">Tap an effect to apply it to your video</p>
        </div>
      )}
    </div>
  );
}
