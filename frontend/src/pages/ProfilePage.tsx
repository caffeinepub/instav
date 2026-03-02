import React, { useState, useRef, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useSaveCallerUserProfile } from '../hooks/useQueries';
import AvatarPlaceholder from '../components/AvatarPlaceholder';
import { Camera, Edit3, MapPin, Grid3X3, Heart, Check, Loader2 } from 'lucide-react';
import { ExternalBlob } from '../backend';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'liked'>('posts');

  // Banner state — tracks the ExternalBlob and a local preview URL
  const [bannerPhoto, setBannerPhoto] = useState<ExternalBlob | undefined>(undefined);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editHandle, setEditHandle] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editProfilePhoto, setEditProfilePhoto] = useState<ExternalBlob | undefined>(undefined);
  const [editProfilePhotoPreview, setEditProfilePhotoPreview] = useState<string | null>(null);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);

  // Sync banner from profile when profile loads
  useEffect(() => {
    if (userProfile?.bannerImage && !bannerPhoto) {
      setBannerPhoto(userProfile.bannerImage);
    }
  }, [userProfile]);

  const openEditModal = () => {
    setEditName(userProfile?.name || '');
    setEditUsername(userProfile?.username || '');
    setEditHandle(userProfile?.handle || '');
    setEditBio(userProfile?.bio || '');
    setEditLocation(userProfile?.location || '');
    setEditProfilePhoto(userProfile?.profilePhoto);
    setEditProfilePhotoPreview(null);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => {
      setBannerPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Convert to ExternalBlob and save to profile right away
    file.arrayBuffer().then(async (buf) => {
      const blob = ExternalBlob.fromBytes(new Uint8Array(buf));
      setBannerPhoto(blob);

      // Persist banner immediately using current profile data
      try {
        const currentProfile = userProfile;
        await saveProfile.mutateAsync({
          name: currentProfile?.name || '',
          username: currentProfile?.username || '',
          handle: currentProfile?.handle || '',
          bio: currentProfile?.bio || '',
          location: currentProfile?.location || '',
          profilePhoto: currentProfile?.profilePhoto,
          bannerImage: blob,
        });
        toast.success('Banner updated!');
      } catch {
        toast.error('Failed to save banner. Please try again.');
      }
    });
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setEditProfilePhotoPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    file.arrayBuffer().then((buf) => {
      const blob = ExternalBlob.fromBytes(new Uint8Array(buf));
      setEditProfilePhoto(blob);
    });
  };

  const handleSaveProfile = async () => {
    try {
      // Include bannerImage — use the current bannerPhoto state (new upload or existing from profile)
      const currentBanner = bannerPhoto ?? userProfile?.bannerImage;

      await saveProfile.mutateAsync({
        name: editName,
        username: editUsername,
        handle: editHandle,
        bio: editBio,
        location: editLocation,
        profilePhoto: editProfilePhoto,
        bannerImage: currentBanner,
      });
      toast.success('Profile updated successfully!');
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Profile save error:', err);
      toast.error('Failed to update profile. Please try again.');
    }
  };

  const principalId = identity?.getPrincipal().toString() || '';
  const displayName = userProfile?.name || 'Anonymous';
  const handle = userProfile?.handle || userProfile?.username || '';
  const bio = userProfile?.bio || '';
  const location = userProfile?.location || '';

  // Determine banner display: local preview > existing profile banner URL > gradient fallback
  const bannerSrc = bannerPreview || (userProfile?.bannerImage ? userProfile.bannerImage.getDirectURL() : null);

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-gold-400" />
          <p className="text-muted-foreground text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Banner */}
      <div className="relative w-full h-48 overflow-hidden">
        {bannerSrc ? (
          <img src={bannerSrc} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background:
                'linear-gradient(135deg, oklch(0.18 0.04 60) 0%, oklch(0.14 0.06 30) 40%, oklch(0.16 0.05 280) 100%)',
            }}
          >
            {/* Decorative ambient glow */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 80% 60% at 50% 120%, oklch(0.55 0.18 60 / 0.25) 0%, transparent 70%)',
              }}
            />
          </div>
        )}
        {/* Edit Banner button */}
        <button
          type="button"
          onClick={() => bannerInputRef.current?.click()}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 cursor-pointer"
          style={{
            background: 'oklch(0.15 0.02 60 / 0.8)',
            border: '1px solid oklch(0.65 0.18 60 / 0.4)',
            color: 'oklch(0.85 0.12 60)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 10,
          }}
        >
          <Camera className="w-3 h-3" />
          {saveProfile.isPending ? 'Saving...' : 'Edit Banner'}
        </button>
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleBannerChange}
        />
      </div>

      {/* Profile Header */}
      <div className="relative px-4 pb-4">
        {/* Avatar — positioned to overlap the banner */}
        <div className="relative -mt-16 mb-3 flex items-end justify-between">
          <div className="relative z-10">
            {/* Ambient glow behind avatar */}
            <div
              className="absolute inset-0 rounded-full blur-2xl opacity-60 scale-125"
              style={{
                background:
                  'radial-gradient(circle, oklch(0.75 0.22 60 / 0.5) 0%, oklch(0.65 0.20 30 / 0.3) 60%, transparent 100%)',
                zIndex: 0,
              }}
            />
            <div className="relative z-10">
              <AvatarPlaceholder
                name={displayName}
                profilePhoto={userProfile?.profilePhoto}
                size="2xl"
                showGradientRing={true}
              />
            </div>
          </div>

          {/* Edit Profile button */}
          <div className="flex gap-2 pb-2 z-10">
            <button
              type="button"
              onClick={openEditModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 cursor-pointer"
              style={{
                background: 'oklch(0.15 0.02 60 / 0.85)',
                border: '1px solid oklch(0.65 0.18 60 / 0.5)',
                color: 'oklch(0.85 0.12 60)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                boxShadow: '0 0 12px oklch(0.65 0.18 60 / 0.15)',
                position: 'relative',
                zIndex: 20,
              }}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Name & Handle */}
        <div className="mb-3">
          <h1
            className="text-2xl font-bold font-display"
            style={{
              background: 'linear-gradient(90deg, oklch(0.85 0.18 60), oklch(0.75 0.20 30))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {displayName}
          </h1>
          {handle && (
            <p className="text-sm text-muted-foreground mt-0.5">@{handle}</p>
          )}
        </div>

        {/* Bio */}
        {bio && (
          <p className="text-sm text-foreground/80 mb-3 leading-relaxed">{bio}</p>
        )}

        {/* Location */}
        {location && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
            <MapPin className="w-3.5 h-3.5" />
            <span>{location}</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Posts', value: '0' },
            { label: 'Followers', value: '0' },
            { label: 'Following', value: '0' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center justify-center py-3 rounded-2xl"
              style={{
                background: 'oklch(0.14 0.02 60 / 0.6)',
                border: '1px solid oklch(0.65 0.18 60 / 0.2)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 0 12px oklch(0.65 0.18 60 / 0.08)',
              }}
            >
              <span
                className="text-xl font-bold font-display"
                style={{
                  background: 'linear-gradient(90deg, oklch(0.85 0.18 60), oklch(0.75 0.20 30))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {stat.value}
              </span>
              <span className="text-xs text-muted-foreground mt-0.5">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/30 mb-4">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'posts'
                ? 'border-gold-400 text-gold-400'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
            Posts
          </button>
          <button
            onClick={() => setActiveTab('liked')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'liked'
                ? 'border-gold-400 text-gold-400'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Heart className="w-4 h-4" />
            Liked
          </button>
        </div>

        {/* Posts Grid Placeholder */}
        <div className="grid grid-cols-3 gap-1">
          {activeTab === 'posts' ? (
            <div className="col-span-3 flex flex-col items-center justify-center py-16 text-center">
              <Grid3X3 className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No posts yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Share your first moment!</p>
            </div>
          ) : (
            <div className="col-span-3 flex flex-col items-center justify-center py-16 text-center">
              <Heart className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No liked posts yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Posts you like will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent
          className="max-w-md mx-auto"
          style={{
            background: 'oklch(0.13 0.02 60)',
            border: '1px solid oklch(0.65 0.18 60 / 0.25)',
          }}
        >
          <DialogHeader>
            <DialogTitle
              className="text-lg font-bold font-display"
              style={{
                background: 'linear-gradient(90deg, oklch(0.85 0.18 60), oklch(0.75 0.20 30))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Edit Profile
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Profile Photo */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <AvatarPlaceholder
                  name={editName || displayName}
                  profilePhoto={editProfilePhoto}
                  size="lg"
                  showGradientRing={true}
                />
                {editProfilePhotoPreview && (
                  <div className="absolute inset-0 rounded-full overflow-hidden">
                    <img
                      src={editProfilePhotoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => profilePhotoInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  background: 'oklch(0.18 0.03 60 / 0.8)',
                  border: '1px solid oklch(0.65 0.18 60 / 0.4)',
                  color: 'oklch(0.85 0.12 60)',
                }}
              >
                <Camera className="w-3.5 h-3.5" />
                Change Photo
              </button>
              <input
                ref={profilePhotoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePhotoChange}
              />
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Display Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Your name"
                className="bg-background/50 border-border/40"
              />
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Username</Label>
              <Input
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                placeholder="username"
                className="bg-background/50 border-border/40"
              />
            </div>

            {/* Handle */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Handle</Label>
              <Input
                value={editHandle}
                onChange={(e) => setEditHandle(e.target.value)}
                placeholder="@handle"
                className="bg-background/50 border-border/40"
              />
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Bio</Label>
              <Textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Tell the world about yourself..."
                rows={3}
                className="bg-background/50 border-border/40 resize-none"
              />
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Location</Label>
              <Input
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                placeholder="City, Country"
                className="bg-background/50 border-border/40"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={closeEditModal}
                disabled={saveProfile.isPending}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveProfile}
                disabled={saveProfile.isPending}
                style={{
                  background: 'linear-gradient(135deg, oklch(0.75 0.18 60), oklch(0.65 0.20 30))',
                  color: 'oklch(0.1 0.02 60)',
                  border: 'none',
                }}
              >
                {saveProfile.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
