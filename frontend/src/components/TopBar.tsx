import { useState, useRef, useEffect } from 'react';
import { Bell, Search, LogOut } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useGetNotifications, useMarkNotificationRead } from '../hooks/useQueries';
import { NotificationType } from '../backend';

export default function TopBar() {
  const navigate = useNavigate();
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const { data: notifications = [] } = useGetNotifications();
  const markRead = useMarkNotificationRead();

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const getNotifLabel = (type: NotificationType) => {
    switch (type) {
      case NotificationType.new_shadow: return 'started shadowing you';
      case NotificationType.message: return 'sent you a message';
      case NotificationType.comment: return 'commented on your post';
      default: return 'interacted with you';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-background/90 backdrop-blur-md border-b border-border flex items-center px-4">
      {/* Wordmark */}
      <div className="flex-1">
        <span className="text-xl font-bold font-display bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Smileup
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => navigate({ to: '/explore' })}
          className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Search"
        >
          <Search size={20} />
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(v => !v)}
            className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground relative"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-xl shadow-card overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                    No notifications yet
                  </div>
                ) : (
                  notifications
                    .slice()
                    .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
                    .map(notif => (
                      <div
                        key={String(notif.id)}
                        className={`px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-muted/50 transition-colors ${!notif.read ? 'bg-primary/5' : ''}`}
                        onClick={() => {
                          if (!notif.read) markRead.mutate(notif.id);
                        }}
                      >
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!notif.read ? 'bg-accent' : 'bg-transparent'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">
                            <span className="font-medium">Someone</span>{' '}
                            {getNotifLabel(notif.notificationType)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(Number(notif.timestamp) / 1_000_000).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}
        </div>

        {identity && (
          <button
            onClick={handleLogout}
            className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Sign out"
          >
            <LogOut size={20} />
          </button>
        )}
      </div>
    </header>
  );
}
