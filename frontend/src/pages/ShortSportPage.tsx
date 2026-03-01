import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useGetAllPosts,
  useLikePost,
  useRecordView,
  useGetCallerUserProfile,
} from '../hooks/useQueries';
import { Post } from '../backend';
import AvatarPlaceholder from '../components/AvatarPlaceholder';
import CommentsSheet from '../components/CommentsSheet';
import ShareModal from '../components/ShareModal';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Volume2,
  VolumeX,
  Play,
  RefreshCw,
} from 'lucide-react';

// ─── Video Item ───────────────────────────────────────────────────────────────

interface VideoItemProps {
  post: Post;
  isActive: boolean;
  isMuted: boolean;
  autoScroll: boolean;
  onToggleMute: () => void;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onProfileClick: () => void;
  onToggleAutoScroll: () => void;
  onVideoEnded: () => void;
}

function VideoItem({
  post,
  isActive,
  isMuted,
  autoScroll,
  onToggleMute,
  onLike,
  onComment,
  onShare,
  onProfileClick,
  onToggleAutoScroll,
  onVideoEnded,
}: VideoItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [liked, setLiked] = useState(false);
  const recordView = useRecordView();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.play().catch(() => {});
      setIsPlaying(true);
      recordView.mutate(post.id);
    } else {
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const handleVideoClick = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleLike = () => {
    setLiked((prev) => !prev);
    onLike();
  };

  const isVideo = post.mediaType?.startsWith('video');
  const mediaUrl = post.media?.getDirectURL();

  return (
    <div className="relative w-full h-full bg-black flex flex-col overflow-hidden">
      {/* ── Media area ── */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {mediaUrl ? (
          isVideo ? (
            <video
              ref={videoRef}
              src={mediaUrl}
              className="max-w-full max-h-full w-auto h-auto object-contain"
              loop={!autoScroll}
              playsInline
              muted={isMuted}
              onClick={handleVideoClick}
              onEnded={autoScroll ? onVideoEnded : undefined}
            />
          ) : (
            <img
              src={mediaUrl}
              alt={post.caption}
              className="max-w-full max-h-full w-auto h-auto object-contain"
              onClick={handleVideoClick}
            />
          )
        ) : (
          <div
            className="w-full h-full flex items-center justify-center bg-surface-2 cursor-pointer"
            onClick={handleVideoClick}
          >
            <div className="text-center px-8">
              <p className="text-foreground text-lg font-medium">{post.caption}</p>
            </div>
          </div>
        )}

        {/* Play/Pause overlay */}
        {!isPlaying && isVideo && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center">
              <Play size={28} className="text-white ml-1" />
            </div>
          </div>
        )}

        {/* Right-side action buttons (mute, like, bookmark) */}
        <div className="absolute right-3 bottom-4 flex flex-col items-center gap-4">
          {/* Mute */}
          <button
            onClick={onToggleMute}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
              {isMuted ? (
                <VolumeX size={18} className="text-white" />
              ) : (
                <Volume2 size={18} className="text-white" />
              )}
            </div>
          </button>

          {/* Like */}
          <button
            onClick={handleLike}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
              <Heart
                size={20}
                className={liked ? 'text-red-500 fill-red-500' : 'text-white'}
              />
            </div>
            <span className="text-white text-xs drop-shadow">
              {Number(post.likeCount) + (liked ? 1 : 0)}
            </span>
          </button>

          {/* Bookmark */}
          <button className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
              <Bookmark size={20} className="text-white" />
            </div>
          </button>
        </div>
      </div>

      {/* ── Bottom info bar ── */}
      <div className="flex-shrink-0 bg-black/80 px-4 pt-3 pb-4">
        {/* Author row */}
        <button
          onClick={onProfileClick}
          className="flex items-center gap-2 mb-1.5 group"
        >
          <AvatarPlaceholder name={post.authorName} size="sm" />
          <span className="text-white font-semibold text-sm group-hover:underline">
            {post.authorName}
          </span>
        </button>

        {/* Caption */}
        {post.caption && (
          <p className="text-white/85 text-sm mb-3 line-clamp-2 leading-snug">
            {post.caption}
          </p>
        )}

        {/* Action row: Comment | Auto-scroll | Share */}
        <div className="flex items-center gap-3">
          {/* Comment */}
          <button
            onClick={onComment}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <MessageCircle size={16} className="text-white" />
            <span className="text-white text-xs font-medium">Comment</span>
          </button>

          {/* Auto-scroll toggle */}
          <button
            onClick={onToggleAutoScroll}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
              autoScroll
                ? 'bg-gold/80 hover:bg-gold text-black'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title={autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
          >
            <RefreshCw size={16} className={autoScroll ? 'text-black' : 'text-white'} />
            <span className={`text-xs font-medium ${autoScroll ? 'text-black' : 'text-white'}`}>
              Auto
            </span>
          </button>

          {/* Share */}
          <button
            onClick={onShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Share2 size={16} className="text-white" />
            <span className="text-white text-xs font-medium">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ShortSportPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: posts = [], isLoading } = useGetAllPosts();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: _callerProfile } = useGetCallerUserProfile();
  const likeMutation = useLikePost();

  const search = useSearch({ from: '/shortsport' }) as { postId?: string };
  const targetPostId = search?.postId;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [autoScroll, setAutoScroll] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [sharePost, setSharePost] = useState<Post | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Sort newest first; move target post to front if specified
  const feedPosts = React.useMemo(() => {
    const sorted = [...posts].sort(
      (a, b) => Number(b.timestamp) - Number(a.timestamp)
    );
    if (!targetPostId) return sorted;
    const idx = sorted.findIndex((p) => p.id.toString() === targetPostId);
    if (idx <= 0) return sorted;
    const target = sorted.splice(idx, 1)[0];
    return [target, ...sorted];
  }, [posts, targetPostId]);

  // Scroll to top when target post is set
  useEffect(() => {
    if (targetPostId && feedPosts.length > 0) {
      setActiveIndex(0);
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
    }
  }, [targetPostId, feedPosts.length]);

  // Intersection observer to track active video
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = itemRefs.current.findIndex(
              (ref) => ref === entry.target
            );
            if (index !== -1) setActiveIndex(index);
          }
        });
      },
      { root: container, threshold: 0.6 }
    );

    itemRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [feedPosts.length]);

  // Auto-scroll to next video when current video ends
  const handleVideoEnded = useCallback(() => {
    if (!autoScroll) return;
    const nextIndex = activeIndex + 1;
    if (nextIndex < feedPosts.length) {
      const nextEl = itemRefs.current[nextIndex];
      if (nextEl) {
        nextEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [autoScroll, activeIndex, feedPosts.length]);

  const handleProfileClick = useCallback(
    (post: Post) => {
      const principalStr = post.authorPrincipal?.toString();
      if (!principalStr) return;
      navigate({
        to: '/user/$principal',
        params: { principal: principalStr },
      });
    },
    [navigate]
  );

  if (isLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (feedPosts.length === 0) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center gap-4 text-white">
        <div className="text-5xl">🎬</div>
        <p className="text-lg font-medium">No posts yet</p>
        <p className="text-white/60 text-sm">Be the first to share something!</p>
        <button
          onClick={() => navigate({ to: '/create' })}
          className="mt-2 px-6 py-2.5 rounded-full bg-white text-black font-medium text-sm hover:bg-white/90 transition-colors"
        >
          Create Post
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-screen bg-black overflow-hidden">
      {/* Scrollable feed */}
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {feedPosts.map((post, index) => (
          <div
            key={post.id.toString()}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            className="h-screen w-full snap-start snap-always flex-shrink-0"
          >
            <VideoItem
              post={post}
              isActive={index === activeIndex}
              isMuted={isMuted}
              autoScroll={autoScroll}
              onToggleMute={() => setIsMuted((m) => !m)}
              onLike={() => likeMutation.mutate(post.id)}
              onComment={() => {
                setSelectedPost(post);
                setCommentsOpen(true);
              }}
              onShare={() => {
                setSharePost(post);
                setShareOpen(true);
              }}
              onProfileClick={() => handleProfileClick(post)}
              onToggleAutoScroll={() => setAutoScroll((a) => !a)}
              onVideoEnded={handleVideoEnded}
            />
          </div>
        ))}
      </div>

      {/* Comments Sheet */}
      {selectedPost && (
        <CommentsSheet
          post={selectedPost}
          open={commentsOpen}
          onOpenChange={(open) => {
            setCommentsOpen(open);
            if (!open) setSelectedPost(null);
          }}
        />
      )}

      {/* Share Modal */}
      <ShareModal
        open={shareOpen}
        onOpenChange={(open) => {
          setShareOpen(open);
          if (!open) setSharePost(null);
        }}
        postId={sharePost?.id ?? null}
        postCaption={sharePost?.caption}
      />
    </div>
  );
}
