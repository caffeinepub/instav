import React from 'react';
import { Outlet } from '@tanstack/react-router';
import TopBar from './TopBar';
import BottomNav from './BottomNav';

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      <div className="flex-1">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
