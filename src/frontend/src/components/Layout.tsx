import { Outlet } from "@tanstack/react-router";
import React from "react";
import BottomNav from "./BottomNav";
import TopBar from "./TopBar";

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
