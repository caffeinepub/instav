import React, { useEffect, useRef, useState } from 'react';
import { Heart, MessageCircle, Eye, Share2, Bookmark, MoreHorizontal } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import type { Post } from '../backend';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useLikePost, useRecordView, useProfileByPrincipal } from '../hooks/useQueries';
import AvatarPlaceholder from './AvatarPlaceholder';

interface PostCardProps {
  post: Post;
  onCommentClick: (post: Post) => void;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function PostCard({ post, onCommentClick }: PostCardProps) {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const likePost = useLikePost();
  const recordView = useRecordView();
  const cardRef = useRef<HTMLDivElement>(null);
  const viewRecorded = useRef(false);
  const [optimisticLikes, setOptimisticLikes] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const { data: authorProfile } = useProfileByPrincipal(post.authorPrincipal.toString());

  const likeCount = optimisticLikes !== null ? optimisticLikes : Number(post.likeCount);
  const mediaUrl = post.media ? post.media.getDirectURL() : null;

  useEffect(() => {
    if (!cardRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !viewRecorded.current) {
          viewRecorded.current = true;
          recordView.mutate(post.id);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [post.id]);

  const handleLike = () => {
    if (!identity) {
      toast.error('Please sign in to like posts');
      return;
    }
    setLiked((prev) => !prev);
    setOptimisticLikes(liked ? likeCount - 1 : likeCount + 1);
    if (!liked) {
      likePost.mutate(post.id, {
        onError: () => {
          setOptimisticLikes(null);
          setLiked(false);
          toast.error('Failed to like post');
        },
      });
    }
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (authorProfile?.handle) {
      navigate({ to: '/profile/$handle', params: { handle: authorProfile.handle } });
    } else {
      navigate({
        to: '/user/$principal',
        params: { principal: post.authorPrincipal.toString() },
      });
    }
  };

  // Use startsWith to handle 'video/mp4', 'video/webm', etc.
  const isVideo = post.mediaType?.startsWith('video');

  const formatTime = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const displayName = authorProfile?.displayName || post.authorName;
  const displayHandle = authorProfile?.handle ? `@${authorProfile.handle}` : null;

  return (
    <article
      ref={cardRef}
      className="glass-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 fade-in-up"
    >
      {/* Author header */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        <button
          onClick={handleAuthorClick}
          className="shrink-0 hover:opacity-80 transition-opacity"
          aria-label={`View ${displayName}'s profile`}
        >
          <div className="story-ring p-0.5">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-surface">
              <AvatarPlaceholder
                name={displayName}
                profilePicture={authorProfile?.profilePicture ?? null}
                size="sm"
                className="w-full h-full"
              />
            </div>
          </div>
        </button>

        <div className="flex-1 min-w-0">
          <button
            onClick={handleAuthorClick}
            className="font-semibold text-sm text-foreground hover:text-gold transition-colors truncate block leading-tight"
          >
            {displayName}
          </button>
          <div className="flex items-center gap-1.5 mt-0.5">
            {displayHandle && (
              <span className="text-xs text-gold/80 font-medium truncate">
                {displayHandle}
              </span>
            )}
            {displayHandle && (
              <span className="text-xs text-muted-foreground">·</span>
            )}
            <p className="text-xs text-muted-foreground">{formatTime(post.timestamp)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-gold bg-gold/10 px-2 py-0.5 rounded-full border border-gold/20 capitalize">
            {post.mediaType}
          </span>
          <button className="w-7 h-7 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Media */}
      {mediaUrl && (
        <div className="relative bg-surface w-full overflow-hidden" style={{ maxHeight: '520px' }}>
          {!imageLoaded && !isVideo && (
            <div className="absolute inset-0 shimmer" style={{ minHeight: '280px' }} />
          )}
          {isVideo ? (
            <video
              src={mediaUrl}
              controls
              className="w-full object-cover max-h-[520px]"
              onPlay={() => {
                if (!viewRecorded.current) {
                  viewRecorded.current = true;
                  recordView.mutate(post.id);
                }
              }}
            />
          ) : (
            <img
              src={mediaUrl}
              alt={post.caption || 'Post media'}
              className={`w-full object-cover max-h-[520px] transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
            />
          )}
        </div>
      )}

      {/* Caption */}
      {post.caption && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-sm text-foreground leading-relaxed">
            <button
              onClick={handleAuthorClick}
              className="font-bold mr-1.5 text-foreground hover:text-gold transition-colors"
            >
              {displayName}
            </button>
            <span className="text-foreground/80">{post.caption}</span>
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 px-3 py-3">
        {/* Like */}
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 group ${
            liked
              ? 'text-coral bg-coral/10'
              : 'text-muted-foreground hover:text-coral hover:bg-coral/5'
          }`}
          aria-label="Like post"
        >
          <Heart
            className={`w-5 h-5 transition-all duration-200 ${liked ? 'fill-coral scale-110' : 'group-hover:scale-110'}`}
            style={{ color: liked ? '#ff6b6b' : undefined }}
          />
          <span className="text-sm font-semibold">{formatCount(likeCount)}</span>
        </button>

        {/* Comment */}
        <button
          onClick={() => onCommentClick(post)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200 group"
          aria-label="Comment on post"
        >
          <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-semibold">Comment</span>
        </button>

        {/* Share */}
        <button
          onClick={() => toast.success('Link copied!')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-muted-foreground hover:text-gold hover:bg-gold/5 transition-all duration-200 group"
          aria-label="Share post"
        >
          <Share2 className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
        </button>

        {/* Views — right aligned */}
        <div className="flex items-center gap-1.5 ml-auto text-muted-foreground px-2">
          <Eye className="w-4 h-4" />
          <span className="text-xs font-medium">{formatCount(Number(post.viewCount))}</span>
        </div>

        {/* Bookmark */}
        <button
          onClick={() => {
            setBookmarked((prev) => !prev);
            toast.success(bookmarked ? 'Removed from saved' : 'Saved!');
          }}
          className={`p-2 rounded-xl transition-all duration-200 ${
            bookmarked ? 'text-gold' : 'text-muted-foreground hover:text-gold hover:bg-gold/5'
          }`}
          aria-label="Bookmark post"
        >
          <Bookmark
            className={`w-4.5 h-4.5 transition-all ${bookmarked ? 'fill-gold' : ''}`}
            style={{ color: bookmarked ? '#f5c842' : undefined }}
          />
        </button>
      </div>
    </article>
  );
}
