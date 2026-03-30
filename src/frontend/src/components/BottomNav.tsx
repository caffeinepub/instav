import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Compass,
  Home,
  MessageCircle,
  Play,
  PlusSquare,
  User,
} from "lucide-react";
import React, { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetConversations } from "../hooks/useQueries";
import AuthPromptModal from "./AuthPromptModal";

export default function BottomNav() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: conversations } = useGetConversations();
  const [authPromptOpen, setAuthPromptOpen] = useState(false);

  const currentPath = routerState.location.pathname;

  // Hide on shortsport route
  if (currentPath === "/shortsport") return null;

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  const hasConversations = (conversations?.length ?? 0) > 0;

  // Tabs that require authentication
  const authRequiredPaths = new Set(["/create", "/messages", "/profile"]);

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Compass, label: "Explore", path: "/explore" },
    { icon: Play, label: "ShortSport", path: "/shortsport" },
    { icon: MessageCircle, label: "Messages", path: "/messages" },
    { icon: PlusSquare, label: "Create", path: "/create" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  const handleNav = (path: string) => {
    if (!isAuthenticated && authRequiredPaths.has(path)) {
      setAuthPromptOpen(true);
      return;
    }
    navigate({ to: path });
  };

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: "oklch(0.08 0.007 265 / 88%)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          borderTop: "1px solid oklch(1 0 0 / 6%)",
          boxShadow:
            "0 -1px 0 oklch(1 0 0 / 4%), 0 -4px 24px oklch(0 0 0 / 0.25)",
        }}
      >
        <div className="flex items-center justify-around max-w-2xl mx-auto px-2 py-1">
          {navItems.map(({ icon: Icon, label, path }) => {
            const active = isActive(path);
            const isMessages = path === "/messages";
            const needsAuth = !isAuthenticated && authRequiredPaths.has(path);

            return (
              <button
                type="button"
                key={path}
                onClick={() => handleNav(path)}
                className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-colors min-w-0 ${
                  active
                    ? "text-primary"
                    : needsAuth
                      ? "text-muted-foreground/50"
                      : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="relative">
                  <Icon
                    size={22}
                    strokeWidth={active ? 2.5 : 1.8}
                    className={active ? "text-primary" : ""}
                  />
                  {isMessages &&
                    hasConversations &&
                    !active &&
                    isAuthenticated && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                    )}
                </div>
                <span
                  className={`text-[10px] font-medium leading-none ${active ? "text-primary" : ""}`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <AuthPromptModal
        open={authPromptOpen}
        onClose={() => setAuthPromptOpen(false)}
      />
    </>
  );
}
