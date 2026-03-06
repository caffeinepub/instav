import { useSearch } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronUp,
  Heart,
  MessageCircle,
  Share2,
  UserCheck,
  UserPlus,
  Volume2,
  VolumeX,
} from "lucide-react";
import React, { useState, useRef, useEffect, useCallback } from "react";
import CommentsSheet from "../components/CommentsSheet";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  type Post,
  useFollowUser,
  useGetAllPosts,
  useGetLikedPosts,
  useIsFollowing,
  useLikePost,
  useUnfollowUser,
  useUnlikePost,
} from "../hooks/useQueries";

interface FollowButtonProps {
  authorPrincipalStr: string;
}

function FollowButton({ authorPrincipalStr }: FollowButtonProps) {
  const { data: isFollowing } = useIsFollowing(authorPrincipalStr);
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  const handleToggle = () => {
    if (isFollowing) {
      unfollowMutation.mutate(authorPrincipalStr);
    } else {
      followMutation.mutate(authorPrincipalStr);
    }
  };

  const isPending = followMutation.isPending || unfollowMutation.isPending;

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 ${
        isFollowing
          ? "bg-surface-2 border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40"
          : "bg-gold-500 hover:bg-gold-400 text-background shadow-gold-glow"
      }`}
    >
      {isPending ? (
        <span className="w-3 h-3 border border-current/40 border-t-current rounded-full animate-spin" />
      ) : isFollowing ? (
        <UserCheck className="w-3 h-3" />
      ) : (
        <UserPlus className="w-3 h-3" />
      )}
      {isFollowing ? "Shadowing" : "Shadow"}
    </button>
  );
}

interface ReelCardProps {
  post: Post;
  isActive: boolean;
  isLiked: boolean;
  onLikeToggle: () => void;
  onCommentOpen: () => void;
  onShare: () => void;
}

function ReelCard({
  post,
  isActive,
  isLiked,
  onLikeToggle,
  onCommentOpen,
  onShare,
}: ReelCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [localLiked, setLocalLiked] = useState(isLiked);
  const [localLikeCount, setLocalLikeCount] = useState(Number(post.likeCount));

  const mediaUrl = post.media?.getDirectURL();
  const isVideo = post.mediaType?.startsWith("video");

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isActive]);

  const handleLike = () => {
    setLocalLiked((l) => !l);
    setLocalLikeCount((c) => (localLiked ? c - 1 : c + 1));
    onLikeToggle();
  };

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      {/* Media */}
      {mediaUrl && isVideo ? (
        <video
          ref={videoRef}
          src={mediaUrl}
          className="w-full h-full object-cover"
          loop
          muted={muted}
          playsInline
          preload="auto"
        />
      ) : mediaUrl ? (
        <img
          src={mediaUrl}
          alt={post.caption}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
          <p className="text-white/60 text-center px-8 text-sm">
            {post.caption}
          </p>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

      {/* Author info */}
      <div className="absolute bottom-20 left-4 right-16 z-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-white font-semibold text-sm">
            {post.authorName}
          </span>
          <FollowButton authorPrincipalStr={post.authorPrincipal.toString()} />
        </div>
        {post.caption && (
          <p className="text-white/80 text-xs leading-relaxed line-clamp-2">
            {post.caption}
          </p>
        )}
      </div>

      {/* Right actions */}
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-10">
        {/* Like */}
        <button
          type="button"
          onClick={handleLike}
          className="flex flex-col items-center gap-1"
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              localLiked ? "bg-coral-500/30" : "bg-black/40"
            }`}
          >
            <Heart
              className={`w-5 h-5 transition-all ${
                localLiked
                  ? "fill-coral-400 text-coral-400 scale-110"
                  : "text-white"
              }`}
            />
          </div>
          <span className="text-white text-xs font-medium">
            {localLikeCount}
          </span>
        </button>

        {/* Comment */}
        <button
          type="button"
          onClick={onCommentOpen}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
        </button>

        {/* Share */}
        <button
          type="button"
          onClick={onShare}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center">
            <Share2 className="w-5 h-5 text-white" />
          </div>
        </button>

        {/* Mute (video only) */}
        {isVideo && (
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center">
              {muted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

export default function ShortSportPage() {
  useInternetIdentity();
  const search = useSearch({ from: "/shortsport" });
  const initialPostId = (search as { postId?: string }).postId;

  const { data: allPosts = [], isLoading } = useGetAllPosts();
  const { data: likedPosts = [] } = useGetLikedPosts();
  const likePost = useLikePost();
  const unlikePost = useUnlikePost();

  const videoPosts = allPosts.filter(
    (p: Post) => p.mediaType?.startsWith("video") || p.media,
  );

  const [currentIndex, setCurrentIndex] = useState(() => {
    if (initialPostId) {
      const idx = videoPosts.findIndex(
        (p: Post) => p.id.toString() === initialPostId,
      );
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });

  const [commentsPostId, setCommentsPostId] = useState<bigint | undefined>(
    undefined,
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const likedPostIds = new Set(likedPosts.map((p: Post) => p.id.toString()));

  const handleLikeToggle = useCallback(
    (post: Post) => {
      if (likedPostIds.has(post.id.toString())) {
        unlikePost.mutate(post.id);
      } else {
        likePost.mutate(post.id);
      }
    },
    [likedPostIds, likePost, unlikePost],
  );

  const goNext = () =>
    setCurrentIndex((i) => Math.min(i + 1, videoPosts.length - 1));
  const goPrev = () => setCurrentIndex((i) => Math.max(i - 1, 0));

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown")
        setCurrentIndex((i) => Math.min(i + 1, videoPosts.length - 1));
      if (e.key === "ArrowUp") setCurrentIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [videoPosts.length]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-500/40 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (videoPosts.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-center px-8">
        <Heart className="w-12 h-12 text-white/20 mb-4" />
        <p className="text-white/60 text-sm">No ShortSport videos yet</p>
        <p className="text-white/40 text-xs mt-1">
          Be the first to share a video!
        </p>
      </div>
    );
  }

  const currentPost = videoPosts[currentIndex];

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black overflow-hidden">
      {/* Reel */}
      <ReelCard
        key={currentPost.id.toString()}
        post={currentPost}
        isActive={true}
        isLiked={likedPostIds.has(currentPost.id.toString())}
        onLikeToggle={() => handleLikeToggle(currentPost)}
        onCommentOpen={() => setCommentsPostId(currentPost.id)}
        onShare={() => {
          if (navigator.share) {
            navigator.share({
              url: `${window.location.origin}/shortsport?postId=${currentPost.id}`,
            });
          }
        }}
      />

      {/* Navigation arrows */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
        <button
          type="button"
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white disabled:opacity-30 transition-opacity"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={currentIndex === videoPosts.length - 1}
          className="w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white disabled:opacity-30 transition-opacity"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Progress dots */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1 z-20">
        {videoPosts.slice(0, 10).map((p: Post, i: number) => (
          <div
            key={p.id.toString()}
            className={`h-1 rounded-full transition-all ${
              i === currentIndex ? "w-4 bg-white" : "w-1 bg-white/40"
            }`}
          />
        ))}
      </div>

      {/* Comments sheet */}
      <CommentsSheet
        postId={commentsPostId}
        isOpen={commentsPostId !== undefined}
        onClose={() => setCommentsPostId(undefined)}
      />
    </div>
  );
}
