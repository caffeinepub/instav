import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import type React from "react";
import { type CreatorRanking, useGetTopCreators } from "../hooks/useQueries";
import AvatarPlaceholder from "./AvatarPlaceholder";

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// Color configs for ranks 3-10 (cycling)
const RANK_COLORS = [
  {
    border: "oklch(0.62 0.26 303 / 60%)",
    bg: "oklch(0.62 0.26 303 / 8%)",
    text: "oklch(0.72 0.20 303)",
    ring: "linear-gradient(135deg, oklch(0.62 0.26 303), oklch(0.52 0.24 300))",
  }, // purple
  {
    border: "oklch(0.82 0.18 200 / 60%)",
    bg: "oklch(0.82 0.18 200 / 8%)",
    text: "oklch(0.82 0.18 200)",
    ring: "linear-gradient(135deg, oklch(0.82 0.18 200), oklch(0.70 0.18 210))",
  }, // cyan
  {
    border: "oklch(0.68 0.22 25 / 60%)",
    bg: "oklch(0.68 0.22 25 / 8%)",
    text: "oklch(0.75 0.20 25)",
    ring: "linear-gradient(135deg, oklch(0.68 0.22 25), oklch(0.60 0.22 20))",
  }, // coral
  {
    border: "oklch(0.72 0.20 140 / 60%)",
    bg: "oklch(0.72 0.20 140 / 8%)",
    text: "oklch(0.72 0.20 140)",
    ring: "linear-gradient(135deg, oklch(0.72 0.20 140), oklch(0.60 0.20 150))",
  }, // green
  {
    border: "oklch(0.75 0.22 350 / 60%)",
    bg: "oklch(0.75 0.22 350 / 8%)",
    text: "oklch(0.75 0.22 350)",
    ring: "linear-gradient(135deg, oklch(0.75 0.22 350), oklch(0.65 0.22 340))",
  }, // pink
  {
    border: "oklch(0.60 0.20 240 / 60%)",
    bg: "oklch(0.60 0.20 240 / 8%)",
    text: "oklch(0.70 0.18 240)",
    ring: "linear-gradient(135deg, oklch(0.60 0.20 240), oklch(0.52 0.22 255))",
  }, // blue
  {
    border: "oklch(0.75 0.18 55 / 60%)",
    bg: "oklch(0.75 0.18 55 / 8%)",
    text: "oklch(0.78 0.18 55)",
    ring: "linear-gradient(135deg, oklch(0.75 0.18 55), oklch(0.65 0.20 45))",
  }, // orange
  {
    border: "oklch(0.72 0.18 175 / 60%)",
    bg: "oklch(0.72 0.18 175 / 8%)",
    text: "oklch(0.72 0.18 175)",
    ring: "linear-gradient(135deg, oklch(0.72 0.18 175), oklch(0.62 0.18 185))",
  }, // teal
];

export default function TrendingProfilesSection() {
  const { data: creators = [], isLoading } = useGetTopCreators(10);
  const navigate = useNavigate();

  return (
    <section className="px-4 py-3">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5" style={{ color: "#f5c842" }} />
        <h2
          className="font-display font-semibold text-base"
          style={{ color: "oklch(0.96 0.008 60)" }}
        >
          Trending
        </h2>
      </div>

      <div className="flex flex-col gap-2">
        {isLoading ? (
          Array.from({ length: 5 }, (_, i) => `skeleton-${i}`).map((k) => (
            <div
              key={k}
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: "oklch(0.10 0.010 265 / 60%)" }}
            >
              <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="w-24 h-3.5 rounded" />
                <Skeleton className="w-16 h-3 rounded" />
              </div>
              <Skeleton className="w-10 h-3.5 rounded" />
            </div>
          ))
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

            // Determine card style based on rank
            let cardStyle: React.CSSProperties;
            let rankBadge: React.ReactNode;
            let countColor: string;
            let ringStyle: string;

            if (rank === 1) {
              // Gold theme
              cardStyle = {
                background:
                  "linear-gradient(135deg, oklch(0.78 0.16 75 / 15%), oklch(0.78 0.16 75 / 5%))",
                border: "1px solid oklch(0.78 0.16 75 / 60%)",
                boxShadow: "0 2px 20px oklch(0.78 0.16 75 / 0.12)",
              };
              rankBadge = (
                <span
                  style={{
                    fontSize: "1.2rem",
                    filter: "drop-shadow(0 0 6px oklch(0.78 0.16 75 / 0.8))",
                  }}
                >
                  👑
                </span>
              );
              countColor = "#f5c842";
              ringStyle = "linear-gradient(135deg, #f5c842, #e8a020, #f5c842)";
            } else if (rank === 2) {
              // Silver theme
              cardStyle = {
                background:
                  "linear-gradient(135deg, oklch(0.75 0.02 265 / 15%), oklch(0.75 0.02 265 / 5%))",
                border: "1px solid oklch(0.75 0.02 265 / 50%)",
                boxShadow: "0 2px 16px oklch(0 0 0 / 0.15)",
              };
              rankBadge = (
                <span
                  style={{
                    fontSize: "1rem",
                    color: "oklch(0.80 0.01 265)",
                    fontWeight: 700,
                  }}
                >
                  #2
                </span>
              );
              countColor = "oklch(0.80 0.01 265)";
              ringStyle =
                "linear-gradient(135deg, oklch(0.80 0.02 265), oklch(0.65 0.02 265))";
            } else {
              // Rank 3-10 — cycle through colors
              const colorIdx = (rank - 3) % RANK_COLORS.length;
              const c = RANK_COLORS[colorIdx];
              cardStyle = {
                background: c.bg,
                border: `1px solid ${c.border}`,
              };
              rankBadge = (
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: c.text,
                    fontWeight: 700,
                  }}
                >
                  #{rank}
                </span>
              );
              countColor = c.text;
              ringStyle = c.ring;
            }

            return (
              <button
                type="button"
                key={creator.principal.toString()}
                data-ocid={`trending.item.${rank}`}
                onClick={() =>
                  navigate({
                    to: "/user/$principal",
                    params: { principal: creator.principal.toString() },
                  })
                }
                className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                style={cardStyle}
              >
                {/* Rank badge */}
                <div className="w-6 flex-shrink-0 flex items-center justify-center">
                  {rankBadge}
                </div>

                {/* Avatar with colored ring */}
                <div
                  className="w-10 h-10 rounded-full p-0.5 flex-shrink-0"
                  style={{ background: ringStyle }}
                >
                  <div
                    className="w-full h-full rounded-full overflow-hidden"
                    style={{ background: "oklch(0.05 0.008 265)" }}
                  >
                    <AvatarPlaceholder
                      name={name}
                      profilePicture={creator.profile?.profilePhoto}
                      size="md"
                      className="w-full h-full"
                    />
                  </div>
                </div>

                {/* Name / handle */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: "oklch(0.96 0.008 60)" }}
                  >
                    {name}
                  </p>
                  {handle && (
                    <p
                      className="text-xs truncate"
                      style={{ color: "oklch(0.50 0.010 60)" }}
                    >
                      @{handle}
                    </p>
                  )}
                </div>

                {/* Shadow count */}
                <div className="flex-shrink-0 text-right">
                  <p
                    className="text-sm font-bold"
                    style={{ color: countColor }}
                  >
                    {formatCount(followerCount)}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "oklch(0.45 0.010 60)" }}
                  >
                    shadows
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
