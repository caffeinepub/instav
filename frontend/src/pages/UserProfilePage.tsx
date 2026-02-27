import React, { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Grid, Heart, Eye, Loader2, UserX } from 'lucide-react';
import type { Post } from '../backend';
import { useProfileByHandle, usePostsByHandle } from '../hooks/useQueries';
import CommentsSheet from '../components/CommentsSheet';
import AvatarPlaceholder from '../components/AvatarPlaceholder';

export default function UserProfilePage() {
  // Support both /profile/$handle and /user/$principal routes
  const params = useParams({ strict: false }) as { handle?: string; principal?: string };
  const handle = params.handle ?? params.principal ?? '';
  const navigate = useNavigate();

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const { data: profile, isLoading: profileLoading } = useProfileByHandle(handle);
  const { data: posts, isLoading: postsLoading } = usePostsByHandle(handle);

  const isLoading = profileLoading || postsLoading;

  // User not found state
  if (!profileLoading && profile === null) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <button
              onClick={() => navigate({ to: '/' })}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="font-bold text-lg text-foreground">User Not Found</h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-muted-foreground">
          <UserX className="w-16 h-16 opacity-30" />
          <div className="text-center">
            <p className="font-semibold text-foreground">User not found</p>
            <p className="text-sm mt-1">No profile exists for @{handle}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate({ to: '/' })}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-bold text-lg text-foreground truncate">
            {profile ? `@${profile.handle}` : `@${handle}`}
          </h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Profile info */}
            <div className="flex flex-col items-center gap-3 mb-8">
              <AvatarPlaceholder
                name={profile?.displayName || handle}
                profilePicture={profile?.profilePicture ?? null}
                size="xl"
              />
              <div className="text-center">
                <h2 className="text-xl font-bold text-foreground">
                  {profile?.displayName || handle}
                </h2>
                <p className="text-sm text-primary font-medium mt-0.5">
                  @{profile?.handle || handle}
                </p>
                {profile?.bio && (
                  <p className="text-sm text-muted-foreground mt-2 max-w-xs leading-relaxed">
                    {profile.bio}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  {posts?.length ?? 0}{' '}
                  {posts?.length === 1 ? 'post' : 'posts'}
                </p>
              </div>
            </div>

            {/* Posts grid */}
            {posts && posts.length > 0 ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Grid className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Posts</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {posts.map((post) => {
                    const mediaUrl = post.media?.getDirectURL();
                    return (
                      <button
                        key={post.id.toString()}
                        onClick={() => {
                          setSelectedPost(post);
                          setCommentsOpen(true);
                        }}
                        className="relative aspect-square bg-muted rounded-lg overflow-hidden group"
                      >
                        {post.mediaType === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center bg-black/80">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                              <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-0.5" />
                            </div>
                          </div>
                        ) : mediaUrl ? (
                          <img
                            src={mediaUrl}
                            alt={post.caption || 'Post'}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <span className="text-xs text-muted-foreground">No image</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <div className="flex items-center gap-1 text-white text-xs">
                            <Heart className="w-3 h-3" />
                            {Number(post.likeCount)}
                          </div>
                          <div className="flex items-center gap-1 text-white text-xs">
                            <Eye className="w-3 h-3" />
                            {Number(post.viewCount)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Grid className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">No posts yet</p>
              </div>
            )}
          </>
        )}
      </div>

      <CommentsSheet
        post={selectedPost}
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
      />
    </div>
  );
}
