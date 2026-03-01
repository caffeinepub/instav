import React from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetConversations, useGetMessages } from '../hooks/useQueries';
import { Home, Compass, Play, PlusSquare, User, MessageCircle } from 'lucide-react';

function useUnreadMessageCount() {
  const { identity } = useInternetIdentity();
  const myPrincipal = identity?.getPrincipal().toString();
  const { data: conversations } = useGetConversations();

  // Count conversations that have unread messages
  // We use a simple heuristic: conversations with lastUpdated > some threshold
  // Since we can't easily get all messages here, we count conversations
  const count = conversations?.length ?? 0;
  return count > 0 ? 0 : 0; // Will be updated per conversation in the actual view
}

export default function BottomNav() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const { identity } = useInternetIdentity();
  const { data: conversations } = useGetConversations();
  const myPrincipal = identity?.getPrincipal().toString();

  const currentPath = routerState.location.pathname;

  // Hide on shortsport route
  if (currentPath === '/shortsport') return null;

  const isActive = (path: string) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  // Count unread: conversations where we have unread messages
  // We approximate by checking if there are any conversations
  const hasConversations = (conversations?.length ?? 0) > 0;

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Compass, label: 'Explore', path: '/explore' },
    { icon: Play, label: 'ShortSport', path: '/shortsport' },
    { icon: MessageCircle, label: 'Messages', path: '/messages' },
    { icon: PlusSquare, label: 'Create', path: '/create' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-t border-border">
      <div className="flex items-center justify-around max-w-2xl mx-auto px-2 py-1">
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = isActive(path);
          const isMessages = path === '/messages';

          return (
            <button
              key={path}
              onClick={() => navigate({ to: path })}
              className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-colors min-w-0 ${
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="relative">
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.8}
                  className={active ? 'text-primary' : ''}
                />
                {isMessages && hasConversations && !active && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                )}
              </div>
              <span className={`text-[10px] font-medium leading-none ${active ? 'text-primary' : ''}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
