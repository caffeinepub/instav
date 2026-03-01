import React, { useCallback, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PlusCircle } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useActor } from "../hooks/useActor";
import {
  useGetProfileRowUsers,
  useSocialProfiles,
  useProfilesWithNewPosts,
} from "../hooks/useQueries";
import AvatarPlaceholder from "./AvatarPlaceholder";
import YourStoryPopup from "./YourStoryPopup";
import { Principal } from "@dfinity/principal";

export default function StoriesRow() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { actor } = useActor();
  const isAuthenticated = !!identity;

  const [showYourStoryPopup, setShowYourStoryPopup] = useState(false);

  // Fetch profile row users from backend
  const { data: profileRowPrincipals = [] } =
    useGetProfileRowUsers(isAuthenticated);

  // Fetch profiles for those principals
  const { data: socialProfilesData = [] } = useSocialProfiles(
    profileRowPrincipals
  );

  // Fetch glow state (new posts since last seen)
  const { data: glowingPrincipals = new Set<string>() } =
    useProfilesWithNewPosts(profileRowPrincipals);

  const handleProfileClick = useCallback(
    async (principalStr: string) => {
      const isGlowing = glowingPrincipals.has(principalStr);

      if (isGlowing && actor) {
        try {
          // Fetch latest post
          const latestPost = await actor.getLatestPostByUser(
            Principal.fromText(principalStr)
          );

          // Update lastSeen timestamp
          localStorage.setItem(`lastSeen_${principalStr}`, String(Date.now()));

          if (latestPost) {
            navigate({
              to: "/shortsport",
              search: { postId: latestPost.id.toString() },
            });
            return;
          }
        } catch {
          // fall through to profile navigation
        }
      }

      // Navigate to user profile
      navigate({ to: `/user/${principalStr}` });
    },
    [glowingPrincipals, actor, navigate]
  );

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-3 py-3 overflow-x-auto scrollbar-hide">
        {/* Your Story Button */}
        <div className="flex-shrink-0 relative">
          <button
            onClick={() => setShowYourStoryPopup((v) => !v)}
            className="flex flex-col items-center gap-1.5 w-16"
          >
            <div className="w-14 h-14 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center hover:border-primary transition-colors">
              <PlusCircle size={22} className="text-muted-foreground" />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium text-center leading-tight">
              Your Story
            </span>
          </button>

          {showYourStoryPopup && (
            <YourStoryPopup
              isOpen={showYourStoryPopup}
              onClose={() => setShowYourStoryPopup(false)}
              onViewMyPosts={() => {
                setShowYourStoryPopup(false);
                navigate({ to: "/profile" });
              }}
              onCreateNewPost={() => {
                setShowYourStoryPopup(false);
                navigate({ to: "/create" });
              }}
            />
          )}
        </div>

        {/* Divider */}
        {socialProfilesData.length > 0 && (
          <div className="flex-shrink-0 w-px h-10 bg-border" />
        )}

        {/* Social Profile Bubbles from backend */}
        {socialProfilesData.map(({ principalStr, profile }) => {
          const isGlowing = glowingPrincipals.has(principalStr);
          const displayName =
            profile?.displayName || principalStr.slice(0, 8) + "…";

          return (
            <button
              key={principalStr}
              onClick={() => handleProfileClick(principalStr)}
              className="flex-shrink-0 flex flex-col items-center gap-1.5 w-16"
            >
              <div
                className={`w-14 h-14 rounded-full p-0.5 transition-all ${
                  isGlowing
                    ? "story-ring animate-pulse-glow"
                    : "bg-transparent"
                }`}
              >
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-background">
                  <AvatarPlaceholder
                    name={displayName}
                    profilePicture={profile?.profilePicture}
                    size="md"
                  />
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground font-medium text-center leading-tight truncate w-full">
                {displayName}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
