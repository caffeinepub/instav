import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import BottomNav from './BottomNav';
import TopBar from './TopBar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-background flex flex-col max-w-screen-sm mx-auto relative">
      <TopBar />
      <main className="flex-1 pb-20 pt-14">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
