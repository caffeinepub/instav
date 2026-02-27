import { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Play, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNumber, timeAgo, formatTime } from '@/lib/utils';
import type { Post } from '@/lib/mockData';
import AvatarPlaceholder from './AvatarPlaceholder';

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
    <article className="bg-card border border-border/50 rounded-2xl overflow-hidden mb-4 mx-3">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-0.5 rounded-full bg-gradient-to-br from-amber-400 to-rose-500">
              <div className="p-0.5 rounded-full bg-card">
                <AvatarPlaceholder userId={post.userId} displayName={post.displayName} size="sm" />
              </div>
            </div>
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground leading-tight">{post.displayName}</p>
            <p className="text-xs text-muted-foreground">@{post.username} · {timeAgo(post.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!post.isFollowing && (
            <button
              onClick={() => onFollow(post.userId)}
              className="text-xs font-semibold text-amber-400 border border-amber-400/50 rounded-full px-3 py-1 hover:bg-amber-400/10 transition-colors"
            >
              Follow
            </button>
          )}
          <button className="text-muted-foreground hover:text-foreground transition-colors">
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
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <Play className="w-6 h-6 text-white fill-white ml-1" />
          </div>
        </div>
        {/* Duration badge */}
        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2 py-0.5 rounded-full">
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
              onClick={handleLike}
              className={cn(
                'flex items-center gap-1.5 transition-all duration-200',
                post.isLiked ? 'text-rose-500' : 'text-muted-foreground hover:text-rose-400'
              )}
            >
              <Heart className={cn('w-5 h-5 transition-transform', post.isLiked && 'fill-rose-500', likeAnim && 'scale-125')} />
              <span className="text-sm font-medium">{formatNumber(post.likes)}</span>
            </button>
            <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{formatNumber(post.comments)}</span>
            </button>
            <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <Share2 className="w-5 h-5" />
              <span className="text-sm font-medium">{formatNumber(post.shares)}</span>
            </button>
          </div>
          <button
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={cn(
              'transition-colors',
              isBookmarked ? 'text-amber-400' : 'text-muted-foreground hover:text-amber-400'
            )}
          >
            <Bookmark className={cn('w-5 h-5', isBookmarked && 'fill-amber-400')} />
          </button>
        </div>

        {/* Caption */}
        <p className="text-sm text-foreground leading-relaxed">
          <span className="font-semibold">{post.username}</span>{' '}
          {post.caption}
        </p>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {post.tags.map((tag) => (
              <span key={tag} className="text-xs text-amber-400 hover:text-amber-300 cursor-pointer">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
