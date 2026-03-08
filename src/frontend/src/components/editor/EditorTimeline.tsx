import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Clip, EditorState } from "@/pages/EditorPage";
import { Plus, Trash2, X } from "lucide-react";
import { useRef } from "react";

interface EditorTimelineProps {
  state: EditorState;
  onUpdate: (updates: Partial<EditorState>) => void;
}

const TRACK_COLORS: Record<string, string> = {
  video: "from-amber-500/80 to-amber-600/80",
  image: "from-sky-500/80 to-sky-600/80",
  blank: "from-violet-500/80 to-violet-600/80",
};

export default function EditorTimeline({
  state,
  onUpdate,
}: EditorTimelineProps) {
  const _timelineRef = useRef<HTMLDivElement>(null);
  const PX_PER_SEC = 60 * state.zoom;

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = Math.max(0, Math.min(state.totalDuration, x / PX_PER_SEC));
    onUpdate({ currentTime: time });
  };

  const removeClip = (id: string) => {
    const newClips = state.clips.filter((c) => c.id !== id);
    const newDuration = newClips.reduce(
      (acc, c) => Math.max(acc, c.startTime + c.duration),
      0,
    );
    onUpdate({ clips: newClips, totalDuration: newDuration });
  };

  const addBlankClip = () => {
    const startTime = state.clips.reduce(
      (acc, c) => Math.max(acc, c.startTime + c.duration),
      0,
    );
    const newClip: Clip = {
      id: `clip-${Date.now()}`,
      type: "blank",
      name: "Blank",
      duration: 3,
      startTime,
      color: "#1a1a2e",
    };
    onUpdate({
      clips: [...state.clips, newClip],
      totalDuration: startTime + 3,
    });
  };

  return (
    <div className="p-3 space-y-3">
      {/* Timeline ruler */}
      <div className="relative overflow-x-auto rounded-xl bg-muted/50 border border-border/50">
        {/* Ruler */}
        <div
          className="relative h-6 cursor-pointer select-none"
          style={{
            width: Math.max(300, state.totalDuration * PX_PER_SEC + 40),
          }}
          onClick={handleScrub}
          onKeyDown={(e) =>
            e.key === "Enter" &&
            handleScrub(e as unknown as React.MouseEvent<HTMLDivElement>)
          }
          role="slider"
          aria-valuenow={state.currentTime}
          aria-valuemin={0}
          aria-valuemax={state.totalDuration}
          tabIndex={0}
        >
          {Array.from(
            { length: Math.ceil(state.totalDuration) + 1 },
            (_, i) => `tick-${i}`,
          ).map((tickKey, i) => (
            <div
              key={tickKey}
              className="absolute top-0 flex flex-col items-center"
              style={{ left: i * PX_PER_SEC }}
            >
              <div className="w-px h-3 bg-border" />
              <span className="text-[9px] text-muted-foreground mt-0.5">
                {formatTime(i)}
              </span>
            </div>
          ))}
          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10 pointer-events-none"
            style={{ left: state.currentTime * PX_PER_SEC }}
          >
            <div className="w-3 h-3 bg-amber-400 rounded-full -translate-x-1/2 -translate-y-0.5" />
          </div>
        </div>

        {/* Video track */}
        <div
          className="relative h-12 border-t border-border/30 cursor-pointer"
          style={{
            width: Math.max(300, state.totalDuration * PX_PER_SEC + 40),
          }}
          onClick={handleScrub}
          onKeyDown={(e) =>
            e.key === "Enter" &&
            handleScrub(e as unknown as React.MouseEvent<HTMLDivElement>)
          }
          role="presentation"
        >
          <span className="absolute left-1 top-1 text-[9px] text-muted-foreground font-medium z-10">
            VIDEO
          </span>
          {state.clips.map((clip) => (
            <div
              key={clip.id}
              className={cn(
                "absolute top-1 bottom-1 rounded-lg bg-gradient-to-r flex items-center px-2 overflow-hidden group",
                TRACK_COLORS[clip.type] ?? "from-gray-500/80 to-gray-600/80",
              )}
              style={{
                left: clip.startTime * PX_PER_SEC,
                width: clip.duration * PX_PER_SEC - 2,
              }}
            >
              <span className="text-[10px] text-white font-medium truncate flex-1">
                {clip.name}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeClip(clip.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-white/80 hover:text-white ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {/* Playhead overlay */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10 pointer-events-none"
            style={{ left: state.currentTime * PX_PER_SEC }}
          />
        </div>

        {/* Text track */}
        {state.textLayers.length > 0 && (
          <div
            className="relative h-8 border-t border-border/30"
            style={{
              width: Math.max(300, state.totalDuration * PX_PER_SEC + 40),
            }}
          >
            <span className="absolute left-1 top-1 text-[9px] text-muted-foreground font-medium">
              TEXT
            </span>
            {state.textLayers.map((layer) => (
              <div
                key={layer.id}
                className="absolute top-1 bottom-1 rounded bg-gradient-to-r from-emerald-500/70 to-teal-500/70 flex items-center px-1"
                style={{
                  left: layer.startTime * PX_PER_SEC,
                  width: layer.duration * PX_PER_SEC - 2,
                }}
              >
                <span className="text-[9px] text-white truncate">
                  {layer.text}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Audio track */}
        {state.audioTracks.length > 0 && (
          <div
            className="relative h-8 border-t border-border/30"
            style={{
              width: Math.max(300, state.totalDuration * PX_PER_SEC + 40),
            }}
          >
            <span className="absolute left-1 top-1 text-[9px] text-muted-foreground font-medium">
              AUDIO
            </span>
            {state.audioTracks.map((track) => (
              <div
                key={track.id}
                className="absolute top-1 bottom-1 rounded bg-gradient-to-r from-rose-500/70 to-pink-500/70 flex items-center px-1"
                style={{
                  left: track.startTime * PX_PER_SEC,
                  width: track.duration * PX_PER_SEC - 2,
                }}
              >
                <span className="text-[9px] text-white truncate">
                  {track.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clip list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Clips
          </h3>
          <button
            type="button"
            onClick={addBlankClip}
            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add Blank
          </button>
        </div>
        {state.clips.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No clips yet. Add media to get started.
          </p>
        ) : (
          state.clips.map((clip) => (
            <div
              key={clip.id}
              className="flex items-center gap-3 bg-muted/50 rounded-xl p-2.5 border border-border/30"
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-lg bg-gradient-to-br flex-shrink-0",
                  TRACK_COLORS[clip.type],
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {clip.name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {formatTime(clip.duration)} · {clip.type}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeClip(clip.id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
