import React, { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useGetUserProfile,
  useGetPostsByUser,
  useGetFollowerCount,
  useIsFollowing,
  useFollowUser,
  useUnfollowUser,
  useGetFriendshipStatus,
  useSendFriendRequest,
  useRespondToFriendRequest,
  useUnfriend,
  FriendshipStatusEnum,
  Post,
} from '../hooks/useQueries';
import AvatarPlaceholder from '../components/AvatarPlaceholder';
import { Heart, Grid, Users, UserPlus, UserCheck, MapPin, MessageCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PostGridItemProps {
  post: Post;
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
  const { principal } = useParams({ from: '/user/$principal' });
  const { identity } = useInternetIdentity();
  const myPrincipal = identity?.getPrincipal().toString();
  const navigate = useNavigate();

  const { data: profile, isLoading: profileLoading } = useGetUserProfile(principal);
  const { data: posts = [], isLoading: postsLoading } = useGetPostsByUser(principal);
  const { data: followerCount } = useGetFollowerCount(principal);
  const { data: isFollowing } = useIsFollowing(principal);
  const { data: friendshipStatus } = useGetFriendshipStatus(principal);

  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  const sendFriendRequest = useSendFriendRequest();
  const respondToFriendRequest = useRespondToFriendRequest();
  const unfriend = useUnfriend();

  const isOwnProfile = myPrincipal === principal;

  const handleFollowToggle = () => {
    if (isFollowing) {
      unfollowMutation.mutate(principal);
    } else {
      followMutation.mutate(principal);
    }
  };

  const handleFriendAction = () => {
    if (!friendshipStatus) return;
    const kind = friendshipStatus.__kind__;
    if (kind === 'notConnected') {
      sendFriendRequest.mutate(principal);
    } else if (kind === 'pendingIncoming') {
      respondToFriendRequest.mutate({ senderStr: principal, accept: true });
    } else if (kind === 'friends') {
      unfriend.mutate(principal);
    }
  };

  const getFriendButtonLabel = () => {
    if (!friendshipStatus) return 'Connect';
    const kind = friendshipStatus.__kind__;
    if (kind === 'friends') return 'Friends';
    if (kind === 'pendingOutgoing') return 'Requested';
    if (kind === 'pendingIncoming') return 'Accept';
    return 'Connect';
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Skeleton className="w-full h-48" />
        <div className="px-4 pt-14 space-y-4">
          <Skeleton className="w-32 h-7 rounded-2xl" />
          <Skeleton className="w-24 h-4" />
          <div className="flex gap-3">
            <Skeleton className="w-28 h-14 rounded-2xl" />
            <Skeleton className="w-24 h-14 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">User not found</p>
        </div>
      </div>
    );
  }

  const displayName = profile.name;
  const handle = profile.handle;
  const bio = profile.bio;
  const location = profile.location;
  const followerNum = followerCount !== undefined ? Number(followerCount) : 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Banner */}
      <div className="relative w-full h-48 overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
            <div className="absolute top-2/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="relative px-4">
        {/* Avatar + Action buttons row */}
        <div className="flex items-end justify-between" style={{ marginTop: '-44px' }}>
          <div className="relative z-10">
            <div className="w-20 h-20 rounded-full p-0.5 bg-gradient-to-br from-gold-500 to-coral-500 shadow-gold-glow">
              <div className="w-full h-full rounded-full border-2 border-background overflow-hidden">
                <AvatarPlaceholder
                  name={displayName}
                  profilePicture={profile.profilePhoto}
                  size="xl"
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {!isOwnProfile && (
            <div className="flex gap-2 mb-2">
              <button
                onClick={handleFollowToggle}
                disabled={followMutation.isPending || unfollowMutation.isPending}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 ${
                  isFollowing
                    ? 'bg-surface-2 border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40'
                    : 'bg-gold-500 hover:bg-gold-400 text-background shadow-gold-glow'
                }`}
              >
                {followMutation.isPending || unfollowMutation.isPending ? (
                  <span className="w-3 h-3 border border-current/40 border-t-current rounded-full animate-spin" />
                ) : isFollowing ? (
                  <UserCheck className="w-3.5 h-3.5" />
                ) : (
                  <UserPlus className="w-3.5 h-3.5" />
                )}
                {isFollowing ? 'Shadowing' : 'Shadow'}
              </button>

              <button
                onClick={() =>
                  navigate({ to: '/messages/$principalId', params: { principalId: principal } })
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-border text-muted-foreground hover:bg-surface-2 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Message
              </button>
            </div>
          )}
        </div>

        {/* Profile info */}
        <div className="mt-3 space-y-2">
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

          {handle && (
            <p className="text-gold-400/80 text-sm ml-1">@{handle}</p>
          )}

          {location && (
            <div className="flex items-center gap-1.5 ml-1">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">{location}</span>
            </div>
          )}

          {bio && (
            <p className="text-foreground/75 text-sm leading-relaxed ml-1 max-w-sm">{bio}</p>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-3 mt-4 mb-6">
          <div
            className="flex flex-col items-center justify-center bg-gold-500/10 border border-gold-500/60 rounded-2xl px-4 py-3 min-w-[90px]"
            style={{ boxShadow: '0 0 16px rgba(234,179,8,0.3), 0 2px 6px rgba(0,0,0,0.4)' }}
          >
            <span className="text-gold-300 font-bold text-xl leading-none">
              {followerNum.toLocaleString()}
            </span>
            <span className="text-gold-500/80 text-[10px] font-semibold uppercase tracking-widest mt-1 flex items-center gap-1">
              <Users className="w-3 h-3" />
              Shadows
            </span>
          </div>

          <div className="flex flex-col items-center justify-center bg-surface-2 border border-border rounded-2xl px-4 py-3 min-w-[70px]">
            <span className="text-foreground font-bold text-xl leading-none">
              {posts.length}
            </span>
            <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-widest mt-1 flex items-center gap-1">
              <Grid className="w-3 h-3" />
              Posts
            </span>
          </div>
        </div>

        {/* Posts grid */}
        {postsLoading ? (
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Grid className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">No posts yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {posts.map((post: Post) => (
              <PostGridItem key={post.id.toString()} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
