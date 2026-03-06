import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Copy, Send, Share2 } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import {
  type Post,
  useGetFriendsList,
  useGetUserProfile,
  useSendMessage,
} from "../hooks/useQueries";
import AvatarPlaceholder from "./AvatarPlaceholder";

interface FriendItemProps {
  principalStr: string;
  selected: boolean;
  onToggle: () => void;
}

function FriendItem({ principalStr, selected, onToggle }: FriendItemProps) {
  const { data: profile } = useGetUserProfile(principalStr);

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-colors ${
        selected
          ? "bg-gold-500/15 border border-gold-500/40"
          : "hover:bg-surface-2 border border-transparent"
      }`}
    >
      <AvatarPlaceholder
        name={profile?.name ?? principalStr.slice(0, 8)}
        profilePicture={profile?.profilePhoto}
        size="sm"
      />
      <div className="flex-1 min-w-0 text-left">
        <p className="text-foreground text-sm font-medium truncate">
          {profile?.name ?? `${principalStr.slice(0, 8)}…`}
        </p>
        {profile?.handle && (
          <p className="text-muted-foreground text-xs truncate">
            @{profile.handle}
          </p>
        )}
      </div>
      {selected && <Check className="w-4 h-4 text-gold-400 flex-shrink-0" />}
    </button>
  );
}

interface ShareModalProps {
  post: Post;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ShareModal({
  post,
  open,
  onOpenChange,
}: ShareModalProps) {
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const { data: friendsList = [] } = useGetFriendsList();
  const sendMessage = useSendMessage();

  const toggleFriend = (principalStr: string) => {
    setSelectedFriends((prev) =>
      prev.includes(principalStr)
        ? prev.filter((p) => p !== principalStr)
        : [...prev, principalStr],
    );
  };

  const handleSend = async () => {
    if (selectedFriends.length === 0) return;
    try {
      await Promise.all(
        selectedFriends.map((recipient) =>
          sendMessage.mutateAsync({
            recipient,
            content: `Check out this post: ${post.caption || "(no caption)"}`,
            postId: post.id,
          }),
        ),
      );
      toast.success(
        `Shared with ${selectedFriends.length} friend${selectedFriends.length > 1 ? "s" : ""}!`,
      );
      setSelectedFriends([]);
      onOpenChange(false);
    } catch {
      toast.error("Failed to share post");
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/shortsport?postId=${post.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copied!");
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-1 border border-border rounded-2xl max-w-sm w-full p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border">
          <DialogTitle className="text-foreground text-base font-semibold flex items-center gap-2">
            <Share2 className="w-4 h-4 text-gold-400" />
            Share Post
          </DialogTitle>
        </DialogHeader>

        {/* Copy link */}
        <div className="px-4 py-3 border-b border-border">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-surface-2 transition-colors border border-border"
          >
            {copied ? (
              <Check className="w-4 h-4 text-gold-400" />
            ) : (
              <Copy className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-foreground text-sm">
              {copied ? "Copied!" : "Copy link"}
            </span>
          </button>
        </div>

        {/* Friends list */}
        <div className="px-4 py-3 max-h-64 overflow-y-auto">
          {friendsList.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              No friends to share with yet
            </p>
          ) : (
            <div className="space-y-1">
              {friendsList.map((principalStr: string) => (
                <FriendItem
                  key={principalStr}
                  principalStr={principalStr}
                  selected={selectedFriends.includes(principalStr)}
                  onToggle={() => toggleFriend(principalStr)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Send button */}
        {selectedFriends.length > 0 && (
          <div className="px-4 py-3 border-t border-border">
            <button
              type="button"
              onClick={handleSend}
              disabled={sendMessage.isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-background text-sm font-semibold shadow-gold-glow transition-colors disabled:opacity-50"
            >
              {sendMessage.isPending ? (
                <span className="w-4 h-4 border-2 border-background/40 border-t-background rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send to {selectedFriends.length} friend
              {selectedFriends.length > 1 ? "s" : ""}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
