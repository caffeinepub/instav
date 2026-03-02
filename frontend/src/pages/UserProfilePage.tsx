import React, { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useGetUserProfile,
  useGetUserProfileByHandle,
  useGetPostsByUser,
  useIsFollowing,
  useFollowUser,
  useUnfollowUser,
  useGetFriendshipStatus,
  useSendFriendRequest,
  useRespondToFriendRequest,
  useCancelFriendRequest,
  useUnfriend,
  useGetFollowerCount,
} from '../hooks/useQueries';
import { Principal } from '@dfinity/principal';
import AvatarPlaceholder from '../components/AvatarPlaceholder';
import { ExternalBlob } from '../backend';
import { FriendshipStatusEnum } from '../backend';
import { Heart, Grid, UserPlus, UserCheck, UserX, Clock, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface PostGridItemProps {
  post: {
    id: bigint;
    media?: ExternalBlob;
    mediaType: string;
    caption: string;
    likeCount: bigint;
    viewCount: bigint;
  };
}

function PostGridItem({ post }: PostGridItemProps) {
  const isVideo = post.mediaType?.startsWith('video');
  const mediaUrl = post.media?.getDirectURL();

  return (
    <div className="relative aspect-square bg-surface-2 rounded-lg overflow-hidden group cursor-pointer">
      {mediaUrl ? (
        isVideo ? (
          <video
            src={mediaUrl}
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <img src={mediaUrl} alt={post.caption} className="w-full h-full object-cover" />
        )
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-surface-2">
          <span className="text-muted-foreground text-xs text-center px-2 line-clamp-3">
            {post.caption}
          </span>
        </div>
      )}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
        <span className="text-white text-sm font-semibold flex items-center gap-1">
          <Heart className="w-4 h-4 fill-white" />
          {post.likeCount.toString()}
        </span>
      </div>
    </div>
  );
}

export default function UserProfilePage() {
  const { identity } = useInternetIdentity();
  const params = useParams({ strict: false }) as { principalOrHandle?: string };
  const paramValue = params.principalOrHandle ?? '';

  // Determine if param is a principal or handle
  let resolvedPrincipalId: string | undefined;
  let resolvedHandle: string | undefined;
  try {
    Principal.fromText(paramValue);
    resolvedPrincipalId = paramValue;
  } catch {
    resolvedHandle = paramValue;
  }

  const { data: profileByPrincipal, isLoading: loadingByPrincipal } = useGetUserProfile(
    resolvedPrincipalId
  );
  const { data: profileByHandle, isLoading: loadingByHandle } = useGetUserProfileByHandle(
    resolvedHandle
  );

  const profile = resolvedPrincipalId ? profileByPrincipal : profileByHandle;
  const isLoading = resolvedPrincipalId ? loadingByPrincipal : loadingByHandle;

  const [activeTab, setActiveTab] = useState<'posts'>('posts');

  const targetPrincipalStr = resolvedPrincipalId;
  const targetPrincipal = targetPrincipalStr ? Principal.fromText(targetPrincipalStr) : null;

  const myPrincipalStr = identity?.getPrincipal().toString();
  const isOwnProfile = myPrincipalStr && targetPrincipalStr && myPrincipalStr === targetPrincipalStr;

  const { data: posts, isLoading: postsLoading } = useGetPostsByUser(targetPrincipalStr);
  const { data: isFollowing } = useIsFollowing(isOwnProfile ? null : targetPrincipal);
  const { data: friendshipStatus } = useGetFriendshipStatus(
    isOwnProfile ? undefined : targetPrincipalStr
  );
  const { data: followerCount, isLoading: followerCountLoading } = useGetFollowerCount(
    targetPrincipalStr
  );

  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();
  const sendFriendRequest = useSendFriendRequest();
  const respondToFriendRequest = useRespondToFriendRequest();
  const cancelFriendRequest = useCancelFriendRequest();
  const unfriend = useUnfriend();

  const handleFollow = async () => {
    if (!targetPrincipal) return;
    try {
      if (isFollowing) {
        await unfollowUser.mutateAsync(targetPrincipal);
        toast.success('Unfollowed');
      } else {
        await followUser.mutateAsync(targetPrincipal);
        toast.success('Following!');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    }
  };

  const handleFriendAction = async () => {
    if (!targetPrincipalStr) return;
    try {
      if (friendshipStatus === FriendshipStatusEnum.notConnected) {
        await sendFriendRequest.mutateAsync(targetPrincipalStr);
        toast.success('Friend request sent!');
      } else if (friendshipStatus === FriendshipStatusEnum.pendingOutgoing) {
        await cancelFriendRequest.mutateAsync(targetPrincipalStr);
        toast.success('Friend request cancelled');
      } else if (friendshipStatus === FriendshipStatusEnum.pendingIncoming) {
        await respondToFriendRequest.mutateAsync({ sender: targetPrincipalStr, accept: true });
        toast.success('Friend request accepted!');
      } else if (friendshipStatus === FriendshipStatusEnum.friends) {
        await unfriend.mutateAsync(targetPrincipalStr);
        toast.success('Unfriended');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    }
  };

  const bannerUrl = profile?.bannerImage?.getDirectURL();
  const followerNum = followerCount !== undefined ? Number(followerCount) : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Skeleton className="w-full h-48" />
        <div className="px-4 pt-16">
          <Skeleton className="w-24 h-6 mb-2" />
          <Skeleton className="w-32 h-4 mb-4" />
          <Skeleton className="w-full h-16" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-muted-foreground">User not found</p>
        </div>
      </div>
    );
  }

  const displayName = profile.displayName ?? 'Anonymous';
  const handle = profile.handle ?? '';
  const bio = profile.bio ?? '';

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Banner */}
      <div className="relative w-full h-48 md:h-64 overflow-hidden">
        {bannerUrl ? (
          <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gold-500/30 via-surface-2 to-coral-500/20" />
        )}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="relative px-4">
        {/* Avatar + Action buttons row */}
        <div className="flex items-end justify-between -mt-12 mb-4">
          <div className="w-24 h-24 rounded-full p-0.5 bg-gradient-to-br from-gold-500 to-coral-500 shadow-gold-glow">
            <div className="w-full h-full rounded-full border-2 border-background overflow-hidden">
              <AvatarPlaceholder
                name={displayName}
                profilePicture={profile.profilePhoto}
                size="xl"
                className="w-full h-full"
              />
            </div>
          </div>

          {!isOwnProfile && targetPrincipalStr && (
            <div className="flex gap-2 mb-2">
              {/* Follow button */}
              <button
                onClick={handleFollow}
                disabled={followUser.isPending || unfollowUser.isPending}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors disabled:opacity-50 ${
                  isFollowing
                    ? 'bg-surface-2 border border-border text-foreground hover:bg-surface-3'
                    : 'bg-gold-500 hover:bg-gold-400 text-background shadow-gold-glow'
                }`}
              >
                {followUser.isPending || unfollowUser.isPending ? (
                  <span className="w-3.5 h-3.5 border-2 border-current/40 border-t-current rounded-full animate-spin" />
                ) : isFollowing ? (
                  <UserCheck className="w-3.5 h-3.5" />
                ) : (
                  <UserPlus className="w-3.5 h-3.5" />
                )}
                {isFollowing ? 'Following' : 'Follow'}
              </button>

              {/* Friend button */}
              {friendshipStatus === FriendshipStatusEnum.friends ? (
                <button
                  onClick={handleFriendAction}
                  disabled={unfriend.isPending}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold bg-surface-2 border border-border text-foreground hover:bg-surface-3 transition-colors disabled:opacity-50"
                >
                  <UserX className="w-3.5 h-3.5" />
                  Friends
                </button>
              ) : (
                <button
                  onClick={handleFriendAction}
                  disabled={
                    sendFriendRequest.isPending ||
                    cancelFriendRequest.isPending ||
                    respondToFriendRequest.isPending
                  }
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors disabled:opacity-50 ${
                    friendshipStatus === FriendshipStatusEnum.pendingOutgoing
                      ? 'bg-surface-2 border border-border text-muted-foreground hover:bg-surface-3'
                      : friendshipStatus === FriendshipStatusEnum.pendingIncoming
                      ? 'bg-coral-500/20 border border-coral-500/50 text-coral-400 hover:bg-coral-500/30'
                      : 'bg-surface-2 border border-border text-foreground hover:bg-surface-3'
                  }`}
                >
                  {sendFriendRequest.isPending ||
                  cancelFriendRequest.isPending ||
                  respondToFriendRequest.isPending ? (
                    <span className="w-3.5 h-3.5 border-2 border-current/40 border-t-current rounded-full animate-spin" />
                  ) : friendshipStatus === FriendshipStatusEnum.pendingOutgoing ? (
                    <Clock className="w-3.5 h-3.5" />
                  ) : friendshipStatus === FriendshipStatusEnum.pendingIncoming ? (
                    <UserCheck className="w-3.5 h-3.5" />
                  ) : (
                    <UserPlus className="w-3.5 h-3.5" />
                  )}
                  {friendshipStatus === FriendshipStatusEnum.pendingOutgoing
                    ? 'Requested'
                    : friendshipStatus === FriendshipStatusEnum.pendingIncoming
                    ? 'Accept'
                    : 'Add Friend'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="mb-4 space-y-2">
          {/* Styled username box with golden glow */}
          <div className="inline-block">
            <div
              className="bg-gray-900/90 border border-gold-500/40 rounded-2xl px-5 py-2.5"
              style={{ boxShadow: '0 0 18px rgba(234,179,8,0.35), 0 2px 8px rgba(0,0,0,0.5)' }}
            >
              <h1 className="text-xl font-bold text-foreground font-display tracking-tight">
                {displayName}
              </h1>
            </div>
          </div>

          {/* Handle */}
          {handle && (
            <p className="text-muted-foreground text-sm ml-1">@{handle}</p>
          )}

          {/* Golden follower count box */}
          <div className="inline-flex items-center gap-2 mt-1">
            <div
              className="flex items-center gap-2 bg-gold-500/10 border border-gold-500/60 rounded-2xl px-4 py-2"
              style={{ boxShadow: '0 0 16px rgba(234,179,8,0.3), 0 2px 6px rgba(0,0,0,0.4)' }}
            >
              <span className="text-gold-400 text-xs font-semibold uppercase tracking-wider">
                Shadows
              </span>
              {followerCountLoading ? (
                <Skeleton className="w-8 h-4" />
              ) : (
                <span className="text-gold-300 font-bold text-lg leading-none">
                  {followerNum !== null ? followerNum.toLocaleString() : '0'}
                </span>
              )}
            </div>
          </div>

          {/* Bio */}
          {bio && (
            <p className="text-foreground/80 text-sm leading-relaxed mt-2 ml-1 max-w-sm">{bio}</p>
          )}
        </div>

        {/* Stats row */}
        <div className="flex gap-6 mb-6 ml-1">
          <div className="text-center">
            <div className="text-foreground font-bold text-lg">
              {postsLoading ? <Skeleton className="w-8 h-5 mx-auto" /> : (posts?.length ?? 0)}
            </div>
            <div className="text-muted-foreground text-xs">Posts</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-4">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'posts'
                ? 'border-gold-500 text-gold-400'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Grid className="w-4 h-4" />
            Posts
          </button>
        </div>

        {/* Posts Grid */}
        {postsLoading ? (
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="grid grid-cols-3 gap-1">
            {posts.map((post) => (
              <PostGridItem key={post.id.toString()} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Grid className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No posts yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
