import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Camera,
  Check,
  Edit3,
  Grid3X3,
  Heart,
  Loader2,
  MapPin,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import AvatarPlaceholder from "../components/AvatarPlaceholder";
import {
  useGetCallerUserProfile,
  useSaveCallerUserProfile,
} from "../hooks/useQueries";

export default function ProfilePage() {
  const { data: userProfile, isLoading: profileLoading } =
    useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "liked">("posts");

  // Banner state — tracks the ExternalBlob and a local preview URL
  const [bannerPhoto, setBannerPhoto] = useState<ExternalBlob | undefined>(
    undefined,
  );
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editHandle, setEditHandle] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editProfilePhoto, setEditProfilePhoto] = useState<
    ExternalBlob | undefined
  >(undefined);
  const [editProfilePhotoPreview, setEditProfilePhotoPreview] = useState<
    string | null
  >(null);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);

  // Sync banner from profile when profile loads
  // biome-ignore lint/correctness/useExhaustiveDependencies: bannerPhoto intentionally excluded to avoid overwriting local edits
  useEffect(() => {
    if (userProfile?.bannerImage && !bannerPhoto) {
      setBannerPhoto(userProfile.bannerImage);
    }
  }, [userProfile]);

  const openEditModal = () => {
    setEditName(userProfile?.name || "");
    setEditUsername(userProfile?.username || "");
    setEditHandle(userProfile?.handle || "");
    setEditBio(userProfile?.bio || "");
    setEditLocation(userProfile?.location || "");
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
          name: currentProfile?.name || "",
          username: currentProfile?.username || "",
          handle: currentProfile?.handle || "",
          bio: currentProfile?.bio || "",
          location: currentProfile?.location || "",
          profilePhoto: currentProfile?.profilePhoto,
          bannerImage: blob,
        });
        toast.success("Banner updated!");
      } catch {
        toast.error("Failed to save banner. Please try again.");
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
      toast.success("Profile updated successfully!");
      setIsEditModalOpen(false);
    } catch (err) {
      console.error("Profile save error:", err);
      toast.error("Failed to update profile. Please try again.");
    }
  };

  const displayName = userProfile?.name || "Anonymous";
  const handle = userProfile?.handle || userProfile?.username || "";
  const bio = userProfile?.bio || "";
  const location = userProfile?.location || "";

  // Determine banner display: local preview > existing profile banner URL > premium gradient fallback
  const bannerSrc =
    bannerPreview ||
    (userProfile?.bannerImage ? userProfile.bannerImage.getDirectURL() : null);

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
      <div className="relative w-full h-52 overflow-hidden">
        {bannerSrc ? (
          <img
            src={bannerSrc}
            alt="Banner"
            className="w-full h-full object-cover"
          />
        ) : (
          /* Premium dark banner — layered gradients + glow overlays */
          <div className="banner-premium w-full h-full">
            {/* Animated shimmer sweep */}
            <div
              className="absolute inset-0 pointer-events-none overflow-hidden"
              aria-hidden="true"
            >
              <div
                className="absolute top-0 bottom-0 w-1/3 animate-banner-shimmer"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, oklch(1 0 0 / 0.04) 50%, transparent 100%)",
                }}
              />
            </div>
            {/* Subtle grid texture overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              aria-hidden="true"
              style={{
                backgroundImage:
                  "linear-gradient(oklch(1 0 0 / 0.03) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.03) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
          </div>
        )}

        {/* Edit Banner button */}
        <button
          type="button"
          onClick={() => bannerInputRef.current?.click()}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/90 transition-all"
          style={{
            background: "oklch(0.10 0.01 265 / 70%)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid oklch(1 0 0 / 12%)",
          }}
        >
          <Camera className="w-3.5 h-3.5" />
          Edit Banner
        </button>
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleBannerChange}
        />
      </div>

      {/* Profile info section */}
      <div className="relative px-4 pb-4">
        {/* Avatar — overlaps banner */}
        <div className="absolute -top-14 left-4">
          <div
            className="rounded-full p-0.5"
            style={{
              background: "linear-gradient(135deg, #f5c842, #e8a020, #ff6b6b)",
            }}
          >
            <div
              className="rounded-full p-0.5"
              style={{ background: "oklch(0.07 0.006 265)" }}
            >
              <AvatarPlaceholder
                name={displayName}
                profilePicture={userProfile?.profilePhoto}
                size="2xl"
                showGradientRing={false}
              />
            </div>
          </div>
        </div>

        {/* Edit Profile button */}
        <div className="flex justify-end pt-3 pb-2">
          <button
            type="button"
            onClick={openEditModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all"
            style={{
              background: "oklch(0.15 0.011 265 / 80%)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid oklch(1 0 0 / 10%)",
              color: "oklch(0.96 0.008 60)",
            }}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit Profile
          </button>
        </div>

        {/* Name & handle */}
        <div className="mt-10">
          <h1 className="text-xl font-bold text-foreground">{displayName}</h1>
          {handle && (
            <p className="text-muted-foreground text-sm mt-0.5">@{handle}</p>
          )}
          {bio && (
            <p className="text-foreground/80 text-sm mt-2 leading-relaxed">
              {bio}
            </p>
          )}
          {location && (
            <div className="flex items-center gap-1 mt-1.5 text-muted-foreground text-xs">
              <MapPin className="w-3.5 h-3.5" />
              <span>{location}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-6 mt-4">
          <div className="text-center">
            <p className="text-foreground font-bold text-lg leading-tight">0</p>
            <p className="text-muted-foreground text-xs">Posts</p>
          </div>
          <div className="text-center">
            <p className="text-foreground font-bold text-lg leading-tight">0</p>
            <p className="text-muted-foreground text-xs">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-foreground font-bold text-lg leading-tight">0</p>
            <p className="text-muted-foreground text-xs">Following</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex border-b mx-4 mt-2"
        style={{ borderColor: "oklch(1 0 0 / 7%)" }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("posts")}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "posts"
              ? "border-gold-DEFAULT text-gold-DEFAULT"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          style={
            activeTab === "posts"
              ? { borderColor: "#f5c842", color: "#f5c842" }
              : {}
          }
        >
          <Grid3X3 className="w-4 h-4" />
          Posts
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("liked")}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "liked"
              ? "border-gold-DEFAULT text-gold-DEFAULT"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          style={
            activeTab === "liked"
              ? { borderColor: "#f5c842", color: "#f5c842" }
              : {}
          }
        >
          <Heart className="w-4 h-4" />
          Liked
        </button>
      </div>

      {/* Posts grid placeholder */}
      <div className="px-4 py-6 text-center">
        <p className="text-muted-foreground text-sm">No posts yet</p>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent
          className="max-w-md mx-auto rounded-2xl border"
          style={{
            background: "oklch(0.11 0.009 265)",
            borderColor: "oklch(1 0 0 / 8%)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Profile</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Profile Photo */}
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                className="rounded-full p-0.5 cursor-pointer"
                style={{
                  background:
                    "linear-gradient(135deg, #f5c842, #e8a020, #ff6b6b)",
                }}
                onClick={() => profilePhotoInputRef.current?.click()}
              >
                <div
                  className="rounded-full p-0.5"
                  style={{ background: "oklch(0.11 0.009 265)" }}
                >
                  {editProfilePhotoPreview ? (
                    <img
                      src={editProfilePhotoPreview}
                      alt="Profile preview"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <AvatarPlaceholder
                      name={editName || displayName}
                      profilePicture={editProfilePhoto}
                      size="xl"
                      showGradientRing={false}
                    />
                  )}
                </div>
              </button>
              <button
                type="button"
                onClick={() => profilePhotoInputRef.current?.click()}
                className="text-xs text-gold-DEFAULT font-medium"
                style={{ color: "#f5c842" }}
              >
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

            <div className="space-y-3">
              <div>
                <Label className="text-muted-foreground text-xs mb-1 block">
                  Display Name
                </Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your name"
                  className="bg-surface border-border/50 text-foreground"
                />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs mb-1 block">
                  Username
                </Label>
                <Input
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="username"
                  className="bg-surface border-border/50 text-foreground"
                />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs mb-1 block">
                  Handle
                </Label>
                <Input
                  value={editHandle}
                  onChange={(e) => setEditHandle(e.target.value)}
                  placeholder="@handle"
                  className="bg-surface border-border/50 text-foreground"
                />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs mb-1 block">
                  Bio
                </Label>
                <Textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell the world about yourself…"
                  rows={3}
                  className="bg-surface border-border/50 text-foreground resize-none"
                />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs mb-1 block">
                  Location
                </Label>
                <Input
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="City, Country"
                  className="bg-surface border-border/50 text-foreground"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={closeEditModal}
              className="flex-1 border-border/50 text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={saveProfile.isPending}
              className="flex-1 font-semibold"
              style={{
                background: "linear-gradient(135deg, #f5c842, #e8a020)",
                color: "oklch(0.07 0.006 265)",
              }}
            >
              {saveProfile.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Save
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
