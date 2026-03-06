import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { EditorState, FilterSettings } from "@/pages/EditorPage";

interface FiltersPanelProps {
  state: EditorState;
  onUpdate: (updates: Partial<EditorState>) => void;
}

const PRESETS: {
  id: string;
  label: string;
  emoji: string;
  settings: Partial<FilterSettings>;
}[] = [
  {
    id: "none",
    label: "Original",
    emoji: "🎞️",
    settings: {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hue: 0,
      exposure: 0,
      highlights: 0,
      shadows: 0,
      sharpness: 0,
      vignette: 0,
    },
  },
  {
    id: "moody",
    label: "Moody",
    emoji: "🌑",
    settings: {
      brightness: 90,
      contrast: 120,
      saturation: 70,
      hue: 0,
      exposure: -10,
      highlights: -20,
      shadows: 10,
      vignette: 30,
    },
  },
  {
    id: "warm-vintage",
    label: "Warm Vintage",
    emoji: "🌅",
    settings: {
      brightness: 105,
      contrast: 95,
      saturation: 80,
      hue: 15,
      exposure: 5,
      highlights: -10,
      shadows: 20,
      vignette: 20,
    },
  },
  {
    id: "cool-blue",
    label: "Cool Blue",
    emoji: "🧊",
    settings: {
      brightness: 100,
      contrast: 110,
      saturation: 90,
      hue: -20,
      exposure: 0,
      highlights: 10,
      shadows: -10,
      vignette: 10,
    },
  },
  {
    id: "cinematic",
    label: "Cinematic",
    emoji: "🎬",
    settings: {
      brightness: 95,
      contrast: 130,
      saturation: 85,
      hue: 5,
      exposure: -5,
      highlights: -30,
      shadows: 15,
      vignette: 40,
    },
  },
  {
    id: "noir",
    label: "Noir",
    emoji: "🖤",
    settings: {
      brightness: 85,
      contrast: 150,
      saturation: 0,
      hue: 0,
      exposure: -15,
      highlights: -20,
      shadows: 20,
      vignette: 50,
    },
  },
  {
    id: "pastel",
    label: "Pastel",
    emoji: "🌸",
    settings: {
      brightness: 115,
      contrast: 85,
      saturation: 60,
      hue: 10,
      exposure: 15,
      highlights: 20,
      shadows: 30,
      vignette: 0,
    },
  },
  {
    id: "vivid",
    label: "Vivid",
    emoji: "🌈",
    settings: {
      brightness: 105,
      contrast: 115,
      saturation: 150,
      hue: 0,
      exposure: 5,
      highlights: 10,
      shadows: -5,
      vignette: 0,
    },
  },
  {
    id: "faded",
    label: "Faded",
    emoji: "🌫️",
    settings: {
      brightness: 110,
      contrast: 80,
      saturation: 70,
      hue: 0,
      exposure: 10,
      highlights: 30,
      shadows: 40,
      vignette: 0,
    },
  },
  {
    id: "golden-hour",
    label: "Golden Hour",
    emoji: "✨",
    settings: {
      brightness: 110,
      contrast: 105,
      saturation: 110,
      hue: 25,
      exposure: 10,
      highlights: -5,
      shadows: 15,
      vignette: 15,
    },
  },
  {
    id: "teal-orange",
    label: "Teal & Orange",
    emoji: "🎨",
    settings: {
      brightness: 100,
      contrast: 120,
      saturation: 120,
      hue: -10,
      exposure: 0,
      highlights: -15,
      shadows: 10,
      vignette: 25,
    },
  },
];

const CONTROLS: {
  key: keyof FilterSettings;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}[] = [
  {
    key: "brightness",
    label: "Brightness",
    min: 50,
    max: 150,
    step: 1,
    unit: "%",
  },
  { key: "contrast", label: "Contrast", min: 50, max: 200, step: 1, unit: "%" },
  {
    key: "saturation",
    label: "Saturation",
    min: 0,
    max: 200,
    step: 1,
    unit: "%",
  },
  { key: "hue", label: "Hue Shift", min: -180, max: 180, step: 1, unit: "°" },
  { key: "exposure", label: "Exposure", min: -50, max: 50, step: 1, unit: "" },
  {
    key: "highlights",
    label: "Highlights",
    min: -50,
    max: 50,
    step: 1,
    unit: "",
  },
  { key: "shadows", label: "Shadows", min: -50, max: 50, step: 1, unit: "" },
  { key: "sharpness", label: "Sharpness", min: 0, max: 100, step: 1, unit: "" },
  { key: "vignette", label: "Vignette", min: 0, max: 100, step: 1, unit: "%" },
];

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

export default function FiltersPanel({ state, onUpdate }: FiltersPanelProps) {
  const applyPreset = (preset: (typeof PRESETS)[0]) => {
    onUpdate({
      filters: {
        ...state.filters,
        ...preset.settings,
        preset: preset.id,
      },
    });
  };

  const updateFilter = (key: keyof FilterSettings, value: number) => {
    onUpdate({
      filters: { ...state.filters, [key]: value, preset: "custom" },
    });
  };

  const resetFilters = () => {
    onUpdate({ filters: DEFAULT_FILTERS });
  };

  return (
    <div className="p-3 space-y-4">
      {/* Presets */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Presets
        </h3>
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 pb-1 min-w-max">
            {PRESETS.map((preset) => (
              <button
                type="button"
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-xl border transition-all min-w-[60px]",
                  state.filters.preset === preset.id
                    ? "bg-amber-400/10 border-amber-400/50"
                    : "bg-muted/50 border-border/30 hover:border-amber-400/30",
                )}
              >
                <span className="text-xl">{preset.emoji}</span>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {preset.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Manual controls */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Adjustments
          </h3>
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            Reset All
          </button>
        </div>
        <div className="space-y-3">
          {CONTROLS.map(({ key, label, min, max, step, unit }) => {
            const value = state.filters[key] as number;
            // Use String(key) to ensure the key prop is always a string, not a symbol
            return (
              <div key={String(key)} className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground w-20 flex-shrink-0">
                  {label}
                </span>
                <Slider
                  value={[value]}
                  onValueChange={([v]) => updateFilter(key, v)}
                  min={min}
                  max={max}
                  step={step}
                  className="flex-1"
                />
                <span className="text-[10px] text-muted-foreground w-12 text-right tabular-nums">
                  {value}
                  {unit}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
