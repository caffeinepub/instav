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
  usePostsByHandle,
  usePrincipalByHandle,
  useGetFriendshipStatus,
  useSendFriendRequest,
  useRespondToFriendRequest,
  useCancelFriendRequest,
  useUnfriend,
} from '../hooks/useQueries';
import AvatarPlaceholder from '../components/AvatarPlaceholder';
import CommentsSheet from '../components/CommentsSheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  UserPlus,
  UserMinus,
  MessageCircle,
  Users,
  Eye,
  Film,
  ImageIcon,
  LogIn,
  UserCheck,
  UserX,
  ChevronDown,
  Clock,
  X,
} from 'lucide-react';
import type { Post } from '../backend';
import { FriendshipStatusEnum } from '../backend';
import { toast } from 'sonner';

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

// ─── Friend Action Button ─────────────────────────────────────────────────────

interface FriendActionButtonProps {
  targetPrincipal: string;
}

function FriendActionButton({ targetPrincipal }: FriendActionButtonProps) {
  const { data: friendshipStatus, isLoading: statusLoading } =
    useGetFriendshipStatus(targetPrincipal);

  const sendRequest = useSendFriendRequest();
  const cancelRequest = useCancelFriendRequest();
  const respondRequest = useRespondToFriendRequest();
  const unfriendMutation = useUnfriend();

  const isMutating =
    sendRequest.isPending ||
    cancelRequest.isPending ||
    respondRequest.isPending ||
    unfriendMutation.isPending;

  const handleSend = async () => {
    try {
      await sendRequest.mutateAsync(targetPrincipal);
      toast.success('Friend request sent!');
    } catch {
      toast.error('Failed to send friend request.');
    }
  };

  const handleCancel = async () => {
    try {
      await cancelRequest.mutateAsync(targetPrincipal);
      toast.success('Friend request cancelled.');
    } catch {
      toast.error('Failed to cancel friend request.');
    }
  };

  const handleAccept = async () => {
    try {
      await respondRequest.mutateAsync({ senderPrincipal: targetPrincipal, accept: true });
      toast.success('Friend request accepted! 🎉');
    } catch {
      toast.error('Failed to accept friend request.');
    }
  };

  const handleDecline = async () => {
    try {
      await respondRequest.mutateAsync({ senderPrincipal: targetPrincipal, accept: false });
      toast.success('Friend request declined.');
    } catch {
      toast.error('Failed to decline friend request.');
    }
  };

  const handleUnfriend = async () => {
    try {
      await unfriendMutation.mutateAsync(targetPrincipal);
      toast.success('Unfriended successfully.');
    } catch {
      toast.error('Failed to unfriend.');
    }
  };

  if (statusLoading) {
    return (
      <Button size="sm" variant="outline" disabled className="gap-1.5 rounded-full">
        <span className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
        Loading…
      </Button>
    );
  }

  const status = friendshipStatus ?? FriendshipStatusEnum.notConnected;

  if (status === FriendshipStatusEnum.friends) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            disabled={isMutating}
            className="gap-1.5 rounded-full border-green-500/50 text-green-600 hover:text-green-700"
          >
            {isMutating ? (
              <span className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
            ) : (
              <UserCheck size={14} />
            )}
            Friends
            <ChevronDown size={12} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onClick={handleUnfriend}
            className="text-destructive focus:text-destructive gap-2"
          >
            <UserX size={14} />
            Unfriend
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (status === FriendshipStatusEnum.pendingOutgoing) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={handleCancel}
        disabled={isMutating}
        className="gap-1.5 rounded-full text-muted-foreground"
      >
        {isMutating ? (
          <span className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
        ) : (
          <Clock size={14} />
        )}
        {isMutating ? 'Cancelling…' : 'Request Sent'}
        {!isMutating && <X size={12} className="ml-0.5 opacity-60" />}
      </Button>
    );
  }

  if (status === FriendshipStatusEnum.pendingIncoming) {
    return (
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="default"
          onClick={handleAccept}
          disabled={isMutating}
          className="gap-1.5 rounded-full"
        >
          {respondRequest.isPending ? (
            <span className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
          ) : (
            <UserCheck size={14} />
          )}
          Accept
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleDecline}
          disabled={isMutating}
          className="gap-1.5 rounded-full"
        >
          {respondRequest.isPending ? (
            <span className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
          ) : (
            <UserX size={14} />
          )}
          Decline
        </Button>
      </div>
    );
  }

  // notConnected
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleSend}
      disabled={isMutating}
      className="gap-1.5 rounded-full"
    >
      {isMutating ? (
        <span className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
      ) : (
        <UserPlus size={14} />
      )}
      {isMutating ? 'Sending…' : 'Add Friend'}
    </Button>
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

  // When navigating by handle, resolve the principal from posts
  const { data: resolvedPrincipalFromHandle, isLoading: resolvingPrincipal } =
    usePrincipalByHandle(handle);

  // The effective target principal: prefer URL param, fall back to resolved-from-handle
  const targetPrincipal = principalParam ?? resolvedPrincipalFromHandle ?? undefined;

  const myPrincipal = identity?.getPrincipal().toString();
  const isOwnProfile =
    !!targetPrincipal && !!myPrincipal && targetPrincipal === myPrincipal;

  // Follow data — all keyed on the resolved targetPrincipal
  const { data: followers, isLoading: loadingFollowers } = useGetFollowers(targetPrincipal);
  const { data: following, isLoading: loadingFollowing } = useGetFollowing(targetPrincipal);
  const { data: isFollowingUser } = useIsFollowing(
    isOwnProfile ? undefined : targetPrincipal
  );
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();

  // Posts — use handle-based query when on handle route, principal-based otherwise
  const { data: postsByHandle, isLoading: loadingPostsByHandle } = usePostsByHandle(handle);
  const { data: postsByPrincipal, isLoading: loadingPostsByPrincipal } =
    useGetPostsByUser(principalParam);

  const posts = handle ? postsByHandle : postsByPrincipal;
  const loadingPosts = handle ? loadingPostsByHandle : loadingPostsByPrincipal;

  const isMutating = followUser.isPending || unfollowUser.isPending;

  const handleFollow = async () => {
    if (!identity) {
      navigate({ to: '/profile' });
      return;
    }
    if (!targetPrincipal) {
      toast.error('Could not resolve user profile. Please try again.');
      return;
    }
    try {
      if (isFollowingUser) {
        await unfollowUser.mutateAsync(targetPrincipal);
        toast.success('Unfollowed successfully');
      } else {
        await followUser.mutateAsync(targetPrincipal);
        toast.success('Now following!');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  };

  const handleMessage = () => {
    if (!identity || !targetPrincipal) return;
    navigate({
      to: '/messages/$principalId',
      params: { principalId: targetPrincipal },
    });
  };

  if (isLoading || (handle && resolvingPrincipal && !resolvedPrincipalFromHandle)) {
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
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {identity ? (
                  <>
                    {/* Follow / Unfollow */}
                    <Button
                      size="sm"
                      variant={isFollowingUser ? 'outline' : 'default'}
                      onClick={handleFollow}
                      disabled={isMutating}
                      className="gap-1.5 rounded-full"
                    >
                      {isMutating ? (
                        <span className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
                      ) : isFollowingUser ? (
                        <UserMinus size={14} />
                      ) : (
                        <UserPlus size={14} />
                      )}
                      {isMutating
                        ? isFollowingUser
                          ? 'Unfollowing…'
                          : 'Following…'
                        : isFollowingUser
                          ? 'Unfollow'
                          : 'Follow'}
                    </Button>

                    {/* Friend Action Button */}
                    {targetPrincipal && (
                      <FriendActionButton targetPrincipal={targetPrincipal} />
                    )}

                    {/* Message */}
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
        onOpenChange={(val) => {
          if (!val) setSelectedPost(null);
        }}
      />
    </div>
  );
}
