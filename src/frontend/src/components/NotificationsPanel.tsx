import { Bell, Heart, MessageCircle, Users, X } from "lucide-react";
import React, { useRef, useEffect } from "react";
import {
  type Notification,
  type NotificationType,
  useGetNotifications,
  useMarkNotificationRead,
} from "../hooks/useQueries";
import AvatarPlaceholder from "./AvatarPlaceholder";

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
}

function getNotificationIcon(type: NotificationType) {
  if (type.__kind__ === "new_shadow")
    return <Users className="w-4 h-4 text-gold-400" />;
  if (type.__kind__ === "message")
    return <MessageCircle className="w-4 h-4 text-coral-400" />;
  if (type.__kind__ === "comment")
    return <Heart className="w-4 h-4 text-pink-400" />;
  return <Bell className="w-4 h-4 text-muted-foreground" />;
}

function getNotificationText(type: NotificationType): string {
  if (type.__kind__ === "new_shadow") return "started shadowing you";
  if (type.__kind__ === "message") return "sent you a message";
  if (type.__kind__ === "comment") return "commented on your post";
  return "sent you a notification";
}

function timeAgo(timestamp: bigint): string {
  const now = Date.now();
  const ts = Number(timestamp) / 1_000_000;
  const diff = Math.floor((now - ts) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function NotificationsPanel({
  open,
  onClose,
}: NotificationsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { data: notifications = [], isLoading } = useGetNotifications();
  const markRead = useMarkNotificationRead();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  if (!open) return null;

  const unreadCount = notifications.filter((n: Notification) => !n.read).length;

  return (
    <div
      ref={panelRef}
      className="absolute top-full right-0 mt-2 w-80 bg-surface-1 border border-border rounded-2xl shadow-card overflow-hidden z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gold-400" />
          <span className="text-foreground font-semibold text-sm">
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="bg-coral-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-gold-500/40 border-t-gold-500 rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <Bell className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-muted-foreground text-sm">
              No notifications yet
            </p>
          </div>
        ) : (
          notifications.map((notification: Notification) => (
            <button
              type="button"
              key={notification.id.toString()}
              onClick={() => {
                if (!notification.read) {
                  markRead.mutate();
                }
              }}
              className={`w-full flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0 cursor-pointer transition-colors hover:bg-surface-2 ${
                !notification.read ? "bg-gold-500/5" : ""
              }`}
            >
              <div className="relative flex-shrink-0">
                <AvatarPlaceholder
                  name={notification.fromPrincipal.toString().slice(0, 8)}
                  size="sm"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-surface-1 rounded-full flex items-center justify-center border border-border">
                  {getNotificationIcon(notification.notificationType)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground text-xs leading-relaxed">
                  <span className="font-semibold">
                    {notification.fromPrincipal.toString().slice(0, 8)}…
                  </span>{" "}
                  {getNotificationText(notification.notificationType)}
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {timeAgo(notification.timestamp)} ago
                </p>
              </div>
              {!notification.read && (
                <div className="w-2 h-2 bg-gold-500 rounded-full flex-shrink-0 mt-1" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
