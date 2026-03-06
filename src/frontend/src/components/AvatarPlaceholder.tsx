import React, { useEffect, useState } from "react";
import type { ExternalBlob } from "../backend";

export interface AvatarPlaceholderProps {
  /** Display name used for initials fallback */
  name?: string;
  /** Alias for name — legacy prop */
  displayName?: string;
  /** Legacy prop — used to derive gradient color from a user id string */
  userId?: string;
  /** Profile photo blob (preferred prop name) */
  profilePhoto?: ExternalBlob | null;
  /** Alias for profilePhoto — legacy prop name used by many components */
  profilePicture?: ExternalBlob | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  /** Show a premium warm yellow → orange → pink/red gradient ring around the avatar */
  showGradientRing?: boolean;
  className?: string;
}

const sizeMap: Record<
  NonNullable<AvatarPlaceholderProps["size"]>,
  { container: string; text: string }
> = {
  xs: { container: "w-6 h-6", text: "text-[10px]" },
  sm: { container: "w-8 h-8", text: "text-xs" },
  md: { container: "w-10 h-10", text: "text-sm" },
  lg: { container: "w-14 h-14", text: "text-base" },
  xl: { container: "w-24 h-24", text: "text-2xl" },
  "2xl": { container: "w-28 h-28", text: "text-3xl" },
  "3xl": { container: "w-36 h-36", text: "text-4xl" },
};

const RING_PADDING: Record<
  NonNullable<AvatarPlaceholderProps["size"]>,
  string
> = {
  xs: "2px",
  sm: "2px",
  md: "3px",
  lg: "3px",
  xl: "4px",
  "2xl": "4px",
  "3xl": "5px",
};

const GAP_PADDING: Record<
  NonNullable<AvatarPlaceholderProps["size"]>,
  string
> = {
  xs: "1px",
  sm: "1.5px",
  md: "2px",
  lg: "2.5px",
  xl: "3px",
  "2xl": "3px",
  "3xl": "3.5px",
};

const GLOW_SIZE: Record<NonNullable<AvatarPlaceholderProps["size"]>, string> = {
  xs: "6px",
  sm: "8px",
  md: "10px",
  lg: "14px",
  xl: "20px",
  "2xl": "22px",
  "3xl": "26px",
};

const AVATAR_GRADIENTS = [
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-sky-500 to-blue-600",
  "from-fuchsia-500 to-pink-600",
  "from-orange-500 to-red-600",
];

function getGradientClass(seed?: string): string {
  if (!seed) return AVATAR_GRADIENTS[0];
  // Use char codes for a stable hash
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash += seed.charCodeAt(i);
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

function getInitials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function AvatarPlaceholder({
  name,
  displayName,
  userId,
  profilePhoto,
  profilePicture,
  size = "md",
  showGradientRing = false,
  className = "",
}: AvatarPlaceholderProps) {
  // Resolve aliases: profilePicture is the legacy name for profilePhoto
  const resolvedPhoto = profilePhoto ?? profilePicture ?? null;
  // Resolve label: name takes priority, then displayName, then empty
  const label = name ?? displayName ?? "";
  // Seed for gradient: userId if provided, otherwise label
  const gradientSeed = userId ?? label;

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const sizes = sizeMap[size];

  useEffect(() => {
    if (!resolvedPhoto) {
      setImageUrl(null);
      return;
    }
    let objectUrl: string | null = null;
    const directUrl = resolvedPhoto.getDirectURL();
    if (directUrl) {
      setImageUrl(directUrl);
    } else {
      resolvedPhoto.getBytes().then((bytes) => {
        const blob = new Blob([bytes], { type: "image/jpeg" });
        objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      });
    }
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [resolvedPhoto]);

  const avatarContent = (
    <div
      className={`${sizes.container} rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 ${
        imageUrl ? "" : `bg-gradient-to-br ${getGradientClass(gradientSeed)}`
      } ${!showGradientRing ? className : ""}`}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={label || "Avatar"}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className={`${sizes.text} font-bold text-white select-none`}>
          {getInitials(label)}
        </span>
      )}
    </div>
  );

  if (!showGradientRing) {
    return avatarContent;
  }

  // Premium gradient ring: conic gradient warm yellow → orange → hot pink → red → back
  return (
    <div
      className={`rounded-full flex-shrink-0 inline-flex ${className}`}
      style={{
        background:
          "conic-gradient(from 0deg, #FDB813, #FD8C13, #FD5C13, #FD1365, #FD3D6B, #FD8C13, #FDB813)",
        padding: RING_PADDING[size],
        filter: `drop-shadow(0 0 ${GLOW_SIZE[size]} rgba(253, 140, 19, 0.75)) drop-shadow(0 0 ${GLOW_SIZE[size]} rgba(253, 19, 101, 0.5))`,
      }}
    >
      {/* Dark gap between gradient ring and avatar */}
      <div
        className="w-full h-full rounded-full"
        style={{
          background: "oklch(0.08 0.005 240)",
          padding: GAP_PADDING[size],
        }}
      >
        {avatarContent}
      </div>
    </div>
  );
}
