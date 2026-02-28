import React, { useEffect, useRef, useState } from 'react';
import { Heart, MessageCircle, Eye } from 'lucide-react';
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

export default function PostCard({ post, onCommentClick }: PostCardProps) {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const likePost = useLikePost();
  const recordView = useRecordView();
  const cardRef = useRef<HTMLDivElement>(null);
  const viewRecorded = useRef(false);
  const [optimisticLikes, setOptimisticLikes] = useState<number | null>(null);

  // Convert Principal to string for the hook
  const { data: authorProfile } = useProfileByPrincipal(post.authorPrincipal.toString());

  const likeCount =
    optimisticLikes !== null ? optimisticLikes : Number(post.likeCount);
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
    setOptimisticLikes(likeCount + 1);
    likePost.mutate(post.id, {
      onError: () => {
        setOptimisticLikes(null);
        toast.error('Failed to like post');
      },
    });
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

  const isVideo = post.mediaType === 'video';

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

  const displayName = authorProfile?.displayName || post.authorName;
  const displayHandle = authorProfile?.handle ? `@${authorProfile.handle}` : null;

  return (
    <div
      ref={cardRef}
      className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Author header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={handleAuthorClick}
          className="shrink-0 hover:opacity-80 transition-opacity"
          aria-label={`View ${displayName}'s profile`}
        >
          <AvatarPlaceholder
            name={displayName}
            profilePicture={authorProfile?.profilePicture ?? null}
            size="sm"
          />
        </button>
        <div className="flex-1 min-w-0">
          <button
            onClick={handleAuthorClick}
            className="font-semibold text-sm text-foreground hover:text-primary transition-colors truncate block"
          >
            {displayName}
          </button>
          <div className="flex items-center gap-1.5">
            {displayHandle && (
              <span className="text-xs text-primary font-medium truncate">
                {displayHandle}
              </span>
            )}
            {displayHandle && (
              <span className="text-xs text-muted-foreground">·</span>
            )}
            <p className="text-xs text-muted-foreground">{formatTime(post.timestamp)}</p>
          </div>
        </div>
        <span className="text-xs text-muted-foreground capitalize px-2 py-0.5 bg-muted rounded-full">
          {post.mediaType}
        </span>
      </div>

      {/* Media */}
      {mediaUrl && (
        <div className="relative bg-black w-full" style={{ maxHeight: '480px' }}>
          {isVideo ? (
            <video
              src={mediaUrl}
              controls
              className="w-full object-contain max-h-[480px]"
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
              className="w-full object-contain max-h-[480px]"
              loading="lazy"
            />
          )}
        </div>
      )}

      {/* Caption */}
      {post.caption && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-sm text-foreground leading-relaxed">
            <span className="font-semibold mr-1">{displayName}</span>
            {post.caption}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 py-3">
        <button
          onClick={handleLike}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-rose-500 transition-colors group"
          aria-label="Like post"
        >
          <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium">{likeCount}</span>
        </button>

        <button
          onClick={() => onCommentClick(post)}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors group"
          aria-label="Comment on post"
        >
          <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium">Comments</span>
        </button>

        <div className="flex items-center gap-1.5 text-muted-foreground ml-auto">
          <Eye className="w-4 h-4" />
          <span className="text-sm">{Number(post.viewCount)}</span>
        </div>
      </div>
    </div>
  );
}
