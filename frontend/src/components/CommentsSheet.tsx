import React, { useState } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Post } from '../backend';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetComments, useAddComment, useGetCallerUserProfile } from '../hooks/useQueries';

interface CommentsSheetProps {
  post: Post | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CommentsSheet({ post, open, onOpenChange }: CommentsSheetProps) {
  const { identity } = useInternetIdentity();
  const [commentText, setCommentText] = useState('');

  const { data: comments, isLoading } = useGetComments(post?.id ?? null);
  const { data: userProfile } = useGetCallerUserProfile();
  const addComment = useAddComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity) {
      toast.error('Please sign in to comment');
      return;
    }
    if (!commentText.trim() || !post) return;

    const authorName = userProfile?.displayName || 'Anonymous';
    addComment.mutate(
      { postId: post.id, authorName, text: commentText.trim() },
      {
        onSuccess: () => {
          setCommentText('');
        },
        onError: () => {
          toast.error('Failed to post comment');
        },
      }
    );
  };

  const formatTime = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] flex flex-col p-0">
        <SheetHeader className="px-4 py-3 border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="w-4 h-4" />
            Comments
          </SheetTitle>
        </SheetHeader>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))
          ) : comments && comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id.toString()} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                  {comment.authorName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-sm text-foreground">{comment.authorName}</span>
                    <span className="text-xs text-muted-foreground">{formatTime(comment.timestamp)}</span>
                  </div>
                  <p className="text-sm text-foreground mt-0.5 break-words">{comment.text}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MessageCircle className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No comments yet. Be the first!</p>
            </div>
          )}
        </div>

        {/* Comment input */}
        <div className="border-t border-border px-4 py-3">
          {identity ? (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-muted rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                maxLength={500}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!commentText.trim() || addComment.isPending}
                className="rounded-full shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-primary">Sign in</span> to leave a comment
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
