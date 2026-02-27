import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Post, Comment, PostInput, UserProfileData } from '../backend';
import type { Principal } from '@dfinity/principal';

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

export function useGetUserProfile(principal: string | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserProfileData | null>({
    queryKey: ['userProfile', principal],
    queryFn: async () => {
      if (!actor || !principal) return null;
      const { Principal } = await import('@dfinity/principal');
      return actor.getUserProfile(Principal.fromText(principal));
    },
    enabled: !!actor && !actorFetching && !!principal,
    retry: false,
  });
}

export function useProfileByPrincipal(principal: Principal | undefined) {
  const { actor, isFetching: actorFetching } = useActor();
  const principalStr = principal?.toString();

  return useQuery<UserProfileData | null>({
    queryKey: ['profile', 'principal', principalStr],
    queryFn: async () => {
      if (!actor || !principal) return null;
      return actor.getProfileByPrincipal(principal);
    },
    enabled: !!actor && !actorFetching && !!principal,
    retry: false,
    staleTime: 60_000,
  });
}

export function useProfileByHandle(handle: string | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserProfileData | null>({
    queryKey: ['profile', 'handle', handle],
    queryFn: async () => {
      if (!actor || !handle) return null;
      return actor.getProfileByHandle(handle);
    },
    enabled: !!actor && !actorFetching && !!handle,
    retry: false,
    staleTime: 30_000,
  });
}

export function useSearchHandles(prefix: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['search', 'handles', prefix],
    queryFn: async () => {
      if (!actor || !prefix.trim()) return [];
      return actor.searchHandles(prefix.trim());
    },
    enabled: !!actor && !actorFetching && prefix.trim().length > 0,
    staleTime: 10_000,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfileData) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
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
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

// ─── Posts ───────────────────────────────────────────────────────────────────

export function useGetAllPosts() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ['allPosts'],
    queryFn: async () => {
      if (!actor) return [];
      const posts = await actor.getAllPosts();
      return [...posts].sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetPostsByUser(principalStr: string | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ['postsByUser', principalStr],
    queryFn: async () => {
      if (!actor || !principalStr) return [];
      const { Principal } = await import('@dfinity/principal');
      const posts = await actor.getPostsByUser(Principal.fromText(principalStr));
      return [...posts].sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
    },
    enabled: !!actor && !actorFetching && !!principalStr,
  });
}

export function usePostsByHandle(handle: string | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ['postsByHandle', handle],
    queryFn: async () => {
      if (!actor || !handle) return [];
      // Step 1: get all posts to find unique principals
      const allPosts = await actor.getAllPosts() as Post[];
      const principalSet = new Set<string>();
      allPosts.forEach((p: Post) => principalSet.add(p.authorPrincipal.toString()));

      // Step 2: find which principal owns this handle
      const { Principal } = await import('@dfinity/principal');
      let targetPrincipal: string | null = null;
      for (const principalStr of principalSet) {
        const profile = await actor.getProfileByPrincipal(Principal.fromText(principalStr));
        if (profile && profile.handle === handle) {
          targetPrincipal = principalStr;
          break;
        }
      }

      if (!targetPrincipal) return [];
      const posts = await actor.getPostsByUser(Principal.fromText(targetPrincipal));
      return [...posts].sort((a: Post, b: Post) => Number(b.timestamp) - Number(a.timestamp));
    },
    enabled: !!actor && !actorFetching && !!handle,
    staleTime: 30_000,
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
      queryClient.invalidateQueries({ queryKey: ['postsByUser'] });
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

export function useGetComments(postId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Comment[]>({
    queryKey: ['comments', postId?.toString()],
    queryFn: async () => {
      if (!actor || postId === null) return [];
      const comments = await actor.getComments(postId);
      return [...comments].sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
    },
    enabled: !!actor && !actorFetching && postId !== null,
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
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['allPosts'] });
    },
  });
}
