import { useNavigate, useRouterState } from '@tanstack/react-router';
import { Home, Compass, Play, PlusSquare, User } from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Compass, label: 'Explore', path: '/explore' },
  { icon: Play, label: 'ShortSport', path: '/shortsport' },
  { icon: PlusSquare, label: 'Create', path: '/create' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  if (currentPath === '/shortsport') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-background/90 backdrop-blur-md border-t border-border flex items-center">
      <div className="flex w-full">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = path === '/' ? currentPath === '/' : currentPath.startsWith(path);
          return (
            <button
              key={path}
              onClick={() => navigate({ to: path })}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label={label}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
