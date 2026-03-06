import { Clock, X } from "lucide-react";
import React, { useEffect } from "react";
import type { Story } from "../lib/mockData";
import AvatarPlaceholder from "./AvatarPlaceholder";

interface StoryViewerModalProps {
  story: Story;
  onClose: () => void;
}

export default function StoryViewerModal({
  story,
  onClose,
}: StoryViewerModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const timeAgo = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor(diff / 60000);
    if (hours >= 1) return `${hours}h ago`;
    return `${mins}m ago`;
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      aria-label="Story viewer"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

      {/* Story card */}
      <div
        className="relative w-full max-w-sm mx-4 rounded-3xl overflow-hidden shadow-2xl"
        style={{ aspectRatio: "9/16", maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Background gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(160deg, 
              oklch(0.18 0.04 ${(Number.parseInt(story.userId.replace(/\D/g, "") || "0")) * 60 + 200}) 0%, 
              oklch(0.10 0.02 260) 100%
            )`,
          }}
        />

        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/20 z-10">
          <div
            className="h-full bg-white/80 rounded-full"
            style={{ width: "60%", transition: "width 5s linear" }}
          />
        </div>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 pt-5">
          <div className="flex items-center gap-3">
            <div className="story-ring">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-surface">
                <AvatarPlaceholder
                  userId={story.userId}
                  name={story.displayName}
                  size="md"
                  className="w-full h-full"
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-tight">
                {story.displayName}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-white/60" />
                <p className="text-white/60 text-xs">
                  {timeAgo(story.timestamp)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="Close story"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Story content — centered avatar + name */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8">
          <div className="story-ring p-1">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-surface">
              <AvatarPlaceholder
                userId={story.userId}
                name={story.displayName}
                size="xl"
                className="w-full h-full"
              />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-white font-display font-bold text-2xl">
              {story.displayName}
            </h2>
            <p className="text-white/60 text-sm mt-1">@{story.handle}</p>
          </div>
          <div className="mt-4 px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
            <p className="text-white/80 text-sm text-center">
              ✨ Story content coming soon
            </p>
          </div>
        </div>

        {/* Bottom tap area hint */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium transition-colors backdrop-blur-sm"
          >
            Close Story
          </button>
        </div>
      </div>
    </div>
  );
}
