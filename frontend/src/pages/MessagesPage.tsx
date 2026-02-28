import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useGetConversations,
  useGetMessages,
  useSendMessage,
  useMarkMessagesRead,
  useProfileByPrincipal,
} from '../hooks/useQueries';
import AvatarPlaceholder from '../components/AvatarPlaceholder';
import PostPickerModal from '../components/PostPickerModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageCircle, Film, ArrowLeft, LogIn } from 'lucide-react';
import type { Conversation, Message } from '../backend';

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
            className={`flex items-center gap-2 mb-1 text-sm font-medium hover:underline underline-offset-2 ${
              isMine ? 'text-primary-foreground/90' : 'text-primary'
            }`}
          >
            <Film size={14} />
            <span>View Shortspot</span>
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
    sendMessage.mutate({ recipient: otherPrincipal, content: text.trim() });
    setText('');
  };

  const handleSharePost = (postId: bigint) => {
    sendMessage.mutate({
      recipient: otherPrincipal,
      content: 'Shared a shortspot with you',
      postId,
    });
    setShowPostPicker(false);
  };

  const handleViewPost = (_postId: bigint) => {
    navigate({ to: '/shortsport' });
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

// ─── Main MessagesPage ────────────────────────────────────────────────────────

interface MessagesPageProps {
  initialPrincipal?: string;
}

export default function MessagesPage({ initialPrincipal }: MessagesPageProps) {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const [activePrincipal, setActivePrincipal] = useState<string | undefined>(
    initialPrincipal
  );

  const myPrincipal = identity?.getPrincipal().toString();
  const { data: conversations, isLoading } = useGetConversations();

  if (!identity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
        <MessageCircle size={48} className="text-muted-foreground opacity-50" />
        <h2 className="text-xl font-bold">Messages</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          Sign in to send and receive messages with other users.
        </p>
        <Button onClick={() => navigate({ to: '/profile' })} className="gap-2">
          <LogIn size={16} />
          Sign In to Continue
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden">
      {/* Conversation List */}
      <div
        className={`${
          activePrincipal ? 'hidden md:flex' : 'flex'
        } flex-col w-full md:w-80 border-r border-border bg-background shrink-0`}
      >
        <div className="px-4 py-4 border-b border-border">
          <h2 className="text-lg font-bold">Messages</h2>
        </div>
        <ScrollArea className="flex-1">
          {isLoading ? (
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
          ) : conversations && conversations.length > 0 ? (
            conversations.map((conv, idx) => {
              const other =
                conv.participants[0].toString() === myPrincipal
                  ? conv.participants[1].toString()
                  : conv.participants[0].toString();
              return (
                <ConversationItem
                  key={idx}
                  conversation={conv}
                  myPrincipal={myPrincipal!}
                  isActive={activePrincipal === other}
                  onClick={() => setActivePrincipal(other)}
                />
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground px-4 text-center">
              <MessageCircle size={32} className="mb-2 opacity-40" />
              <p className="text-sm">No conversations yet.</p>
              <p className="text-xs mt-1">Visit a user's profile to start chatting.</p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Thread View */}
      <div className={`${activePrincipal ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
        {activePrincipal && myPrincipal ? (
          <ThreadView
            otherPrincipal={activePrincipal}
            myPrincipal={myPrincipal}
            onBack={() => setActivePrincipal(undefined)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageCircle size={48} className="mb-3 opacity-30" />
            <p className="text-sm">Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
