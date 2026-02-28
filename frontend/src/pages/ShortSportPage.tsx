import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Heart, Volume2, VolumeX, Play, Loader2, PlayCircle, PauseCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Post } from '../backend';
import { useGetAllPosts, useLikePost } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

function ReelItem({
  post,
  muted,
  isActive,
  optimisticLike,
  onLike,
}: {
  post: Post;
  muted: boolean;
  isActive: boolean;
  optimisticLike?: number;
  onLike: (id: bigint) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const likeCount = optimisticLike ?? Number(post.likeCount);
  const videoSrc = post.media?.getDirectURL();

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

  return (
    <div className="reel-item relative w-full flex-shrink-0" style={{ height: '100dvh' }}>
      {videoSrc ? (
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-full object-contain bg-black"
          loop
          muted={muted}
          playsInline
        />
      ) : (
        <div className="w-full h-full bg-black flex items-center justify-center">
          <Play className="w-12 h-12 text-white/30" />
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
        {/* Bottom info */}
        <div className="mt-auto flex items-end justify-between pointer-events-auto">
          <div className="flex-1 mr-4 pb-2">
            <p className="font-bold text-white text-base drop-shadow">{post.authorName}</p>
            {post.caption && (
              <p className="text-white/80 text-sm mt-1 line-clamp-2 drop-shadow">{post.caption}</p>
            )}
          </div>

          {/* Side actions */}
          <div className="flex flex-col items-center gap-4 pb-2">
            <button
              onClick={() => onLike(post.id)}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-white text-xs">{likeCount}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShortSportPage() {
  const { data: posts, isLoading } = useGetAllPosts();
  const { identity } = useInternetIdentity();
  const likePost = useLikePost();
  const [muted, setMuted] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [optimisticLikes, setOptimisticLikes] = useState<Record<string, number>>({});
  const [isAutoScrollActive, setIsAutoScrollActive] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Only show video posts
  const videoPosts: Post[] = posts?.filter((p) => p.mediaType === 'video') ?? [];

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
  }, [videoPosts.length]);

  // Scroll to a specific reel index
  const scrollToIndex = useCallback((index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const items = container.querySelectorAll('.reel-item');
    if (items[index]) {
      (items[index] as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Auto-scroll logic
  useEffect(() => {
    if (!isAutoScrollActive) {
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
        autoScrollTimerRef.current = null;
      }
      return;
    }

    autoScrollTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next >= videoPosts.length) {
          setIsAutoScrollActive(false);
          return prev;
        }
        scrollToIndex(next);
        return next;
      });
    }, 4000);

    return () => {
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
        autoScrollTimerRef.current = null;
      }
    };
  }, [isAutoScrollActive, videoPosts.length, scrollToIndex]);

  const handleLike = (postId: bigint) => {
    if (!identity) {
      toast.error('Sign in to like posts');
      return;
    }
    const key = postId.toString();
    const current =
      optimisticLikes[key] ??
      Number(videoPosts.find((p) => p.id === postId)?.likeCount ?? 0);
    setOptimisticLikes((prev) => ({ ...prev, [key]: current + 1 }));
    likePost.mutate(postId, {
      onError: () => {
        setOptimisticLikes((prev) => ({ ...prev, [key]: current }));
        toast.error('Failed to like');
      },
    });
  };

  const toggleAutoScroll = () => {
    setIsAutoScrollActive((prev) => !prev);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (videoPosts.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4 text-white">
        <Play className="w-12 h-12 opacity-30" />
        <p className="text-lg font-semibold opacity-60">No videos yet</p>
        <p className="text-sm opacity-40">Share a video to get started</p>
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
        {videoPosts.map((post, i) => (
          <div
            key={post.id.toString()}
            style={{ scrollSnapAlign: 'start', height: '100dvh' }}
          >
            <ReelItem
              post={post}
              muted={muted}
              isActive={i === currentIndex}
              optimisticLike={optimisticLikes[post.id.toString()]}
              onLike={handleLike}
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

      {/* Navigation dots — right side */}
      {videoPosts.length > 1 && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-50">
          {videoPosts.map((_, i) => (
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

      {/* Floating Auto-Scroll FAB — bottom-right corner */}
      <button
        onClick={toggleAutoScroll}
        title={isAutoScrollActive ? 'Stop auto-scroll' : 'Start auto-scroll'}
        className={`
          absolute bottom-20 right-4 z-50
          w-12 h-12 rounded-full shadow-lg
          flex items-center justify-center
          transition-colors duration-200
          ${isAutoScrollActive
            ? 'bg-primary text-primary-foreground'
            : 'bg-black/50 text-white/80 border border-white/20'
          }
        `}
      >
        {isAutoScrollActive ? (
          <PauseCircle className="w-6 h-6" />
        ) : (
          <PlayCircle className="w-6 h-6" />
        )}
      </button>
    </div>
  );
}
