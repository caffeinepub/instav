import React, { useState, useEffect, useRef } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useGetConversations,
  useGetMessages,
  useSendMessage,
  useMarkMessagesRead,
  useGetUserProfileByPrincipal,
  useGetFriendsList,
  useGetIncomingFriendRequests,
  useRespondToFriendRequest,
  useGetFollowing,
  useGetFollowingProfiles,
} from '../hooks/useQueries';
import AvatarPlaceholder from '../components/AvatarPlaceholder';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Send, MessageCircle, Users, UserCheck, Star, ArrowLeft } from 'lucide-react';
import type { Conversation } from '../backend';

interface MessagesPageProps {
  initialPrincipal?: string;
}

// Sub-component: conversation list item
function ConversationItem({
  principalStr,
  isSelected,
  onClick,
}: {
  principalStr: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { data: profile } = useGetUserProfileByPrincipal(principalStr);

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
        isSelected
          ? 'bg-primary/10 border-l-2 border-primary'
          : 'hover:bg-surface/60 border-l-2 border-transparent'
      }`}
    >
      <AvatarPlaceholder name={profile?.displayName || principalStr.slice(0, 8)} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {profile?.displayName || 'Unknown User'}
        </p>
        <p className="text-xs text-muted-foreground truncate">@{profile?.handle || principalStr.slice(0, 12)}</p>
      </div>
    </button>
  );
}

// Sub-component: message thread
function MessageThread({
  otherPrincipal,
  currentPrincipal,
  onBack,
}: {
  otherPrincipal: string;
  currentPrincipal: string;
  onBack?: () => void;
}) {
  const { data: messages, isLoading } = useGetMessages(otherPrincipal);
  const { data: profile } = useGetUserProfileByPrincipal(otherPrincipal);
  const sendMessage = useSendMessage();
  const markRead = useMarkMessagesRead();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (otherPrincipal) {
      markRead.mutate(otherPrincipal);
    }
  }, [otherPrincipal, messages?.length]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    const recipientStr = otherPrincipal;
    try {
      await sendMessage.mutateAsync({ recipient: recipientStr, content: newMessage.trim() });
      setNewMessage('');
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface/50">
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden mr-1 p-1 rounded-full hover:bg-surface transition-colors text-muted-foreground"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <AvatarPlaceholder name={profile?.displayName || otherPrincipal.slice(0, 8)} size="sm" />
        <div>
          <p className="font-medium text-foreground">{profile?.displayName || 'Unknown User'}</p>
          <p className="text-xs text-muted-foreground">@{profile?.handle || otherPrincipal.slice(0, 12)}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <Skeleton className="h-10 w-48 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : messages?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages?.map((msg, idx) => {
            const isOwn = msg.sender.toString() === currentPrincipal;
            return (
              <div key={idx} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                    isOwn
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-surface border border-border text-foreground rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-surface/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 rounded-full bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sendMessage.isPending}
            size="icon"
            className="rounded-full shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Sub-component: Friend Zone Tab
function FriendZoneTab({ currentPrincipal, onStartChat }: { currentPrincipal: string; onStartChat: (p: string) => void }) {
  const { data: friendsList, isLoading: friendsLoading } = useGetFriendsList();
  const { data: incomingRequests, isLoading: requestsLoading } = useGetIncomingFriendRequests();
  const respondMutation = useRespondToFriendRequest();

  const handleRespond = async (senderStr: string, accept: boolean) => {
    try {
      await respondMutation.mutateAsync({ sender: senderStr, accept });
    } catch (err) {
      console.error('Respond to friend request error:', err);
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Incoming Requests */}
      {(incomingRequests?.length ?? 0) > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-primary" />
            Friend Requests ({incomingRequests?.length})
          </h3>
          <div className="space-y-2">
            {requestsLoading ? (
              Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)
            ) : (
              incomingRequests?.map((req) => {
                const senderStr = req.sender.toString();
                return (
                  <FriendRequestItem
                    key={senderStr}
                    principalStr={senderStr}
                    onAccept={() => handleRespond(senderStr, true)}
                    onDecline={() => handleRespond(senderStr, false)}
                    isLoading={respondMutation.isPending}
                  />
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Friends ({friendsList?.length ?? 0})
        </h3>
        {friendsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : (friendsList?.length ?? 0) === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No friends yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {friendsList?.map((friendPrincipal) => (
              <FriendItem
                key={friendPrincipal}
                principalStr={friendPrincipal}
                onChat={() => onStartChat(friendPrincipal)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FriendRequestItem({
  principalStr,
  onAccept,
  onDecline,
  isLoading,
}: {
  principalStr: string;
  onAccept: () => void;
  onDecline: () => void;
  isLoading: boolean;
}) {
  const { data: profile } = useGetUserProfileByPrincipal(principalStr);
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border">
      <AvatarPlaceholder name={profile?.displayName || principalStr.slice(0, 8)} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{profile?.displayName || 'Unknown'}</p>
        <p className="text-xs text-muted-foreground">@{profile?.handle || principalStr.slice(0, 12)}</p>
      </div>
      <div className="flex gap-1">
        <Button size="sm" onClick={onAccept} disabled={isLoading} className="h-7 px-2 text-xs">Accept</Button>
        <Button size="sm" variant="outline" onClick={onDecline} disabled={isLoading} className="h-7 px-2 text-xs">Decline</Button>
      </div>
    </div>
  );
}

function FriendItem({ principalStr, onChat }: { principalStr: string; onChat: () => void }) {
  const { data: profile } = useGetUserProfileByPrincipal(principalStr);
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border">
      <AvatarPlaceholder name={profile?.displayName || principalStr.slice(0, 8)} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{profile?.displayName || 'Unknown'}</p>
        <p className="text-xs text-muted-foreground">@{profile?.handle || principalStr.slice(0, 12)}</p>
      </div>
      <Button size="sm" variant="outline" onClick={onChat} className="h-7 px-3 text-xs shrink-0">
        <MessageCircle className="w-3 h-3 mr-1" />
        Chat
      </Button>
    </div>
  );
}

// Sub-component: Shadowing Tab
function ShadowingTab({ currentPrincipal }: { currentPrincipal: string }) {
  const { data: followingList, isLoading: followingLoading } = useGetFollowing(currentPrincipal);
  const { data: followingProfiles, isLoading: profilesLoading } = useGetFollowingProfiles(currentPrincipal);

  const isLoading = followingLoading || profilesLoading;
  const followingCount = followingList?.length ?? 0;

  return (
    <div className="p-4">
      {/* Gold Premium Header Card */}
      <div className="relative mb-5 rounded-2xl overflow-hidden border border-amber-400/60 shadow-lg shadow-amber-400/20">
        {/* Gold gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/40 via-yellow-900/30 to-amber-800/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 via-amber-300/10 to-yellow-400/5" />
        {/* Shimmer line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />
        <div className="relative px-5 py-4 flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-md shadow-amber-500/40">
            <Star className="w-6 h-6 text-amber-900 fill-amber-900" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-400/80 mb-0.5">Shadowing</p>
            <p className="text-2xl font-display font-bold bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
              {followingCount} {followingCount === 1 ? 'User' : 'Users'}
            </p>
            <p className="text-xs text-amber-400/60 mt-0.5">People you are shadowing</p>
          </div>
        </div>
        {/* Bottom shimmer */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
      </div>

      {/* Following List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : followingCount === 0 ? (
        <div className="text-center py-10 rounded-xl border border-amber-400/20 bg-amber-900/10">
          <Star className="w-10 h-10 mx-auto mb-3 text-amber-400/40" />
          <p className="text-amber-300/60 text-sm font-medium">Not shadowing anyone yet.</p>
          <p className="text-amber-300/40 text-xs mt-1">Follow users to start shadowing them.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(followingProfiles ?? followingList?.map(p => ({ principal: p, profile: null })) ?? []).map((item) => (
            <ShadowingUserItem
              key={item.principal}
              principalStr={item.principal}
              profile={item.profile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ShadowingUserItem({
  principalStr,
  profile,
}: {
  principalStr: string;
  profile: import('../backend').UserProfileData | null;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-900/20 to-yellow-900/10 border border-amber-400/25 hover:border-amber-400/50 transition-colors">
      <div className="relative">
        <AvatarPlaceholder
          name={profile?.displayName || principalStr.slice(0, 8)}
          profilePicture={profile?.profilePicture}
          size="sm"
        />
        {/* Gold ring */}
        <div className="absolute inset-0 rounded-full ring-1 ring-amber-400/40" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {profile?.displayName || 'Unknown User'}
        </p>
        <p className="text-xs text-amber-400/70 truncate">
          @{profile?.handle || principalStr.slice(0, 12)}
        </p>
      </div>
      <div className="shrink-0">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-medium">
          <Star className="w-2.5 h-2.5 fill-amber-300" />
          Shadow
        </span>
      </div>
    </div>
  );
}

// Main MessagesPage
export default function MessagesPage({ initialPrincipal }: MessagesPageProps) {
  const { identity } = useInternetIdentity();
  const currentPrincipal = identity?.getPrincipal().toString() ?? '';

  const { data: conversations, isLoading: convsLoading } = useGetConversations();
  const [selectedPrincipal, setSelectedPrincipal] = useState<string | null>(initialPrincipal ?? null);
  const [activeTab, setActiveTab] = useState<'inbox' | 'social' | 'friendzone' | 'shadowing'>('inbox');

  useEffect(() => {
    if (initialPrincipal) {
      setSelectedPrincipal(initialPrincipal);
      setActiveTab('inbox');
    }
  }, [initialPrincipal]);

  const conversationPrincipals = (conversations ?? [])
    .map((conv: Conversation) => {
      const [p1, p2] = conv.participants;
      return p1.toString() === currentPrincipal ? p2.toString() : p1.toString();
    })
    .filter((p, idx, arr) => arr.indexOf(p) === idx);

  const handleSelectConversation = (p: string) => {
    setSelectedPrincipal(p);
    setActiveTab('inbox');
  };

  const handleBack = () => {
    setSelectedPrincipal(null);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] max-w-4xl mx-auto">
      {/* Left Panel — full width on mobile when no conversation selected, hidden on mobile when thread is open */}
      <div
        className={`
          flex flex-col bg-background border-r border-border
          ${selectedPrincipal ? 'hidden md:flex md:w-80 md:shrink-0' : 'flex w-full md:w-80 md:shrink-0'}
        `}
      >
        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex-1 py-3 text-xs font-medium transition-colors ${
              activeTab === 'inbox' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Inbox
          </button>
          <button
            onClick={() => setActiveTab('friendzone')}
            className={`flex-1 py-3 text-xs font-medium transition-colors ${
              activeTab === 'friendzone' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Friend Zone
          </button>
          <button
            onClick={() => setActiveTab('shadowing')}
            className={`flex-1 py-3 text-xs font-medium transition-colors relative ${
              activeTab === 'shadowing'
                ? 'border-b-2 border-amber-400'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            style={activeTab === 'shadowing' ? { color: '#fbbf24' } : {}}
          >
            <span className={activeTab === 'shadowing' ? 'bg-gradient-to-r from-yellow-300 to-amber-400 bg-clip-text text-transparent font-semibold' : ''}>
              Shadowing
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'inbox' && (
            <>
              {convsLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 rounded-xl" />
                  ))}
                </div>
              ) : conversationPrincipals.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                  <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm text-center">No conversations yet.</p>
                </div>
              ) : (
                conversationPrincipals.map((p) => (
                  <ConversationItem
                    key={p}
                    principalStr={p}
                    isSelected={selectedPrincipal === p}
                    onClick={() => handleSelectConversation(p)}
                  />
                ))
              )}
            </>
          )}

          {activeTab === 'friendzone' && (
            <FriendZoneTab
              currentPrincipal={currentPrincipal}
              onStartChat={handleSelectConversation}
            />
          )}

          {activeTab === 'shadowing' && (
            <ShadowingTab currentPrincipal={currentPrincipal} />
          )}
        </div>
      </div>

      {/* Right Panel — hidden on mobile when no conversation selected, full width on mobile when thread is open */}
      <div
        className={`
          flex-1 flex flex-col bg-background
          ${selectedPrincipal ? 'flex' : 'hidden md:flex'}
        `}
      >
        {selectedPrincipal ? (
          <MessageThread
            otherPrincipal={selectedPrincipal}
            currentPrincipal={currentPrincipal}
            onBack={handleBack}
          />
        ) : (
          /* Desktop-only empty state — hidden on mobile via parent */
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageCircle className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">Select a conversation</p>
            <p className="text-sm mt-1">Choose from your inbox or start a new chat</p>
          </div>
        )}
      </div>
    </div>
  );
}
