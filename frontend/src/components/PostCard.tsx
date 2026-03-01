import { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Eye } from 'lucide-react';
import { Post } from '../backend';
import { useLikePost, useRecordView } from '../hooks/useQueries';
import AvatarPlaceholder from './AvatarPlaceholder';
import CommentsSheet from './CommentsSheet';
import ShareModal from './ShareModal';
import { useNavigate } from '@tanstack/react-router';

interface PostCardProps {
  post: Post;
}

function formatCount(n: bigint | number): string {
  const num = typeof n === 'bigint' ? Number(n) : n;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
}

export default function PostCard({ post }: PostCardProps) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [viewRecorded, setViewRecorded] = useState(false);

  const likePost = useLikePost();
  const recordView = useRecordView();

  const handleLike = () => {
    if (!liked) {
      setLiked(true);
      likePost.mutate(post.id);
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    if (!viewRecorded) {
      setViewRecorded(true);
      recordView.mutate(post.id);
    }
  };

  const isVideo = post.mediaType?.startsWith('video') || post.mediaType === 'shortsport';
  const mediaUrl = post.media?.getDirectURL();

  const displayLikes = liked
    ? Number(post.likeCount) + 1
    : Number(post.likeCount);

  return (
    <>
      <article className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-3 py-2.5">
          <button
            onClick={() => navigate({ to: '/profile/$handle', params: { handle: post.authorPrincipal.toString() } })}
            className="flex-shrink-0"
          >
            <AvatarPlaceholder
              name={post.authorName}
              size="sm"
            />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{post.authorName}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(Number(post.timestamp) / 1_000_000).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Media */}
        {mediaUrl && (
          <div className="relative bg-muted aspect-square w-full overflow-hidden">
            {!imageLoaded && (
              <div className="absolute inset-0 bg-muted animate-pulse" />
            )}
            {isVideo ? (
              <video
                src={mediaUrl}
                className="w-full h-full object-cover"
                controls
                playsInline
                onLoadedData={handleImageLoad}
              />
            ) : (
              <img
                src={mediaUrl}
                alt={post.caption}
                className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={handleImageLoad}
              />
            )}
          </div>
        )}

        {/* Actions */}
        <div className="px-3 pt-2.5 pb-1">
          <div className="flex items-center gap-1 mb-2">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors text-sm ${
                liked
                  ? 'text-red-500'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Heart
                size={18}
                className={liked ? 'fill-red-500' : ''}
                strokeWidth={liked ? 0 : 1.8}
              />
              <span className="font-medium">{formatCount(displayLikes)}</span>
            </button>

            <button
              onClick={() => setShowComments(true)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <MessageCircle size={18} strokeWidth={1.8} />
            </button>

            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <Share2 size={18} strokeWidth={1.8} />
            </button>

            <div className="flex items-center gap-1.5 px-2 py-1.5 text-muted-foreground text-sm ml-auto">
              <Eye size={16} strokeWidth={1.8} />
              <span>{formatCount(post.viewCount)}</span>
            </div>

            <button
              onClick={() => setBookmarked(v => !v)}
              className={`p-1.5 rounded-lg transition-colors ${
                bookmarked ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Bookmark
                size={18}
                strokeWidth={1.8}
                className={bookmarked ? 'fill-primary' : ''}
              />
            </button>
          </div>

          {/* Caption */}
          {post.caption && (
            <p className="text-sm text-foreground pb-2.5 leading-snug">
              <span className="font-semibold mr-1">{post.authorName}</span>
              {post.caption}
            </p>
          )}
        </div>
      </article>

      <CommentsSheet
        post={post}
        open={showComments}
        onOpenChange={setShowComments}
      />

      <ShareModal
        postId={post.id}
        open={showShare}
        onOpenChange={setShowShare}
      />
    </>
  );
}
