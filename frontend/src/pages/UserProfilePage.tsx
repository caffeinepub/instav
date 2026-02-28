import React, { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useProfileByHandle,
  useProfileByPrincipal,
  useGetFollowers,
  useGetFollowing,
  useIsFollowing,
  useFollowUser,
  useUnfollowUser,
  useGetPostsByUser,
} from '../hooks/useQueries';
import AvatarPlaceholder from '../components/AvatarPlaceholder';
import CommentsSheet from '../components/CommentsSheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  UserPlus,
  UserMinus,
  MessageCircle,
  Users,
  Eye,
  Film,
  ImageIcon,
  LogIn,
} from 'lucide-react';
import type { Post } from '../backend';

// ─── Post Grid ────────────────────────────────────────────────────────────────

function PostGrid({
  posts,
  onCommentClick,
}: {
  posts: Post[];
  onCommentClick: (post: Post) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-0.5">
      {posts.map((post) => {
        const mediaUrl = post.media?.getDirectURL();
        const isVideo = post.mediaType === 'video';
        return (
          <button
            key={post.id.toString()}
            onClick={() => onCommentClick(post)}
            className="relative aspect-square bg-muted overflow-hidden group"
          >
            {mediaUrl ? (
              isVideo ? (
                <video
                  src={mediaUrl}
                  className="w-full h-full object-cover"
                  muted
                  preload="metadata"
                />
              ) : (
                <img
                  src={mediaUrl}
                  alt={post.caption}
                  className="w-full h-full object-cover"
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                {isVideo ? <Film size={20} /> : <ImageIcon size={20} />}
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex items-center gap-3 text-white text-sm font-semibold">
                <span className="flex items-center gap-1">
                  <Eye size={14} /> {post.viewCount.toString()}
                </span>
              </div>
            </div>
            {isVideo && (
              <div className="absolute top-1 right-1 bg-black/60 rounded p-0.5">
                <Film size={10} className="text-white" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UserProfilePage() {
  const params = useParams({ strict: false }) as {
    handle?: string;
    principal?: string;
    principalId?: string;
  };
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const handle = params.handle;
  const principalParam = params.principal ?? params.principalId;

  // Fetch profile by handle or principal
  const { data: profileByHandle, isLoading: loadingByHandle } = useProfileByHandle(handle);
  const { data: profileByPrincipal, isLoading: loadingByPrincipal } =
    useProfileByPrincipal(principalParam);

  const profile = handle ? profileByHandle : profileByPrincipal;
  const isLoading = handle ? loadingByHandle : loadingByPrincipal;

  const myPrincipal = identity?.getPrincipal().toString();
  const targetPrincipal = principalParam;
  const isOwnProfile =
    !!targetPrincipal && !!myPrincipal && targetPrincipal === myPrincipal;

  // Follow data
  const { data: followers, isLoading: loadingFollowers } = useGetFollowers(targetPrincipal);
  const { data: following, isLoading: loadingFollowing } = useGetFollowing(targetPrincipal);
  const { data: isFollowingUser } = useIsFollowing(
    isOwnProfile ? undefined : targetPrincipal
  );
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();

  // Posts for this user
  const { data: posts, isLoading: loadingPosts } = useGetPostsByUser(targetPrincipal);

  const handleFollow = () => {
    if (!identity) {
      navigate({ to: '/profile' });
      return;
    }
    if (!targetPrincipal) return;
    if (isFollowingUser) {
      unfollowUser.mutate(targetPrincipal);
    } else {
      followUser.mutate(targetPrincipal);
    }
  };

  const handleMessage = () => {
    if (!identity || !targetPrincipal) return;
    navigate({
      to: '/messages/$principalId',
      params: { principalId: targetPrincipal },
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="w-20 h-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-0.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
        <Users size={40} className="opacity-40" />
        <p className="text-lg font-semibold">User not found</p>
        <p className="text-sm">This profile doesn't exist or has been removed.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-24">
      {/* Profile Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-start gap-4">
          <AvatarPlaceholder
            name={profile.displayName}
            profilePicture={profile.profilePicture}
            size="xl"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{profile.displayName}</h1>
            <p className="text-muted-foreground text-sm">@{profile.handle}</p>
            {profile.bio && (
              <p className="text-sm mt-2 text-foreground/80 leading-relaxed">
                {profile.bio}
              </p>
            )}

            {/* Stats Row */}
            <div className="flex items-center gap-4 mt-3">
              <div className="text-center">
                <p className="font-bold text-sm">{posts?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground">Posts</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-sm">
                  {loadingFollowers ? '—' : (followers?.length ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">Shadows</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-sm">
                  {loadingFollowing ? '—' : (following?.length ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">Following</p>
              </div>
            </div>

            {/* Action Buttons — only for other users' profiles */}
            {!isOwnProfile && (
              <div className="flex items-center gap-2 mt-3">
                {identity ? (
                  <>
                    <Button
                      size="sm"
                      variant={isFollowingUser ? 'outline' : 'default'}
                      onClick={handleFollow}
                      disabled={followUser.isPending || unfollowUser.isPending}
                      className="gap-1.5 rounded-full"
                    >
                      {followUser.isPending || unfollowUser.isPending ? (
                        <span className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
                      ) : isFollowingUser ? (
                        <UserMinus size={14} />
                      ) : (
                        <UserPlus size={14} />
                      )}
                      {isFollowingUser ? 'Unfollow' : 'Follow'}
                    </Button>
                    {targetPrincipal && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleMessage}
                        className="gap-1.5 rounded-full"
                      >
                        <MessageCircle size={14} />
                        Message
                      </Button>
                    )}
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate({ to: '/profile' })}
                    className="gap-1.5 rounded-full"
                  >
                    <LogIn size={14} />
                    Sign in to follow
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Posts Grid */}
      {loadingPosts ? (
        <div className="grid grid-cols-3 gap-0.5 mt-0.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      ) : posts && posts.length > 0 ? (
        <PostGrid posts={posts} onCommentClick={setSelectedPost} />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Film size={32} className="mb-2 opacity-40" />
          <p className="text-sm">No posts yet</p>
        </div>
      )}

      {/* Comments Sheet — uses open/onOpenChange convention */}
      <CommentsSheet
        post={selectedPost}
        open={!!selectedPost}
        onOpenChange={(val) => { if (!val) setSelectedPost(null); }}
      />
    </div>
  );
}
