import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  useGetNotifications,
  useMarkNotificationRead,
  useProfileByPrincipal,
} from '../hooks/useQueries';
import AvatarPlaceholder from './AvatarPlaceholder';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, UserPlus, MessageCircle } from 'lucide-react';
import type { Notification } from '../backend';
import { NotificationType } from '../backend';

function timeAgo(timestamp: bigint): string {
  const now = Date.now();
  const ts = Number(timestamp) / 1_000_000;
  const diff = Math.floor((now - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: () => void;
}) {
  const navigate = useNavigate();
  const fromPrincipal = notification.fromPrincipal.toString();
  const { data: profile } = useProfileByPrincipal(fromPrincipal);

  const handleClick = () => {
    onRead();
    if (notification.notificationType === NotificationType.new_shadow) {
      if (profile?.handle) {
        navigate({ to: '/profile/$handle', params: { handle: profile.handle } });
      }
    } else if (notification.notificationType === NotificationType.message) {
      navigate({ to: '/messages' });
    }
  };

  const getIcon = () => {
    switch (notification.notificationType) {
      case NotificationType.new_shadow:
        return <UserPlus size={12} className="text-primary" />;
      case NotificationType.message:
        return <MessageCircle size={12} className="text-blue-400" />;
      default:
        return <Bell size={12} className="text-muted-foreground" />;
    }
  };

  const getText = () => {
    const name = profile?.displayName ?? `@${fromPrincipal.slice(0, 8)}...`;
    switch (notification.notificationType) {
      case NotificationType.new_shadow:
        return (
          <>
            <span className="font-semibold">{name}</span> started shadowing you
          </>
        );
      case NotificationType.message:
        return (
          <>
            <span className="font-semibold">{name}</span> sent you a message
          </>
        );
      default:
        return (
          <>
            <span className="font-semibold">{name}</span> interacted with you
          </>
        );
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left ${
        !notification.read ? 'bg-primary/5' : ''
      }`}
    >
      <div className="relative shrink-0">
        <AvatarPlaceholder
          name={profile?.displayName ?? fromPrincipal.slice(0, 8)}
          profilePicture={profile?.profilePhoto}
          size="sm"
        />
        <span className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5 border border-border">
          {getIcon()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug">{getText()}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {timeAgo(notification.timestamp)}
        </p>
      </div>
      {!notification.read && (
        <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
      )}
    </button>
  );
}

interface NotificationsPanelProps {
  onClose: () => void;
}

export default function NotificationsPanel({ onClose }: NotificationsPanelProps) {
  const { data: notifications, isLoading } = useGetNotifications();
  const markRead = useMarkNotificationRead();

  const handleRead = (notificationId: bigint) => {
    markRead.mutate(notificationId);
    onClose();
  };

  return (
    <div className="w-80 max-h-[480px] flex flex-col bg-background border border-border rounded-xl shadow-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-sm">Notifications</h3>
        {notifications && notifications.filter((n) => !n.read).length > 0 && (
          <span className="text-xs text-muted-foreground">
            {notifications.filter((n) => !n.read).length} unread
          </span>
        )}
      </div>
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="space-y-1 p-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications && notifications.length > 0 ? (
          notifications.map((notif) => (
            <NotificationItem
              key={notif.id.toString()}
              notification={notif}
              onRead={() => handleRead(notif.id)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Bell size={28} className="mb-2 opacity-40" />
            <p className="text-sm">No notifications yet</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
