import { formatNumber, formatTime, timeAgo } from "@/lib/format";
import type { Post } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Play,
  Share2,
} from "lucide-react";
import { useState } from "react";
import AvatarPlaceholder from "./AvatarPlaceholder";

interface VideoCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onFollow: (userId: string) => void;
}

export default function VideoCard({ post, onLike, onFollow }: VideoCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);

  const handleLike = () => {
    onLike(post.id);
    if (!post.isLiked) {
      setLikeAnim(true);
      setTimeout(() => setLikeAnim(false), 600);
    }
  };

  return (
    <article
      className="overflow-hidden rounded-2xl mb-4 mx-3 transition-shadow duration-200 hover:shadow-card-hover"
      style={{
        background: "oklch(0.11 0.009 265 / 85%)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid oklch(1 0 0 / 7%)",
        boxShadow:
          "0 4px 24px -4px oklch(0 0 0 / 0.5), inset 0 1px 0 oklch(1 0 0 / 0.05)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-0.5 rounded-full bg-gradient-to-br from-amber-400 to-rose-500">
              <div
                className="p-0.5 rounded-full"
                style={{ background: "oklch(0.11 0.009 265)" }}
              >
                <AvatarPlaceholder
                  userId={post.userId}
                  displayName={post.displayName}
                  size="sm"
                />
              </div>
            </div>
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground leading-tight">
              {post.displayName}
            </p>
            <p className="text-xs text-muted-foreground">
              @{post.username} · {timeAgo(post.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!post.isFollowing && (
            <button
              type="button"
              onClick={() => onFollow(post.userId)}
              className="text-xs font-semibold border rounded-full px-3 py-1 transition-colors"
              style={{
                color: "#f5c842",
                borderColor: "oklch(0.78 0.16 75 / 40%)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "oklch(0.78 0.16 75 / 10%)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "transparent";
              }}
            >
              Follow
            </button>
          )}
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Video Thumbnail */}
      <div className="relative bg-muted aspect-[9/16] max-h-[480px] overflow-hidden">
        <img
          src={post.thumbnailUrl}
          alt={post.caption}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{
              background: "oklch(0 0 0 / 45%)",
              backdropFilter: "blur(8px)",
              border: "1px solid oklch(1 0 0 / 20%)",
            }}
          >
            <Play className="w-6 h-6 text-white fill-white ml-1" />
          </div>
        </div>
        {/* Duration badge */}
        <div
          className="absolute bottom-3 right-3 text-white text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            background: "oklch(0 0 0 / 60%)",
            backdropFilter: "blur(8px)",
          }}
        >
          {formatTime(post.duration)}
        </div>
        {/* Double-tap like animation */}
        {likeAnim && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart className="w-24 h-24 text-rose-500 fill-rose-500 animate-ping opacity-80" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleLike}
              className={cn(
                "flex items-center gap-1.5 transition-all duration-200",
                post.isLiked
                  ? "text-rose-500"
                  : "text-muted-foreground hover:text-rose-400",
              )}
            >
              <Heart
                className={cn(
                  "w-5 h-5 transition-transform",
                  post.isLiked && "fill-rose-500",
                  likeAnim && "scale-125",
                )}
              />
              <span className="text-sm font-medium">
                {formatNumber(post.likes)}
              </span>
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">
                {formatNumber(post.comments)}
              </span>
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Share2 className="w-5 h-5" />
              <span className="text-sm font-medium">
                {formatNumber(post.shares)}
              </span>
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={cn(
              "transition-colors",
              isBookmarked
                ? "text-amber-400"
                : "text-muted-foreground hover:text-amber-400",
            )}
          >
            <Bookmark
              className={cn("w-5 h-5", isBookmarked && "fill-amber-400")}
            />
          </button>
        </div>

        {/* Caption */}
        <p className="text-sm text-foreground leading-relaxed">
          <span className="font-semibold">{post.username}</span> {post.caption}
        </p>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-amber-400 hover:text-amber-300 cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
