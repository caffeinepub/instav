import { Skeleton } from "@/components/ui/skeleton";
import type { Principal } from "@dfinity/principal";
import {
  ArrowLeft,
  MessageCircle,
  Search,
  Send,
  UserPlus,
  Users,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { UserProfile } from "../backend";
import AvatarPlaceholder from "../components/AvatarPlaceholder";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  type Conversation,
  type Message,
  useGetCallerUserProfile,
  useGetConversations,
  useGetFollowing,
  useGetFriendsList,
  useGetMessages,
  useGetUserProfile,
  useMarkMessagesRead,
  useSendMessage,
} from "../hooks/useQueries";

interface ShadowingUserItemProps {
  principalStr: string;
  onClick: () => void;
}

function ShadowingUserItem({ principalStr, onClick }: ShadowingUserItemProps) {
  const { data: profile } = useGetUserProfile(principalStr);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 w-full px-4 py-3 transition-colors text-left"
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          "oklch(1 0 0 / 4%)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      <AvatarPlaceholder
        name={profile?.name ?? principalStr.slice(0, 8)}
        profilePicture={profile?.profilePhoto}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <p className="text-foreground font-medium text-sm truncate">
          {profile?.name ?? `${principalStr.slice(0, 8)}…`}
        </p>
        {profile?.handle && (
          <p className="text-muted-foreground text-xs truncate">
            @{profile.handle}
          </p>
        )}
      </div>
    </button>
  );
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const timeStr = new Date(
    Number(message.timestamp) / 1_000_000,
  ).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
          isOwn ? "rounded-br-sm" : "rounded-bl-sm"
        }`}
        style={
          isOwn
            ? {
                background: "oklch(0.78 0.16 75 / 18%)",
                border: "1px solid oklch(0.78 0.16 75 / 35%)",
                color: "oklch(0.96 0.008 60)",
              }
            : {
                background: "oklch(0.15 0.011 265 / 80%)",
                border: "1px solid oklch(1 0 0 / 7%)",
                color: "oklch(0.96 0.008 60)",
              }
        }
      >
        <p className="text-sm leading-relaxed break-words">{message.content}</p>
        <p
          className="text-[10px] mt-1"
          style={{
            color: isOwn ? "oklch(0.78 0.16 75 / 65%)" : "oklch(0.55 0.015 60)",
          }}
        >
          {timeStr}
        </p>
      </div>
    </div>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

function ConversationItem({
  conversation,
  isActive,
  onClick,
}: ConversationItemProps) {
  const otherPrincipalStr = conversation.otherPrincipal.toString();
  const { data: profile } = useGetUserProfile(otherPrincipalStr);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 w-full px-4 py-3 transition-colors text-left"
      style={
        isActive
          ? {
              background: "oklch(0.78 0.16 75 / 8%)",
              borderRight: "2px solid oklch(0.78 0.16 75)",
            }
          : {}
      }
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLButtonElement).style.background =
            "oklch(1 0 0 / 4%)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLButtonElement).style.background =
            "transparent";
        }
      }}
    >
      <AvatarPlaceholder
        name={profile?.name ?? otherPrincipalStr.slice(0, 8)}
        profilePicture={profile?.profilePhoto}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <p className="text-foreground font-medium text-sm truncate">
          {profile?.name ?? `${otherPrincipalStr.slice(0, 8)}…`}
        </p>
        {profile?.handle && (
          <p className="text-muted-foreground text-xs truncate">
            @{profile.handle}
          </p>
        )}
      </div>
      {Number(conversation.unreadCount) > 0 && (
        <span className="bg-coral-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
          {Number(conversation.unreadCount)}
        </span>
      )}
    </button>
  );
}

interface MessagesPageProps {
  initialPrincipal?: string | null;
}

export default function MessagesPage({ initialPrincipal }: MessagesPageProps) {
  const { identity } = useInternetIdentity();
  const myPrincipal = identity?.getPrincipal().toString();

  const [activeTab, setActiveTab] = useState<"inbox" | "friends" | "shadowing">(
    "inbox",
  );
  const [activePrincipal, setActivePrincipal] = useState<string | null>(
    initialPrincipal ?? null,
  );
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], isLoading: convsLoading } =
    useGetConversations();
  const { data: messages = [], isLoading: msgsLoading } =
    useGetMessages(activePrincipal);
  const { data: friendsList = [] } = useGetFriendsList();
  const { data: followingList = [] } = useGetFollowing(myPrincipal);
  const { data: callerProfile } = useGetCallerUserProfile();
  const { data: activeProfile } = useGetUserProfile(activePrincipal);

  const sendMessage = useSendMessage();
  const markRead = useMarkMessagesRead();

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message list change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: markRead intentionally omitted to avoid infinite loop
  useEffect(() => {
    if (activePrincipal) {
      markRead.mutate(activePrincipal);
    }
  }, [activePrincipal]);

  const handleSend = async () => {
    if (!messageText.trim() || !activePrincipal) return;
    const text = messageText.trim();
    setMessageText("");
    await sendMessage
      .mutateAsync({ recipient: activePrincipal, content: text })
      .catch(() => {
        setMessageText(text);
      });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showThread = !!activePrincipal;

  return (
    <div className="flex h-[calc(100vh-120px)] bg-background">
      {/* Sidebar */}
      <div
        className={`${showThread ? "hidden md:flex" : "flex"} flex-col w-full md:w-80`}
        style={{
          background: "oklch(0.10 0.008 265 / 80%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRight: "1px solid oklch(1 0 0 / 6%)",
        }}
      >
        {/* Tabs */}
        <div
          className="flex"
          style={{ borderBottom: "1px solid oklch(1 0 0 / 6%)" }}
        >
          {(["inbox", "friends", "shadowing"] as const).map((tab) => (
            <button
              type="button"
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors"
              style={
                activeTab === tab
                  ? {
                      color: "#f5c842",
                      borderBottom: "2px solid #f5c842",
                    }
                  : {
                      color: "oklch(0.55 0.015 60)",
                      borderBottom: "2px solid transparent",
                    }
              }
            >
              {tab === "inbox"
                ? "Inbox"
                : tab === "friends"
                  ? "Friends"
                  : "Shadowing"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === "inbox" && (
            <div>
              {convsLoading ? (
                Array.from({ length: 4 }, (_, i) => `msg-skeleton-${i}`).map(
                  (k) => (
                    <div key={k} className="flex items-center gap-3 px-4 py-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="w-28 h-4 rounded" />
                        <Skeleton className="w-20 h-3 rounded" />
                      </div>
                    </div>
                  ),
                )
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <MessageCircle className="w-8 h-8 text-muted-foreground/30 mb-2" />
                  <p className="text-muted-foreground text-sm">
                    No conversations yet
                  </p>
                </div>
              ) : (
                conversations.map((conv: Conversation) => (
                  <ConversationItem
                    key={conv.otherPrincipal.toString()}
                    conversation={conv}
                    isActive={
                      activePrincipal === conv.otherPrincipal.toString()
                    }
                    onClick={() =>
                      setActivePrincipal(conv.otherPrincipal.toString())
                    }
                  />
                ))
              )}
            </div>
          )}

          {activeTab === "friends" &&
            (friendsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <Users className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-muted-foreground text-sm">No friends yet</p>
              </div>
            ) : (
              friendsList.map((principalStr: string) => (
                <ShadowingUserItem
                  key={principalStr}
                  principalStr={principalStr}
                  onClick={() => setActivePrincipal(principalStr)}
                />
              ))
            ))}

          {activeTab === "shadowing" &&
            (followingList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <UserPlus className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-muted-foreground text-sm">
                  Not shadowing anyone yet
                </p>
              </div>
            ) : (
              followingList.map((p: Principal) => (
                <ShadowingUserItem
                  key={p.toString()}
                  principalStr={p.toString()}
                  onClick={() => setActivePrincipal(p.toString())}
                />
              ))
            ))}
        </div>
      </div>

      {/* Thread */}
      {showThread ? (
        <div className="flex flex-col flex-1 min-w-0">
          {/* Thread header */}
          <div
            className="flex items-center gap-3 px-4 py-3"
            style={{
              background: "oklch(0.10 0.008 265 / 80%)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderBottom: "1px solid oklch(1 0 0 / 6%)",
            }}
          >
            <button
              type="button"
              onClick={() => setActivePrincipal(null)}
              className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <AvatarPlaceholder
              name={activeProfile?.name ?? activePrincipal?.slice(0, 8) ?? "?"}
              profilePicture={activeProfile?.profilePhoto}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-foreground font-semibold text-sm truncate">
                {activeProfile?.name ?? `${activePrincipal?.slice(0, 8)}…`}
              </p>
              {activeProfile?.handle && (
                <p className="text-muted-foreground text-xs">
                  @{activeProfile.handle}
                </p>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {msgsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div
                  className="w-6 h-6 border-2 rounded-full animate-spin"
                  style={{
                    borderColor: "oklch(0.78 0.16 75 / 30%)",
                    borderTopColor: "#f5c842",
                  }}
                />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageCircle className="w-10 h-10 text-muted-foreground/30 mb-2" />
                <p className="text-muted-foreground text-sm">No messages yet</p>
                <p className="text-muted-foreground/60 text-xs mt-1">
                  Say hello!
                </p>
              </div>
            ) : (
              messages.map((msg: Message, i) => (
                <MessageBubble
                  key={`msg-${msg.sender.toString()}-${i}`}
                  message={msg}
                  isOwn={msg.sender.toString() === myPrincipal}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            className="px-4 py-3 flex items-center gap-3"
            style={{
              background: "oklch(0.10 0.008 265 / 80%)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderTop: "1px solid oklch(1 0 0 / 6%)",
            }}
          >
            <AvatarPlaceholder
              name={callerProfile?.name ?? "Me"}
              profilePicture={callerProfile?.profilePhoto}
              size="sm"
            />
            <input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              className="flex-1 rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              style={{
                background: "oklch(0.15 0.011 265 / 80%)",
                border: "1px solid oklch(1 0 0 / 8%)",
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLInputElement).style.boxShadow =
                  "0 0 0 2px oklch(0.78 0.16 75 / 35%)";
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLInputElement).style.boxShadow = "none";
              }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!messageText.trim() || sendMessage.isPending}
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-50 transition-all"
              style={{
                background: "linear-gradient(135deg, #f5c842, #e8a020)",
                color: "oklch(0.07 0.006 265)",
              }}
            >
              {sendMessage.isPending ? (
                <span
                  className="w-4 h-4 border-2 rounded-full animate-spin"
                  style={{
                    borderColor: "oklch(0.07 0.006 265 / 40%)",
                    borderTopColor: "oklch(0.07 0.006 265)",
                  }}
                />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-center">
          <div>
            <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              Select a conversation
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
