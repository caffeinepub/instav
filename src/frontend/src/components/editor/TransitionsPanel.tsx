import { cn } from "@/lib/utils";
import type { EditorState } from "@/pages/EditorPage";

interface TransitionsPanelProps {
  state: EditorState;
  onUpdate: (updates: Partial<EditorState>) => void;
}

const TRANSITIONS = [
  { id: "fade", label: "Fade", icon: "🌅", desc: "Smooth fade between clips" },
  {
    id: "slide-left",
    label: "Slide Left",
    icon: "⬅️",
    desc: "Slide to the left",
  },
  {
    id: "slide-right",
    label: "Slide Right",
    icon: "➡️",
    desc: "Slide to the right",
  },
  { id: "zoom-in", label: "Zoom In", icon: "🔍", desc: "Zoom into next clip" },
  {
    id: "zoom-out",
    label: "Zoom Out",
    icon: "🔎",
    desc: "Zoom out to next clip",
  },
  { id: "wipe", label: "Wipe", icon: "🧹", desc: "Wipe across the screen" },
  {
    id: "dissolve",
    label: "Dissolve",
    icon: "✨",
    desc: "Dissolve between clips",
  },
  {
    id: "flash",
    label: "Flash",
    icon: "⚡",
    desc: "Flash white between clips",
  },
  { id: "spin", label: "Spin", icon: "🌀", desc: "Spin transition" },
  { id: "blur", label: "Blur", icon: "💫", desc: "Blur transition" },
];

export default function TransitionsPanel({
  state,
  onUpdate,
}: TransitionsPanelProps) {
  const setTransition = (clipIndex: number, transitionId: string) => {
    const key = `${clipIndex}-${clipIndex + 1}`;
    const current = state.transitions[key];
    onUpdate({
      transitions: {
        ...state.transitions,
        [key]: current === transitionId ? "" : transitionId,
      },
    });
  };

  return (
    <div className="p-3 space-y-4">
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Transition Library
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {TRANSITIONS.map((t) => (
            <button
              type="button"
              key={t.id}
              className="flex items-center gap-3 bg-muted/50 hover:bg-muted rounded-xl p-3 border border-border/30 hover:border-amber-400/30 transition-all text-left"
            >
              <span className="text-2xl">{t.icon}</span>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  {t.label}
                </p>
                <p className="text-[10px] text-muted-foreground">{t.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {state.clips.length > 1 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Apply to Clips
          </h3>
          <div className="space-y-2">
            {state.clips.slice(0, -1).map((clip, i) => {
              const key = `${i}-${i + 1}`;
              const current = state.transitions[key];
              return (
                <div
                  key={clip.id}
                  className="bg-muted/50 rounded-xl p-3 border border-border/30"
                >
                  <p className="text-xs text-muted-foreground mb-2">
                    Between clip {i + 1} → {i + 2}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {TRANSITIONS.map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => setTransition(i, t.id)}
                        className={cn(
                          "text-xs px-2 py-1 rounded-lg transition-colors",
                          current === t.id
                            ? "bg-gradient-to-r from-amber-500 to-rose-500 text-white"
                            : "bg-muted text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {t.icon} {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {state.clips.length <= 1 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-3xl mb-2">🎬</p>
          <p className="text-sm">Add at least 2 clips to apply transitions</p>
        </div>
      )}
    </div>
  );
}
