import React, { useState, useRef, useEffect } from 'react';
import { LogOut, User, Loader2, Camera, Edit2, X, AtSign } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useCreateOrUpdateProfile } from '../hooks/useQueries';
import { ExternalBlob } from '../backend';
import AvatarPlaceholder from '../components/AvatarPlaceholder';

export default function ProfilePage() {
  const { identity, login, clear, loginStatus } = useInternetIdentity();
  const queryClient = useQueryClient();
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();
  const createOrUpdateProfile = useCreateOrUpdateProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [profilePictureBlob, setProfilePictureBlob] = useState<ExternalBlob | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';
  const needsSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  // When entering edit mode, pre-fill form with existing profile data
  useEffect(() => {
    if (isEditing && userProfile) {
      setHandle(userProfile.handle || '');
      setDisplayName(userProfile.displayName || '');
      setBio(userProfile.bio || '');
      setProfilePictureBlob(userProfile.profilePicture ?? null);
      setProfilePicturePreview(
        userProfile.profilePicture ? userProfile.profilePicture.getDirectURL() : null
      );
    }
  }, [isEditing]);

  // When setup mode activates, clear the form
  useEffect(() => {
    if (needsSetup) {
      setHandle('');
      setDisplayName('');
      setBio('');
      setProfilePictureBlob(null);
      setProfilePicturePreview(null);
    }
  }, [needsSetup]);

  const handleLogin = async () => {
    try {
      await login();
    } catch (err: any) {
      if (err?.message === 'User is already authenticated') {
        await clear();
        setTimeout(() => login(), 300);
      }
    }
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    toast.success('Signed out');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setProfilePicturePreview(previewUrl);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
      setUploadProgress(pct);
    });
    setProfilePictureBlob(blob);
    setUploadProgress(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) {
      toast.error('Handle is required');
      return;
    }
    if (!displayName.trim()) {
      toast.error('Display name is required');
      return;
    }

    createOrUpdateProfile.mutate(
      {
        handle: handle.trim().toLowerCase(),
        displayName: displayName.trim(),
        bio: bio.trim(),
        profilePicture: profilePictureBlob ?? undefined,
      },
      {
        onSuccess: () => {
          toast.success(needsSetup ? 'Welcome to InstaV! 🎉' : 'Profile updated!');
          setIsEditing(false);
          setUploadProgress(null);
        },
        onError: (err: any) => {
          const msg = err?.message || '';
          if (msg.includes('Handle already in use')) {
            toast.error('That handle is already taken. Please choose another.');
          } else {
            toast.error('Failed to save profile. Please try again.');
          }
        },
      }
    );
  };

  // ── Unauthenticated ──────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 pb-24 gap-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-10 h-10 text-primary" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Sign In</h2>
          <p className="text-muted-foreground text-sm">
            Sign in to create posts, like, and comment
          </p>
        </div>
        <Button
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="rounded-full px-8"
          size="lg"
        >
          {isLoggingIn ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </div>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Profile Setup / Edit Form ────────────────────────────────────────────
  if (needsSetup || isEditing) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <h1 className="font-bold text-lg text-foreground">
              {needsSetup ? 'Set Up Profile' : 'Edit Profile'}
            </h1>
            {isEditing && (
              <button
                onClick={() => setIsEditing(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-6 space-y-6">
          {/* Profile picture upload */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {profilePicturePreview ? (
                <img
                  src={profilePicturePreview}
                  alt="Profile preview"
                  className="w-24 h-24 rounded-full object-cover border-2 border-primary/30"
                />
              ) : (
                <AvatarPlaceholder name={displayName || 'You'} size="xl" />
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
              >
                <Camera className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {uploadProgress !== null && (
              <p className="text-xs text-muted-foreground">Uploading... {uploadProgress}%</p>
            )}
            <p className="text-xs text-muted-foreground">Tap the camera icon to upload a photo</p>
          </div>

          {/* Handle */}
          <div className="space-y-1.5">
            <Label htmlFor="handle" className="text-sm font-medium">
              Handle <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="handle"
                value={handle}
                onChange={(e) =>
                  setHandle(e.target.value.toLowerCase().replace(/\s/g, ''))
                }
                placeholder="yourhandle"
                maxLength={30}
                className="pl-9"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Unique identifier — others can find you by this
            </p>
          </div>

          {/* Display name */}
          <div className="space-y-1.5">
            <Label htmlFor="displayName" className="text-sm font-medium">
              Display Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your Name"
              maxLength={50}
              required
            />
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <Label htmlFor="bio" className="text-sm font-medium">
              Bio
            </Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the world about yourself..."
              maxLength={200}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{bio.length}/200</p>
          </div>

          <Button
            type="submit"
            disabled={
              !handle.trim() || !displayName.trim() || createOrUpdateProfile.isPending
            }
            className="w-full rounded-full"
            size="lg"
          >
            {createOrUpdateProfile.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : needsSetup ? (
              'Get Started'
            ) : (
              'Save Changes'
            )}
          </Button>
        </form>
      </div>
    );
  }

  // ── Profile View ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="font-bold text-lg text-foreground">Profile</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setHandle(userProfile?.handle || '');
                setDisplayName(userProfile?.displayName || '');
                setBio(userProfile?.bio || '');
                setProfilePictureBlob(userProfile?.profilePicture ?? null);
                setProfilePicturePreview(
                  userProfile?.profilePicture
                    ? userProfile.profilePicture.getDirectURL()
                    : null
                );
                setIsEditing(true);
              }}
              className="text-muted-foreground hover:text-foreground gap-1"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive gap-1"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-4 mb-8">
          <AvatarPlaceholder
            name={userProfile?.displayName || '?'}
            profilePicture={userProfile?.profilePicture ?? null}
            size="xl"
          />

          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground">{userProfile?.displayName}</h2>
            {userProfile?.handle && (
              <p className="text-sm text-primary font-medium mt-0.5">
                @{userProfile.handle}
              </p>
            )}
            {userProfile?.bio && (
              <p className="text-sm text-muted-foreground mt-2 max-w-xs leading-relaxed">
                {userProfile.bio}
              </p>
            )}
          </div>

          <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
            {identity?.getPrincipal().toString().slice(0, 20)}...
          </p>
        </div>
      </div>
    </div>
  );
}
