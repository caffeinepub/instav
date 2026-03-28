import { Principal } from "@dfinity/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserProfile, UserProfileInput } from "../backend";
import type { ExternalBlob } from "../backend";
import * as localPosts from "../lib/localPosts";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

// ─── Local types (not exported by backend) ────────────────────────────────────

export type UserProfileData = UserProfile;

export interface PostInput {
  authorName: string;
  media?: ExternalBlob;
  mediaFile?: File;
  mediaType: string;
  caption: string;
  destination?: "feed" | "shortsport";
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
  destination: "feed" | "shortsport";
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
  | { __kind__: "new_shadow" }
  | { __kind__: "message" }
  | { __kind__: "comment" };

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
  | { __kind__: "notConnected" }
  | { __kind__: "pendingOutgoing" }
  | { __kind__: "pendingIncoming" }
  | { __kind__: "friends" };

export interface FriendRequest {
  sender: Principal;
  recipient: Principal;
  status:
    | { __kind__: "pending" }
    | { __kind__: "accepted" }
    | { __kind__: "declined" };
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
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
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
      if (!actor || isFetching) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profileData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

export function useUpdateProfile() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileData: UserProfileInput) => {
      if (!actor || isFetching) throw new Error("Actor not available");
      return actor.updateProfile(profileData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

export function useGetUserProfile(principalStr: string | null | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ["userProfile", principalStr],
    queryFn: async () => {
      if (!actor || !principalStr)
        throw new Error("Actor or principal not available");
      try {
        const p = Principal.fromText(principalStr);
        const result = await actor.getUserProfile(p);
        return result ?? null;
      } catch {
        return null;
      }
    },
    enabled: !!actor && !actorFetching && !!principalStr,
    retry: false,
  });
}

export function useGetAllUsers() {
  return useQuery<UserProfile[]>({
    queryKey: ["allUsers"],
    queryFn: async () => {
      return [];
    },
  });
}

// ─── Posts ────────────────────────────────────────────────────────────────────

function storedToPost(p: localPosts.StoredPost): Post {
  const dest =
    p.destination ?? (p.mediaType?.startsWith("video") ? "shortsport" : "feed");
  return {
    id: (() => {
      try {
        return BigInt(`0x${p.id.replace(/-/g, "").slice(0, 16)}`);
      } catch {
        return BigInt(p.timestamp);
      }
    })(),
    authorPrincipal: (() => {
      try {
        return Principal.fromText(p.authorPrincipal);
      } catch {
        return Principal.anonymous();
      }
    })(),
    authorName: p.authorName,
    media: p.mediaDataUrl
      ? ({
          getDirectURL: () => p.mediaDataUrl as string,
        } as unknown as ExternalBlob)
      : undefined,
    mediaType: p.mediaType,
    caption: p.caption,
    timestamp: BigInt(p.timestamp),
    likeCount: BigInt(p.likeCount),
    viewCount: BigInt(p.viewCount),
    destination: dest,
  };
}

export function useGetAllPosts() {
  return useQuery<Post[]>({
    queryKey: ["posts"],
    queryFn: async () => {
      const posts = await localPosts.getAllPostsAsync();
      return posts.map(storedToPost);
    },
  });
}

export function useGetFeedPosts() {
  return useQuery<Post[]>({
    queryKey: ["posts", "feed"],
    queryFn: async () => {
      const posts = await localPosts.getAllPostsAsync();
      return posts.map(storedToPost).filter((p) => p.destination === "feed");
    },
  });
}

export function useGetShortSportPosts() {
  return useQuery<Post[]>({
    queryKey: ["posts", "shortsport"],
    queryFn: async () => {
      const posts = await localPosts.getAllPostsAsync();
      return posts
        .map(storedToPost)
        .filter((p) => p.destination === "shortsport");
    },
  });
}

export function useGetPost(postId: string | null | undefined) {
  return useQuery<Post | null>({
    queryKey: ["post", postId],
    queryFn: async () => {
      if (!postId) return null;
      const p = await localPosts.getPostAsync(postId);
      return p ? storedToPost(p) : null;
    },
    enabled: !!postId,
  });
}

export function useGetLikedPosts() {
  const { identity } = useInternetIdentity();

  return useQuery<Post[]>({
    queryKey: ["likedPosts", identity?.getPrincipal().toString()],
    queryFn: async () => {
      const principal = identity?.getPrincipal().toString() ?? "anonymous";
      const allPosts = await localPosts.getAllPostsAsync();
      return allPosts
        .filter((p) => p.likedBy?.includes(principal))
        .map(storedToPost);
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (postInput: PostInput) => {
      const principal = identity?.getPrincipal().toString() ?? "anonymous";

      let mediaDataUrl: string | null = null;
      if (postInput.mediaFile) {
        mediaDataUrl = await localPosts.fileToDataUrl(postInput.mediaFile);
      }

      const dest: "feed" | "shortsport" =
        postInput.destination ??
        (postInput.mediaType?.startsWith("video") ? "shortsport" : "feed");

      const stored = await localPosts.createPostAsync({
        authorPrincipal: principal,
        authorName: postInput.authorName,
        mediaDataUrl,
        mediaType: postInput.mediaType,
        caption: postInput.caption,
        timestamp: Date.now(),
        likeCount: 0,
        viewCount: 0,
        likedBy: [],
        destination: dest,
      });

      return storedToPost(stored);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useLikePost() {
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (postId: string) => {
      const principal = identity?.getPrincipal().toString() ?? "anonymous";
      const post = await localPosts.getPostAsync(postId);
      if (!post) throw new Error("Post not found");
      const likedBy = post.likedBy ?? [];
      if (!likedBy.includes(principal)) {
        await localPosts.updatePostAsync(postId, {
          likeCount: post.likeCount + 1,
          likedBy: [...likedBy, principal],
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["likedPosts"] });
    },
  });
}

export function useUnlikePost() {
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (postId: string) => {
      const principal = identity?.getPrincipal().toString() ?? "anonymous";
      const post = await localPosts.getPostAsync(postId);
      if (!post) throw new Error("Post not found");
      const likedBy = (post.likedBy ?? []).filter((p) => p !== principal);
      await localPosts.updatePostAsync(postId, {
        likeCount: Math.max(0, post.likeCount - 1),
        likedBy,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["likedPosts"] });
    },
  });
}

// ─── Follow / Shadow ──────────────────────────────────────────────────────────

export function useFollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (principalStr: string) => {
      await localPosts.followUser(principalStr);
    },
    onSuccess: (_data, principalStr) => {
      queryClient.invalidateQueries({
        queryKey: ["isFollowing", principalStr],
      });
      queryClient.invalidateQueries({ queryKey: ["followerCount"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
    },
  });
}

export function useUnfollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (principalStr: string) => {
      await localPosts.unfollowUser(principalStr);
    },
    onSuccess: (_data, principalStr) => {
      queryClient.invalidateQueries({
        queryKey: ["isFollowing", principalStr],
      });
      queryClient.invalidateQueries({ queryKey: ["followerCount"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
    },
  });
}

export function useIsFollowing(principalStr: string | null | undefined) {
  return useQuery<boolean>({
    queryKey: ["isFollowing", principalStr],
    queryFn: async () => {
      if (!principalStr) return false;
      return localPosts.isFollowing(principalStr);
    },
    enabled: !!principalStr,
  });
}

export function useGetFollowerCount(principalStr: string | null | undefined) {
  return useQuery<bigint>({
    queryKey: ["followerCount", principalStr],
    queryFn: async () => {
      return BigInt(0);
    },
    enabled: !!principalStr,
  });
}

export function useGetFollowingList() {
  const { identity } = useInternetIdentity();

  return useQuery<string[]>({
    queryKey: ["following", identity?.getPrincipal().toString()],
    queryFn: async () => {
      const map = await localPosts.getFollowingMap();
      return Object.keys(map).filter((k) => map[k]);
    },
  });
}

// ─── Trending Creators ────────────────────────────────────────────────────────

export function useGetTrendingCreators(limit = 10) {
  return useQuery<CreatorRanking[]>({
    queryKey: ["trendingCreators", limit],
    queryFn: async () => [],
  });
}

// ─── Search ───────────────────────────────────────────────────────────────────

export function useSearchUsers(query: string) {
  return useQuery<UserProfile[]>({
    queryKey: ["searchUsers", query],
    queryFn: async () => [],
    enabled: query.trim().length > 0,
  });
}

// ─── Messages ────────────────────────────────────────────────────────────────

export function useGetConversations() {
  const { identity } = useInternetIdentity();

  return useQuery<Conversation[]>({
    queryKey: ["conversations", identity?.getPrincipal().toString()],
    queryFn: async () => [],
    refetchInterval: 5000,
  });
}

export function useGetMessages(otherPrincipalStr: string | null | undefined) {
  return useQuery<Message[]>({
    queryKey: ["messages", otherPrincipalStr],
    queryFn: async () => [],
    enabled: !!otherPrincipalStr,
    refetchInterval: 3000,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_args: {
      recipientStr: string;
      content: string;
      postId?: string;
    }) => {
      // local messaging stub
    },
    onSuccess: (_data, { recipientStr }) => {
      queryClient.invalidateQueries({ queryKey: ["messages", recipientStr] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function useGetNotifications() {
  const { identity } = useInternetIdentity();

  return useQuery<Notification[]>({
    queryKey: ["notifications", identity?.getPrincipal().toString()],
    queryFn: async () => [],
    refetchInterval: 10000,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // no-op
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

// ─── Friend Requests ──────────────────────────────────────────────────────────

export function useGetFriendRequests() {
  return useQuery<FriendRequest[]>({
    queryKey: ["friendRequests"],
    queryFn: async () => [],
  });
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_principalStr: string) => {
      // no-op
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });
}

export function useRespondToFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_args: {
      senderStr: string;
      accept: boolean;
    }) => {
      // no-op
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });
}

export function useGetFriendshipStatus(
  principalStr: string | null | undefined,
) {
  return useQuery<FriendshipStatusEnum>({
    queryKey: ["friendshipStatus", principalStr],
    queryFn: async () => ({ __kind__: "notConnected" }) as FriendshipStatusEnum,
    enabled: !!principalStr,
  });
}

// ─── Aliases & stubs for backwards compatibility ──────────────────────────────

/** Alias: useGetTrendingCreators → useGetTopCreators */
export function useGetTopCreators(limit = 10) {
  return useGetTrendingCreators(limit);
}

/** Stub: record a post view (no-op locally) */
export function useRecordView() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_postId: string) => {
      // no-op for local posts
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

/** Stub: get comments for a post (local posts have no comments yet) */
export function useGetComments(_postId: bigint | null | undefined) {
  return useQuery<Comment[]>({
    queryKey: ["comments", _postId?.toString()],
    queryFn: async () => [],
    enabled: !!_postId,
  });
}

/** Stub: add a comment */
export function useAddComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_input: { postId: bigint; text: string }) => {
      // no-op for local posts
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
  });
}

/** Alias: useMarkNotificationsRead → useMarkNotificationRead */
export function useMarkNotificationRead() {
  return useMarkNotificationsRead();
}

/** Stub: get friends list (uses following list as proxy) */
export function useGetFriendsList() {
  const { identity } = useInternetIdentity();
  return useQuery<string[]>({
    queryKey: ["friendsList", identity?.getPrincipal().toString()],
    queryFn: async () => {
      const map = await localPosts.getFollowingMap();
      return Object.keys(map).filter((k) => map[k]);
    },
  });
}

/** Get posts by a specific user */
export function useGetPostsByUser(principalStr: string | null | undefined) {
  return useQuery<Post[]>({
    queryKey: ["postsByUser", principalStr],
    queryFn: async () => {
      if (!principalStr) return [];
      const all = await localPosts.getAllPostsAsync();
      return all
        .filter((p) => p.authorPrincipal === principalStr)
        .map(storedToPost);
    },
    enabled: !!principalStr,
  });
}

/** Stub: unfriend (uses unfollow as proxy) */
export function useUnfriend() {
  return useUnfollowUser();
}

/** Stub: mark messages as read (no-op) */
export function useMarkMessagesRead() {
  return useMutation({
    mutationFn: async (_principalStr: string) => {
      // no-op
    },
  });
}
