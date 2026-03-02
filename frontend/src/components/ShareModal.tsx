import React, { useState } from 'react';
import { Send, Users, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import AvatarPlaceholder from './AvatarPlaceholder';
import { useGetFriendsList, useSendMessage, useProfileByPrincipal } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

interface FriendItemProps {
  principalStr: string;
  selected: boolean;
  onToggle: () => void;
}

function FriendItem({ principalStr, selected, onToggle }: FriendItemProps) {
  const { data: profile } = useProfileByPrincipal(principalStr);
  const displayName = profile?.displayName ?? principalStr.slice(0, 12) + '…';

  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors ${
        selected
          ? 'bg-primary/15 border border-primary/40'
          : 'hover:bg-muted/60 border border-transparent'
      }`}
    >
      <AvatarPlaceholder
        userId={principalStr}
        name={displayName}
        profilePicture={profile?.profilePhoto}
        size="sm"
      />
      <span className="flex-1 text-left text-sm font-medium text-foreground truncate">
        {displayName}
      </span>
      {selected && (
        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
          <Check className="w-3 h-3 text-primary-foreground" />
        </div>
      )}
    </button>
  );
}

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: bigint | null;
  postCaption?: string;
}

export default function ShareModal({ open, onOpenChange, postId, postCaption }: ShareModalProps) {
  const { identity } = useInternetIdentity();
  const { data: friends, isLoading: loadingFriends } = useGetFriendsList();
  const sendMessage = useSendMessage();
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());

  const toggleFriend = (principalStr: string) => {
    setSelectedFriends((prev) => {
      const next = new Set(prev);
      if (next.has(principalStr)) {
        next.delete(principalStr);
      } else {
        next.add(principalStr);
      }
      return next;
    });
  };

  const handleSend = async () => {
    if (!identity || !postId || selectedFriends.size === 0) return;

    const shareText = postCaption
      ? `Check out this post: "${postCaption}"`
      : 'Check out this post!';

    try {
      await Promise.all(
        Array.from(selectedFriends).map((friendPrincipal) =>
          sendMessage.mutateAsync({
            recipient: friendPrincipal,
            content: shareText,
            postId,
          })
        )
      );
      toast.success(`Shared with ${selectedFriends.size} friend${selectedFriends.size > 1 ? 's' : ''}!`);
      setSelectedFriends(new Set());
      onOpenChange(false);
    } catch {
      toast.error('Failed to share post');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Share with Friends
          </DialogTitle>
          <DialogDescription>
            Select friends to share this post with via direct message.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-64 overflow-y-auto -mx-1 px-1">
          {loadingFriends ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          ) : !friends || friends.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Users className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No friends yet</p>
              <p className="text-xs mt-1">Add friends to share posts with them</p>
            </div>
          ) : (
            <div className="space-y-1">
              {friends.map((friendPrincipal) => (
                <FriendItem
                  key={friendPrincipal}
                  principalStr={friendPrincipal}
                  selected={selectedFriends.has(friendPrincipal)}
                  onToggle={() => toggleFriend(friendPrincipal)}
                />
              ))}
            </div>
          )}
        </div>

        {friends && friends.length > 0 && (
          <div className="flex gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSend}
              disabled={selectedFriends.size === 0 || sendMessage.isPending}
            >
              {sendMessage.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send ({selectedFriends.size})
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
