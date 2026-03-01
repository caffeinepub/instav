import { Outlet } from '@tanstack/react-router';
import TopBar from './TopBar';
import BottomNav from './BottomNav';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopBar />
      <main className="flex-1 pt-14 pb-16">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
