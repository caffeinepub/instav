import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { Post, UserProfileData, PostInput, Comment, Notification, Conversation, Message, FriendRequest, FriendshipStatusEnum, UserProfileSummary, CreatorRanking } from '../backend';

// Get caller's user profile
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const query = useQuery<UserProfileData | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

// Save caller's user profile
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
    },
  });
}

// Get all posts
export function useGetAllPosts() {
  const { actor, isFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ['allPosts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPosts();
    },
    enabled: !!actor && !isFetching,
  });
}

// Get posts by user
export function useGetPostsByUser(authorPrincipal: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ['postsByUser', authorPrincipal],
    queryFn: async () => {
      if (!actor || !authorPrincipal) return [];
      const { Principal } = await import('@dfinity/principal');
      return actor.getPostsByUser(Principal.fromText(authorPrincipal));
    },
    enabled: !!actor && !isFetching && !!authorPrincipal,
  });
}

// Get liked posts for the current user
export function useGetLikedPosts() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Post[]>({
    queryKey: ['likedPosts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLikedPosts();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

// Create post
export function useCreatePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postInput: PostInput) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createPost(postInput);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPosts'] });
      queryClient.invalidateQueries({ queryKey: ['postsByUser'] });
    },
    onError: (error: Error) => {
      console.error('Create post error:', error);
    },
  });
}

// Like post
export function useLikePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.likePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPosts'] });
      queryClient.invalidateQueries({ queryKey: ['postsByUser'] });
      queryClient.invalidateQueries({ queryKey: ['likedPosts'] });
    },
  });
}

// Unlike post
export function useUnlikePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.unlikePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPosts'] });
      queryClient.invalidateQueries({ queryKey: ['postsByUser'] });
      queryClient.invalidateQueries({ queryKey: ['likedPosts'] });
    },
  });
}

// Record view
export function useRecordView() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.recordView(postId);
    },
  });
}

// Get comments
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

// Add comment
export function useAddComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, authorName, text }: { postId: bigint; authorName: string; text: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addComment(postId, authorName, text);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId.toString()] });
    },
  });
}

// Get notifications
export function useGetNotifications() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getNotifications();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

// Mark notification read
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

// Get conversations
export function useGetConversations() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getConversations();
    },
    enabled: !!actor && !isFetching && !!identity,
    refetchInterval: 5000,
  });
}

// Get messages
export function useGetMessages(otherParticipant: string | null) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Message[]>({
    queryKey: ['messages', otherParticipant],
    queryFn: async () => {
      if (!actor || !otherParticipant) return [];
      const { Principal } = await import('@dfinity/principal');
      return actor.getMessages(Principal.fromText(otherParticipant));
    },
    enabled: !!actor && !isFetching && !!identity && !!otherParticipant,
    refetchInterval: 3000,
  });
}

// Send message — supports both `recipient` and legacy `recipientStr` for backward compat
export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { recipient?: string; recipientStr?: string; content: string; postId?: bigint | null }) => {
      if (!actor) throw new Error('Actor not available');
      const recipientPrincipal = args.recipient ?? args.recipientStr;
      if (!recipientPrincipal) throw new Error('Recipient is required');
      const { Principal } = await import('@dfinity/principal');
      return actor.sendMessage(Principal.fromText(recipientPrincipal), args.content, args.postId ?? null);
    },
    onSuccess: (_, variables) => {
      const recipientPrincipal = variables.recipient ?? variables.recipientStr;
      queryClient.invalidateQueries({ queryKey: ['messages', recipientPrincipal] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// Mark messages read
export function useMarkMessagesRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (otherParticipant: string) => {
      if (!actor) throw new Error('Actor not available');
      const { Principal } = await import('@dfinity/principal');
      return actor.markMessagesRead(Principal.fromText(otherParticipant));
    },
    onSuccess: (_, otherParticipant) => {
      queryClient.invalidateQueries({ queryKey: ['messages', otherParticipant] });
    },
  });
}

// Follow user
export function useFollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (target: string) => {
      if (!actor) throw new Error('Actor not available');
      const { Principal } = await import('@dfinity/principal');
      return actor.followUser(Principal.fromText(target));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['isFollowing'] });
      queryClient.invalidateQueries({ queryKey: ['topCreators'] });
    },
  });
}

// Unfollow user
export function useUnfollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (target: string) => {
      if (!actor) throw new Error('Actor not available');
      const { Principal } = await import('@dfinity/principal');
      return actor.unfollowUser(Principal.fromText(target));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['isFollowing'] });
      queryClient.invalidateQueries({ queryKey: ['topCreators'] });
    },
  });
}

// Get followers
export function useGetFollowers(userPrincipal: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['followers', userPrincipal],
    queryFn: async () => {
      if (!actor || !userPrincipal) return [];
      const { Principal } = await import('@dfinity/principal');
      const followers = await actor.getFollowers(Principal.fromText(userPrincipal));
      return followers.map(p => p.toString());
    },
    enabled: !!actor && !isFetching && !!userPrincipal,
  });
}

// Get following
export function useGetFollowing(userPrincipal: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['following', userPrincipal],
    queryFn: async () => {
      if (!actor || !userPrincipal) return [];
      const { Principal } = await import('@dfinity/principal');
      const following = await actor.getFollowing(Principal.fromText(userPrincipal));
      return following.map(p => p.toString());
    },
    enabled: !!actor && !isFetching && !!userPrincipal,
  });
}

// Get following profiles (for Shadowing section)
export function useGetFollowingProfiles(userPrincipal: string | null) {
  const { actor, isFetching } = useActor();
  const followingQuery = useGetFollowing(userPrincipal);

  return useQuery<Array<{ principal: string; profile: UserProfileData | null }>>({
    queryKey: ['followingProfiles', userPrincipal],
    queryFn: async () => {
      if (!actor || !followingQuery.data || followingQuery.data.length === 0) return [];
      const { Principal } = await import('@dfinity/principal');
      const profiles = await Promise.all(
        followingQuery.data.map(async (principalStr) => {
          try {
            const profile = await actor.getProfileByPrincipal(Principal.fromText(principalStr));
            return { principal: principalStr, profile };
          } catch {
            return { principal: principalStr, profile: null };
          }
        })
      );
      return profiles;
    },
    enabled: !!actor && !isFetching && !!userPrincipal && !!followingQuery.data && followingQuery.data.length > 0,
  });
}

// Check if following
export function useIsFollowing(target: string | null) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<boolean>({
    queryKey: ['isFollowing', target],
    queryFn: async () => {
      if (!actor || !target) return false;
      const { Principal } = await import('@dfinity/principal');
      return actor.isFollowing(Principal.fromText(target));
    },
    enabled: !!actor && !isFetching && !!identity && !!target,
  });
}

// Get top creators
export function useGetTopCreators(limit: number = 10) {
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

// Get user profile by principal
export function useGetUserProfileByPrincipal(principal: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfileData | null>({
    queryKey: ['userProfile', 'principal', principal],
    queryFn: async () => {
      if (!actor || !principal) return null;
      const { Principal } = await import('@dfinity/principal');
      return actor.getProfileByPrincipal(Principal.fromText(principal));
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

// Alias for backward compatibility
export const useProfileByPrincipal = useGetUserProfileByPrincipal;

// Get user profile by handle
export function useGetUserProfileByHandle(handle: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfileData | null>({
    queryKey: ['userProfile', 'handle', handle],
    queryFn: async () => {
      if (!actor || !handle) return null;
      return actor.getProfileByHandle(handle);
    },
    enabled: !!actor && !isFetching && !!handle,
  });
}

// Alias for backward compatibility
export const useProfileByHandle = useGetUserProfileByHandle;

// Search users
export function useSearchUsers(searchStr: string) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfileSummary[]>({
    queryKey: ['searchUsers', searchStr],
    queryFn: async () => {
      if (!actor || !searchStr.trim()) return [];
      return actor.searchUsers(searchStr);
    },
    enabled: !!actor && !isFetching && !!searchStr.trim(),
  });
}

// Friend request hooks
export function useSendFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (receiver: string) => {
      if (!actor) throw new Error('Actor not available');
      const { Principal } = await import('@dfinity/principal');
      return actor.sendFriendRequest(Principal.fromText(receiver));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendshipStatus'] });
      queryClient.invalidateQueries({ queryKey: ['outgoingFriendRequests'] });
    },
  });
}

// Supports both `sender` and legacy `senderStr` for backward compat
export function useRespondToFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { sender?: string; senderStr?: string; accept: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      const senderPrincipal = args.sender ?? args.senderStr;
      if (!senderPrincipal) throw new Error('Sender is required');
      const { Principal } = await import('@dfinity/principal');
      return actor.respondToFriendRequest(Principal.fromText(senderPrincipal), args.accept);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendshipStatus'] });
      queryClient.invalidateQueries({ queryKey: ['incomingFriendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['friendsList'] });
    },
  });
}

export function useCancelFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (receiver: string) => {
      if (!actor) throw new Error('Actor not available');
      const { Principal } = await import('@dfinity/principal');
      return actor.cancelFriendRequest(Principal.fromText(receiver));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendshipStatus'] });
      queryClient.invalidateQueries({ queryKey: ['outgoingFriendRequests'] });
    },
  });
}

export function useUnfriend() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (friendPrincipal: string) => {
      if (!actor) throw new Error('Actor not available');
      const { Principal } = await import('@dfinity/principal');
      return actor.unfriend(Principal.fromText(friendPrincipal));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendshipStatus'] });
      queryClient.invalidateQueries({ queryKey: ['friendsList'] });
    },
  });
}

export function useGetIncomingFriendRequests() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<FriendRequest[]>({
    queryKey: ['incomingFriendRequests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getIncomingFriendRequests();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useGetOutgoingFriendRequests() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<FriendRequest[]>({
    queryKey: ['outgoingFriendRequests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOutgoingFriendRequests();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useGetFriendsList() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<string[]>({
    queryKey: ['friendsList'],
    queryFn: async () => {
      if (!actor) return [];
      const friends = await actor.getFriendsList();
      return friends.map(p => p.toString());
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useGetFriendshipStatus(otherPrincipal: string | null) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<FriendshipStatusEnum | null>({
    queryKey: ['friendshipStatus', otherPrincipal],
    queryFn: async () => {
      if (!actor || !otherPrincipal) return null;
      const { Principal } = await import('@dfinity/principal');
      return actor.getFriendshipStatus(Principal.fromText(otherPrincipal));
    },
    enabled: !!actor && !isFetching && !!identity && !!otherPrincipal,
  });
}
