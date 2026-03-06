import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Grid, Image, Video } from "lucide-react";
import React, { useState } from "react";
import type { Post } from "../hooks/useQueries";

interface PostPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  posts: Post[];
  onSelect: (post: Post) => void;
  title?: string;
}

export default function PostPickerModal({
  open,
  onOpenChange,
  posts,
  onSelect,
  title = "Select a Post",
}: PostPickerModalProps) {
  const [selected, setSelected] = useState<Post | null>(null);

  const handleSelect = (post: Post) => {
    setSelected(post);
    onSelect(post);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-1 border border-border rounded-2xl max-w-sm w-full p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border">
          <DialogTitle className="text-foreground text-base font-semibold flex items-center gap-2">
            <Grid className="w-4 h-4 text-gold-400" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="p-3 max-h-96 overflow-y-auto">
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Grid className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-muted-foreground text-sm">
                No posts available
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {posts.map((post) => {
                const mediaUrl = post.media?.getDirectURL();
                const isVideo = post.mediaType?.startsWith("video");
                return (
                  <button
                    type="button"
                    key={post.id.toString()}
                    onClick={() => handleSelect(post)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selected?.id === post.id
                        ? "border-gold-500 shadow-gold-glow"
                        : "border-transparent hover:border-gold-500/50"
                    }`}
                  >
                    {mediaUrl ? (
                      isVideo ? (
                        <video
                          src={mediaUrl}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={mediaUrl}
                          alt={post.caption}
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <div className="w-full h-full bg-surface-2 flex items-center justify-center">
                        <span className="text-muted-foreground text-xs text-center px-1 line-clamp-2">
                          {post.caption}
                        </span>
                      </div>
                    )}
                    {isVideo && (
                      <div className="absolute top-1 right-1 bg-black/60 rounded p-0.5">
                        <Video className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
