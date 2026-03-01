import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useActor } from "../hooks/useActor";
import {
  useProfileByPrincipal,
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
  useUnfriend,
} from "../hooks/useQueries";
import { Principal } from "@dfinity/principal";
import AvatarPlaceholder from "../components/AvatarPlaceholder";
import PostCard from "../components/PostCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageCircle, UserPlus, UserCheck, ChevronDown, UserMinus } from "lucide-react";
import { toast } from "sonner";

// ─── Friend Action Button ─────────────────────────────────────────────────────

interface FriendActionButtonProps {
  targetPrincipal: string;
}

function FriendActionButton({ targetPrincipal }: FriendActionButtonProps) {
  const { data: status, isLoading } = useGetFriendshipStatus(targetPrincipal);
  const sendRequest = useSendFriendRequest();
  const cancelRequest = useCancelFriendRequest();
  const respond = useRespondToFriendRequest();
  const unfriend = useUnfriend();

  if (isLoading) return <Skeleton className="h-9 w-28" />;

  if (status === "friends") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <UserCheck className="w-4 h-4" />
            Friends
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => {
              unfriend.mutate(targetPrincipal, {
                onSuccess: () => toast.success("Unfriended"),
                onError: () => toast.error("Failed to unfriend"),
              });
            }}
          >
            <UserMinus className="w-4 h-4 mr-2" />
            Unfriend
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (status === "pendingOutgoing") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          cancelRequest.mutate(targetPrincipal, {
            onSuccess: () => toast.success("Request cancelled"),
            onError: () => toast.error("Failed to cancel request"),
          });
        }}
        disabled={cancelRequest.isPending}
      >
        Request Sent
      </Button>
    );
  }

  if (status === "pendingIncoming") {
    return (
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => {
            respond.mutate(
              { senderPrincipal: targetPrincipal, accept: true },
              {
                onSuccess: () => toast.success("Friend request accepted"),
                onError: () => toast.error("Failed to accept request"),
              }
            );
          }}
          disabled={respond.isPending}
        >
          Accept
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            respond.mutate(
              { senderPrincipal: targetPrincipal, accept: false },
              {
                onSuccess: () => toast.success("Request declined"),
                onError: () => toast.error("Failed to decline request"),
              }
            );
          }}
          disabled={respond.isPending}
        >
          Decline
        </Button>
      </div>
    );
  }

  // notConnected / following
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => {
        sendRequest.mutate(targetPrincipal, {
          onSuccess: () => toast.success("Follow request sent"),
          onError: () => toast.error("Failed to send request"),
        });
      }}
      disabled={sendRequest.isPending}
    >
      <UserPlus className="w-4 h-4 mr-1" />
      Add Friend
    </Button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UserProfilePage() {
  const { principalId } = useParams({ strict: false }) as {
    principalId?: string;
  };
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { actor } = useActor();

  const viewedPrincipal = principalId ?? "";
  const callerPrincipal = identity?.getPrincipal().toString() ?? "";
  const isOwnProfile = !!callerPrincipal && callerPrincipal === viewedPrincipal;

  // ── Record visit (fire-and-forget) ──────────────────────────────────────────
  useEffect(() => {
    if (!actor || !viewedPrincipal || isOwnProfile) return;
    // Fire-and-forget: do not block rendering
    actor
      .recordVisit(Principal.fromText(viewedPrincipal))
      .catch(() => {
        // silently ignore errors
      });
  }, [actor, viewedPrincipal, isOwnProfile]);

  // ── Data fetching ───────────────────────────────────────────────────────────
  const { data: profile, isLoading: profileLoading } =
    useProfileByPrincipal(viewedPrincipal);
  const { data: posts = [], isLoading: postsLoading } =
    useGetPostsByUser(viewedPrincipal);
  const { data: followers = [] } = useGetFollowers(viewedPrincipal);
  const { data: following = [] } = useGetFollowing(viewedPrincipal);
  const { data: isFollowing } = useIsFollowing(
    isOwnProfile ? null : viewedPrincipal
  );

  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();

  const [commentsPostId, setCommentsPostId] = useState<bigint | null>(null);

  if (!viewedPrincipal) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No profile found.
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="w-20 h-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-4 w-full" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Profile Header */}
      <div className="flex items-start gap-4">
        <AvatarPlaceholder
          name={profile?.displayName ?? viewedPrincipal.slice(0, 8)}
          profilePicture={profile?.profilePicture}
          size="xl"
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">
            {profile?.displayName ?? "Unknown User"}
          </h1>
          {profile?.handle && (
            <p className="text-sm text-muted-foreground">@{profile.handle}</p>
          )}
          {profile?.bio && (
            <p className="text-sm mt-1 text-foreground/80">{profile.bio}</p>
          )}

          {/* Stats */}
          <div className="flex gap-4 mt-2 text-sm">
            <span>
              <strong>{posts.length}</strong>{" "}
              <span className="text-muted-foreground">posts</span>
            </span>
            <span>
              <strong>{followers.length}</strong>{" "}
              <span className="text-muted-foreground">shadows</span>
            </span>
            <span>
              <strong>{following.length}</strong>{" "}
              <span className="text-muted-foreground">following</span>
            </span>
          </div>

          {/* Action Buttons */}
          {!isOwnProfile && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {/* Follow / Unfollow */}
              <Button
                size="sm"
                variant={isFollowing ? "outline" : "default"}
                onClick={() => {
                  if (isFollowing) {
                    unfollowUser.mutate(viewedPrincipal, {
                      onSuccess: () => toast.success("Unfollowed"),
                      onError: () => toast.error("Failed to unfollow"),
                    });
                  } else {
                    followUser.mutate(viewedPrincipal, {
                      onSuccess: () => toast.success("Following!"),
                      onError: () => toast.error("Failed to follow"),
                    });
                  }
                }}
                disabled={followUser.isPending || unfollowUser.isPending}
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </Button>

              {/* Message */}
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  navigate({ to: `/messages/${viewedPrincipal}` })
                }
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                Message
              </Button>

              {/* Friend Action */}
              <FriendActionButton targetPrincipal={viewedPrincipal} />
            </div>
          )}
        </div>
      </div>

      {/* Posts Grid */}
      <div>
        <h2 className="text-base font-semibold mb-3">Posts</h2>
        {postsLoading ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No posts yet.
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id.toString()}
                post={post}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
