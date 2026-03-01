import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { TrendingUp, ChevronRight, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import AvatarPlaceholder from './AvatarPlaceholder';
import { useGetTopCreators } from '../hooks/useQueries';
import type { CreatorRanking } from '../backend';

function formatNumber(n: number | bigint): string {
  const num = typeof n === 'bigint' ? Number(n) : n;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
}

export default function TrendingProfilesSection() {
  const navigate = useNavigate();
  const { data: creators, isLoading } = useGetTopCreators(10);

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

          {/* Loading skeletons */}
          {isLoading && (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="glass-card rounded-2xl p-4 w-44 flex-shrink-0 shadow-card"
              >
                <div className="flex items-start justify-between mb-3">
                  <Skeleton className="w-5 h-5 rounded-full" />
                </div>
                <div className="flex justify-center mb-3">
                  <Skeleton className="w-14 h-14 rounded-full" />
                </div>
                <div className="text-center mb-3 space-y-1.5">
                  <Skeleton className="h-3 w-24 mx-auto rounded-full" />
                  <Skeleton className="h-2.5 w-16 mx-auto rounded-full" />
                </div>
                <div className="flex justify-center gap-3 mb-3">
                  <Skeleton className="h-8 w-16 rounded-lg" />
                </div>
                <Skeleton className="h-7 w-full rounded-xl" />
              </div>
            ))
          )}

          {/* Empty state */}
          {!isLoading && (!creators || creators.length === 0) && (
            <div className="flex flex-col items-center justify-center py-8 px-6 gap-3 w-72">
              <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-gold" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                No creators yet. Be the first to join!
              </p>
            </div>
          )}

          {/* Creator cards */}
          {!isLoading && creators && creators.map((creator, index) => (
            <TrendingCreatorCard
              key={creator.principal.toString()}
              creator={creator}
              rank={index + 1}
              onViewProfile={() =>
                navigate({
                  to: '/profile/$handle',
                  params: { handle: creator.principal.toString() },
                })
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}

interface TrendingCreatorCardProps {
  creator: CreatorRanking;
  rank: number;
  onViewProfile: () => void;
}

function TrendingCreatorCard({ creator, rank, onViewProfile }: TrendingCreatorCardProps) {
  const rankColors: Record<number, string> = {
    1: 'bg-amber-400/20 text-amber-400 border border-amber-400/30',
    2: 'bg-slate-300/20 text-slate-300 border border-slate-300/30',
    3: 'bg-orange-400/20 text-orange-400 border border-orange-400/30',
  };
  const rankClass = rankColors[rank] ?? 'bg-gold/15 text-gold border border-gold/20';

  return (
    <div
      className="glass-card rounded-2xl p-4 w-44 flex-shrink-0 hover-scale cursor-pointer shadow-card hover:shadow-card-hover transition-all duration-200"
      onClick={onViewProfile}
    >
      {/* Rank badge */}
      <div className="flex items-start justify-between mb-3">
        <div className={`min-w-[22px] h-[22px] px-1.5 rounded-full flex items-center justify-center ${rankClass}`}>
          <span className="text-[10px] font-bold">#{rank}</span>
        </div>
        {rank <= 3 && (
          <span className="text-[10px] font-medium text-gold bg-gold/10 px-1.5 py-0.5 rounded-full">
            {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
          </span>
        )}
      </div>

      {/* Avatar */}
      <div className="flex justify-center mb-3">
        <div className="story-ring p-0.5">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-surface">
            <AvatarPlaceholder
              userId={creator.principal.toString()}
              name={creator.username}
              size="lg"
              profilePicture={creator.profilePicBlob ?? null}
              className="w-full h-full"
            />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="text-center mb-3">
        <p className="font-semibold text-sm text-foreground truncate leading-tight">
          {creator.username || 'Unknown'}
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {creator.principal.toString().slice(0, 8)}…
        </p>
      </div>

      {/* Shadow count */}
      <div className="flex justify-center mb-3">
        <div className="text-center">
          <p className="text-xs font-bold text-foreground">{formatNumber(creator.followerCount)}</p>
          <p className="text-[10px] text-muted-foreground">Shadows</p>
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
