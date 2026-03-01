import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetCallerUserProfile,
  useCreateOrUpdateProfile,
  useGetPostsByUser,
  useGetFollowers,
  useGetFollowing,
} from '../hooks/useQueries';
import AvatarPlaceholder from '../components/AvatarPlaceholder';
import CommentsSheet from '../components/CommentsSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Edit2, LogOut, Camera, Film, ImageIcon, Eye, Users, RefreshCw } from 'lucide-react';
import { ExternalBlob } from '../backend';
import type { Post } from '../backend';

function PostGrid({
  posts,
  onCommentClick,
}: {
  posts: Post[];
  onCommentClick: (post: Post) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-0.5">
      {posts.map((post) => {
        const mediaUrl = post.media?.getDirectURL();
        const isVideo = post.mediaType === 'video';
        return (
          <button
            key={post.id.toString()}
            onClick={() => onCommentClick(post)}
            className="relative aspect-square bg-muted overflow-hidden group"
          >
            {mediaUrl ? (
              isVideo ? (
                <video
                  src={mediaUrl}
                  className="w-full h-full object-cover"
                  muted
                  preload="metadata"
                />
              ) : (
                <img src={mediaUrl} alt={post.caption} className="w-full h-full object-cover" />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                {isVideo ? <Film size={20} /> : <ImageIcon size={20} />}
                {post.caption && (
                  <p className="absolute bottom-1 left-1 right-1 text-xs text-center line-clamp-2 text-foreground/70 px-1">
                    {post.caption}
                  </p>
                )}
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="flex items-center gap-1 text-white text-sm font-semibold">
                <Eye size={14} /> {post.viewCount.toString()}
              </span>
            </div>
            {isVideo && (
              <div className="absolute top-1 right-1 bg-black/60 rounded p-0.5">
                <Film size={10} className="text-white" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { identity, clear, loginStatus, login } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const isAuthenticated = !!identity;
  const myPrincipal = identity?.getPrincipal().toString();

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
    isError: profileError,
    refetch: refetchProfile,
  } = useGetCallerUserProfile();

  const createOrUpdateProfile = useCreateOrUpdateProfile();
  const { data: posts, isLoading: postsLoading } = useGetPostsByUser(myPrincipal);
  const { data: followers } = useGetFollowers(myPrincipal);
  const { data: following } = useGetFollowing(myPrincipal);

  const [formData, setFormData] = useState({
    handle: '',
    displayName: '',
    bio: '',
    profilePicture: undefined as ExternalBlob | undefined,
  });
  const [uploadingPic, setUploadingPic] = useState(false);

  // Show profile setup when: authenticated, not loading, query has resolved, and no profile exists
  // Use loose equality (== null) to catch both null and undefined
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile == null;

  useEffect(() => {
    if (userProfile) {
      setFormData({
        handle: userProfile.handle ?? '',
        displayName: userProfile.displayName ?? '',
        bio: userProfile.bio ?? '',
        profilePicture: userProfile.profilePicture,
      });
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!formData.handle.trim() || !formData.displayName.trim()) {
      toast.error('Handle and display name are required');
      return;
    }
    try {
      await createOrUpdateProfile.mutateAsync({
        handle: formData.handle.trim().toLowerCase(),
        displayName: formData.displayName.trim(),
        bio: formData.bio.trim(),
        profilePicture: formData.profilePicture,
      });
      toast.success('Profile saved!');
      setIsEditing(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Handle already in use')) {
        toast.error('That handle is already taken. Please choose another.');
      } else {
        toast.error('Failed to save profile. Please try again.');
      }
    }
  };

  const handlePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPic(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const blob = ExternalBlob.fromBytes(new Uint8Array(arrayBuffer));
      setFormData((prev) => ({ ...prev, profilePicture: blob }));
    } catch {
      toast.error('Failed to process image');
    } finally {
      setUploadingPic(false);
    }
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    navigate({ to: '/' });
  };

  // ── Not authenticated ──
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          <Users size={32} className="text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">Your Profile</h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            Sign in to create your profile, post content, and connect with others.
          </p>
        </div>
        <Button
          onClick={() => login()}
          disabled={loginStatus === 'logging-in'}
          className="rounded-full px-8 gap-2"
        >
          {loginStatus === 'logging-in' && (
            <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
          )}
          {loginStatus === 'logging-in' ? 'Signing in...' : 'Sign In'}
        </Button>
      </div>
    );
  }

  // ── Loading ──
  if (profileLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="w-20 h-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-0.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state (non-auth errors) ──
  if (profileError && !showProfileSetup) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <RefreshCw size={24} className="text-destructive" />
        </div>
        <div>
          <h2 className="text-xl font-bold mb-1">Couldn't load profile</h2>
          <p className="text-muted-foreground text-sm">Something went wrong. Please try again.</p>
        </div>
        <Button onClick={() => refetchProfile()} variant="outline" className="rounded-full gap-2">
          <RefreshCw size={14} />
          Retry
        </Button>
      </div>
    );
  }

  // ── Profile Setup / Edit Form ──
  if (showProfileSetup || isEditing) {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-2">
          {showProfileSetup ? 'Set Up Your Profile' : 'Edit Profile'}
        </h2>
        {showProfileSetup && (
          <p className="text-muted-foreground text-sm mb-6">
            Welcome to Smileup! Create your profile to start sharing and connecting.
          </p>
        )}

        {/* Profile Picture */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <AvatarPlaceholder
              name={formData.displayName || 'You'}
              profilePicture={formData.profilePicture}
              size="xl"
            />
            <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer hover:bg-primary/90 transition-colors">
              <Camera size={14} />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePictureUpload}
                disabled={uploadingPic}
              />
            </label>
          </div>
          {uploadingPic && (
            <p className="text-xs text-muted-foreground mt-2">Processing...</p>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="handle">Handle</Label>
            <Input
              id="handle"
              value={formData.handle}
              onChange={(e) =>
                setFormData((p) => ({ ...p, handle: e.target.value.toLowerCase().replace(/\s/g, '') }))
              }
              placeholder="yourhandle"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">No spaces, lowercase only</p>
          </div>
          <div>
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData((p) => ({ ...p, displayName: e.target.value }))}
              placeholder="Your Name"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData((p) => ({ ...p, bio: e.target.value }))}
              placeholder="Tell the world about yourself..."
              className="mt-1 resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            onClick={handleSave}
            disabled={createOrUpdateProfile.isPending}
            className="flex-1 rounded-full"
          >
            {createOrUpdateProfile.isPending && (
              <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
            )}
            Save Profile
          </Button>
          {isEditing && (
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="rounded-full"
            >
              Cancel
            </Button>
          )}
        </div>

        {/* Sign out option on setup screen */}
        {showProfileSetup && (
          <div className="mt-4 text-center">
            <button
              onClick={handleLogout}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign out instead
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Profile View ──
  return (
    <div className="max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-start gap-4">
          <AvatarPlaceholder
            name={userProfile?.displayName ?? 'You'}
            profilePicture={userProfile?.profilePicture}
            size="xl"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{userProfile?.displayName ?? 'Your Profile'}</h1>
            {userProfile?.handle && (
              <p className="text-muted-foreground text-sm">@{userProfile.handle}</p>
            )}
            {userProfile?.bio && (
              <p className="text-sm mt-2 text-foreground/80 leading-relaxed">
                {userProfile.bio}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 mt-3">
              <div className="text-center">
                <p className="font-bold text-sm">{posts?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground">Posts</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-sm">{followers?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground">Shadows</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-sm">{following?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground">Following</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="gap-1.5 rounded-full"
              >
                <Edit2 size={13} />
                Edit Profile
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleLogout}
                className="gap-1.5 rounded-full text-muted-foreground"
              >
                <LogOut size={13} />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Posts Grid */}
      {postsLoading ? (
        <div className="grid grid-cols-3 gap-0.5 mt-0.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      ) : posts && posts.length > 0 ? (
        <PostGrid posts={posts} onCommentClick={setSelectedPost} />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Film size={32} className="mb-2 opacity-40" />
          <p className="text-sm">No posts yet</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate({ to: '/create' })}
            className="mt-3 rounded-full"
          >
            Create your first post
          </Button>
        </div>
      )}

      {/* Comments Sheet */}
      <CommentsSheet
        post={selectedPost}
        open={!!selectedPost}
        onOpenChange={(val) => { if (!val) setSelectedPost(null); }}
      />
    </div>
  );
}
