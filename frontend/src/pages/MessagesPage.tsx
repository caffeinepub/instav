import { useState } from 'react';
import { ArrowLeft, Send, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MOCK_CONVERSATIONS } from '@/lib/mockData';
import type { Conversation, Message } from '@/lib/mockData';
import AvatarPlaceholder from '@/components/AvatarPlaceholder';
import { timeAgo, formatNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function MessagesPage() {
  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');

  const handleSend = () => {
    if (!newMessage.trim() || !activeConv) return;
    const msg: Message = {
      id: `m${Date.now()}`,
      senderId: 'me',
      text: newMessage,
      createdAt: new Date(),
      isRead: false,
    };
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConv.id
          ? { ...c, messages: [...c.messages, msg], lastMessage: newMessage, lastMessageAt: new Date(), unread: 0 }
          : c
      )
    );
    setActiveConv((prev) =>
      prev ? { ...prev, messages: [...prev.messages, msg], lastMessage: newMessage } : prev
    );
    setNewMessage('');
  };

  if (activeConv) {
    const conv = conversations.find((c) => c.id === activeConv.id) ?? activeConv;
    return (
      <div className="flex flex-col h-[calc(100vh-7rem)]">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-background/80 backdrop-blur-md">
          <Button variant="ghost" size="icon" onClick={() => setActiveConv(null)} className="text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <AvatarPlaceholder userId={conv.user.id} displayName={conv.user.displayName} size="sm" />
          <div>
            <p className="font-semibold text-sm text-foreground">{conv.user.displayName}</p>
            <p className="text-xs text-muted-foreground">@{conv.user.username}</p>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-3">
          <div className="space-y-3">
            {conv.messages.map((msg) => {
              const isMe = msg.senderId === 'me';
              return (
                <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                  {!isMe && (
                    <AvatarPlaceholder userId={conv.user.id} displayName={conv.user.displayName} size="xs" className="mr-2 mt-1 flex-shrink-0" />
                  )}
                  <div
                    className={cn(
                      'max-w-[75%] px-4 py-2.5 rounded-2xl text-sm',
                      isMe
                        ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-br-sm'
                        : 'bg-muted text-foreground rounded-bl-sm'
                    )}
                  >
                    <p>{msg.text}</p>
                    <p className={cn('text-[10px] mt-1', isMe ? 'text-white/70 text-right' : 'text-muted-foreground')}>
                      {timeAgo(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="px-4 py-3 border-t border-border/50 flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Message..."
            className="flex-1 bg-muted border-0 rounded-full text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="rounded-full bg-gradient-to-r from-amber-500 to-rose-500 border-0 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search messages..." className="pl-9 bg-muted border-0 rounded-2xl text-sm" />
        </div>
      </div>

      <div className="divide-y divide-border/30">
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => setActiveConv(conv)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
          >
            <div className="relative">
              <AvatarPlaceholder userId={conv.user.id} displayName={conv.user.displayName} size="md" />
              {conv.unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                  {conv.unread}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <p className="font-semibold text-sm text-foreground">{conv.user.displayName}</p>
                <span className="text-xs text-muted-foreground">{timeAgo(conv.lastMessageAt)}</span>
              </div>
              <p className={cn('text-sm truncate', conv.unread > 0 ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                {conv.lastMessage}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
