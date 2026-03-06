import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  Grid,
  Heart,
  MapPin,
  MessageCircle,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import React, { useState } from "react";
import AvatarPlaceholder from "../components/AvatarPlaceholder";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  FriendshipStatusEnum,
  type Post,
  useFollowUser,
  useGetFollowerCount,
  useGetFriendshipStatus,
  useGetPostsByUser,
  useGetUserProfile,
  useIsFollowing,
  useRespondToFriendRequest,
  useSendFriendRequest,
  useUnfollowUser,
  useUnfriend,
} from "../hooks/useQueries";

interface PostGridItemProps {
  post: Post;
}

function PostGridItem({ post }: PostGridItemProps) {
  const isVideo = post.mediaType?.startsWith("video");
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
          <img
            src={mediaUrl}
            alt={post.caption}
            className="w-full h-full object-cover"
          />
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
  const { principal } = useParams({ from: "/user/$principal" });
  const { identity } = useInternetIdentity();
  const myPrincipal = identity?.getPrincipal().toString();
  const navigate = useNavigate();

  const { data: profile, isLoading: profileLoading } =
    useGetUserProfile(principal);
  const { data: posts = [], isLoading: postsLoading } =
    useGetPostsByUser(principal);
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
    if (kind === "notConnected") {
      sendFriendRequest.mutate(principal);
    } else if (kind === "pendingIncoming") {
      respondToFriendRequest.mutate({ senderStr: principal, accept: true });
    } else if (kind === "friends") {
      unfriend.mutate(principal);
    }
  };

  const getFriendButtonLabel = () => {
    if (!friendshipStatus) return "Connect";
    const kind = friendshipStatus.__kind__;
    if (kind === "friends") return "Friends";
    if (kind === "pendingOutgoing") return "Requested";
    if (kind === "pendingIncoming") return "Accept";
    return "Connect";
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Skeleton className="w-full h-52" />
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
  const postCount = posts.length;

  const bannerSrc = profile.bannerImage
    ? profile.bannerImage.getDirectURL()
    : null;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Banner */}
      <div className="relative w-full h-52 overflow-hidden">
        {bannerSrc ? (
          <img
            src={bannerSrc}
            alt="Banner"
            className="w-full h-full object-cover"
          />
        ) : (
          /* Premium dark banner — layered gradients + glow overlays */
          <div className="banner-premium w-full h-full">
            {/* Animated shimmer sweep */}
            <div
              className="absolute inset-0 pointer-events-none overflow-hidden"
              aria-hidden="true"
            >
              <div
                className="absolute top-0 bottom-0 w-1/3 animate-banner-shimmer"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, oklch(1 0 0 / 0.04) 50%, transparent 100%)",
                }}
              />
            </div>
            {/* Subtle grid texture overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              aria-hidden="true"
              style={{
                backgroundImage:
                  "linear-gradient(oklch(1 0 0 / 0.03) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.03) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
          </div>
        )}
      </div>

      {/* Profile info */}
      <div className="relative px-4 pb-4">
        {/* Avatar — overlaps banner */}
        <div className="absolute -top-14 left-4">
          <div
            className="rounded-full p-0.5"
            style={{
              background: "linear-gradient(135deg, #f5c842, #e8a020, #ff6b6b)",
            }}
          >
            <div
              className="rounded-full p-0.5"
              style={{ background: "oklch(0.07 0.006 265)" }}
            >
              <AvatarPlaceholder
                name={displayName}
                profilePicture={profile.profilePhoto}
                size="2xl"
                showGradientRing={false}
              />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {!isOwnProfile && (
          <div className="flex justify-end pt-3 pb-2 gap-2">
            <button
              type="button"
              onClick={handleFollowToggle}
              disabled={followMutation.isPending || unfollowMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all disabled:opacity-60"
              style={
                isFollowing
                  ? {
                      background: "oklch(0.15 0.011 265 / 80%)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid oklch(1 0 0 / 10%)",
                      color: "oklch(0.96 0.008 60)",
                    }
                  : {
                      background: "linear-gradient(135deg, #f5c842, #e8a020)",
                      color: "oklch(0.07 0.006 265)",
                    }
              }
            >
              {isFollowing ? (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  Follow
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate({ to: "/messages" })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                background: "oklch(0.15 0.011 265 / 80%)",
                backdropFilter: "blur(12px)",
                border: "1px solid oklch(1 0 0 / 10%)",
                color: "oklch(0.96 0.008 60)",
              }}
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleFriendAction}
              disabled={
                sendFriendRequest.isPending ||
                respondToFriendRequest.isPending ||
                unfriend.isPending ||
                friendshipStatus?.__kind__ === "pendingOutgoing"
              }
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all disabled:opacity-60"
              style={{
                background: "oklch(0.15 0.011 265 / 80%)",
                backdropFilter: "blur(12px)",
                border: "1px solid oklch(1 0 0 / 10%)",
                color: "oklch(0.96 0.008 60)",
              }}
            >
              {getFriendButtonLabel()}
            </button>
          </div>
        )}

        {/* Name & handle */}
        <div className="mt-10">
          <h1 className="text-xl font-bold text-foreground">{displayName}</h1>
          {handle && (
            <p className="text-muted-foreground text-sm mt-0.5">@{handle}</p>
          )}
          {bio && (
            <p className="text-foreground/80 text-sm mt-2 leading-relaxed">
              {bio}
            </p>
          )}
          {location && (
            <div className="flex items-center gap-1 mt-1.5 text-muted-foreground text-xs">
              <MapPin className="w-3.5 h-3.5" />
              <span>{location}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-6 mt-4">
          <div className="text-center">
            <p className="text-foreground font-bold text-lg leading-tight">
              {postCount}
            </p>
            <p className="text-muted-foreground text-xs">Posts</p>
          </div>
          <div className="text-center">
            <p className="text-foreground font-bold text-lg leading-tight">
              {followerNum}
            </p>
            <p className="text-muted-foreground text-xs">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-foreground font-bold text-lg leading-tight">0</p>
            <p className="text-muted-foreground text-xs">Following</p>
          </div>
        </div>
      </div>

      {/* Posts grid */}
      <div className="px-4 mt-4">
        {postsLoading ? (
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 6 }, (_, i) => `profile-skeleton-${i}`).map(
              (k) => (
                <Skeleton key={k} className="aspect-square rounded-lg" />
              ),
            )}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <Grid className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No posts yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {posts.map((post) => (
              <PostGridItem key={post.id.toString()} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
