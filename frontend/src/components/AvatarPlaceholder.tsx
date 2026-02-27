import React from 'react';
import { cn } from '@/lib/utils';
import { ExternalBlob } from '../backend';

interface AvatarPlaceholderProps {
  /** Legacy prop — used to derive gradient color */
  userId?: string;
  /** Display name used for initials fallback */
  displayName?: string;
  /** Alias for displayName — either one works */
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  profilePicture?: ExternalBlob | null;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<AvatarPlaceholderProps['size']>, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-24 h-24 text-3xl',
};

const AVATAR_COLORS = [
  'from-rose-500 to-amber-500',
  'from-violet-500 to-indigo-500',
  'from-emerald-500 to-teal-500',
  'from-sky-500 to-blue-500',
  'from-pink-500 to-rose-500',
  'from-amber-500 to-orange-500',
];

function getGradient(userId?: string): string {
  if (!userId) return AVATAR_COLORS[0];
  const num = parseInt(userId.replace(/\D/g, '') || '0', 10);
  return AVATAR_COLORS[num % AVATAR_COLORS.length];
}

export default function AvatarPlaceholder({
  userId,
  displayName,
  name,
  size = 'md',
  profilePicture,
  className,
}: AvatarPlaceholderProps) {
  const label = displayName ?? name ?? '';
  const initials = label
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  const gradient = getGradient(userId);
  const sizeClass = SIZE_CLASSES[size];

  if (profilePicture) {
    return (
      <img
        src={profilePicture.getDirectURL()}
        alt={label || 'Profile'}
        className={cn(sizeClass, 'rounded-full object-cover flex-shrink-0', className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-br flex-shrink-0',
        gradient,
        sizeClass,
        className
      )}
    >
      {initials}
    </div>
  );
}
