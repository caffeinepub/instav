import { Bookmark, Eye, Heart, MessageCircle, Share2 } from "lucide-react";
import React, { useState } from "react";
import type { Post } from "../hooks/useQueries";
import {
  useGetCallerUserProfile,
  useLikePost,
  useRecordView,
  useUnlikePost,
} from "../hooks/useQueries";
import AvatarPlaceholder from "./AvatarPlaceholder";
import CommentsSheet from "./CommentsSheet";
import ShareModal from "./ShareModal";

interface PostCardProps {
  post: Post;
  isLiked?: boolean;
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

export default function PostCard({ post, isLiked = false }: PostCardProps) {
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(Number(post.likeCount));
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const likePost = useLikePost();
  const unlikePost = useUnlikePost();
  const recordView = useRecordView();

  useGetCallerUserProfile();

  const mediaUrl = post.media?.getDirectURL();
  const isVideo = post.mediaType?.startsWith("video");

  const handleLike = async () => {
    if (liked) {
      setLiked(false);
      setLikeCount((c) => c - 1);
      await unlikePost.mutateAsync(post.id).catch(() => {
        setLiked(true);
        setLikeCount((c) => c + 1);
      });
    } else {
      setLiked(true);
      setLikeCount((c) => c + 1);
      await likePost.mutateAsync(post.id).catch(() => {
        setLiked(false);
        setLikeCount((c) => c - 1);
      });
    }
  };

  const handleView = () => {
    recordView.mutate(post.id);
  };

  return (
    <article
      className="overflow-hidden rounded-2xl mb-3 transition-shadow duration-200 hover:shadow-card-hover"
      style={{
        background: "oklch(0.11 0.009 265 / 85%)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid oklch(1 0 0 / 7%)",
        boxShadow:
          "0 4px 24px -4px oklch(0 0 0 / 0.5), inset 0 1px 0 oklch(1 0 0 / 0.05)",
      }}
    >
      {/* Author header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <AvatarPlaceholder name={post.authorName} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-foreground font-semibold text-sm truncate">
            {post.authorName}
          </p>
          <p className="text-muted-foreground text-xs">
            {timeAgo(post.timestamp)}
          </p>
        </div>
      </div>

      {/* Media */}
      {mediaUrl && (
        <div
          className="relative bg-black"
          onClick={handleView}
          onKeyDown={(e) => e.key === "Enter" && handleView()}
          role="presentation"
        >
          {isVideo ? (
            <video
              src={mediaUrl}
              className="w-full max-h-96 object-contain"
              controls
              playsInline
              preload="metadata"
            >
              <track kind="captions" />
            </video>
          ) : (
            <img
              src={mediaUrl}
              alt={post.caption}
              className="w-full max-h-96 object-cover"
              loading="lazy"
            />
          )}
        </div>
      )}

      {/* Caption */}
      {post.caption && (
        <div className="px-4 py-2">
          <p className="text-foreground/85 text-sm leading-relaxed">
            {post.caption}
          </p>
        </div>
      )}

      {/* Actions */}
      <div
        className="flex items-center gap-1 px-3 py-2"
        style={{ borderTop: "1px solid oklch(1 0 0 / 6%)" }}
      >
        <button
          type="button"
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
            liked
              ? "text-coral-400 bg-coral-500/10"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5"
          }`}
        >
          <Heart className={`w-4 h-4 ${liked ? "fill-coral-400" : ""}`} />
          <span>{likeCount}</span>
        </button>

        <button
          type="button"
          onClick={() => setCommentsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setShareOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
        >
          <Share2 className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground/60">
          <Eye className="w-3.5 h-3.5" />
          <span>{Number(post.viewCount)}</span>
        </div>

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => setBookmarked((b) => !b)}
          className={`p-2 rounded-xl transition-colors ${
            bookmarked
              ? "text-gold-400 bg-gold-500/10"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5"
          }`}
        >
          <Bookmark
            className={`w-4 h-4 ${bookmarked ? "fill-gold-400" : ""}`}
          />
        </button>
      </div>

      <CommentsSheet
        post={post}
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
      />

      <ShareModal post={post} open={shareOpen} onOpenChange={setShareOpen} />
    </article>
  );
}
