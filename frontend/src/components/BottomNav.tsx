import React from 'react';
import { Home, Search, Zap, PlusSquare, User } from 'lucide-react';
import { useNavigate, useRouterState } from '@tanstack/react-router';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Search, label: 'Explore', path: '/explore' },
  { icon: Zap, label: 'ShortSport', path: '/shortsport' },
  { icon: PlusSquare, label: 'Create', path: '/create' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  // Hide on shortsport full-screen page
  if (currentPath === '/shortsport') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-t border-border">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = currentPath === path;
          const isShortSport = path === '/shortsport';
          return (
            <button
              key={path}
              onClick={() => navigate({ to: path })}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label={label}
            >
              <Icon
                className={`w-6 h-6 ${isShortSport && isActive ? 'text-primary' : ''}`}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : ''}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
