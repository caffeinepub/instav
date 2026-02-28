import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Heart,
  Volume2,
  VolumeX,
  Play,
  Loader2,
  MessageCircle,
  Share2,
  PlayCircle,
  PauseCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';
import type { Post } from '../backend';
import { useGetAllPosts, useLikePost, useGetComments } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import AvatarPlaceholder from '../components/AvatarPlaceholder';
import CommentsSheet from '../components/CommentsSheet';
import ShareModal from '../components/ShareModal';

// ─── Reel Item ────────────────────────────────────────────────────────────────

interface ReelItemProps {
  post: Post;
  muted: boolean;
  isActive: boolean;
  optimisticLike?: number;
  autoScrollEnabled: boolean;
  onLike: (id: bigint) => void;
  onComment: (post: Post) => void;
  onShare: (post: Post) => void;
  onProfileClick: (authorPrincipal: string) => void;
  onVideoEnded: () => void;
  onVideoClick: () => void;
}

function CommentCount({ postId }: { postId: bigint }) {
  const { data: comments } = useGetComments(postId);
  return <span className="text-white text-xs">{comments?.length ?? 0}</span>;
}

function ReelItem({
  post,
  muted,
  isActive,
  optimisticLike,
  autoScrollEnabled,
  onLike,
  onComment,
  onShare,
  onProfileClick,
  onVideoEnded,
  onVideoClick,
}: ReelItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const likeCount = optimisticLike ?? Number(post.likeCount);
  const videoSrc = post.media?.getDirectURL();
  const isVideo = post.mediaType === 'video';

  // Play/pause based on whether this reel is in view
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (isActive) {
      el.play().catch(() => {});
    } else {
      el.pause();
      el.currentTime = 0;
    }
  }, [isActive]);

  // Sync muted state
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = muted;
  }, [muted]);

  const authorPrincipal = post.authorPrincipal.toString();

  return (
    <div className="reel-item relative w-full flex-shrink-0" style={{ height: '100dvh' }}>
      {/* Media */}
      {isVideo && videoSrc ? (
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-full object-contain bg-black"
          loop={!autoScrollEnabled}
          muted={muted}
          playsInline
          onClick={onVideoClick}
          onEnded={autoScrollEnabled ? onVideoEnded : undefined}
        />
      ) : videoSrc ? (
        <img
          src={videoSrc}
          alt={post.caption}
          className="w-full h-full object-contain bg-black"
          onClick={onVideoClick}
        />
      ) : (
        <div
          className="w-full h-full bg-black flex items-center justify-center cursor-pointer"
          onClick={onVideoClick}
        >
          <Play className="w-12 h-12 text-white/30" />
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end pointer-events-none">
        {/* Bottom row: author info + side actions */}
        <div className="flex items-end justify-between px-4 pb-6 pointer-events-auto">
          {/* Left: Author info + caption */}
          <div className="flex-1 mr-4">
            {/* Author row — clickable */}
            <button
              onClick={() => onProfileClick(authorPrincipal)}
              className="flex items-center gap-2 mb-2 group"
            >
              <AvatarPlaceholder
                userId={authorPrincipal}
                name={post.authorName}
                size="sm"
                className="ring-2 ring-white/60 group-hover:ring-white transition-all"
              />
              <span className="font-bold text-white text-sm drop-shadow group-hover:underline">
                {post.authorName}
              </span>
            </button>

            {post.caption && (
              <p className="text-white/80 text-sm line-clamp-2 drop-shadow leading-snug">
                {post.caption}
              </p>
            )}
          </div>

          {/* Right: Side action buttons */}
          <div className="flex flex-col items-center gap-5 pb-1">
            {/* Like */}
            <button
              onClick={() => onLike(post.id)}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-11 h-11 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-white text-xs">{likeCount}</span>
            </button>

            {/* Comment */}
            <button
              onClick={() => onComment(post)}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-11 h-11 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <CommentCount postId={post.id} />
            </button>

            {/* Share */}
            <button
              onClick={() => onShare(post)}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-11 h-11 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-white text-xs">Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ShortSportPage() {
  const { data: posts, isLoading } = useGetAllPosts();
  const { identity } = useInternetIdentity();
  const likePost = useLikePost();
  const navigate = useNavigate();

  const [muted, setMuted] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [optimisticLikes, setOptimisticLikes] = useState<Record<string, number>>({});
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(false);

  // Comments sheet state
  const [commentPost, setCommentPost] = useState<Post | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);

  // Share modal state
  const [sharePost, setSharePost] = useState<Post | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Show all posts (videos and images)
  const feedPosts: Post[] = posts ?? [];

  // Track which reel is visible via IntersectionObserver
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const items = container.querySelectorAll('.reel-item');
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Array.from(items).indexOf(entry.target as Element);
            if (idx !== -1) setCurrentIndex(idx);
          }
        });
      },
      { root: container, threshold: 0.6 }
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [feedPosts.length]);

  // Scroll to a specific reel index
  const scrollToIndex = useCallback((index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const items = container.querySelectorAll('.reel-item');
    if (items[index]) {
      (items[index] as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // When a video ends and auto-scroll is enabled, advance to next
  const handleVideoEnded = useCallback(() => {
    if (!autoScrollEnabled) return;
    const next = currentIndex + 1;
    if (next >= feedPosts.length) {
      // Reached the end — stop auto-scroll
      setAutoScrollEnabled(false);
      toast('End of feed', { description: 'Auto-scroll stopped.' });
      return;
    }
    scrollToIndex(next);
  }, [autoScrollEnabled, currentIndex, feedPosts.length, scrollToIndex]);

  // Clicking the video activates auto-scroll mode
  const handleVideoClick = useCallback(() => {
    setAutoScrollEnabled(true);
    toast.success('Auto-scroll activated', {
      description: 'Videos will advance automatically after each one finishes.',
      duration: 2000,
    });
  }, []);

  const handleLike = (postId: bigint) => {
    if (!identity) {
      toast.error('Sign in to like posts');
      return;
    }
    const key = postId.toString();
    const current =
      optimisticLikes[key] ??
      Number(feedPosts.find((p) => p.id === postId)?.likeCount ?? 0);
    setOptimisticLikes((prev) => ({ ...prev, [key]: current + 1 }));
    likePost.mutate(postId, {
      onError: () => {
        setOptimisticLikes((prev) => ({ ...prev, [key]: current }));
        toast.error('Failed to like');
      },
    });
  };

  const handleComment = (post: Post) => {
    setCommentPost(post);
    setCommentsOpen(true);
  };

  const handleShare = (post: Post) => {
    if (!identity) {
      toast.error('Sign in to share posts');
      return;
    }
    setSharePost(post);
    setShareOpen(true);
  };

  const handleProfileClick = (authorPrincipal: string) => {
    navigate({ to: '/user/$principal', params: { principal: authorPrincipal } });
  };

  const toggleAutoScroll = () => {
    setAutoScrollEnabled((prev) => {
      if (!prev) {
        toast.success('Auto-scroll activated', { duration: 1500 });
      }
      return !prev;
    });
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (feedPosts.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4 text-white">
        <Play className="w-12 h-12 opacity-30" />
        <p className="text-lg font-semibold opacity-60">No posts yet</p>
        <p className="text-sm opacity-40">Share a video or photo to get started</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Scroll-snap container */}
      <div
        ref={scrollContainerRef}
        className="w-full h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {feedPosts.map((post, i) => (
          <div
            key={post.id.toString()}
            style={{ scrollSnapAlign: 'start', height: '100dvh' }}
          >
            <ReelItem
              post={post}
              muted={muted}
              isActive={i === currentIndex}
              optimisticLike={optimisticLikes[post.id.toString()]}
              autoScrollEnabled={autoScrollEnabled}
              onLike={handleLike}
              onComment={handleComment}
              onShare={handleShare}
              onProfileClick={handleProfileClick}
              onVideoEnded={handleVideoEnded}
              onVideoClick={handleVideoClick}
            />
          </div>
        ))}
      </div>

      {/* Mute toggle — top right */}
      <button
        onClick={() => setMuted(!muted)}
        className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white"
      >
        {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

      {/* Navigation dots — right side (only when no side actions overlap) */}
      {feedPosts.length > 1 && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-50">
          {feedPosts.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToIndex(i)}
              className={`w-1.5 rounded-full transition-all ${
                i === currentIndex ? 'h-6 bg-white' : 'h-1.5 bg-white/40'
              }`}
            />
          ))}
        </div>
      )}

      {/* Auto-scroll FAB — bottom-right corner */}
      <button
        onClick={toggleAutoScroll}
        title={autoScrollEnabled ? 'Stop auto-scroll' : 'Start auto-scroll'}
        className={`
          absolute bottom-20 right-4 z-50
          w-12 h-12 rounded-full shadow-lg
          flex items-center justify-center
          transition-colors duration-200
          ${autoScrollEnabled
            ? 'bg-primary text-primary-foreground'
            : 'bg-black/50 text-white/80 border border-white/20'
          }
        `}
      >
        {autoScrollEnabled ? (
          <PauseCircle className="w-6 h-6" />
        ) : (
          <PlayCircle className="w-6 h-6" />
        )}
      </button>

      {/* Auto-scroll indicator badge */}
      {autoScrollEnabled && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-primary/90 text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm">
          Auto-scroll ON
        </div>
      )}

      {/* Comments Sheet */}
      <CommentsSheet
        post={commentPost}
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
      />

      {/* Share Modal */}
      <ShareModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        postId={sharePost?.id ?? null}
        postCaption={sharePost?.caption}
      />
    </div>
  );
}
