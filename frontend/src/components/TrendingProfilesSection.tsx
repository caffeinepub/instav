import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Users, TrendingUp, ChevronRight } from 'lucide-react';
import { MOCK_USERS } from '../lib/mockData';
import AvatarPlaceholder from './AvatarPlaceholder';

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export default function TrendingProfilesSection() {
  const navigate = useNavigate();

  return (
    <section className="w-full">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gold/15 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-gold" />
          </div>
          <h2 className="font-display font-bold text-base text-foreground tracking-tight">
            Trending Creators
          </h2>
        </div>
        <button className="flex items-center gap-0.5 text-xs text-gold font-medium hover:text-gold-light transition-colors">
          See all
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Horizontal scroll */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 px-4 pb-2 min-w-max">
          {MOCK_USERS.map((user, index) => (
            <TrendingProfileCard
              key={user.id}
              user={user}
              rank={index + 1}
              onViewProfile={() =>
                navigate({ to: '/explore' })
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}

interface TrendingProfileCardProps {
  user: {
    id: string;
    username: string;
    displayName: string;
    bio: string;
    followers: number;
    posts: number;
    isFollowing: boolean;
  };
  rank: number;
  onViewProfile: () => void;
}

function TrendingProfileCard({ user, rank, onViewProfile }: TrendingProfileCardProps) {
  return (
    <div
      className="glass-card rounded-2xl p-4 w-44 flex-shrink-0 hover-scale cursor-pointer shadow-card hover:shadow-card-hover transition-all duration-200"
      onClick={onViewProfile}
    >
      {/* Rank badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="w-5 h-5 rounded-full bg-gold/15 flex items-center justify-center">
          <span className="text-[10px] font-bold text-gold">#{rank}</span>
        </div>
        {user.isFollowing && (
          <span className="text-[10px] font-medium text-gold bg-gold/10 px-1.5 py-0.5 rounded-full">
            Following
          </span>
        )}
      </div>

      {/* Avatar */}
      <div className="flex justify-center mb-3">
        <div className="story-ring p-0.5">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-surface">
            <AvatarPlaceholder
              userId={user.id}
              name={user.displayName}
              size="lg"
              className="w-full h-full"
            />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="text-center mb-3">
        <p className="font-semibold text-sm text-foreground truncate leading-tight">
          {user.displayName}
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">@{user.username}</p>
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-3 mb-3">
        <div className="text-center">
          <p className="text-xs font-bold text-foreground">{formatCount(user.followers)}</p>
          <p className="text-[10px] text-muted-foreground">Followers</p>
        </div>
        <div className="w-px bg-border" />
        <div className="text-center">
          <p className="text-xs font-bold text-foreground">{user.posts}</p>
          <p className="text-[10px] text-muted-foreground">Posts</p>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onViewProfile();
        }}
        className="w-full py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 bg-gold/15 text-gold hover:bg-gold hover:text-surface border border-gold/20 hover:border-gold"
      >
        View Profile
      </button>
    </div>
  );
}
