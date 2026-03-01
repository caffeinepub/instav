import React, { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useProfileByPrincipal,
  useProfileByHandle,
  useGetPostsByUser,
  useIsFollowing,
  useFollowUser,
  useUnfollowUser,
  useGetFollowers,
  useGetFollowing,
  useGetFriendshipStatus,
  useSendFriendRequest,
  useRespondToFriendRequest,
  useCancelFriendRequest,
  useUnfriend,
  usePrincipalByHandle,
} from '../hooks/useQueries';
import { toast } from 'sonner';
import { Post } from '../backend';
import AvatarPlaceholder from '../components/AvatarPlaceholder';
import CommentsSheet from '../components/CommentsSheet';
import { FriendshipStatusEnum } from '../backend';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, UserMinus, MessageCircle, UserPlus, UserCheck, Clock } from 'lucide-react';

// ─── Friend Action Button ─────────────────────────────────────────────────────

interface FriendActionButtonProps {
  targetPrincipalStr: string;
}

function FriendActionButton({ targetPrincipalStr }: FriendActionButtonProps) {
  const { data: status, isLoading } = useGetFriendshipStatus(targetPrincipalStr);
  const sendRequest = useSendFriendRequest();
  const cancelRequest = useCancelFriendRequest();
  const respond = useRespondToFriendRequest();
  const unfriendMutation = useUnfriend();

  if (isLoading) {
    return (
      <div className="h-9 w-28 rounded-lg bg-surface-2 animate-pulse" />
    );
  }

  if (status === FriendshipStatusEnum.friends) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-2 text-foreground text-sm font-medium border border-border hover:bg-surface-3 transition-colors">
            <UserCheck size={15} />
            Friends
            <ChevronDown size={13} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => {
              unfriendMutation.mutate(targetPrincipalStr, {
                onSuccess: () => toast.success('Unfriended'),
                onError: () => toast.error('Failed to unfriend'),
              });
            }}
          >
            <UserMinus size={14} className="mr-2" />
            Unfriend
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (status === FriendshipStatusEnum.pendingOutgoing) {
    return (
      <button
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-2 text-muted-foreground text-sm font-medium border border-border hover:bg-surface-3 transition-colors"
        onClick={() => {
          cancelRequest.mutate(targetPrincipalStr, {
            onSuccess: () => toast.success('Request cancelled'),
            onError: () => toast.error('Failed to cancel request'),
          });
        }}
        disabled={cancelRequest.isPending}
      >
        <Clock size={15} />
        Request Sent
      </button>
    );
  }

  if (status === FriendshipStatusEnum.pendingIncoming) {
    return (
      <div className="flex gap-2">
        <button
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          onClick={() => {
            respond.mutate(
              { senderStr: targetPrincipalStr, accept: true },
              {
                onSuccess: () => toast.success('Friend request accepted'),
                onError: () => toast.error('Failed to accept request'),
              }
            );
          }}
          disabled={respond.isPending}
        >
          <UserCheck size={15} />
          Accept
        </button>
        <button
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-2 text-muted-foreground text-sm font-medium border border-border hover:bg-surface-3 transition-colors"
          onClick={() => {
            respond.mutate(
              { senderStr: targetPrincipalStr, accept: false },
              {
                onSuccess: () => toast.success('Request declined'),
                onError: () => toast.error('Failed to decline request'),
              }
            );
          }}
          disabled={respond.isPending}
        >
          Decline
        </button>
      </div>
    );
  }

  // notConnected
  return (
    <button
      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-2 text-foreground text-sm font-medium border border-border hover:bg-surface-3 transition-colors"
      onClick={() => {
        sendRequest.mutate(targetPrincipalStr, {
          onSuccess: () => toast.success('Friend request sent'),
          onError: () => toast.error('Failed to send friend request'),
        });
      }}
      disabled={sendRequest.isPending}
    >
      <UserPlus size={15} />
      Add Friend
    </button>
  );
}

// ─── Post Grid Item ───────────────────────────────────────────────────────────

interface PostGridItemProps {
  post: Post;
  onClick: () => void;
}

function PostGridItem({ post, onClick }: PostGridItemProps) {
  const [imgError, setImgError] = useState(false);
  const isVideo = post.mediaType?.startsWith('video');

  return (
    <button
      onClick={onClick}
      className="relative aspect-square bg-surface-2 rounded-lg overflow-hidden group hover:opacity-90 transition-opacity"
    >
      {post.media && !imgError ? (
        isVideo ? (
          <video
            src={post.media.getDirectURL()}
            className="w-full h-full object-cover"
            muted
            playsInline
          />
        ) : (
          <img
            src={post.media.getDirectURL()}
            alt={post.caption}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        )
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-surface-3">
          <span className="text-2xl">📷</span>
        </div>
      )}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <span className="text-white text-xs font-medium px-2 text-center line-clamp-2">
          {post.caption || 'View post'}
        </span>
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UserProfilePage() {
  const params = useParams({ strict: false }) as {
    principal?: string;
    handle?: string;
  };
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);

  // Determine if we're looking up by principal or handle
  const principalParam = params.principal;
  const handleParam = params.handle;

  // If we have a handle, resolve the principal from it
  const { data: resolvedPrincipalFromHandle } = usePrincipalByHandle(
    handleParam && !principalParam ? handleParam : undefined
  );

  // The actual principal string to use for queries
  const targetPrincipal = principalParam ?? resolvedPrincipalFromHandle ?? undefined;

  // Fetch profile — try by principal first, then by handle
  const {
    data: profileByPrincipal,
    isLoading: loadingByPrincipal,
  } = useProfileByPrincipal(targetPrincipal);

  const {
    data: profileByHandle,
    isLoading: loadingByHandle,
  } = useProfileByHandle(
    !targetPrincipal && handleParam ? handleParam : undefined
  );

  // Fetch posts for this user
  const { data: userPosts = [], isLoading: loadingPosts } = useGetPostsByUser(targetPrincipal);

  // Follow state
  const { data: isFollowing } = useIsFollowing(targetPrincipal);
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  // Follower/following counts
  const { data: followers = [] } = useGetFollowers(targetPrincipal);
  const { data: following = [] } = useGetFollowing(targetPrincipal);

  const isOwnProfile =
    identity && targetPrincipal
      ? identity.getPrincipal().toString() === targetPrincipal
      : false;

  const isLoading =
    loadingByPrincipal ||
    loadingByHandle ||
    (!targetPrincipal && !!handleParam);

  // Resolve the profile to display
  // If no saved profile but we have posts, synthesize a basic profile from post data
  const profile = profileByPrincipal ?? profileByHandle ?? null;

  // Synthesize a display name from posts if no profile exists
  const syntheticDisplayName =
    userPosts.length > 0 ? userPosts[0].authorName : null;

  const displayName =
    profile?.displayName || syntheticDisplayName || 'Unknown User';
  const handle = profile?.handle || '';
  const bio = profile?.bio || '';

  // Determine if we genuinely have no user (no profile AND no posts AND not loading)
  const hasNoUser =
    !isLoading &&
    !loadingPosts &&
    !profile &&
    userPosts.length === 0 &&
    !!targetPrincipal;

  const handleFollowToggle = () => {
    if (!targetPrincipal) return;
    if (isFollowing) {
      unfollowMutation.mutate(targetPrincipal, {
        onSuccess: () => toast.success(`Unfollowed ${displayName}`),
        onError: () => toast.error('Failed to unfollow'),
      });
    } else {
      followMutation.mutate(targetPrincipal, {
        onSuccess: () => toast.success(`Now following ${displayName}`),
        onError: () => toast.error('Failed to follow'),
      });
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading profile…</p>
        </div>
      </div>
    );
  }

  // ── No user found ──────────────────────────────────────────────────────────
  if (hasNoUser) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6">
        <div className="text-5xl">👤</div>
        <h2 className="text-xl font-semibold text-foreground">User not found</h2>
        <p className="text-muted-foreground text-sm text-center">
          This user doesn't exist or may have deleted their account.
        </p>
        <button
          onClick={() => navigate({ to: '/' })}
          className="mt-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Go Home
        </button>
      </div>
    );
  }

  // ── No identifier at all ───────────────────────────────────────────────────
  if (!targetPrincipal && !handleParam) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6">
        <div className="text-5xl">🔍</div>
        <h2 className="text-xl font-semibold text-foreground">No user specified</h2>
        <button
          onClick={() => navigate({ to: '/' })}
          className="mt-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Go Home
        </button>
      </div>
    );
  }

  // ── Profile view ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate({ to: -1 as never })}
          className="p-2 rounded-full hover:bg-surface-2 transition-colors"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <h1 className="font-semibold text-foreground truncate">
          {displayName}
        </h1>
      </div>

      {/* Profile Info */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <AvatarPlaceholder
            name={displayName}
            profilePicture={profile?.profilePicture}
            size="xl"
          />

          {/* Stats */}
          <div className="flex-1 flex flex-col gap-3">
            <div className="flex gap-6">
              <div className="text-center">
                <p className="font-bold text-foreground text-lg leading-tight">
                  {userPosts.length}
                </p>
                <p className="text-muted-foreground text-xs">Posts</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-foreground text-lg leading-tight">
                  {followers.length}
                </p>
                <p className="text-muted-foreground text-xs">Shadows</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-foreground text-lg leading-tight">
                  {following.length}
                </p>
                <p className="text-muted-foreground text-xs">Following</p>
              </div>
            </div>

            {/* Action buttons */}
            {!isOwnProfile && targetPrincipal && (
              <div className="flex gap-2 flex-wrap">
                {/* Follow button */}
                <button
                  onClick={handleFollowToggle}
                  disabled={
                    followMutation.isPending || unfollowMutation.isPending
                  }
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isFollowing
                      ? 'bg-surface-2 text-foreground border border-border hover:bg-surface-3'
                      : 'bg-primary text-primary-foreground hover:opacity-90'
                  } disabled:opacity-50`}
                >
                  {followMutation.isPending || unfollowMutation.isPending ? (
                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                  ) : null}
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </button>

                {/* Message button */}
                <button
                  onClick={() =>
                    navigate({
                      to: '/messages/$principalId',
                      params: { principalId: targetPrincipal },
                    })
                  }
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-2 text-foreground text-sm font-medium border border-border hover:bg-surface-3 transition-colors"
                >
                  <MessageCircle size={15} />
                  Message
                </button>

                {/* Friend action */}
                <FriendActionButton targetPrincipalStr={targetPrincipal} />
              </div>
            )}

            {isOwnProfile && (
              <button
                onClick={() => navigate({ to: '/profile' })}
                className="px-4 py-2 rounded-lg bg-surface-2 text-foreground text-sm font-medium border border-border hover:bg-surface-3 transition-colors w-fit"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Name & Bio */}
        <div className="mt-4">
          <p className="font-semibold text-foreground">{displayName}</p>
          {handle && (
            <p className="text-muted-foreground text-sm">@{handle}</p>
          )}
          {bio && (
            <p className="text-foreground text-sm mt-1 whitespace-pre-wrap">
              {bio}
            </p>
          )}
        </div>
      </div>

      {/* Posts Grid */}
      <div className="px-1">
        {loadingPosts ? (
          <div className="grid grid-cols-3 gap-0.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-surface-2 animate-pulse"
              />
            ))}
          </div>
        ) : userPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="text-4xl">📸</div>
            <p className="text-muted-foreground text-sm">No posts yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5">
            {userPosts.map((post) => (
              <PostGridItem
                key={post.id.toString()}
                post={post}
                onClick={() => {
                  setSelectedPost(post);
                  setCommentsOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Comments Sheet */}
      {selectedPost && (
        <CommentsSheet
          post={selectedPost}
          open={commentsOpen}
          onOpenChange={(open) => {
            setCommentsOpen(open);
            if (!open) setSelectedPost(null);
          }}
        />
      )}
    </div>
  );
}
