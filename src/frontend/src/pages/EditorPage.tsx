import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Film,
  LayoutTemplate,
  Palette,
  Scissors,
  Sparkles,
  Sticker,
  Upload,
} from "lucide-react";
import type React from "react";
import { useMemo, useRef, useState } from "react";
import DesignPanel from "../components/editor/DesignPanel";
import EditorTimeline from "../components/editor/EditorTimeline";
import EffectsPanel from "../components/editor/EffectsPanel";
import ExportPanel from "../components/editor/ExportPanel";
import FiltersPanel from "../components/editor/FiltersPanel";
import StickersPanel from "../components/editor/StickersPanel";

// ─── Shared editor types (re-exported for sub-components) ────────────────────

export type EditorMode = "video" | "design";
export type EditorTool =
  | "timeline"
  | "transitions"
  | "audio"
  | "text"
  | "stickers"
  | "effects"
  | "filters"
  | "design"
  | "export";

export interface Clip {
  id: string;
  type: "video" | "image" | "blank";
  name: string;
  duration: number;
  startTime: number;
  src?: string;
  color?: string;
}

export interface TextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
  align: "left" | "center" | "right";
  bgColor?: string;
  animation: string;
  startTime: number;
  duration: number;
}

export interface StickerLayer {
  id: string;
  emoji: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  startTime: number;
  duration: number;
}

export interface AudioTrack {
  id: string;
  name: string;
  src?: string;
  volume: number;
  muted: boolean;
  startTime: number;
  duration: number;
}

export interface FilterSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  exposure: number;
  highlights: number;
  shadows: number;
  sharpness: number;
  vignette: number;
  preset: string;
}

export interface EditorState {
  mode: EditorMode;
  clips: Clip[];
  textLayers: TextLayer[];
  stickerLayers: StickerLayer[];
  audioTracks: AudioTrack[];
  filters: FilterSettings;
  effects: string[];
  transitions: Record<string, string>;
  currentTime: number;
  totalDuration: number;
  isPlaying: boolean;
  zoom: number;
  aspectRatio: "9:16" | "1:1" | "16:9";
}

// ─── Default state ────────────────────────────────────────────────────────────

const DEFAULT_FILTERS: FilterSettings = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hue: 0,
  exposure: 0,
  highlights: 0,
  shadows: 0,
  sharpness: 0,
  vignette: 0,
  preset: "none",
};

function createDefaultState(): EditorState {
  return {
    mode: "video",
    clips: [],
    textLayers: [],
    stickerLayers: [],
    audioTracks: [],
    filters: { ...DEFAULT_FILTERS },
    effects: [],
    transitions: {},
    currentTime: 0,
    totalDuration: 0,
    isPlaying: false,
    zoom: 1,
    aspectRatio: "9:16",
  };
}

// ─── Panel types ─────────────────────────────────────────────────────────────

type PanelType =
  | "export"
  | "trim"
  | "filters"
  | "effects"
  | "stickers"
  | "design";

const PANELS: { id: PanelType; label: string; icon: React.ReactNode }[] = [
  { id: "export", label: "Upload", icon: <Upload className="w-4 h-4" /> },
  { id: "trim", label: "Trim", icon: <Scissors className="w-4 h-4" /> },
  { id: "filters", label: "Filters", icon: <Palette className="w-4 h-4" /> },
  { id: "effects", label: "Effects", icon: <Sparkles className="w-4 h-4" /> },
  { id: "stickers", label: "Stickers", icon: <Sticker className="w-4 h-4" /> },
  {
    id: "design",
    label: "Design",
    icon: <LayoutTemplate className="w-4 h-4" />,
  },
];

// ─── Build CSS filter string from FilterSettings ──────────────────────────────

function buildCssFilter(f: FilterSettings): string {
  return [
    `brightness(${f.brightness / 100})`,
    `contrast(${f.contrast / 100})`,
    `saturate(${f.saturation / 100})`,
    `hue-rotate(${f.hue}deg)`,
  ].join(" ");
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function EditorPage() {
  const [activePanel, setActivePanel] = useState<PanelType>("export");
  const [videoClip, setVideoClip] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("My Project");
  const [editorState, setEditorState] =
    useState<EditorState>(createDefaultState);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  const handleStateUpdate = (updates: Partial<EditorState>) => {
    setEditorState((prev) => ({ ...prev, ...updates }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Revoke previous object URL to avoid memory leaks
      if (videoUrl) URL.revokeObjectURL(videoUrl);

      const url = URL.createObjectURL(file);
      setVideoClip(file);
      setVideoUrl(url);

      const name = file.name.replace(/\.[^/.]+$/, "");
      setProjectName(name);

      // Initialize editor state with the imported clip
      const clip: Clip = {
        id: `clip-${Date.now()}`,
        type: "video",
        name,
        duration: 30, // will be updated when video metadata loads
        startTime: 0,
        src: url,
      };

      setEditorState({
        ...createDefaultState(),
        clips: [clip],
        totalDuration: 30,
      });

      setActivePanel("export");
    }
    e.target.value = "";
  };

  const handleVideoMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const duration = e.currentTarget.duration;
    if (!Number.isNaN(duration) && duration > 0) {
      setEditorState((prev) => ({
        ...prev,
        totalDuration: duration,
        clips: prev.clips.map((c, i) => (i === 0 ? { ...c, duration } : c)),
      }));
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const scrollTabs = (dir: "left" | "right") => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({
        left: dir === "left" ? -80 : 80,
        behavior: "smooth",
      });
    }
  };

  // Build CSS filter string for video preview
  const cssFilter = useMemo(
    () => buildCssFilter(editorState.filters),
    [editorState.filters],
  );

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] overflow-hidden bg-background">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground text-sm truncate max-w-[160px]">
            {projectName}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={handleImportClick}>
          <Upload className="w-3.5 h-3.5 mr-1" />
          Import Video
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* ── Video Preview (top ~50%) ── */}
      <div className="flex-1 flex items-center justify-center bg-black relative overflow-hidden min-h-0">
        {videoUrl ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              src={videoUrl}
              className="max-h-full max-w-full object-contain"
              style={{ filter: cssFilter }}
              controls
              playsInline
              onLoadedMetadata={handleVideoMetadata}
            >
              <track kind="captions" />
            </video>
            {/* Sticker overlays */}
            {editorState.stickerLayers.map((sticker) => (
              <div
                key={sticker.id}
                className="absolute pointer-events-none select-none"
                style={{
                  left: `${sticker.x * 100}%`,
                  top: `${sticker.y * 100}%`,
                  fontSize: sticker.size,
                  transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
                  lineHeight: 1,
                }}
              >
                {sticker.emoji}
              </div>
            ))}
            {/* Effects overlays */}
            {editorState.effects.includes("letterbox") && (
              <>
                <div className="absolute top-0 left-0 right-0 h-[10%] bg-black pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 h-[10%] bg-black pointer-events-none" />
              </>
            )}
            {editorState.effects.includes("vignette-pulse") && (
              <div
                className="absolute inset-0 pointer-events-none animate-pulse"
                style={{
                  background:
                    "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%)",
                }}
              />
            )}
            {editorState.effects.includes("film-grain") && (
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
                  backgroundSize: "150px 150px",
                }}
              />
            )}
            {editorState.effects.includes("glitch") && (
              <div
                className="absolute inset-0 pointer-events-none mix-blend-screen opacity-30"
                style={{
                  background:
                    "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,0,0,0.1) 2px, rgba(255,0,0,0.1) 4px)",
                }}
              />
            )}
          </div>
        ) : (
          <button
            type="button"
            className="flex flex-col items-center gap-3 cursor-pointer group bg-transparent border-0"
            onClick={handleImportClick}
          >
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <Upload className="w-8 h-8 text-white/60" />
            </div>
            <p className="text-white/60 text-sm">Tap to import a video</p>
            <p className="text-white/30 text-xs">MP4, MOV, AVI supported</p>
          </button>
        )}
      </div>

      {/* ── Tools Panel (bottom ~50%) ── */}
      <div
        className="flex flex-col border-t border-border bg-card flex-shrink-0"
        style={{ height: "50%" }}
      >
        {/* Tab bar */}
        <div className="flex items-center border-b border-border flex-shrink-0 bg-card">
          {/* Left scroll arrow */}
          <button
            type="button"
            onClick={() => scrollTabs("left")}
            className="flex-shrink-0 px-1 py-2 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Scrollable tabs */}
          <div
            ref={tabsRef}
            className="flex overflow-x-auto scrollbar-hide flex-1"
          >
            {PANELS.map((panel) => (
              <button
                type="button"
                key={panel.id}
                onClick={() => setActivePanel(panel.id)}
                className={`flex flex-col items-center gap-0.5 px-4 py-2 text-[11px] font-medium transition-colors flex-shrink-0 border-b-2 ${
                  activePanel === panel.id
                    ? "text-primary border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                }`}
              >
                {panel.icon}
                <span>{panel.label}</span>
              </button>
            ))}
          </div>

          {/* Right scroll arrow */}
          <button
            type="button"
            onClick={() => scrollTabs("right")}
            className="flex-shrink-0 px-1 py-2 text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Panel content — scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {activePanel === "export" && (
            <ExportPanel videoClip={videoClip} projectName={projectName} />
          )}
          {activePanel === "trim" && (
            <EditorTimeline state={editorState} onUpdate={handleStateUpdate} />
          )}
          {activePanel === "filters" && (
            <FiltersPanel state={editorState} onUpdate={handleStateUpdate} />
          )}
          {activePanel === "effects" && (
            <EffectsPanel state={editorState} onUpdate={handleStateUpdate} />
          )}
          {activePanel === "stickers" && (
            <StickersPanel state={editorState} onUpdate={handleStateUpdate} />
          )}
          {activePanel === "design" && (
            <DesignPanel state={editorState} onUpdate={handleStateUpdate} />
          )}
        </div>
      </div>
    </div>
  );
}
