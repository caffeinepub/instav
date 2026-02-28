import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useGetNotifications } from '../hooks/useQueries';
import NotificationsPanel from './NotificationsPanel';
import { Bell, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TopBar() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const { identity, login, clear, loginStatus } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = !!identity;
  const currentPath = routerState.location.pathname;

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

  const getPageTitle = () => {
    if (currentPath === '/') return 'Home';
    if (currentPath === '/explore') return 'Explore';
    if (currentPath === '/profile') return 'Profile';
    if (currentPath === '/create') return 'Create Post';
    if (currentPath === '/editor') return 'Editor';
    if (currentPath.startsWith('/messages')) return 'Messages';
    if (currentPath.startsWith('/profile/')) return 'Profile';
    if (currentPath.startsWith('/user/')) return 'Profile';
    return 'InstaV';
  };

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          error.message === 'User is already authenticated'
        ) {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between px-4 h-14 max-w-2xl mx-auto">
        {/* Brand */}
        <button
          onClick={() => navigate({ to: '/' })}
          className="font-bold text-lg tracking-tight text-foreground hover:text-primary transition-colors"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          InstaV
        </button>

        {/* Page Title */}
        <span className="text-sm font-medium text-muted-foreground absolute left-1/2 -translate-x-1/2">
          {getPageTitle()}
        </span>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Bell Icon — only for authenticated users */}
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
                <div className="absolute right-0 top-full mt-2 z-50">
                  <NotificationsPanel onClose={() => setShowNotifications(false)} />
                </div>
              )}
            </div>
          )}

          {/* Auth Button */}
          <Button
            variant={isAuthenticated ? 'outline' : 'default'}
            size="sm"
            onClick={handleAuth}
            disabled={loginStatus === 'logging-in'}
            className="gap-1.5 rounded-full text-xs"
          >
            {loginStatus === 'logging-in' ? (
              <span className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
            ) : isAuthenticated ? (
              <LogOut size={13} />
            ) : (
              <LogIn size={13} />
            )}
            {loginStatus === 'logging-in'
              ? 'Signing in...'
              : isAuthenticated
              ? 'Sign Out'
              : 'Sign In'}
          </Button>
        </div>
      </div>
    </header>
  );
}
