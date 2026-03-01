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
        profilePicture={profile?.profilePicture}
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
            recipientStr: friendPrincipal,
            content: shareText,
            postId,
          })
        )
      );
      toast.success(`Shared with ${selectedFriends.size} friend${selectedFriends.size > 1 ? 's' : ''}!`);
      setSelectedFriends(new Set());
      onOpenChange(false);
    } catch {
      toast.error('Failed to share. Please try again.');
    }
  };

  const handleClose = () => {
    setSelectedFriends(new Set());
    onOpenChange(false);
  };

  // friends is Principal[] — convert to string[] for rendering
  const friendStrings: string[] = friends?.map((p) => p.toString()) ?? [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm w-full p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Send className="w-4 h-4" />
            Share with Friends
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Select friends to share this post with
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-72 overflow-y-auto px-2 py-2">
          {!identity ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
              <Users className="w-8 h-8 opacity-30" />
              <p className="text-sm">Sign in to share with friends</p>
            </div>
          ) : loadingFriends ? (
            <div className="space-y-2 px-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          ) : friendStrings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
              <Users className="w-8 h-8 opacity-30" />
              <p className="text-sm">No friends yet</p>
              <p className="text-xs opacity-60">Add friends to share posts with them</p>
            </div>
          ) : (
            <div className="space-y-1">
              {friendStrings.map((principalStr) => (
                <FriendItem
                  key={principalStr}
                  principalStr={principalStr}
                  selected={selectedFriends.has(principalStr)}
                  onToggle={() => toggleFriend(principalStr)}
                />
              ))}
            </div>
          )}
        </div>

        {identity && friendStrings.length > 0 && (
          <div className="px-4 py-3 border-t border-border">
            <Button
              onClick={handleSend}
              disabled={selectedFriends.size === 0 || sendMessage.isPending}
              className="w-full rounded-xl gap-2"
            >
              {sendMessage.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {sendMessage.isPending
                ? 'Sending…'
                : selectedFriends.size > 0
                  ? `Send to ${selectedFriends.size} friend${selectedFriends.size > 1 ? 's' : ''}`
                  : 'Select friends'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
