import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfileData, Post, Comment, Notification, Message, Conversation } from '../backend';
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

  return useQuery<Principal[]>({
    queryKey: ['followers', principal],
    queryFn: async () => {
      if (!actor || !principal) return [];
      return actor.getFollowers(Principal.fromText(principal));
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useGetFollowing(principal: string | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<Principal[]>({
    queryKey: ['following', principal],
    queryFn: async () => {
      if (!actor || !principal) return [];
      return actor.getFollowing(Principal.fromText(principal));
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
      queryClient.invalidateQueries({ queryKey: ['following'] });
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
      queryClient.invalidateQueries({ queryKey: ['following'] });
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
    refetchInterval: 15000,
    select: (data) => [...data].sort((a, b) => Number(b.timestamp - a.timestamp)),
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
