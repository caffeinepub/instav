import React, { useState } from 'react';
import { Heart, Volume2, VolumeX, Play, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useGetAllPosts, useLikePost } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

export default function ShortSportPage() {
  const { data: posts, isLoading } = useGetAllPosts();
  const { identity } = useInternetIdentity();
  const likePost = useLikePost();
  const [muted, setMuted] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [optimisticLikes, setOptimisticLikes] = useState<Record<string, number>>({});

  // Only show video posts
  const videoPosts = posts?.filter((p) => p.mediaType === 'video') ?? [];

  const handleLike = (postId: bigint) => {
    if (!identity) {
      toast.error('Sign in to like posts');
      return;
    }
    const key = postId.toString();
    const current = optimisticLikes[key] ?? Number(videoPosts.find(p => p.id === postId)?.likeCount ?? 0);
    setOptimisticLikes((prev) => ({ ...prev, [key]: current + 1 }));
    likePost.mutate(postId, {
      onError: () => {
        setOptimisticLikes((prev) => ({ ...prev, [key]: current }));
        toast.error('Failed to like');
      },
    });
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

  const currentPost = videoPosts[currentIndex];
  const likeCount = optimisticLikes[currentPost.id.toString()] ?? Number(currentPost.likeCount);
  const videoSrc = currentPost.media?.getDirectURL();

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Video */}
      {videoSrc && (
        <video
          key={currentPost.id.toString()}
          src={videoSrc}
          className="w-full h-full object-contain"
          autoPlay
          loop
          muted={muted}
          playsInline
        />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
        {/* Top controls */}
        <div className="flex justify-end pointer-events-auto">
          <button
            onClick={() => setMuted(!muted)}
            className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white"
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>

        {/* Bottom info */}
        <div className="flex items-end justify-between pointer-events-auto">
          <div className="flex-1 mr-4">
            <p className="font-bold text-white text-base">{currentPost.authorName}</p>
            {currentPost.caption && (
              <p className="text-white/80 text-sm mt-1 line-clamp-2">{currentPost.caption}</p>
            )}
          </div>

          {/* Side actions */}
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => handleLike(currentPost.id)}
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

      {/* Navigation dots */}
      {videoPosts.length > 1 && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
          {videoPosts.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-1.5 rounded-full transition-all ${
                i === currentIndex ? 'h-6 bg-white' : 'h-1.5 bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
