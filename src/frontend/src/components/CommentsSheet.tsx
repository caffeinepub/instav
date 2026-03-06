import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { MessageCircle, Send } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  type Comment,
  type Post,
  useAddComment,
  useGetComments,
} from "../hooks/useQueries";
import { useGetCallerUserProfile } from "../hooks/useQueries";
import AvatarPlaceholder from "./AvatarPlaceholder";

interface CommentsSheetProps {
  post?: Post | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isOpen?: boolean;
  onClose?: () => void;
  postId?: bigint;
}

function timeAgo(timestamp: bigint): string {
  const now = Date.now();
  const ts = Number(timestamp) / 1_000_000;
  const diff = Math.floor((now - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function CommentsSheet({
  post,
  open,
  onOpenChange,
  isOpen,
  onClose,
  postId: postIdProp,
}: CommentsSheetProps) {
  const [commentText, setCommentText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isSheetOpen = open ?? isOpen ?? false;
  const handleOpenChange = (v: boolean) => {
    onOpenChange?.(v);
    if (!v) onClose?.();
  };

  const resolvedPostId = post?.id ?? postIdProp ?? undefined;

  const { data: comments = [], isLoading } = useGetComments(resolvedPostId);
  const addComment = useAddComment();
  const { data: callerProfile } = useGetCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || resolvedPostId === undefined) return;
    const authorName = callerProfile?.name ?? "Anonymous";
    await addComment.mutateAsync({
      postId: resolvedPostId,
      authorName,
      text: commentText.trim(),
    });
    setCommentText("");
  };

  useEffect(() => {
    if (isSheetOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isSheetOpen]);

  return (
    <Sheet open={isSheetOpen} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-surface-1 border-t border-border rounded-t-2xl h-[70vh] flex flex-col p-0"
      >
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-border">
          <SheetTitle className="text-foreground text-base font-semibold flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-gold-400" />
            Comments {comments.length > 0 && `(${comments.length})`}
          </SheetTitle>
        </SheetHeader>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-gold-500/40 border-t-gold-500 rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageCircle className="w-10 h-10 text-muted-foreground/30 mb-2" />
              <p className="text-muted-foreground text-sm">No comments yet</p>
              <p className="text-muted-foreground/60 text-xs mt-1">
                Be the first to comment!
              </p>
            </div>
          ) : (
            comments.map((comment: Comment) => (
              <div key={comment.id.toString()} className="flex gap-3">
                <AvatarPlaceholder name={comment.authorName} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-foreground text-sm font-semibold">
                      {comment.authorName}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {timeAgo(comment.timestamp)}
                    </span>
                  </div>
                  <p className="text-foreground/80 text-sm mt-0.5 break-words">
                    {comment.text}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="px-4 py-3 border-t border-border flex items-center gap-3"
        >
          <AvatarPlaceholder
            name={callerProfile?.name ?? "Me"}
            profilePicture={callerProfile?.profilePhoto}
            size="sm"
          />
          <input
            ref={inputRef}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment…"
            className="flex-1 bg-surface-2 border border-border rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/40"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!commentText.trim() || addComment.isPending}
            className="bg-gold-500 hover:bg-gold-400 text-background rounded-full w-9 h-9 flex-shrink-0"
          >
            {addComment.isPending ? (
              <span className="w-4 h-4 border-2 border-background/40 border-t-background rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
