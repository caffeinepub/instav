import { PlusSquare, User } from "lucide-react";
import React, { useEffect, useRef } from "react";

interface YourStoryPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onViewMyPosts: () => void;
  onCreateNewPost: () => void;
}

export default function YourStoryPopup({
  isOpen,
  onClose,
  onViewMyPosts,
  onCreateNewPost,
}: YourStoryPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Use a small delay so the click that opened the popup doesn't immediately close it
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={popupRef}
      className="absolute top-full left-0 mt-2 z-50 min-w-[180px] rounded-2xl overflow-hidden shadow-card"
      style={{
        background: "oklch(0.14 0.012 260 / 0.95)",
        backdropFilter: "blur(20px)",
        border: "1px solid oklch(0.78 0.16 75 / 0.2)",
      }}
    >
      <button
        type="button"
        onClick={() => {
          onViewMyPosts();
          onClose();
        }}
        className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-foreground hover:bg-white/5 transition-colors text-left"
      >
        <div className="w-7 h-7 rounded-lg bg-gold/15 flex items-center justify-center flex-shrink-0">
          <User className="w-3.5 h-3.5 text-gold" />
        </div>
        <span>View My Posts</span>
      </button>

      <div
        className="mx-3 h-px"
        style={{ background: "oklch(0.78 0.16 75 / 0.1)" }}
      />

      <button
        type="button"
        onClick={() => {
          onCreateNewPost();
          onClose();
        }}
        className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-foreground hover:bg-white/5 transition-colors text-left"
      >
        <div className="w-7 h-7 rounded-lg bg-coral/15 flex items-center justify-center flex-shrink-0">
          <PlusSquare className="w-3.5 h-3.5 text-coral" />
        </div>
        <span>Create New Post</span>
      </button>
    </div>
  );
}
