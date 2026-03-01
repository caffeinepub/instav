import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useGetConversations,
  useGetMessages,
  useSendMessage,
  useMarkMessagesRead,
  useProfileByPrincipal,
  useGetIncomingFriendRequests,
  useGetFriendsList,
  useRespondToFriendRequest,
} from '../hooks/useQueries';
import AvatarPlaceholder from '../components/AvatarPlaceholder';
import PostPickerModal from '../components/PostPickerModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Send,
  MessageCircle,
  Film,
  ArrowLeft,
  LogIn,
  UserCheck,
  UserX,
  Users,
  Heart,
  Loader2,
  Play,
} from 'lucide-react';
import type { Conversation, Message, FriendRequest } from '../backend';
import { toast } from 'sonner';

function timeAgo(timestamp: bigint): string {
  const now = Date.now();
  const ts = Number(timestamp) / 1_000_000;
  const diff = Math.floor((now - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Conversation Item ────────────────────────────────────────────────────────

function ConversationItem({
  conversation,
  myPrincipal,
  onClick,
  isActive,
}: {
  conversation: Conversation;
  myPrincipal: string;
  onClick: () => void;
  isActive: boolean;
}) {
  const otherPrincipal =
    conversation.participants[0].toString() === myPrincipal
      ? conversation.participants[1].toString()
      : conversation.participants[0].toString();

  const { data: profile } = useProfileByPrincipal(otherPrincipal);
  const { data: messages } = useGetMessages(otherPrincipal);

  const unreadCount =
    messages?.filter((m) => m.sender.toString() !== myPrincipal && !m.read).length ?? 0;

  const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1] : null;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left ${
        isActive ? 'bg-muted' : ''
      }`}
    >
      <AvatarPlaceholder
        name={profile?.displayName ?? otherPrincipal.slice(0, 8)}
        profilePicture={profile?.profilePicture}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm truncate">
            {profile?.displayName ?? `@${otherPrincipal.slice(0, 8)}...`}
          </span>
          {lastMessage && (
            <span className="text-xs text-muted-foreground ml-2 shrink-0">
              {timeAgo(lastMessage.timestamp)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-xs text-muted-foreground truncate">
            {lastMessage
              ? lastMessage.postId !== undefined && lastMessage.postId !== null
                ? '🎬 Shared a shortspot'
                : lastMessage.content
              : 'No messages yet'}
          </p>
          {unreadCount > 0 && (
            <span className="ml-2 shrink-0 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  message,
  isMine,
  onViewPost,
}: {
  message: Message;
  isMine: boolean;
  onViewPost?: (postId: bigint) => void;
}) {
  const hasPost = message.postId !== undefined && message.postId !== null;

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
          isMine
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm'
        }`}
      >
        {hasPost && (
          <button
            onClick={() => onViewPost?.(message.postId!)}
            className={`flex items-center gap-2 mb-2 w-full rounded-xl overflow-hidden border transition-opacity hover:opacity-80 ${
              isMine
                ? 'border-primary-foreground/20 bg-primary-foreground/10'
                : 'border-border bg-background/50'
            }`}
          >
            <div className="flex items-center gap-2 px-3 py-2 w-full">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  isMine ? 'bg-primary-foreground/20' : 'bg-primary/10'
                }`}
              >
                <Play
                  size={16}
                  className={isMine ? 'text-primary-foreground' : 'text-primary'}
                  fill="currentColor"
                />
              </div>
              <div className="flex flex-col items-start min-w-0">
                <span
                  className={`text-xs font-semibold truncate ${
                    isMine ? 'text-primary-foreground' : 'text-foreground'
                  }`}
                >
                  ShortSport
                </span>
                <span
                  className={`text-xs truncate ${
                    isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}
                >
                  Tap to watch
                </span>
              </div>
              <Film
                size={14}
                className={`ml-auto shrink-0 ${
                  isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'
                }`}
              />
            </div>
          </button>
        )}
        {message.content && (
          <p className="text-sm leading-relaxed">{message.content}</p>
        )}
        <p
          className={`text-xs mt-1 ${
            isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'
          }`}
        >
          {timeAgo(message.timestamp)}
        </p>
      </div>
    </div>
  );
}

// ─── Thread View ──────────────────────────────────────────────────────────────

function ThreadView({
  otherPrincipal,
  myPrincipal,
  onBack,
}: {
  otherPrincipal: string;
  myPrincipal: string;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [showPostPicker, setShowPostPicker] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: profile } = useProfileByPrincipal(otherPrincipal);
  const { data: messages, isLoading } = useGetMessages(otherPrincipal);
  const sendMessage = useSendMessage();
  const markRead = useMarkMessagesRead();

  const messagesLength = messages?.length ?? 0;

  useEffect(() => {
    if (messagesLength > 0) {
      markRead.mutate(otherPrincipal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messagesLength, otherPrincipal]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesLength]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage.mutate({ recipientStr: otherPrincipal, content: text.trim() });
    setText('');
  };

  const handleSharePost = (postId: bigint) => {
    sendMessage.mutate({
      recipientStr: otherPrincipal,
      content: 'Shared a shortspot with you',
      postId,
    });
    setShowPostPicker(false);
  };

  const handleViewPost = (postId: bigint) => {
    navigate({
      to: '/shortsport',
      search: { postId: postId.toString() },
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="md:hidden p-1 rounded-full hover:bg-muted transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <AvatarPlaceholder
          name={profile?.displayName ?? otherPrincipal.slice(0, 8)}
          profilePicture={profile?.profilePicture}
          size="sm"
        />
        <div>
          <p className="font-semibold text-sm">
            {profile?.displayName ?? `@${otherPrincipal.slice(0, 8)}...`}
          </p>
          {profile?.handle && (
            <p className="text-xs text-muted-foreground">@{profile.handle}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}
              >
                <Skeleton className="h-12 w-48 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : messages && messages.length > 0 ? (
          <>
            {messages.map((msg, idx) => (
              <MessageBubble
                key={idx}
                message={msg}
                isMine={msg.sender.toString() === myPrincipal}
                onViewPost={handleViewPost}
              />
            ))}
            <div ref={bottomRef} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <MessageCircle size={32} className="mb-2 opacity-40" />
            <p className="text-sm">No messages yet. Say hello!</p>
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPostPicker(true)}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Share a Shortspot"
          >
            <Film size={20} />
          </button>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 rounded-full bg-muted border-0 focus-visible:ring-1"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!text.trim() || sendMessage.isPending}
            className="rounded-full shrink-0"
          >
            <Send size={16} />
          </Button>
        </div>
      </div>

      {showPostPicker && (
        <PostPickerModal
          myPrincipal={myPrincipal}
          onSelect={handleSharePost}
          onClose={() => setShowPostPicker(false)}
        />
      )}
    </div>
  );
}

// ─── Friend Request Card ──────────────────────────────────────────────────────

function FriendRequestCard({
  request,
  onAccept,
  onDecline,
  isResponding,
}: {
  request: FriendRequest;
  onAccept: () => void;
  onDecline: () => void;
  isResponding: boolean;
}) {
  const senderStr = request.sender.toString();
  const { data: profile } = useProfileByPrincipal(senderStr);

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
      <AvatarPlaceholder
        name={profile?.displayName ?? senderStr.slice(0, 8)}
        profilePicture={profile?.profilePicture}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">
          {profile?.displayName ?? `@${senderStr.slice(0, 8)}...`}
        </p>
        {profile?.handle && (
          <p className="text-xs text-muted-foreground">@{profile.handle}</p>
        )}
        <p className="text-xs text-muted-foreground mt-0.5">
          Sent a friend request · {timeAgo(request.timestamp)}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          size="sm"
          onClick={onAccept}
          disabled={isResponding}
          className="rounded-full h-8 px-3 text-xs gap-1"
        >
          {isResponding ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <UserCheck size={12} />
          )}
          Accept
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onDecline}
          disabled={isResponding}
          className="rounded-full h-8 px-3 text-xs gap-1"
        >
          {isResponding ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <UserX size={12} />
          )}
          Decline
        </Button>
      </div>
    </div>
  );
}

// ─── Social Tab ───────────────────────────────────────────────────────────────

function SocialTab() {
  const { data: incomingRequests, isLoading } = useGetIncomingFriendRequests();
  const respondMutation = useRespondToFriendRequest();
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  const handleAccept = async (senderPrincipal: string) => {
    setRespondingTo(senderPrincipal);
    try {
      await respondMutation.mutateAsync({ senderStr: senderPrincipal, accept: true });
      toast.success('Friend request accepted! 🎉');
    } catch {
      toast.error('Failed to accept friend request.');
    } finally {
      setRespondingTo(null);
    }
  };

  const handleDecline = async (senderPrincipal: string) => {
    setRespondingTo(senderPrincipal);
    try {
      await respondMutation.mutateAsync({ senderStr: senderPrincipal, accept: false });
      toast.success('Friend request declined.');
    } catch {
      toast.error('Failed to decline friend request.');
    } finally {
      setRespondingTo(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-1 p-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!incomingRequests || incomingRequests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground px-4 text-center">
        <Heart size={32} className="mb-2 opacity-40" />
        <p className="text-sm font-medium">No friend requests</p>
        <p className="text-xs mt-1 opacity-70">
          When someone sends you a friend request, it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="px-4 py-2 text-xs text-muted-foreground font-medium uppercase tracking-wide">
        Friend Requests · {incomingRequests.length}
      </p>
      {incomingRequests.map((req) => {
        const senderStr = req.sender.toString();
        return (
          <FriendRequestCard
            key={senderStr}
            request={req}
            onAccept={() => handleAccept(senderStr)}
            onDecline={() => handleDecline(senderStr)}
            isResponding={respondingTo === senderStr}
          />
        );
      })}
    </div>
  );
}

// ─── Friend Zone Item ─────────────────────────────────────────────────────────

function FriendZoneItem({
  principalStr,
  onMessage,
}: {
  principalStr: string;
  onMessage: () => void;
}) {
  const { data: profile } = useProfileByPrincipal(principalStr);

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
      <AvatarPlaceholder
        name={profile?.displayName ?? principalStr.slice(0, 8)}
        profilePicture={profile?.profilePicture}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">
          {profile?.displayName ?? `@${principalStr.slice(0, 8)}...`}
        </p>
        {profile?.handle && (
          <p className="text-xs text-muted-foreground">@{profile.handle}</p>
        )}
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={onMessage}
        className="rounded-full h-8 px-3 text-xs gap-1 shrink-0"
      >
        <MessageCircle size={12} />
        Message
      </Button>
    </div>
  );
}

// ─── Friend Zone Tab ──────────────────────────────────────────────────────────

function FriendZoneTab({
  onStartConversation,
}: {
  onStartConversation: (principal: string) => void;
}) {
  const { data: friends, isLoading } = useGetFriendsList();

  // friends is Principal[] — convert to string[] for rendering
  const friendStrings: string[] = friends?.map((p) => p.toString()) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-1 p-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (friendStrings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground px-4 text-center">
        <Users size={32} className="mb-2 opacity-40" />
        <p className="text-sm font-medium">No friends yet</p>
        <p className="text-xs mt-1 opacity-70">
          Send friend requests to connect with people.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="px-4 py-2 text-xs text-muted-foreground font-medium uppercase tracking-wide">
        Friends · {friendStrings.length}
      </p>
      {friendStrings.map((principalStr) => (
        <FriendZoneItem
          key={principalStr}
          principalStr={principalStr}
          onMessage={() => onStartConversation(principalStr)}
        />
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

interface MessagesPageProps {
  initialPrincipal?: string;
}

export default function MessagesPage({ initialPrincipal }: MessagesPageProps) {
  const { identity } = useInternetIdentity();
  const myPrincipal = identity?.getPrincipal().toString() ?? '';

  const [activeConversation, setActiveConversation] = useState<string | null>(
    initialPrincipal ?? null
  );

  const { data: conversations, isLoading: loadingConversations } =
    useGetConversations();

  const handleStartConversation = (principal: string) => {
    setActiveConversation(principal);
  };

  if (!identity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-foreground px-6 text-center">
        <LogIn size={40} className="opacity-40" />
        <p className="text-lg font-semibold text-foreground">Sign in to message</p>
        <p className="text-sm">
          You need to be signed in to send and receive messages.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] overflow-hidden">
      {/* Sidebar — conversation list */}
      <div
        className={`flex flex-col border-r border-border bg-background ${
          activeConversation ? 'hidden md:flex md:w-80' : 'flex w-full md:w-80'
        }`}
      >
        <div className="px-4 py-3 border-b border-border">
          <h1 className="font-bold text-lg">Messages</h1>
        </div>

        <Tabs defaultValue="inbox" className="flex flex-col flex-1 overflow-hidden">
          <TabsList className="mx-4 mt-2 mb-1 grid grid-cols-3 h-9">
            <TabsTrigger value="inbox" className="text-xs">
              Inbox
            </TabsTrigger>
            <TabsTrigger value="social" className="text-xs">
              Social
            </TabsTrigger>
            <TabsTrigger value="friends" className="text-xs">
              Friends
            </TabsTrigger>
          </TabsList>

          {/* Inbox Tab */}
          <TabsContent value="inbox" className="flex-1 overflow-y-auto mt-0">
            {loadingConversations ? (
              <div className="space-y-1 p-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !conversations || conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground px-4 text-center">
                <MessageCircle size={32} className="mb-2 opacity-40" />
                <p className="text-sm font-medium">No conversations yet</p>
                <p className="text-xs mt-1 opacity-70">
                  Start a conversation from someone's profile.
                </p>
              </div>
            ) : (
              <div>
                {conversations.map((conv, idx) => (
                  <ConversationItem
                    key={idx}
                    conversation={conv}
                    myPrincipal={myPrincipal}
                    isActive={
                      activeConversation ===
                      (conv.participants[0].toString() === myPrincipal
                        ? conv.participants[1].toString()
                        : conv.participants[0].toString())
                    }
                    onClick={() => {
                      const other =
                        conv.participants[0].toString() === myPrincipal
                          ? conv.participants[1].toString()
                          : conv.participants[0].toString();
                      setActiveConversation(other);
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social" className="flex-1 overflow-y-auto mt-0">
            <SocialTab />
          </TabsContent>

          {/* Friends Tab */}
          <TabsContent value="friends" className="flex-1 overflow-y-auto mt-0">
            <FriendZoneTab onStartConversation={handleStartConversation} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Thread view */}
      <div
        className={`flex-1 overflow-hidden ${
          activeConversation ? 'flex flex-col' : 'hidden md:flex md:flex-col'
        }`}
      >
        {activeConversation ? (
          <ThreadView
            otherPrincipal={activeConversation}
            myPrincipal={myPrincipal}
            onBack={() => setActiveConversation(null)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageCircle size={48} className="mb-3 opacity-20" />
            <p className="text-sm font-medium">Select a conversation</p>
            <p className="text-xs mt-1 opacity-60">
              Choose from your inbox or start a new one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
