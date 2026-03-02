import React, { useMemo } from 'react';
import { useParams } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useProfileByPrincipal,
  useProfileByHandle,
  useGetPostsByUser,
  useGetFollowers,
  useGetFollowing,
  useIsFollowing,
  useFollowUser,
  useUnfollowUser,
  useGetFriendshipStatus,
  useSendFriendRequest,
  useCancelFriendRequest,
  useRespondToFriendRequest,
} from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import AvatarPlaceholder from '../components/AvatarPlaceholder';
import { Grid3X3, AlertCircle, RefreshCw, UserPlus, UserCheck, Users } from 'lucide-react';
import { FriendshipStatusEnum } from '../backend';
import type { Post } from '../backend';

function PostGridItem({ post }: { post: Post }) {
  const [imgError, setImgError] = React.useState(false);
  const mediaUrl = post.media ? post.media.getDirectURL() : null;

  return (
    <div className="aspect-square bg-surface-2 rounded-lg overflow-hidden relative group cursor-pointer">
      {mediaUrl && !imgError ? (
        <img
          src={mediaUrl}
          alt={post.caption}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center p-2">
          <p className="text-xs text-muted-foreground text-center line-clamp-4">
            {post.caption || 'Post'}
          </p>
        </div>
      )}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
        <span className="text-white text-xs font-medium">❤️ {post.likeCount.toString()}</span>
      </div>
    </div>
  );
}

// Determine if the param looks like a principal (contains dashes and is long)
function looksLikePrincipal(param: string): boolean {
  return param.includes('-') && param.length > 20;
}

export default function UserProfilePage() {
  const { identity } = useInternetIdentity();
  const callerPrincipal = identity?.getPrincipal().toString() ?? null;

  // Try to get route params - support both 'handle' and 'principal' params
  let routeParam: string | null = null;
  try {
    const params = useParams({ strict: false }) as Record<string, string | undefined>;
    routeParam = params?.handle ?? params?.principal ?? params?.principalId ?? null;
  } catch {
    routeParam = null;
  }

  const isPrincipalParam = routeParam ? looksLikePrincipal(routeParam) : false;

  // Fetch profile by principal or handle
  const {
    data: profileByPrincipal,
    isLoading: loadingByPrincipal,
    error: errorByPrincipal,
    refetch: refetchByPrincipal,
  } = useProfileByPrincipal(isPrincipalParam ? routeParam : null);

  const {
    data: profileByHandle,
    isLoading: loadingByHandle,
    error: errorByHandle,
    refetch: refetchByHandle,
  } = useProfileByHandle(!isPrincipalParam ? routeParam : null);

  const profile = isPrincipalParam ? profileByPrincipal : profileByHandle;
  const profileLoading = isPrincipalParam ? loadingByPrincipal : loadingByHandle;
  const profileError = isPrincipalParam ? errorByPrincipal : errorByHandle;
  const refetchProfile = isPrincipalParam ? refetchByPrincipal : refetchByHandle;

  // Resolve the target principal string
  const targetPrincipalStr = useMemo(() => {
    if (isPrincipalParam && routeParam) return routeParam;
    return null;
  }, [isPrincipalParam, routeParam]);

  // Get posts by principal if we have it
  const {
    data: posts,
    isLoading: postsLoading,
    error: postsError,
    refetch: refetchPosts,
  } = useGetPostsByUser(targetPrincipalStr);

  // Infer principal from posts if we fetched by handle
  const inferredPrincipal = useMemo(() => {
    if (targetPrincipalStr) return targetPrincipalStr;
    if (posts && posts.length > 0) {
      return posts[0].authorPrincipal.toString();
    }
    return null;
  }, [targetPrincipalStr, posts]);

  const { data: followers } = useGetFollowers(inferredPrincipal);
  const { data: following } = useGetFollowing(inferredPrincipal);
  const { data: isFollowingTarget } = useIsFollowing(inferredPrincipal);
  const { data: friendshipStatus } = useGetFriendshipStatus(inferredPrincipal);

  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();
  const sendFriendRequest = useSendFriendRequest();
  const cancelFriendRequest = useCancelFriendRequest();
  const respondToFriendRequest = useRespondToFriendRequest();

  const isOwnProfile = !!(callerPrincipal && inferredPrincipal && callerPrincipal === inferredPrincipal);

  const handleFollow = async () => {
    if (!inferredPrincipal) return;
    try {
      if (isFollowingTarget) {
        await unfollowUser.mutateAsync(inferredPrincipal);
      } else {
        await followUser.mutateAsync(inferredPrincipal);
      }
    } catch (err) {
      console.error('Follow/unfollow error:', err);
    }
  };

  const handleFriendAction = async () => {
    if (!inferredPrincipal) return;
    try {
      if (friendshipStatus === FriendshipStatusEnum.notConnected || friendshipStatus == null) {
        await sendFriendRequest.mutateAsync(inferredPrincipal);
      } else if (friendshipStatus === FriendshipStatusEnum.pendingOutgoing) {
        await cancelFriendRequest.mutateAsync(inferredPrincipal);
      } else if (friendshipStatus === FriendshipStatusEnum.pendingIncoming) {
        await respondToFriendRequest.mutateAsync({ senderStr: inferredPrincipal, accept: true });
      }
    } catch (err) {
      console.error('Friend action error:', err);
    }
  };

  const followerCount = followers?.length ?? 0;
  const followingCount = following?.length ?? 0;
  const postCount = posts?.length ?? 0;

  // ── Loading state ──────────────────────────────────────────────────────────
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="max-w-lg mx-auto px-4 pt-6">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <div className="flex gap-6 mb-6">
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-10 w-16" />
          </div>
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (profileError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-24">
        <div className="text-center px-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Failed to load profile</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {(profileError as Error)?.message ?? 'An unexpected error occurred.'}
          </p>
          <Button onClick={() => refetchProfile()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // ── Not found state ────────────────────────────────────────────────────────
  if (!profile && !profileLoading && !postsLoading && !inferredPrincipal) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-24">
        <div className="text-center px-4">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h2 className="text-lg font-semibold text-foreground mb-2">User not found</h2>
          <p className="text-sm text-muted-foreground">
            This profile doesn't exist or may have been removed.
          </p>
        </div>
      </div>
    );
  }

  // Synthesize display name from posts if no profile
  const displayName =
    profile?.displayName ??
    (posts && posts.length > 0 ? posts[0].authorName : routeParam ?? 'Unknown User');
  const handle = profile?.handle ?? routeParam ?? '';
  const bio = profile?.bio ?? '';

  const followPending = followUser.isPending || unfollowUser.isPending;
  const friendPending =
    sendFriendRequest.isPending ||
    cancelFriendRequest.isPending ||
    respondToFriendRequest.isPending;

  const isFriends = friendshipStatus === FriendshipStatusEnum.friends;

  const getFriendButtonLabel = () => {
    if (friendPending) return 'Loading...';
    switch (friendshipStatus) {
      case FriendshipStatusEnum.pendingOutgoing: return 'Cancel Request';
      case FriendshipStatusEnum.pendingIncoming: return 'Accept Request';
      default: return 'Add Friend';
    }
  };

  const getFriendButtonVariant = (): 'default' | 'outline' | 'secondary' => {
    switch (friendshipStatus) {
      case FriendshipStatusEnum.pendingOutgoing: return 'outline';
      case FriendshipStatusEnum.pendingIncoming: return 'default';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Profile header */}
        <div className="flex items-start gap-4 mb-5">
          <AvatarPlaceholder
            name={displayName}
            profilePicture={profile?.profilePicture}
            size="xl"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-display font-bold text-foreground truncate">
              {displayName}
            </h1>
            {handle && (
              <p className="text-sm text-accent-gold font-medium">@{handle}</p>
            )}
            {bio && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{bio}</p>
            )}

            {/* Action buttons for other users */}
            {!isOwnProfile && identity && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {/* Follow button */}
                <Button
                  size="sm"
                  variant={isFollowingTarget ? 'secondary' : 'default'}
                  onClick={handleFollow}
                  disabled={followPending}
                  className="h-8 text-xs"
                >
                  {followPending ? (
                    'Loading...'
                  ) : isFollowingTarget ? (
                    <>
                      <UserCheck className="w-3 h-3 mr-1" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3 h-3 mr-1" />
                      Follow
                    </>
                  )}
                </Button>

                {/* Friend button — show "Friends ✓" if already friends, otherwise show action */}
                {isFriends ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled
                    className="h-8 text-xs"
                  >
                    <UserCheck className="w-3 h-3 mr-1" />
                    Friends ✓
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant={getFriendButtonVariant()}
                    onClick={handleFriendAction}
                    disabled={friendPending}
                    className="h-8 text-xs"
                  >
                    {friendPending ? (
                      'Loading...'
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3 mr-1" />
                        {getFriendButtonLabel()}
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-6 mb-6 border-b border-border pb-5">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{postCount}</p>
            <p className="text-xs text-muted-foreground">Posts</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{followerCount}</p>
            <p className="text-xs text-muted-foreground">Shadows</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{followingCount}</p>
            <p className="text-xs text-muted-foreground">Following</p>
          </div>
        </div>

        {/* Posts grid */}
        <div className="mb-4 flex items-center gap-2">
          <Grid3X3 className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Posts</span>
        </div>

        {postsLoading ? (
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : postsError ? (
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">Failed to load posts</p>
            <Button onClick={() => refetchPosts()} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="grid grid-cols-3 gap-1">
            {posts.map((post) => (
              <PostGridItem key={post.id.toString()} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Grid3X3 className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">No posts yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
