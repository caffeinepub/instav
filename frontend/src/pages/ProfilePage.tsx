import React, { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useSaveCallerUserProfile, useGetPostsByUser, useGetLikedPosts } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import AvatarPlaceholder from '../components/AvatarPlaceholder';
import { ExternalBlob } from '../backend';
import type { Post } from '../backend';
import { Camera, Edit2, Save, X, Heart, Grid3X3, AlertCircle, RefreshCw } from 'lucide-react';

// Lightweight grid thumbnail — no onCommentClick needed
function PostGridItem({ post }: { post: Post }) {
  const [imgError, setImgError] = useState(false);
  const mediaUrl = post.media ? post.media.getDirectURL() : null;

  return (
    <div className="aspect-square bg-surface-2 rounded-lg overflow-hidden relative group cursor-pointer">
      {mediaUrl && !imgError ? (
        <img
          src={mediaUrl}
          alt={post.caption}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center p-2">
          <p className="text-xs text-muted-foreground text-center line-clamp-4">
            {post.caption || 'Post'}
          </p>
        </div>
      )}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
        <span className="text-white text-xs font-medium">❤️ {post.likeCount.toString()}</span>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { identity } = useInternetIdentity();
  const principalStr = identity?.getPrincipal().toString() ?? null;

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
    error: profileError,
    refetch,
  } = useGetCallerUserProfile();

  const { data: posts, isLoading: postsLoading } = useGetPostsByUser(principalStr);
  const { data: likedPosts, isLoading: likedPostsLoading } = useGetLikedPosts();
  const saveProfile = useSaveCallerUserProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [editHandle, setEditHandle] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editProfilePicture, setEditProfilePicture] = useState<ExternalBlob | undefined>(undefined);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);

  // Profile setup state
  const [setupHandle, setSetupHandle] = useState('');
  const [setupDisplayName, setSetupDisplayName] = useState('');
  const [setupBio, setSetupBio] = useState('');

  const isAuthenticated = !!identity;
  const showSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  const handleStartEdit = () => {
    if (userProfile) {
      setEditHandle(userProfile.handle);
      setEditDisplayName(userProfile.displayName);
      setEditBio(userProfile.bio);
      setEditProfilePicture(userProfile.profilePicture);
      setProfilePicturePreview(null);
    }
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setProfilePicturePreview(null);
  };

  const handleSaveEdit = async () => {
    if (!editHandle.trim() || !editDisplayName.trim()) return;
    try {
      await saveProfile.mutateAsync({
        handle: editHandle.trim(),
        displayName: editDisplayName.trim(),
        bio: editBio.trim(),
        profilePicture: editProfilePicture,
      });
      setIsEditing(false);
      setProfilePicturePreview(null);
    } catch (err: any) {
      console.error('Save profile error:', err);
    }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const arrayBuffer = ev.target?.result as ArrayBuffer;
      const uint8Array = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(uint8Array);
      setEditProfilePicture(blob);
      setProfilePicturePreview(URL.createObjectURL(file));
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSetupSubmit = async () => {
    if (!setupHandle.trim() || !setupDisplayName.trim()) return;
    try {
      await saveProfile.mutateAsync({
        handle: setupHandle.trim(),
        displayName: setupDisplayName.trim(),
        bio: setupBio.trim(),
        profilePicture: undefined,
      });
    } catch (err: any) {
      console.error('Setup profile error:', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Please log in to view your profile.</p>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-24 h-24 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="text-destructive">Failed to load profile.</p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  // Profile setup form
  if (showSetup) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-display font-bold text-foreground">Set Up Your Profile</h1>
          <p className="text-muted-foreground">Welcome! Let's get your profile ready.</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Display Name *</label>
            <input
              type="text"
              value={setupDisplayName}
              onChange={e => setSetupDisplayName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Handle *</label>
            <input
              type="text"
              value={setupHandle}
              onChange={e => setSetupHandle(e.target.value.replace(/\s/g, '').toLowerCase())}
              placeholder="@yourhandle"
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Bio</label>
            <textarea
              value={setupBio}
              onChange={e => setSetupBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
          <Button
            onClick={handleSetupSubmit}
            disabled={!setupHandle.trim() || !setupDisplayName.trim() || saveProfile.isPending}
            className="w-full"
          >
            {saveProfile.isPending ? 'Saving...' : 'Create Profile'}
          </Button>
          {saveProfile.isError && (
            <p className="text-destructive text-sm text-center">{(saveProfile.error as Error)?.message}</p>
          )}
        </div>
      </div>
    );
  }

  const sortedPosts = [...(posts ?? [])].sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
  const sortedLikedPosts = [...(likedPosts ?? [])].sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24 space-y-8">
      {/* Profile Header */}
      <div className="relative">
        {!isEditing ? (
          <div className="flex items-start gap-4">
            <AvatarPlaceholder
              name={userProfile?.displayName}
              profilePicture={userProfile?.profilePicture}
              size="xl"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h1 className="text-xl font-display font-bold text-foreground truncate">
                    {userProfile?.displayName || 'Unknown User'}
                  </h1>
                  <p className="text-sm text-muted-foreground">@{userProfile?.handle || 'unknown'}</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleStartEdit} className="shrink-0">
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </div>
              {userProfile?.bio && (
                <p className="mt-2 text-sm text-foreground/80 leading-relaxed">{userProfile.bio}</p>
              )}
              <div className="mt-3 flex gap-4 text-sm">
                <span className="text-foreground font-semibold">
                  {sortedPosts.length}{' '}
                  <span className="text-muted-foreground font-normal">posts</span>
                </span>
                <span className="text-foreground font-semibold">
                  {sortedLikedPosts.length}{' '}
                  <span className="text-muted-foreground font-normal">liked</span>
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                {profilePicturePreview ? (
                  <img src={profilePicturePreview} alt="Preview" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <AvatarPlaceholder
                    name={editDisplayName || userProfile?.displayName}
                    profilePicture={editProfilePicture}
                    size="xl"
                  />
                )}
                <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 cursor-pointer">
                  <Camera className="w-3 h-3" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleProfilePictureChange} />
                </label>
              </div>
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={e => setEditDisplayName(e.target.value)}
                  placeholder="Display Name"
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                <input
                  type="text"
                  value={editHandle}
                  onChange={e => setEditHandle(e.target.value.replace(/\s/g, '').toLowerCase())}
                  placeholder="handle"
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
            </div>
            <textarea
              value={editBio}
              onChange={e => setEditBio(e.target.value)}
              placeholder="Bio..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
            />
            <div className="flex gap-2">
              <Button onClick={handleSaveEdit} disabled={saveProfile.isPending} size="sm" className="flex-1">
                <Save className="w-4 h-4 mr-1" />
                {saveProfile.isPending ? 'Saving...' : 'Save'}
              </Button>
              <Button onClick={handleCancelEdit} variant="outline" size="sm" className="flex-1">
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>
            {saveProfile.isError && (
              <p className="text-destructive text-sm">{(saveProfile.error as Error)?.message}</p>
            )}
          </div>
        )}
      </div>

      {/* Posts Grid */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Grid3X3 className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-display font-semibold text-foreground">
            Posts ({sortedPosts.length})
          </h2>
        </div>
        {postsLoading ? (
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square" />
            ))}
          </div>
        ) : sortedPosts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Grid3X3 className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No posts yet. Share your first moment!</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {sortedPosts.map(post => (
              <PostGridItem key={post.id.toString()} post={post} />
            ))}
          </div>
        )}
      </div>

      {/* Liked Posts Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
          <h2 className="text-lg font-display font-semibold text-foreground">
            Liked Posts ({sortedLikedPosts.length})
          </h2>
        </div>
        {likedPostsLoading ? (
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square" />
            ))}
          </div>
        ) : sortedLikedPosts.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-border bg-surface/50">
            <Heart className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground text-sm">No liked posts yet.</p>
            <p className="text-muted-foreground text-xs mt-1">Posts you like will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {sortedLikedPosts.map(post => (
              <PostGridItem key={post.id.toString()} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
