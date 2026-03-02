import React, { useState, useRef } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useGetCallerUserProfile,
  useSaveCallerUserProfile,
  useGetPostsByUser,
  useGetLikedPosts,
  useGetBannerImage,
  useSetBannerImage,
  useGetMyFollowerCount,
  useGetFollowing,
  useUpdateProfilePhoto,
} from '../hooks/useQueries';
import { ExternalBlob } from '../backend';
import AvatarPlaceholder from '../components/AvatarPlaceholder';
import { Camera, Edit2, Save, X, Heart, Grid, Users, UserCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface PostGridItemProps {
  post: {
    id: bigint;
    media?: ExternalBlob;
    mediaType: string;
    caption: string;
    likeCount: bigint;
    viewCount: bigint;
  };
}

function PostGridItem({ post }: PostGridItemProps) {
  const isVideo = post.mediaType?.startsWith('video');
  const mediaUrl = post.media?.getDirectURL();

  return (
    <div className="relative aspect-square bg-surface-2 rounded-lg overflow-hidden group cursor-pointer">
      {mediaUrl ? (
        isVideo ? (
          <video
            src={mediaUrl}
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <img src={mediaUrl} alt={post.caption} className="w-full h-full object-cover" />
        )
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-surface-2">
          <span className="text-muted-foreground text-xs text-center px-2 line-clamp-3">
            {post.caption}
          </span>
        </div>
      )}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
        <span className="text-white text-sm font-semibold flex items-center gap-1">
          <Heart className="w-4 h-4 fill-white" />
          {post.likeCount.toString()}
        </span>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { identity } = useInternetIdentity();
  const principalId = identity?.getPrincipal().toString();

  const { data: profile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: posts, isLoading: postsLoading } = useGetPostsByUser(principalId);
  const { data: likedPosts, isLoading: likedLoading } = useGetLikedPosts();
  const { data: bannerBlob, isLoading: bannerLoading } = useGetBannerImage();
  const { data: followerCount, isLoading: followerCountLoading } = useGetMyFollowerCount();
  const { data: followingList, isLoading: followingLoading } = useGetFollowing(principalId);

  const saveProfile = useSaveCallerUserProfile();
  const setBannerImage = useSetBannerImage();
  const updateProfilePhoto = useUpdateProfilePhoto();

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'liked'>('posts');
  const [editForm, setEditForm] = useState({
    displayName: '',
    handle: '',
    bio: '',
  });
  const [bannerUploadProgress, setBannerUploadProgress] = useState<number | null>(null);
  const [avatarUploadProgress, setAvatarUploadProgress] = useState<number | null>(null);
  const [previewBannerUrl, setPreviewBannerUrl] = useState<string | null>(null);
  const [previewAvatarBlob, setPreviewAvatarBlob] = useState<ExternalBlob | null>(null);

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const bannerUrl = previewBannerUrl ?? bannerBlob?.getDirectURL();

  const handleEditStart = () => {
    setEditForm({
      displayName: profile?.displayName ?? '',
      handle: profile?.handle ?? '',
      bio: profile?.bio ?? '',
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!profile) return;
    try {
      await saveProfile.mutateAsync({
        displayName: editForm.displayName,
        handle: editForm.handle,
        bio: editForm.bio,
        profilePhoto: profile.profilePhoto,
        bannerImage: profile.bannerImage,
      });
      setIsEditing(false);
      toast.success('Profile saved!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save profile');
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optimistic preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewBannerUrl(objectUrl);

    const bytes = new Uint8Array(await file.arrayBuffer());
    const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
      setBannerUploadProgress(pct);
    });
    try {
      await setBannerImage.mutateAsync(blob);
      toast.success('Banner updated!');
    } catch (err: unknown) {
      setPreviewBannerUrl(null);
      toast.error(err instanceof Error ? err.message : 'Failed to update banner');
    } finally {
      setBannerUploadProgress(null);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const bytes = new Uint8Array(await file.arrayBuffer());
    const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
      setAvatarUploadProgress(pct);
    });

    // Optimistic preview
    setPreviewAvatarBlob(ExternalBlob.fromBytes(bytes));

    try {
      await updateProfilePhoto.mutateAsync(blob);
      toast.success('Profile photo updated!');
    } catch (err: unknown) {
      setPreviewAvatarBlob(null);
      toast.error(err instanceof Error ? err.message : 'Failed to update photo');
    } finally {
      setAvatarUploadProgress(null);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Skeleton className="w-full h-52" />
        <div className="px-4 pt-16 space-y-4">
          <Skeleton className="w-32 h-7 rounded-2xl" />
          <Skeleton className="w-24 h-4" />
          <div className="flex gap-3">
            <Skeleton className="w-28 h-14 rounded-2xl" />
            <Skeleton className="w-24 h-14 rounded-2xl" />
            <Skeleton className="w-24 h-14 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const displayName = profile?.displayName ?? 'Anonymous';
  const handle = profile?.handle ?? '';
  const bio = profile?.bio ?? '';
  const followerNum = followerCount !== undefined ? Number(followerCount) : 0;
  const followingNum = followingList?.length ?? 0;
  const postsNum = posts?.length ?? 0;
  const currentAvatarBlob = previewAvatarBlob ?? profile?.profilePhoto ?? null;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* ── Banner ── */}
      <div className="relative w-full h-52 md:h-64 overflow-hidden">
        {bannerLoading ? (
          <Skeleton className="w-full h-full" />
        ) : bannerUrl ? (
          <img src={bannerUrl} alt="Profile banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            {/* Decorative gold shimmer lines */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
              <div className="absolute top-2/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
            </div>
          </div>
        )}

        {/* Dark gradient overlay at bottom for readability */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />

        {/* Upload progress overlay */}
        {bannerUploadProgress !== null && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
            <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gold-500 rounded-full transition-all duration-300"
                style={{ width: `${bannerUploadProgress}%` }}
              />
            </div>
            <span className="text-white text-xs font-medium">
              Uploading banner… {bannerUploadProgress}%
            </span>
          </div>
        )}

        {/* Banner camera button */}
        <button
          onClick={() => bannerInputRef.current?.click()}
          className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/60 hover:bg-black/80 text-white text-xs font-medium rounded-full px-3 py-1.5 backdrop-blur-sm border border-white/20 transition-colors"
          title="Change banner"
        >
          <Camera className="w-3.5 h-3.5" />
          Edit Banner
        </button>
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleBannerUpload}
        />
      </div>

      {/* ── Profile Header ── */}
      <div className="relative px-4">
        {/* Avatar — overlaps banner */}
        <div className="flex items-end justify-between" style={{ marginTop: '-48px' }}>
          <div className="relative z-10">
            {/* Avatar ring */}
            <div className="w-24 h-24 rounded-full p-0.5 bg-gradient-to-br from-gold-500 to-coral-500 shadow-gold-glow">
              <div
                className="w-full h-full rounded-full border-2 border-background overflow-hidden cursor-pointer relative"
                onClick={() => avatarInputRef.current?.click()}
              >
                <AvatarPlaceholder
                  name={displayName}
                  profilePicture={currentAvatarBlob}
                  size="xl"
                  className="w-full h-full"
                />
                {/* Avatar upload progress */}
                {avatarUploadProgress !== null && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-full">
                    <span className="text-white text-xs font-bold">{avatarUploadProgress}%</span>
                  </div>
                )}
              </div>
            </div>
            {/* Camera badge */}
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 bg-gold-500 hover:bg-gold-400 text-background rounded-full flex items-center justify-center shadow-gold-glow transition-colors border-2 border-background"
              title="Change profile photo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>

          {/* Edit / Save buttons */}
          <div className="mb-2 flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:bg-surface-2 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saveProfile.isPending}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gold-500 hover:bg-gold-400 text-background text-sm font-semibold shadow-gold-glow transition-colors disabled:opacity-50"
                >
                  {saveProfile.isPending ? (
                    <span className="w-3.5 h-3.5 border-2 border-background/40 border-t-background rounded-full animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Save
                </button>
              </>
            ) : (
              <button
                onClick={handleEditStart}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-gold-500/60 text-gold-400 hover:bg-gold-500/10 text-sm font-medium transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* ── Profile Info ── */}
        <div className="mt-3 space-y-2">
          {isEditing ? (
            <div className="space-y-3">
              <input
                value={editForm.displayName}
                onChange={(e) => setEditForm((f) => ({ ...f, displayName: e.target.value }))}
                placeholder="Display name"
                className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/50 text-sm"
              />
              <input
                value={editForm.handle}
                onChange={(e) => setEditForm((f) => ({ ...f, handle: e.target.value }))}
                placeholder="@handle"
                className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/50 text-sm"
              />
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="Bio"
                rows={3}
                className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/50 text-sm resize-none"
              />
            </div>
          ) : (
            <>
              {/* Name in golden-glow dark box */}
              <div className="inline-block">
                <div
                  className="bg-gray-900/90 border border-gold-500/40 rounded-2xl px-5 py-2.5"
                  style={{ boxShadow: '0 0 18px rgba(234,179,8,0.35), 0 2px 8px rgba(0,0,0,0.5)' }}
                >
                  <h1 className="text-xl font-bold text-foreground font-display tracking-tight">
                    {displayName}
                  </h1>
                </div>
              </div>

              {/* Handle */}
              {handle && (
                <p className="text-muted-foreground text-sm ml-1">@{handle}</p>
              )}

              {/* Bio */}
              {bio && (
                <p className="text-foreground/75 text-sm leading-relaxed ml-1 max-w-sm">{bio}</p>
              )}
            </>
          )}
        </div>

        {/* ── Stats Row ── */}
        {!isEditing && (
          <div className="flex gap-3 mt-4 mb-6">
            {/* Followers — golden box with glow */}
            <div
              className="flex flex-col items-center justify-center bg-gold-500/10 border border-gold-500/60 rounded-2xl px-4 py-3 min-w-[90px]"
              style={{ boxShadow: '0 0 16px rgba(234,179,8,0.3), 0 2px 6px rgba(0,0,0,0.4)' }}
            >
              {followerCountLoading ? (
                <Skeleton className="w-10 h-6 mb-1" />
              ) : (
                <span className="text-gold-300 font-bold text-xl leading-none">
                  {followerNum.toLocaleString()}
                </span>
              )}
              <span className="text-gold-500/80 text-[10px] font-semibold uppercase tracking-widest mt-1 flex items-center gap-1">
                <Users className="w-3 h-3" />
                Shadows
              </span>
            </div>

            {/* Following */}
            <div className="flex flex-col items-center justify-center bg-surface-2 border border-border rounded-2xl px-4 py-3 min-w-[80px]">
              {followingLoading ? (
                <Skeleton className="w-8 h-6 mb-1" />
              ) : (
                <span className="text-foreground font-bold text-xl leading-none">
                  {followingNum.toLocaleString()}
                </span>
              )}
              <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-widest mt-1 flex items-center gap-1">
                <UserCheck className="w-3 h-3" />
                Following
              </span>
            </div>

            {/* Posts */}
            <div className="flex flex-col items-center justify-center bg-surface-2 border border-border rounded-2xl px-4 py-3 min-w-[70px]">
              {postsLoading ? (
                <Skeleton className="w-8 h-6 mb-1" />
              ) : (
                <span className="text-foreground font-bold text-xl leading-none">
                  {postsNum.toLocaleString()}
                </span>
              )}
              <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-widest mt-1 flex items-center gap-1">
                <Grid className="w-3 h-3" />
                Posts
              </span>
            </div>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex border-b border-border mb-4">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'posts'
                ? 'border-gold-500 text-gold-400'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Grid className="w-4 h-4" />
            Posts
          </button>
          <button
            onClick={() => setActiveTab('liked')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'liked'
                ? 'border-gold-500 text-gold-400'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Heart className="w-4 h-4" />
            Liked
          </button>
        </div>

        {/* ── Posts Grid ── */}
        {activeTab === 'posts' && (
          <>
            {postsLoading ? (
              <div className="grid grid-cols-3 gap-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            ) : posts && posts.length > 0 ? (
              <div className="grid grid-cols-3 gap-1">
                {posts.map((post) => (
                  <PostGridItem key={post.id.toString()} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Grid className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No posts yet</p>
              </div>
            )}
          </>
        )}

        {/* ── Liked Posts Grid ── */}
        {activeTab === 'liked' && (
          <>
            {likedLoading ? (
              <div className="grid grid-cols-3 gap-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            ) : likedPosts && likedPosts.length > 0 ? (
              <div className="grid grid-cols-3 gap-1">
                {likedPosts.map((post) => (
                  <PostGridItem key={post.id.toString()} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Heart className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No liked posts yet</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
