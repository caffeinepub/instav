import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { ExternalBlob, UserProfileData, PostInput } from '../backend';
import { Principal } from '@dfinity/principal';

// ─── User Profile ────────────────────────────────────────────────────────────

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
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileData: UserProfileData) => {
      if (!actor || isFetching) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profileData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
}

export function useGetUserProfile(principalId?: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfileData | null>({
    queryKey: ['userProfile', principalId],
    queryFn: async () => {
      if (!actor || !principalId) return null;
      return actor.getProfileByPrincipal(Principal.fromText(principalId));
    },
    enabled: !!actor && !isFetching && !!principalId,
  });
}

// Aliases for backward compatibility
export const useProfileByPrincipal = useGetUserProfile;
export const useGetUserProfileByPrincipal = useGetUserProfile;

export function useGetUserProfileByHandle(handle?: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfileData | null>({
    queryKey: ['userProfileByHandle', handle],
    queryFn: async () => {
      if (!actor || !handle) return null;
      return actor.getProfileByHandle(handle);
    },
    enabled: !!actor && !isFetching && !!handle,
  });
}

// Alias for backward compatibility
export const useProfileByHandle = useGetUserProfileByHandle;

// ─── Banner Image ─────────────────────────────────────────────────────────────

export function useGetBannerImage() {
  const { actor, isFetching } = useActor();

  return useQuery<ExternalBlob | null>({
    queryKey: ['bannerImage'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getBannerImage();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetBannerImage() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (banner: ExternalBlob) => {
      if (!actor || isFetching) throw new Error('Actor not available');
      return actor.setBannerImage(banner);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bannerImage'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ─── Profile Photo ────────────────────────────────────────────────────────────

export function useUpdateProfilePhoto() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photo: ExternalBlob) => {
      if (!actor || isFetching) throw new Error('Actor not available');
      return actor.updateProfilePhoto(photo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export function useGetAllPosts() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['allPosts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPosts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetPostsByUser(authorPrincipal?: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['postsByUser', authorPrincipal],
    queryFn: async () => {
      if (!actor || !authorPrincipal) return [];
      return actor.getPostsByUser(Principal.fromText(authorPrincipal));
    },
    enabled: !!actor && !isFetching && !!authorPrincipal,
  });
}

export function useCreatePost() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postInput: PostInput) => {
      if (!actor || isFetching) throw new Error('Actor not available');
      return actor.createPost(postInput);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPosts'] });
      queryClient.invalidateQueries({ queryKey: ['postsByUser'] });
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
      queryClient.invalidateQueries({ queryKey: ['allPosts'] });
      queryClient.invalidateQueries({ queryKey: ['likedPosts'] });
    },
  });
}

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
      queryClient.invalidateQueries({ queryKey: ['likedPosts'] });
    },
  });
}

export function useGetLikedPosts() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['likedPosts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLikedPosts();
    },
    enabled: !!actor && !isFetching,
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

  return useQuery({
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['comments', variables.postId.toString()],
      });
    },
  });
}

// ─── Follow / Unfollow ────────────────────────────────────────────────────────

export function useFollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (target: string | Principal) => {
      if (!actor) throw new Error('Actor not available');
      const principal = typeof target === 'string' ? Principal.fromText(target) : target;
      return actor.followUser(principal);
    },
    onSuccess: (_, target) => {
      const targetStr = typeof target === 'string' ? target : target.toString();
      queryClient.invalidateQueries({ queryKey: ['isFollowing', targetStr] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['followerCount'] });
      queryClient.invalidateQueries({ queryKey: ['myFollowerCount'] });
      queryClient.invalidateQueries({ queryKey: ['topCreators'] });
      queryClient.invalidateQueries({ queryKey: ['followingProfiles'] });
    },
  });
}

export function useUnfollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (target: string | Principal) => {
      if (!actor) throw new Error('Actor not available');
      const principal = typeof target === 'string' ? Principal.fromText(target) : target;
      return actor.unfollowUser(principal);
    },
    onSuccess: (_, target) => {
      const targetStr = typeof target === 'string' ? target : target.toString();
      queryClient.invalidateQueries({ queryKey: ['isFollowing', targetStr] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['followerCount'] });
      queryClient.invalidateQueries({ queryKey: ['myFollowerCount'] });
      queryClient.invalidateQueries({ queryKey: ['topCreators'] });
      queryClient.invalidateQueries({ queryKey: ['followingProfiles'] });
    },
  });
}

export function useIsFollowing(target: string | Principal | null) {
  const { actor, isFetching } = useActor();

  const targetStr = target
    ? typeof target === 'string'
      ? target
      : target.toString()
    : null;

  return useQuery<boolean>({
    queryKey: ['isFollowing', targetStr],
    queryFn: async () => {
      if (!actor || !targetStr) return false;
      return actor.isFollowing(Principal.fromText(targetStr));
    },
    enabled: !!actor && !isFetching && !!targetStr,
  });
}

export function useGetFollowers(principalId?: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Principal[]>({
    queryKey: ['followers', principalId],
    queryFn: async () => {
      if (!actor || !principalId) return [];
      return actor.getFollowers(Principal.fromText(principalId));
    },
    enabled: !!actor && !isFetching && !!principalId,
  });
}

export function useGetFollowing(principalId?: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Principal[]>({
    queryKey: ['following', principalId],
    queryFn: async () => {
      if (!actor || !principalId) return [];
      return actor.getFollowing(Principal.fromText(principalId));
    },
    enabled: !!actor && !isFetching && !!principalId,
  });
}

export function useGetFollowingProfiles(principalId?: string | null) {
  const { actor, isFetching } = useActor();
  const { data: followingList } = useGetFollowing(principalId);

  return useQuery<Array<{ principal: string; profile: UserProfileData | null }>>({
    queryKey: ['followingProfiles', principalId],
    queryFn: async () => {
      if (!actor || !followingList || followingList.length === 0) return [];
      const profiles = await Promise.all(
        followingList.map(async (p) => {
          const principalStr = p.toString();
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
    enabled: !!actor && !isFetching && !!principalId && !!followingList && followingList.length > 0,
  });
}

// ─── Follower Count ───────────────────────────────────────────────────────────

export function useGetMyFollowerCount() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['myFollowerCount'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getMyFollowerCount();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetFollowerCount(principalId?: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['followerCount', principalId],
    queryFn: async () => {
      if (!actor || !principalId) return BigInt(0);
      return actor.getFollowerCount(Principal.fromText(principalId));
    },
    enabled: !!actor && !isFetching && !!principalId,
  });
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function useGetNotifications() {
  const { actor, isFetching } = useActor();

  return useQuery({
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

  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getConversations();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });
}

export function useGetMessages(otherPrincipal?: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['messages', otherPrincipal],
    queryFn: async () => {
      if (!actor || !otherPrincipal) return [];
      return actor.getMessages(Principal.fromText(otherPrincipal));
    },
    enabled: !!actor && !isFetching && !!otherPrincipal,
    refetchInterval: 3000,
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
      postId?: bigint | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendMessage(Principal.fromText(recipient), content, postId ?? null);
    },
    onSuccess: (_, variables) => {
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
    onSuccess: (_, otherPrincipal) => {
      queryClient.invalidateQueries({ queryKey: ['messages', otherPrincipal] });
    },
  });
}

// ─── Friends ──────────────────────────────────────────────────────────────────

export function useGetFriendsList() {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['friendsList'],
    queryFn: async () => {
      if (!actor) return [];
      const list = await actor.getFriendsList();
      return list.map((p) => p.toString());
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetFriendshipStatus(otherPrincipal?: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['friendshipStatus', otherPrincipal],
    queryFn: async () => {
      if (!actor || !otherPrincipal) return null;
      return actor.getFriendshipStatus(Principal.fromText(otherPrincipal));
    },
    enabled: !!actor && !isFetching && !!otherPrincipal,
  });
}

export function useSendFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (receiver: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendFriendRequest(Principal.fromText(receiver));
    },
    onSuccess: (_, receiver) => {
      queryClient.invalidateQueries({ queryKey: ['friendshipStatus', receiver] });
      queryClient.invalidateQueries({ queryKey: ['outgoingFriendRequests'] });
    },
  });
}

export function useRespondToFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sender,
      senderStr,
      accept,
    }: {
      sender?: string;
      senderStr?: string;
      accept: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const senderPrincipal = sender ?? senderStr;
      if (!senderPrincipal) throw new Error('Sender is required');
      return actor.respondToFriendRequest(Principal.fromText(senderPrincipal), accept);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomingFriendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['friendsList'] });
      queryClient.invalidateQueries({ queryKey: ['friendshipStatus'] });
    },
  });
}

export function useCancelFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (receiver: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.cancelFriendRequest(Principal.fromText(receiver));
    },
    onSuccess: (_, receiver) => {
      queryClient.invalidateQueries({ queryKey: ['friendshipStatus', receiver] });
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
      return actor.unfriend(Principal.fromText(friendPrincipal));
    },
    onSuccess: (_, friendPrincipal) => {
      queryClient.invalidateQueries({ queryKey: ['friendshipStatus', friendPrincipal] });
      queryClient.invalidateQueries({ queryKey: ['friendsList'] });
    },
  });
}

export function useGetIncomingFriendRequests() {
  const { actor, isFetching } = useActor();

  return useQuery({
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

  return useQuery({
    queryKey: ['outgoingFriendRequests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOutgoingFriendRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Search ───────────────────────────────────────────────────────────────────

export function useSearchUsers(searchStr: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['searchUsers', searchStr],
    queryFn: async () => {
      if (!actor || !searchStr.trim()) return [];
      return actor.searchUsers(searchStr);
    },
    enabled: !!actor && !isFetching && searchStr.trim().length > 0,
  });
}

// ─── Top Creators ─────────────────────────────────────────────────────────────

export function useGetTopCreators(limit = 10) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['topCreators', limit],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTopCreatorsByShadows(BigInt(limit));
    },
    enabled: !!actor && !isFetching,
  });
}
