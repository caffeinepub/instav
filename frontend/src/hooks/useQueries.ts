import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type {
  Post,
  Comment,
  UserProfileData,
  UserProfileSummary,
  CreatorRanking,
  Conversation,
  Message,
  Notification,
  FriendRequest,
  FriendshipStatusEnum,
  PostInput,
  UserIdentifier,
} from '../backend';
import { Principal } from '@dfinity/principal';

// ─── Posts ────────────────────────────────────────────────────────────────────

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

export function useGetPostsByUser(principalStr?: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Post[]>({
    queryKey: ['posts', 'user', principalStr],
    queryFn: async () => {
      if (!actor || !principalStr) return [];
      try {
        const p = Principal.fromText(principalStr);
        return actor.getPostsByUser(p);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!principalStr,
  });
}

export function useCreatePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (post: PostInput) => {
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

// ─── Comments ─────────────────────────────────────────────────────────────────

export function useGetComments(postId?: bigint) {
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

// ─── User Profiles ────────────────────────────────────────────────────────────

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

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profileData: UserProfileData) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profileData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
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
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
}

/**
 * Fetch a user profile by principal string OR handle string.
 * Uses the backend's getUserProfile(UserIdentifier) endpoint.
 * Returns null if the user has no saved profile.
 */
export function useGetUserProfile(identifier?: string) {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfileData | null>({
    queryKey: ['userProfile', identifier],
    queryFn: async () => {
      if (!actor || !identifier) return null;
      // Determine if identifier looks like a principal (contains '-')
      // or a handle (plain text)
      let userIdentifier: UserIdentifier;
      try {
        const p = Principal.fromText(identifier);
        userIdentifier = { __kind__: 'principal', principal: p };
      } catch {
        userIdentifier = { __kind__: 'handle', handle: identifier };
      }
      return actor.getUserProfile(userIdentifier);
    },
    enabled: !!actor && !isFetching && !!identifier,
    retry: false,
  });
}

/**
 * Fetch a user profile by principal string.
 * Falls back gracefully to null if principal is invalid or user has no profile.
 */
export function useProfileByPrincipal(principalStr?: string) {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfileData | null>({
    queryKey: ['userProfile', 'principal', principalStr],
    queryFn: async () => {
      if (!actor || !principalStr) return null;
      try {
        const p = Principal.fromText(principalStr);
        return actor.getProfileByPrincipal(p);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!principalStr,
    retry: false,
  });
}

/**
 * Fetch a user profile by handle string.
 */
export function useProfileByHandle(handle?: string) {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfileData | null>({
    queryKey: ['userProfile', 'handle', handle],
    queryFn: async () => {
      if (!actor || !handle) return null;
      return actor.getProfileByHandle(handle);
    },
    enabled: !!actor && !isFetching && !!handle,
    retry: false,
  });
}

/**
 * Resolve a principal string from a handle using the backend.
 */
export function usePrincipalByHandle(handle?: string) {
  const { actor, isFetching } = useActor();
  return useQuery<string | null>({
    queryKey: ['principalByHandle', handle],
    queryFn: async () => {
      if (!actor || !handle) return null;
      const profile = await actor.getProfileByHandle(handle);
      if (!profile) return null;
      // We need the principal — search users to find it
      const results = await actor.searchUsers(handle);
      const match = results.find(
        (u) => u.handle === handle || u.displayName === handle
      );
      return match ? match.principal.toString() : null;
    },
    enabled: !!actor && !isFetching && !!handle,
    retry: false,
  });
}

// ─── Search ───────────────────────────────────────────────────────────────────

export function useSearchUsers(searchStr: string) {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfileSummary[]>({
    queryKey: ['searchUsers', searchStr],
    queryFn: async () => {
      if (!actor || !searchStr.trim()) return [];
      return actor.searchUsers(searchStr);
    },
    enabled: !!actor && !isFetching && searchStr.trim().length > 0,
  });
}

// ─── Follow / Unfollow ────────────────────────────────────────────────────────

export function useIsFollowing(targetPrincipalStr?: string) {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ['isFollowing', targetPrincipalStr],
    queryFn: async () => {
      if (!actor || !targetPrincipalStr) return false;
      try {
        const p = Principal.fromText(targetPrincipalStr);
        return actor.isFollowing(p);
      } catch {
        return false;
      }
    },
    enabled: !!actor && !isFetching && !!targetPrincipalStr,
  });
}

export function useFollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (targetPrincipalStr: string) => {
      if (!actor) throw new Error('Actor not available');
      const p = Principal.fromText(targetPrincipalStr);
      return actor.followUser(p);
    },
    onSuccess: (_data, targetPrincipalStr) => {
      queryClient.invalidateQueries({
        queryKey: ['isFollowing', targetPrincipalStr],
      });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['topCreators'] });
    },
  });
}

export function useUnfollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (targetPrincipalStr: string) => {
      if (!actor) throw new Error('Actor not available');
      const p = Principal.fromText(targetPrincipalStr);
      return actor.unfollowUser(p);
    },
    onSuccess: (_data, targetPrincipalStr) => {
      queryClient.invalidateQueries({
        queryKey: ['isFollowing', targetPrincipalStr],
      });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['topCreators'] });
    },
  });
}

export function useGetFollowers(principalStr?: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Principal[]>({
    queryKey: ['followers', principalStr],
    queryFn: async () => {
      if (!actor || !principalStr) return [];
      try {
        const p = Principal.fromText(principalStr);
        return actor.getFollowers(p);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!principalStr,
  });
}

export function useGetFollowing(principalStr?: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Principal[]>({
    queryKey: ['following', principalStr],
    queryFn: async () => {
      if (!actor || !principalStr) return [];
      try {
        const p = Principal.fromText(principalStr);
        return actor.getFollowing(p);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!principalStr,
  });
}

// ─── Top Creators ─────────────────────────────────────────────────────────────

export function useGetTopCreators(limit = 10) {
  const { actor, isFetching } = useActor();
  return useQuery<CreatorRanking[]>({
    queryKey: ['topCreators', limit],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTopCreatorsByShadows(BigInt(limit));
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function useGetNotifications() {
  const { actor, isFetching } = useActor();
  return useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getNotifications();
    },
    enabled: !!actor && !isFetching,
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

// ─── Messages ─────────────────────────────────────────────────────────────────

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

export function useGetMessages(otherPrincipalStr?: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Message[]>({
    queryKey: ['messages', otherPrincipalStr],
    queryFn: async () => {
      if (!actor || !otherPrincipalStr) return [];
      try {
        const p = Principal.fromText(otherPrincipalStr);
        return actor.getMessages(p);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!otherPrincipalStr,
    refetchInterval: 3000,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      recipientStr,
      content,
      postId,
    }: {
      recipientStr: string;
      content: string;
      postId?: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const p = Principal.fromText(recipientStr);
      return actor.sendMessage(p, content, postId ?? null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMarkMessagesRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (otherPrincipalStr: string) => {
      if (!actor) throw new Error('Actor not available');
      const p = Principal.fromText(otherPrincipalStr);
      return actor.markMessagesRead(p);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

// ─── Friend Requests ──────────────────────────────────────────────────────────

export function useGetFriendshipStatus(otherPrincipalStr?: string) {
  const { actor, isFetching } = useActor();
  return useQuery<FriendshipStatusEnum | null>({
    queryKey: ['friendshipStatus', otherPrincipalStr],
    queryFn: async () => {
      if (!actor || !otherPrincipalStr) return null;
      try {
        const p = Principal.fromText(otherPrincipalStr);
        return actor.getFriendshipStatus(p);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!otherPrincipalStr,
  });
}

export function useSendFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (receiverStr: string) => {
      if (!actor) throw new Error('Actor not available');
      const p = Principal.fromText(receiverStr);
      return actor.sendFriendRequest(p);
    },
    onSuccess: (_data, receiverStr) => {
      queryClient.invalidateQueries({
        queryKey: ['friendshipStatus', receiverStr],
      });
      queryClient.invalidateQueries({ queryKey: ['outgoingFriendRequests'] });
    },
  });
}

export function useRespondToFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      senderStr,
      accept,
    }: {
      senderStr: string;
      accept: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const p = Principal.fromText(senderStr);
      return actor.respondToFriendRequest(p, accept);
    },
    onSuccess: (_data, { senderStr }) => {
      queryClient.invalidateQueries({
        queryKey: ['friendshipStatus', senderStr],
      });
      queryClient.invalidateQueries({ queryKey: ['incomingFriendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['friendsList'] });
    },
  });
}

export function useCancelFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (receiverStr: string) => {
      if (!actor) throw new Error('Actor not available');
      const p = Principal.fromText(receiverStr);
      return actor.cancelFriendRequest(p);
    },
    onSuccess: (_data, receiverStr) => {
      queryClient.invalidateQueries({
        queryKey: ['friendshipStatus', receiverStr],
      });
      queryClient.invalidateQueries({ queryKey: ['outgoingFriendRequests'] });
    },
  });
}

export function useUnfriend() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (friendPrincipalStr: string) => {
      if (!actor) throw new Error('Actor not available');
      const p = Principal.fromText(friendPrincipalStr);
      return actor.unfriend(p);
    },
    onSuccess: (_data, friendPrincipalStr) => {
      queryClient.invalidateQueries({
        queryKey: ['friendshipStatus', friendPrincipalStr],
      });
      queryClient.invalidateQueries({ queryKey: ['friendsList'] });
    },
  });
}

export function useGetIncomingFriendRequests() {
  const { actor, isFetching } = useActor();
  return useQuery<FriendRequest[]>({
    queryKey: ['incomingFriendRequests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getIncomingFriendRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetOutgoingFriendRequests() {
  const { actor, isFetching } = useActor();
  return useQuery<FriendRequest[]>({
    queryKey: ['outgoingFriendRequests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOutgoingFriendRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetFriendsList() {
  const { actor, isFetching } = useActor();
  return useQuery<Principal[]>({
    queryKey: ['friendsList'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFriendsList();
    },
    enabled: !!actor && !isFetching,
  });
}
