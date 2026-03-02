import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { ExternalBlob, UserProfile, UserProfileInput } from '../backend';
import { Principal } from '@dfinity/principal';

// ─── Local types (not exported by backend) ────────────────────────────────────

export type UserProfileData = UserProfile;

export interface PostInput {
  authorName: string;
  media?: ExternalBlob;
  mediaType: string;
  caption: string;
}

export interface Post {
  id: bigint;
  authorPrincipal: Principal;
  authorName: string;
  media?: ExternalBlob;
  mediaType: string;
  caption: string;
  timestamp: bigint;
  likeCount: bigint;
  viewCount: bigint;
}

export interface Comment {
  id: bigint;
  postId: bigint;
  authorPrincipal: Principal;
  authorName: string;
  text: string;
  timestamp: bigint;
}

export type NotificationType =
  | { __kind__: 'new_shadow' }
  | { __kind__: 'message' }
  | { __kind__: 'comment' };

export interface Notification {
  id: bigint;
  notificationType: NotificationType;
  fromPrincipal: Principal;
  timestamp: bigint;
  read: boolean;
  postId?: bigint;
}

export interface Conversation {
  otherPrincipal: Principal;
  lastUpdated: bigint;
  unreadCount: bigint;
}

export interface Message {
  sender: Principal;
  recipient: Principal;
  content: string;
  timestamp: bigint;
  postId?: bigint;
  read: boolean;
}

export type FriendshipStatusEnum =
  | { __kind__: 'notConnected' }
  | { __kind__: 'pendingOutgoing' }
  | { __kind__: 'pendingIncoming' }
  | { __kind__: 'friends' };

export interface FriendRequest {
  sender: Principal;
  recipient: Principal;
  status: { __kind__: 'pending' } | { __kind__: 'accepted' } | { __kind__: 'declined' };
  timestamp: bigint;
}

export interface CreatorRanking {
  principal: Principal;
  profile: UserProfile | null;
  followerCount: bigint;
  rank: bigint;
}

export interface UserProfileSummary {
  principal: Principal;
  handle: string;
  displayName: string;
  bio: string;
  avatarUrl?: ExternalBlob;
  bannerImage?: ExternalBlob;
  postCount: bigint;
  followerCount: bigint;
  followingCount: bigint;
}

// ─── User Profile ────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
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
    mutationFn: async (profileData: UserProfileInput) => {
      if (!actor || isFetching) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profileData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
}

export function useUpdateProfile() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileData: UserProfileInput) => {
      if (!actor || isFetching) throw new Error('Actor not available');
      return actor.updateProfile(profileData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
}

export function useGetUserProfile(principalId?: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', principalId],
    queryFn: async () => {
      if (!actor || !principalId) return null;
      return actor.getUserProfile(Principal.fromText(principalId));
    },
    enabled: !!actor && !isFetching && !!principalId,
  });
}

export const useProfileByPrincipal = useGetUserProfile;
export const useGetUserProfileByPrincipal = useGetUserProfile;

export function useGetUserProfileByHandle(handle?: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfileByHandle', handle],
    queryFn: async () => {
      if (!actor || !handle) return null;
      const result = await actor.getProfile({ __kind__: 'handle', handle });
      return result ?? null;
    },
    enabled: !!actor && !isFetching && !!handle,
  });
}

export const useProfileByHandle = useGetUserProfileByHandle;

// ─── Banner Image (local state only — backend doesn't support it) ─────────────

export function useGetBannerImage() {
  return useQuery<ExternalBlob | null>({
    queryKey: ['bannerImage'],
    queryFn: async () => null,
    enabled: false,
  });
}

export function useSetBannerImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_banner: ExternalBlob) => {
      // Banner image not supported by current backend
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bannerImage'] });
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
      // Update profile photo by fetching current profile and updating it
      const current = await actor.getCallerUserProfile();
      if (!current) throw new Error('No profile found');
      return actor.updateProfile({ ...current, profilePhoto: photo });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
}

// ─── Posts (local mock — backend doesn't expose post methods) ─────────────────

export function useGetAllPosts() {
  return useQuery<Post[]>({
    queryKey: ['allPosts'],
    queryFn: async () => [],
    enabled: false,
  });
}

export function useGetPostsByUser(_authorPrincipal?: string | null) {
  return useQuery<Post[]>({
    queryKey: ['postsByUser', _authorPrincipal],
    queryFn: async () => [],
    enabled: false,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_postInput: PostInput) => {
      throw new Error('Post creation not available in current backend');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPosts'] });
      queryClient.invalidateQueries({ queryKey: ['postsByUser'] });
    },
  });
}

export function useLikePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_postId: bigint) => {
      throw new Error('Not available');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPosts'] });
      queryClient.invalidateQueries({ queryKey: ['likedPosts'] });
    },
  });
}

export function useUnlikePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_postId: bigint) => {
      throw new Error('Not available');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPosts'] });
      queryClient.invalidateQueries({ queryKey: ['likedPosts'] });
    },
  });
}

export function useGetLikedPosts() {
  return useQuery<Post[]>({
    queryKey: ['likedPosts'],
    queryFn: async () => [],
    enabled: false,
  });
}

export function useRecordView() {
  return useMutation({
    mutationFn: async (_postId: bigint) => {
      // Not available
    },
  });
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export function useGetComments(_postId?: bigint) {
  return useQuery<Comment[]>({
    queryKey: ['comments', _postId?.toString()],
    queryFn: async () => [],
    enabled: false,
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_args: { postId: bigint; authorName: string; text: string }) => {
      throw new Error('Not available');
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_target: string | Principal) => {
      throw new Error('Not available');
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_target: string | Principal) => {
      throw new Error('Not available');
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

export function useIsFollowing(_target: string | Principal | null) {
  return useQuery<boolean>({
    queryKey: ['isFollowing', typeof _target === 'string' ? _target : _target?.toString()],
    queryFn: async () => false,
    enabled: false,
  });
}

export function useGetFollowers(_principalId?: string | null) {
  return useQuery<Principal[]>({
    queryKey: ['followers', _principalId],
    queryFn: async () => [],
    enabled: false,
  });
}

export function useGetFollowing(_principalId?: string | null) {
  return useQuery<Principal[]>({
    queryKey: ['following', _principalId],
    queryFn: async () => [],
    enabled: false,
  });
}

export function useGetFollowingProfiles(_principalId?: string | null) {
  return useQuery<Array<{ principal: string; profile: UserProfile | null }>>({
    queryKey: ['followingProfiles', _principalId],
    queryFn: async () => [],
    enabled: false,
  });
}

// ─── Follower Count ───────────────────────────────────────────────────────────

export function useGetMyFollowerCount() {
  return useQuery<bigint>({
    queryKey: ['myFollowerCount'],
    queryFn: async () => BigInt(0),
    enabled: false,
  });
}

export function useGetFollowerCount(_principalId?: string | null) {
  return useQuery<bigint>({
    queryKey: ['followerCount', _principalId],
    queryFn: async () => BigInt(0),
    enabled: false,
  });
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function useGetNotifications() {
  return useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => [],
    enabled: false,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_notificationId: bigint) => {
      // Not available
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export function useGetConversations() {
  return useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => [],
    enabled: false,
  });
}

export function useGetMessages(_otherPrincipal?: string | null) {
  return useQuery<Message[]>({
    queryKey: ['messages', _otherPrincipal],
    queryFn: async () => [],
    enabled: false,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_args: {
      recipient: string;
      content: string;
      postId?: bigint | null;
    }) => {
      throw new Error('Not available');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.recipient] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMarkMessagesRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_otherPrincipal: string) => {
      // Not available
    },
    onSuccess: (_, otherPrincipal) => {
      queryClient.invalidateQueries({ queryKey: ['messages', otherPrincipal] });
    },
  });
}

// ─── Friends ──────────────────────────────────────────────────────────────────

export function useGetFriendsList() {
  return useQuery<string[]>({
    queryKey: ['friendsList'],
    queryFn: async () => [],
    enabled: false,
  });
}

export function useGetFriendshipStatus(_otherPrincipal?: string | null) {
  return useQuery<FriendshipStatusEnum | null>({
    queryKey: ['friendshipStatus', _otherPrincipal],
    queryFn: async () => null,
    enabled: false,
  });
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_receiver: string) => {
      throw new Error('Not available');
    },
    onSuccess: (_, receiver) => {
      queryClient.invalidateQueries({ queryKey: ['friendshipStatus', receiver] });
      queryClient.invalidateQueries({ queryKey: ['outgoingFriendRequests'] });
    },
  });
}

// Alias for backward compatibility
export const useCancelFriendRequest = useSendFriendRequest;

export function useRespondToFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_args: {
      sender?: string;
      senderStr?: string;
      accept: boolean;
    }) => {
      throw new Error('Not available');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomingFriendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['friendsList'] });
      queryClient.invalidateQueries({ queryKey: ['friendshipStatus'] });
    },
  });
}

export function useUnfriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_otherPrincipal: string) => {
      throw new Error('Not available');
    },
    onSuccess: (_, otherPrincipal) => {
      queryClient.invalidateQueries({ queryKey: ['friendsList'] });
      queryClient.invalidateQueries({ queryKey: ['friendshipStatus', otherPrincipal] });
    },
  });
}

export function useGetIncomingFriendRequests() {
  return useQuery<FriendRequest[]>({
    queryKey: ['incomingFriendRequests'],
    queryFn: async () => [],
    enabled: false,
  });
}

export function useGetOutgoingFriendRequests() {
  return useQuery<FriendRequest[]>({
    queryKey: ['outgoingFriendRequests'],
    queryFn: async () => [],
    enabled: false,
  });
}

// ─── Search ───────────────────────────────────────────────────────────────────

export function useSearchUsers(_query: string) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile[]>({
    queryKey: ['searchUsers', _query],
    queryFn: async () => {
      if (!actor || !_query.trim()) return [];
      // Search by handle lookup
      const result = await actor.getProfile({ __kind__: 'handle', handle: _query.trim() });
      return result ? [result] : [];
    },
    enabled: !!actor && !isFetching && !!_query.trim(),
  });
}

// ─── Top Creators ─────────────────────────────────────────────────────────────

export function useGetTopCreators(_limit = 10) {
  return useQuery<CreatorRanking[]>({
    queryKey: ['topCreators', _limit],
    queryFn: async () => [],
    enabled: false,
  });
}
