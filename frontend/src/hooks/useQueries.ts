import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";
import type {
  Post,
  UserProfileData,
  Comment,
  Notification,
  Message,
  Conversation,
  CreatorRanking,
} from "../backend";
import { Principal } from "@dfinity/principal";

// Local FriendRequest type (not in backend interface)
export interface FriendRequest {
  sender: Principal;
  recipient: Principal;
  timestamp: bigint;
  status: string;
}

// ─── Auth / Profile ──────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfileData | null>({
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
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileData: UserProfileData) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profileData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useCreateOrUpdateProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileData: UserProfileData) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createOrUpdateProfile(profileData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

// ─── User Profiles ────────────────────────────────────────────────────────────

export function useGetProfileByPrincipal(principal: string | null | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfileData | null>({
    queryKey: ["userProfile", "principal", principal],
    queryFn: async () => {
      if (!actor || !principal) return null;
      return actor.getProfileByPrincipal(Principal.fromText(principal));
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

/** Alias for backwards compatibility */
export const useProfileByPrincipal = useGetProfileByPrincipal;

export function useGetProfileByHandle(handle: string | null | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfileData | null>({
    queryKey: ["userProfile", "handle", handle],
    queryFn: async () => {
      if (!actor || !handle) return null;
      return actor.getProfileByHandle(handle);
    },
    enabled: !!actor && !isFetching && !!handle,
  });
}

/** Alias for backwards compatibility */
export const useProfileByHandle = useGetProfileByHandle;

export function usePrincipalByHandle(handle: string | null | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<string | null>({
    queryKey: ["principalByHandle", handle],
    queryFn: async () => {
      if (!actor || !handle) return null;
      const profile = await actor.getProfileByHandle(handle);
      if (!profile) return null;
      const handles = await actor.searchHandles(handle);
      return handles.length > 0 ? handles[0] : null;
    },
    enabled: !!actor && !isFetching && !!handle,
  });
}

export function useSearchHandles(prefix: string) {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ["handles", "search", prefix],
    queryFn: async () => {
      if (!actor || !prefix) return [];
      return actor.searchHandles(prefix);
    },
    enabled: !!actor && !isFetching && prefix.length > 0,
  });
}

export function useSearchUsers(query: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Array<{ handle: string; profile: UserProfileData }>>({
    queryKey: ["searchUsers", query],
    queryFn: async () => {
      if (!actor || !query.trim()) return [];
      const handles = await actor.searchHandles(query.trim());
      const results = await Promise.all(
        handles.map(async (handle) => {
          const profile = await actor.getProfileByHandle(handle);
          return profile ? { handle, profile } : null;
        })
      );
      return results.filter(
        (r): r is { handle: string; profile: UserProfileData } => r !== null
      );
    },
    enabled: !!actor && !isFetching && query.trim().length > 0,
  });
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export function useGetAllPosts() {
  const { actor, isFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ["allPosts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPosts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetPostsByUser(authorPrincipal: string | null | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ["postsByUser", authorPrincipal],
    queryFn: async () => {
      if (!actor || !authorPrincipal) return [];
      return actor.getPostsByUser(Principal.fromText(authorPrincipal));
    },
    enabled: !!actor && !isFetching && !!authorPrincipal,
  });
}

export function usePostsByHandle(handle: string | null | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ["postsByHandle", handle],
    queryFn: async () => {
      if (!actor || !handle) return [];
      const profile = await actor.getProfileByHandle(handle);
      if (!profile) return [];
      const allPosts = await actor.getAllPosts();
      return allPosts.filter((p) => p.authorName === profile.displayName);
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
      media?: import("../backend").ExternalBlob;
      mediaType: string;
      caption: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createPost(post);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allPosts"] });
      queryClient.invalidateQueries({ queryKey: ["postsByUser"] });
    },
  });
}

export function useLikePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.likePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allPosts"] });
    },
  });
}

export function useRecordView() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.recordView(postId);
    },
  });
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export function useGetComments(postId: bigint | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<Comment[]>({
    queryKey: ["comments", postId?.toString()],
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
      if (!actor) throw new Error("Actor not available");
      return actor.addComment(postId, authorName, text);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.postId.toString()],
      });
    },
  });
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function useGetNotifications() {
  const { actor, isFetching } = useActor();

  return useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getNotifications();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.markNotificationRead(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export function useGetConversations() {
  const { actor, isFetching } = useActor();

  return useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getConversations();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
  });
}

export function useGetMessages(otherPrincipal: string | null | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ["messages", otherPrincipal],
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
      postId?: bigint | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.sendMessage(
        Principal.fromText(recipient),
        content,
        postId ?? null
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.recipient],
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useMarkMessagesRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (otherPrincipal: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.markMessagesRead(Principal.fromText(otherPrincipal));
    },
    onSuccess: (_, otherPrincipal) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", otherPrincipal],
      });
    },
  });
}

// ─── Follow ───────────────────────────────────────────────────────────────────

export function useFollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (target: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.followUser(Principal.fromText(target));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isFollowing"] });
      queryClient.invalidateQueries({ queryKey: ["followers"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["profileRowUsers"] });
    },
  });
}

export function useUnfollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (target: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.unfollowUser(Principal.fromText(target));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isFollowing"] });
      queryClient.invalidateQueries({ queryKey: ["followers"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["profileRowUsers"] });
    },
  });
}

export function useGetFollowers(userPrincipal: string | null | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ["followers", userPrincipal],
    queryFn: async () => {
      if (!actor || !userPrincipal) return [];
      const principals = await actor.getFollowers(
        Principal.fromText(userPrincipal)
      );
      return principals.map((p) => p.toString());
    },
    enabled: !!actor && !isFetching && !!userPrincipal,
  });
}

export function useGetFollowing(userPrincipal: string | null | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ["following", userPrincipal],
    queryFn: async () => {
      if (!actor || !userPrincipal) return [];
      const principals = await actor.getFollowing(
        Principal.fromText(userPrincipal)
      );
      return principals.map((p) => p.toString());
    },
    enabled: !!actor && !isFetching && !!userPrincipal,
  });
}

export function useIsFollowing(target: string | null | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ["isFollowing", target],
    queryFn: async () => {
      if (!actor || !target) return false;
      return actor.isFollowing(Principal.fromText(target));
    },
    enabled: !!actor && !isFetching && !!target,
  });
}

// ─── Top Creators ─────────────────────────────────────────────────────────────

export function useGetTopCreators(limit: number = 10) {
  const { actor, isFetching } = useActor();

  return useQuery<CreatorRanking[]>({
    queryKey: ["topCreators", limit],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTopCreatorsByShadows(BigInt(limit));
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Friend / Social Hooks ────────────────────────────────────────────────────

export function useGetFriendsList() {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ["friendsList"],
    queryFn: async () => {
      if (!actor) return [];
      // Mutual follows = friends. Use getProfileRowUsers which returns them first,
      // but we don't have a direct getFriends endpoint. Return empty for now.
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

/**
 * Returns incoming friend requests for the Social tab in MessagesPage.
 * Since the backend doesn't have a dedicated friend-request system,
 * this returns an empty array (no-op stub that satisfies the type contract).
 */
export function useGetIncomingFriendRequests() {
  const { actor, isFetching } = useActor();

  return useQuery<FriendRequest[]>({
    queryKey: ["incomingFriendRequests"],
    queryFn: async () => {
      if (!actor) return [];
      // Backend does not have a friend-request system; return empty list.
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetFriendshipStatus(
  targetPrincipal: string | null | undefined
) {
  const { actor, isFetching } = useActor();

  return useQuery<string>({
    queryKey: ["friendshipStatus", targetPrincipal],
    queryFn: async () => {
      if (!actor || !targetPrincipal) return "notConnected";
      const isFollowing = await actor.isFollowing(
        Principal.fromText(targetPrincipal)
      );
      return isFollowing ? "following" : "notConnected";
    },
    enabled: !!actor && !isFetching && !!targetPrincipal,
  });
}

export function useSendFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipientPrincipal: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.followUser(Principal.fromText(recipientPrincipal));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendshipStatus"] });
      queryClient.invalidateQueries({ queryKey: ["isFollowing"] });
    },
  });
}

export function useCancelFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipientPrincipal: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.unfollowUser(Principal.fromText(recipientPrincipal));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendshipStatus"] });
      queryClient.invalidateQueries({ queryKey: ["isFollowing"] });
    },
  });
}

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
      if (!actor) throw new Error("Actor not available");
      if (accept) {
        return actor.followUser(Principal.fromText(senderPrincipal));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendshipStatus"] });
      queryClient.invalidateQueries({ queryKey: ["friendsList"] });
      queryClient.invalidateQueries({ queryKey: ["incomingFriendRequests"] });
    },
  });
}

export function useUnfriend() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetPrincipal: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.unfollowUser(Principal.fromText(targetPrincipal));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendshipStatus"] });
      queryClient.invalidateQueries({ queryKey: ["friendsList"] });
    },
  });
}

// ─── Profile Visit Tracking ───────────────────────────────────────────────────

export function useRecordProfileVisit() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (visitedPrincipal: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.recordVisit(Principal.fromText(visitedPrincipal));
    },
  });
}

// ─── Profile Row Users (friends/following/visited) ────────────────────────────

export function useGetProfileRowUsers(isAuthenticated: boolean) {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ["profileRowUsers"],
    queryFn: async () => {
      if (!actor) return [];
      const principals = await actor.getProfileRowUsers();
      return principals.map((p) => p.toString());
    },
    enabled: !!actor && !isFetching && isAuthenticated,
    refetchInterval: 30000,
  });
}

// ─── Has New Post Since ───────────────────────────────────────────────────────

export function useHasNewPostSince(
  userPrincipal: string | null | undefined,
  since: bigint
) {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ["hasNewPostSince", userPrincipal, since.toString()],
    queryFn: async () => {
      if (!actor || !userPrincipal) return false;
      return actor.hasNewPostSince(Principal.fromText(userPrincipal), since);
    },
    enabled: !!actor && !isFetching && !!userPrincipal,
    refetchInterval: 30000,
  });
}

// ─── Get Latest Post By User ──────────────────────────────────────────────────

export function useGetLatestPostByUser(
  userPrincipal: string | null | undefined
) {
  const { actor, isFetching } = useActor();

  return useQuery<Post | null>({
    queryKey: ["latestPostByUser", userPrincipal],
    queryFn: async () => {
      if (!actor || !userPrincipal) return null;
      return actor.getLatestPostByUser(Principal.fromText(userPrincipal));
    },
    enabled: !!actor && !isFetching && !!userPrincipal,
  });
}

// ─── Profiles With New Posts (glow state) ────────────────────────────────────

export function useProfilesWithNewPosts(principalStrs: string[]) {
  const { actor, isFetching } = useActor();

  return useQuery<Set<string>>({
    queryKey: ["profilesWithNewPosts", principalStrs.join(",")],
    queryFn: async () => {
      if (!actor || principalStrs.length === 0) return new Set<string>();
      const glowSet = new Set<string>();
      await Promise.all(
        principalStrs.map(async (pStr) => {
          const stored = localStorage.getItem(`lastSeen_${pStr}`);
          const sinceMs = stored ? Number(stored) : 0;
          // Convert ms to nanoseconds for IC Time
          const sinceNs = BigInt(Math.floor(sinceMs * 1_000_000));
          const hasNew = await actor.hasNewPostSince(
            Principal.fromText(pStr),
            sinceNs
          );
          if (hasNew) glowSet.add(pStr);
        })
      );
      return glowSet;
    },
    enabled: !!actor && !isFetching && principalStrs.length > 0,
    refetchInterval: 30000,
  });
}

// ─── Social Profiles (profile data for a list of principals) ─────────────────

export function useSocialProfiles(principalStrs: string[]) {
  const { actor, isFetching } = useActor();

  return useQuery<
    Array<{ principalStr: string; profile: UserProfileData | null }>
  >({
    queryKey: ["socialProfiles", principalStrs.join(",")],
    queryFn: async () => {
      if (!actor || principalStrs.length === 0) return [];
      return Promise.all(
        principalStrs.map(async (pStr) => {
          const profile = await actor.getProfileByPrincipal(
            Principal.fromText(pStr)
          );
          return { principalStr: pStr, profile };
        })
      );
    },
    enabled: !!actor && !isFetching && principalStrs.length > 0,
  });
}
