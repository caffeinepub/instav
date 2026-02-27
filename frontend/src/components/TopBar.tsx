import React from 'react';
import { useRouterState, useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

const PAGE_TITLES: Record<string, string> = {
  '/': 'InstaV',
  '/explore': 'Explore',
  '/editor': 'Editor',
  '/profile': 'Profile',
  '/create': 'Create Post',
};

export default function TopBar() {
  const routerState = useRouterState();
  const navigate = useNavigate();
  const { identity, login, clear, loginStatus } = useInternetIdentity();
  const queryClient = useQueryClient();
  const currentPath = routerState.location.pathname;

  // Hide on shortsport full-screen page
  if (currentPath === '/shortsport') return null;

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const title = PAGE_TITLES[currentPath] || 'InstaV';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (err: any) {
        if (err?.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <button
          onClick={() => navigate({ to: '/' })}
          className="font-bold text-xl text-primary tracking-tight"
        >
          InstaV
        </button>

        <h1 className="absolute left-1/2 -translate-x-1/2 font-semibold text-sm text-foreground">
          {title}
        </h1>

        <button
          onClick={handleAuth}
          disabled={isLoggingIn}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            isAuthenticated
              ? 'bg-muted text-muted-foreground hover:bg-muted/80'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          } disabled:opacity-50`}
        >
          {isLoggingIn ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isAuthenticated ? 'Sign Out' : 'Sign In'}
        </button>
      </div>
    </header>
  );
}
