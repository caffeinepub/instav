import { Slider } from "@/components/ui/slider";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AudioTrack, EditorState } from "@/pages/EditorPage";
import { Mic, Plus, Trash2, Volume2, VolumeX } from "lucide-react";
import { useRef, useState } from "react";

interface AudioPanelProps {
  state: EditorState;
  onUpdate: (updates: Partial<EditorState>) => void;
}

export default function AudioPanel({ state, onUpdate }: AudioPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);

  const addAudioTrack = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const track: AudioTrack = {
      id: `audio-${Date.now()}`,
      name: file.name,
      src: URL.createObjectURL(file),
      volume: 100,
      muted: false,
      startTime: 0,
      duration: state.totalDuration || 10,
    };
    onUpdate({ audioTracks: [...state.audioTracks, track] });
  };

  const updateTrack = (id: string, updates: Partial<AudioTrack>) => {
    onUpdate({
      audioTracks: state.audioTracks.map((t) =>
        t.id === id ? { ...t, ...updates } : t,
      ),
    });
  };

  const removeTrack = (id: string) => {
    onUpdate({ audioTracks: state.audioTracks.filter((t) => t.id !== id) });
  };

  return (
    <div className="p-3 space-y-4">
      {/* Add audio */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 bg-muted/50 hover:bg-muted rounded-xl p-3 border border-border/30 hover:border-amber-400/30 transition-all text-sm text-muted-foreground hover:text-foreground"
        >
          <Plus className="w-4 h-4" />
          Add Audio File
        </button>
        <button
          type="button"
          onClick={() => setIsRecording(!isRecording)}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl p-3 border transition-all text-sm",
            isRecording
              ? "bg-rose-500/20 border-rose-500/50 text-rose-400 animate-pulse"
              : "bg-muted/50 hover:bg-muted border-border/30 hover:border-rose-400/30 text-muted-foreground hover:text-foreground",
          )}
        >
          <Mic className="w-4 h-4" />
          {isRecording ? "Stop" : "Record"}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={addAudioTrack}
      />

      {/* Track list */}
      {state.audioTracks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-3xl mb-2">🎵</p>
          <p className="text-sm">No audio tracks yet</p>
          <p className="text-xs mt-1">Add music or record a voiceover</p>
        </div>
      ) : (
        <div className="space-y-3">
          {state.audioTracks.map((track) => (
            <div
              key={track.id}
              className="bg-muted/50 rounded-xl p-3 border border-border/30 space-y-3"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500/30 to-pink-500/30 flex items-center justify-center flex-shrink-0">
                  <Volume2 className="w-4 h-4 text-rose-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {track.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatTime(track.duration)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateTrack(track.id, { muted: !track.muted })}
                  className={cn(
                    "transition-colors",
                    track.muted
                      ? "text-rose-400"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {track.muted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => removeTrack(track.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Volume slider */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground w-12">
                  Volume
                </span>
                <Slider
                  value={[track.volume]}
                  onValueChange={([v]) => updateTrack(track.id, { volume: v })}
                  min={0}
                  max={100}
                  step={1}
                  className="flex-1"
                  disabled={track.muted}
                />
                <span className="text-[10px] text-muted-foreground w-8 text-right">
                  {track.volume}%
                </span>
              </div>

              {/* Waveform visualization */}
              <div className="h-8 bg-muted rounded-lg overflow-hidden flex items-center px-2 gap-0.5">
                {Array.from(
                  { length: 40 },
                  (_, i) => `wave-${track.id}-${i}`,
                ).map((waveKey, i) => (
                  <div
                    key={waveKey}
                    className={cn(
                      "flex-1 rounded-full",
                      track.muted ? "bg-muted-foreground/20" : "bg-rose-400/60",
                    )}
                    style={{
                      height: `${20 + Math.sin(i * 0.8) * 15 + Math.random() * 10}%`,
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
