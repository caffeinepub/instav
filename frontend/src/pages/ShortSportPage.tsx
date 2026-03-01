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
import { useNavigate, useSearch } from '@tanstack/react-router';
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

  // Read the optional postId search param (set when navigating from a shared message)
  const search = useSearch({ from: '/shortsport' });
  const targetPostIdStr = (search as { postId?: string }).postId;

  const [muted, setMuted] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [optimisticLikes, setOptimisticLikes] = useState<Record<string, number>>({});
  // Auto-scroll is ON by default so newest → oldest plays automatically
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  // Track whether we've already scrolled to the target post on initial load
  const hasScrolledToTarget = useRef(false);

  // Comments sheet state
  const [commentPost, setCommentPost] = useState<Post | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);

  // Share modal state
  const [sharePost, setSharePost] = useState<Post | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sort posts newest-first (descending by timestamp) so the feed always
  // starts with the most recently created post regardless of backend order.
  // If a targetPostId is present, move that post to the front of the list.
  const feedPosts: Post[] = React.useMemo(() => {
    if (!posts) return [];
    const sorted = [...posts].sort((a, b) => {
      if (b.timestamp > a.timestamp) return 1;
      if (b.timestamp < a.timestamp) return -1;
      return 0;
    });

    if (!targetPostIdStr) return sorted;

    // Find the target post and move it to index 0
    const targetId = BigInt(targetPostIdStr);
    const targetIdx = sorted.findIndex((p) => p.id === targetId);
    if (targetIdx <= 0) return sorted; // already first or not found

    const reordered = [...sorted];
    const [targetPost] = reordered.splice(targetIdx, 1);
    reordered.unshift(targetPost);
    return reordered;
  }, [posts, targetPostIdStr]);

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

  // When a targetPostId is present and posts have loaded, scroll to index 0
  // (the target post is already moved to the front in feedPosts).
  useEffect(() => {
    if (
      targetPostIdStr &&
      feedPosts.length > 0 &&
      !hasScrolledToTarget.current
    ) {
      hasScrolledToTarget.current = true;
      // Ensure the container is rendered before scrolling
      requestAnimationFrame(() => {
        scrollToIndex(0);
        setCurrentIndex(0);
      });
    }
  }, [targetPostIdStr, feedPosts.length, scrollToIndex]);

  // When a video ends and auto-scroll is enabled, advance to next.
  // After the last (oldest) short finishes, loop back to the newest (index 0).
  const handleVideoEnded = useCallback(() => {
    if (!autoScrollEnabled) return;
    const next = currentIndex + 1;
    if (next >= feedPosts.length) {
      // All shorts played — loop back to the newest post
      scrollToIndex(0);
      toast('Starting over', { description: 'Playing from the newest short again.' });
      return;
    }
    scrollToIndex(next);
  }, [autoScrollEnabled, currentIndex, feedPosts.length, scrollToIndex]);

  // Clicking the video toggles auto-scroll mode
  const handleVideoClick = useCallback(() => {
    setAutoScrollEnabled((prev) => {
      const next = !prev;
      if (next) {
        toast.success('Auto-play activated', {
          description: 'Videos will advance automatically.',
          duration: 1800,
        });
      }
      return next;
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
      const next = !prev;
      if (next) {
        toast.success('Auto-play activated', { duration: 1500 });
      } else {
        toast('Auto-play paused', { duration: 1500 });
      }
      return next;
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

      {/* Navigation dots — left side */}
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
        title={autoScrollEnabled ? 'Pause auto-play' : 'Start auto-play'}
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
          Auto-play ON · Newest first
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
