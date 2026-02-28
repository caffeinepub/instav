import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useGetNotifications } from '../hooks/useQueries';
import NotificationsPanel from './NotificationsPanel';
import { Bell, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TopBar() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const { identity, clear, loginStatus } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = !!identity;
  const currentPath = routerState.location.pathname;
  const isProfilePage = currentPath === '/profile';

  const { data: notifications } = useGetNotifications();
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  // Close notifications panel on outside click — must be before any early return
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  // Hide on shortsport route — after all hooks
  if (currentPath === '/shortsport') return null;

  const handleSignOut = async () => {
    await clear();
    queryClient.clear();
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center px-4 h-14 max-w-2xl mx-auto relative">

        {/* Left — Notification bell */}
        <div className="flex items-center">
          {isAuthenticated && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications((v) => !v)}
                className="relative p-2 rounded-full hover:bg-muted transition-colors"
                aria-label="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute left-0 top-full mt-2 z-50">
                  <NotificationsPanel onClose={() => setShowNotifications(false)} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center — Smileup wordmark (absolutely centered) */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <button
            onClick={() => navigate({ to: '/' })}
            className="hover:opacity-80 transition-opacity"
            aria-label="Smileup Home"
          >
            <span
              className="font-display font-extrabold text-2xl tracking-tight select-none"
              style={{
                background: 'linear-gradient(135deg, #C026D3 0%, #7C3AED 50%, #38BDF8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Smileup
            </span>
          </button>
        </div>

        {/* Right — Sign Out (only on /profile page) */}
        <div className="ml-auto flex items-center">
          {isAuthenticated && isProfilePage && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              disabled={loginStatus === 'logging-in'}
              className="gap-1.5 rounded-full text-xs"
            >
              {loginStatus === 'logging-in' ? (
                <span className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <LogOut size={13} />
              )}
              Sign Out
            </Button>
          )}
        </div>

      </div>
    </header>
  );
}
