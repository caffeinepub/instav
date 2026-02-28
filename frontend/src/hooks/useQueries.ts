import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type {
  UserProfileData,
  Post,
  Comment,
  Notification,
  Message,
  Conversation,
  UserProfileSummary,
  FriendRequest,
} from '../backend';
import { FriendshipStatusEnum } from '../backend';
import { Principal } from '@dfinity/principal';

// ─── Profile Hooks ────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfileData | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useProfileByPrincipal(principal: string | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfileData | null>({
    queryKey: ['profile', 'principal', principal],
    queryFn: async () => {
      if (!actor || !principal) return null;
      return actor.getProfileByPrincipal(Principal.fromText(principal));
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useProfileByHandle(handle: string | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfileData | null>({
    queryKey: ['profile', 'handle', handle],
    queryFn: async () => {
      if (!actor || !handle) return null;
      return actor.getProfileByHandle(handle);
    },
    enabled: !!actor && !isFetching && !!handle,
  });
}

export function useSearchHandles(prefix: string) {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['handles', 'search', prefix],
    queryFn: async () => {
      if (!actor || !prefix) return [];
      return actor.searchHandles(prefix);
    },
    enabled: !!actor && !isFetching && prefix.length > 0,
  });
}

export function useSearchUsers(searchStr: string) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfileSummary[]>({
    queryKey: ['users', 'search', searchStr],
    queryFn: async () => {
      if (!actor || !searchStr.trim()) return [];
      return actor.searchUsers(searchStr.trim());
    },
    enabled: !!actor && !isFetching && searchStr.trim().length > 0,
  });
}

export function useCreateOrUpdateProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileData: UserProfileData) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createOrUpdateProfile(profileData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

// ─── Post Hooks ───────────────────────────────────────────────────────────────

export function useGetAllPosts() {
  const { actor, isFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ['posts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPosts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetPostsByUser(principal: string | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ['posts', 'user', principal],
    queryFn: async () => {
      if (!actor || !principal) return [];
      return actor.getPostsByUser(Principal.fromText(principal));
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function usePostsByHandle(handle: string | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ['posts', 'byHandle', handle],
    queryFn: async () => {
      if (!actor || !handle) return [];
      const allPosts = await actor.getAllPosts();
      const profileData = await actor.getProfileByHandle(handle);
      if (!profileData) return [];
      return allPosts.filter(
        (p) => p.authorName === profileData.displayName || p.authorName === handle
      );
    },
    enabled: !!actor && !isFetching && !!handle,
  });
}

/**
 * Resolves a handle to a principal string by scanning all posts for a matching author.
 * Falls back to null if no posts exist for this handle yet.
 */
export function usePrincipalByHandle(handle: string | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<string | null>({
    queryKey: ['principalByHandle', handle],
    queryFn: async () => {
      if (!actor || !handle) return null;
      const [allPosts, profileData] = await Promise.all([
        actor.getAllPosts(),
        actor.getProfileByHandle(handle),
      ]);
      if (!profileData) return null;
      const matchingPost = allPosts.find(
        (p) => p.authorName === profileData.displayName || p.authorName === handle
      );
      if (matchingPost) {
        return matchingPost.authorPrincipal.toString();
      }
      return null;
    },
    enabled: !!actor && !isFetching && !!handle,
  });
}

export function useCreatePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (post: {
      authorName: string;
      media?: import('../backend').ExternalBlob;
      mediaType: string;
      caption: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createPost(post);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useLikePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.likePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useRecordView() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.recordView(postId);
    },
  });
}

// ─── Comment Hooks ────────────────────────────────────────────────────────────

export function useGetComments(postId: bigint | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<Comment[]>({
    queryKey: ['comments', postId?.toString()],
    queryFn: async () => {
      if (!actor || postId === undefined) return [];
      return actor.getComments(postId);
    },
    enabled: !!actor && !isFetching && postId !== undefined,
  });
}

export function useAddComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      authorName,
      text,
    }: {
      postId: bigint;
      authorName: string;
      text: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addComment(postId, authorName, text);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['comments', variables.postId.toString()],
      });
    },
  });
}

// ─── Messaging Hooks ──────────────────────────────────────────────────────────

export function useGetConversations() {
  const { actor, isFetching } = useActor();

  return useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getConversations();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });
}

export function useGetMessages(otherPrincipal: string | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ['messages', otherPrincipal],
    queryFn: async () => {
      if (!actor || !otherPrincipal) return [];
      return actor.getMessages(Principal.fromText(otherPrincipal));
    },
    enabled: !!actor && !isFetching && !!otherPrincipal,
    refetchInterval: 5000,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recipient,
      content,
      postId,
    }: {
      recipient: string;
      content: string;
      postId?: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendMessage(Principal.fromText(recipient), content, postId ?? null);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.recipient] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMarkMessagesRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (otherPrincipal: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.markMessagesRead(Principal.fromText(otherPrincipal));
    },
    onSuccess: (_data, otherPrincipal) => {
      queryClient.invalidateQueries({ queryKey: ['messages', otherPrincipal] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// ─── Follow / Shadows Hooks ───────────────────────────────────────────────────

export function useGetFollowers(principal: string | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['followers', principal],
    queryFn: async () => {
      if (!actor || !principal) return [];
      const result = await actor.getFollowers(Principal.fromText(principal));
      return result.map((p) => p.toString());
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useGetFollowing(principal: string | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['following', principal],
    queryFn: async () => {
      if (!actor || !principal) return [];
      const result = await actor.getFollowing(Principal.fromText(principal));
      return result.map((p) => p.toString());
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useIsFollowing(targetPrincipal: string | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isFollowing', targetPrincipal],
    queryFn: async () => {
      if (!actor || !targetPrincipal) return false;
      return actor.isFollowing(Principal.fromText(targetPrincipal));
    },
    enabled: !!actor && !isFetching && !!targetPrincipal,
  });
}

export function useFollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetPrincipal: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.followUser(Principal.fromText(targetPrincipal));
    },
    onSuccess: (_data, targetPrincipal) => {
      queryClient.invalidateQueries({ queryKey: ['followers', targetPrincipal] });
      queryClient.invalidateQueries({ queryKey: ['isFollowing', targetPrincipal] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useUnfollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetPrincipal: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.unfollowUser(Principal.fromText(targetPrincipal));
    },
    onSuccess: (_data, targetPrincipal) => {
      queryClient.invalidateQueries({ queryKey: ['followers', targetPrincipal] });
      queryClient.invalidateQueries({ queryKey: ['isFollowing', targetPrincipal] });
    },
  });
}

// ─── Notification Hooks ───────────────────────────────────────────────────────

export function useGetNotifications() {
  const { actor, isFetching } = useActor();

  return useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getNotifications();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
  });
}

export function useMarkNotificationRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.markNotificationRead(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// ─── Friend System Hooks ──────────────────────────────────────────────────────

const FRIEND_QUERY_KEYS = {
  friendshipStatus: (otherPrincipal: string) => ['friendshipStatus', otherPrincipal],
  incomingRequests: ['incomingFriendRequests'],
  outgoingRequests: ['outgoingFriendRequests'],
  friendsList: ['friendsList'],
};

/** Get the friendship status between the caller and another user. */
export function useGetFriendshipStatus(otherPrincipal: string | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<FriendshipStatusEnum>({
    queryKey: FRIEND_QUERY_KEYS.friendshipStatus(otherPrincipal ?? ''),
    queryFn: async () => {
      if (!actor || !otherPrincipal) return FriendshipStatusEnum.notConnected;
      return actor.getFriendshipStatus(Principal.fromText(otherPrincipal));
    },
    enabled: !!actor && !isFetching && !!otherPrincipal,
    staleTime: 30_000,
  });
}

/** Get all incoming (pending) friend requests for the caller. */
export function useGetIncomingFriendRequests() {
  const { actor, isFetching } = useActor();

  return useQuery<FriendRequest[]>({
    queryKey: FRIEND_QUERY_KEYS.incomingRequests,
    queryFn: async () => {
      if (!actor) return [];
      return actor.getIncomingFriendRequests();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

/** Get all outgoing (pending) friend requests sent by the caller. */
export function useGetOutgoingFriendRequests() {
  const { actor, isFetching } = useActor();

  return useQuery<FriendRequest[]>({
    queryKey: FRIEND_QUERY_KEYS.outgoingRequests,
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOutgoingFriendRequests();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

/** Get the list of accepted friends (as principal strings) for the caller. */
export function useGetFriendsList() {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: FRIEND_QUERY_KEYS.friendsList,
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getFriendsList();
      return result.map((p) => p.toString());
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

/** Invalidate all friend-related queries. */
function invalidateFriendQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  otherPrincipal?: string
) {
  if (otherPrincipal) {
    queryClient.invalidateQueries({
      queryKey: FRIEND_QUERY_KEYS.friendshipStatus(otherPrincipal),
    });
  }
  queryClient.invalidateQueries({ queryKey: FRIEND_QUERY_KEYS.incomingRequests });
  queryClient.invalidateQueries({ queryKey: FRIEND_QUERY_KEYS.outgoingRequests });
  queryClient.invalidateQueries({ queryKey: FRIEND_QUERY_KEYS.friendsList });
}

/** Send a friend request to a user. */
export function useSendFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (receiverPrincipal: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendFriendRequest(Principal.fromText(receiverPrincipal));
    },
    onSuccess: (_data, receiverPrincipal) => {
      invalidateFriendQueries(queryClient, receiverPrincipal);
    },
  });
}

/** Respond to an incoming friend request (accept or decline). */
export function useRespondToFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      senderPrincipal,
      accept,
    }: {
      senderPrincipal: string;
      accept: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.respondToFriendRequest(Principal.fromText(senderPrincipal), accept);
    },
    onSuccess: (_data, variables) => {
      invalidateFriendQueries(queryClient, variables.senderPrincipal);
    },
  });
}

/** Cancel an outgoing friend request. */
export function useCancelFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (receiverPrincipal: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.cancelFriendRequest(Principal.fromText(receiverPrincipal));
    },
    onSuccess: (_data, receiverPrincipal) => {
      invalidateFriendQueries(queryClient, receiverPrincipal);
    },
  });
}

/** Unfriend an existing friend. */
export function useUnfriend() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (friendPrincipal: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.unfriend(Principal.fromText(friendPrincipal));
    },
    onSuccess: (_data, friendPrincipal) => {
      invalidateFriendQueries(queryClient, friendPrincipal);
    },
  });
}
