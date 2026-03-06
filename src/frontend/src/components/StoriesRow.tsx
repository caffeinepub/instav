import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import React, { useState } from "react";
import { useGetCallerUserProfile } from "../hooks/useQueries";
import { MOCK_STORIES, type Story } from "../lib/mockData";
import AvatarPlaceholder from "./AvatarPlaceholder";
import StoryViewerModal from "./StoryViewerModal";
import YourStoryPopup from "./YourStoryPopup";

export default function StoriesRow() {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const { data: userProfile } = useGetCallerUserProfile();
  const navigate = useNavigate();

  const myDisplayName = userProfile?.name || "You";

  const handleViewMyPosts = () => {
    navigate({ to: "/profile" });
  };

  const handleCreateNewPost = () => {
    navigate({ to: "/create" });
  };

  return (
    <>
      <div className="w-full overflow-x-auto scrollbar-hide">
        <div className="flex items-start gap-4 px-4 py-4 min-w-max">
          {/* Your Story — current user (clickable with popup) */}
          <div className="relative flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPopupOpen((prev) => !prev)}
              className="flex flex-col items-center gap-1.5 group focus:outline-none"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-surface-elevated flex items-center justify-center border-2 border-dashed border-gold/40 group-hover:border-gold transition-colors">
                  <AvatarPlaceholder
                    name={myDisplayName}
                    size="lg"
                    className="w-14 h-14"
                  />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-gold flex items-center justify-center shadow-gold-glow">
                  <Plus className="w-3 h-3 text-surface" strokeWidth={3} />
                </div>
              </div>
              <span className="text-[11px] font-medium text-muted-foreground w-16 text-center truncate">
                Your Story
              </span>
            </button>

            <YourStoryPopup
              isOpen={popupOpen}
              onClose={() => setPopupOpen(false)}
              onViewMyPosts={handleViewMyPosts}
              onCreateNewPost={handleCreateNewPost}
            />
          </div>

          {/* Story items */}
          {MOCK_STORIES.map((story) => (
            <StoryItem
              key={story.id}
              story={story}
              onTap={() => setSelectedStory(story)}
            />
          ))}
        </div>
      </div>

      {selectedStory && (
        <StoryViewerModal
          story={selectedStory}
          onClose={() => setSelectedStory(null)}
        />
      )}
    </>
  );
}

interface StoryItemProps {
  story: Story;
  onTap: () => void;
}

function StoryItem({ story, onTap }: StoryItemProps) {
  return (
    <button
      type="button"
      onClick={onTap}
      className="flex flex-col items-center gap-1.5 group focus:outline-none"
    >
      <div className={story.viewed ? "story-ring-viewed" : "story-ring"}>
        <div className="w-[60px] h-[60px] rounded-full bg-surface flex items-center justify-center overflow-hidden">
          <AvatarPlaceholder
            userId={story.userId}
            name={story.displayName}
            size="lg"
            className="w-full h-full"
          />
        </div>
      </div>
      <span
        className={`text-[11px] font-medium w-16 text-center truncate transition-colors ${
          story.viewed ? "text-muted-foreground" : "text-foreground"
        }`}
      >
        {story.displayName.split(" ")[0]}
      </span>
    </button>
  );
}
