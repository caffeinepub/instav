import { Skeleton } from "@/components/ui/skeleton";
import { Trophy } from "lucide-react";
import React from "react";
import { type CreatorRanking, useGetTopCreators } from "../hooks/useQueries";
import AvatarPlaceholder from "./AvatarPlaceholder";

function rankBadge(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

export default function TrendingProfilesSection() {
  const { data: creators = [], isLoading } = useGetTopCreators(10);

  return (
    <section className="px-4 py-3">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-gold-400" />
        <h2 className="text-foreground font-semibold text-sm">
          Trending Creators
        </h2>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {isLoading ? (
          Array.from({ length: 5 }, (_, i) => `skeleton-${i}`).map(
            (skeletonKey) => (
              <div
                key={skeletonKey}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 w-16"
              >
                <Skeleton className="w-12 h-12 rounded-full" />
                <Skeleton className="w-12 h-3 rounded" />
                <Skeleton className="w-10 h-2.5 rounded" />
              </div>
            ),
          )
        ) : creators.length === 0 ? (
          <p className="text-muted-foreground text-xs py-2">
            No trending creators yet
          </p>
        ) : (
          creators.map((creator: CreatorRanking) => {
            const rank = Number(creator.rank);
            const name =
              creator.profile?.name ?? creator.principal.toString().slice(0, 8);
            const handle = creator.profile?.handle ?? "";
            const followerCount = Number(creator.followerCount);

            return (
              <div
                key={creator.principal.toString()}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 w-16 cursor-pointer group"
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-br from-gold-500 to-coral-500 group-hover:shadow-gold-glow transition-shadow">
                    <div className="w-full h-full rounded-full border border-background overflow-hidden">
                      <AvatarPlaceholder
                        name={name}
                        profilePicture={creator.profile?.profilePhoto}
                        size="md"
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                  <div className="absolute -top-1 -left-1 text-xs leading-none">
                    {rankBadge(rank)}
                  </div>
                </div>
                <p className="text-foreground text-xs font-medium text-center truncate w-full">
                  {name}
                </p>
                {handle && (
                  <p className="text-muted-foreground text-[10px] text-center truncate w-full">
                    @{handle}
                  </p>
                )}
                <p className="text-gold-400 text-[10px] font-semibold">
                  {followerCount >= 1000
                    ? `${(followerCount / 1000).toFixed(1)}k`
                    : followerCount}{" "}
                  shadows
                </p>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
