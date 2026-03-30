import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, LogIn, LogOut, Search } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetNotifications } from "../hooks/useQueries";
import NotificationsPanel from "./NotificationsPanel";

export default function TopBar() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const { identity, clear, login, loginStatus } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = !!identity;
  const currentPath = routerState.location.pathname;
  const isProfilePage = currentPath === "/profile";

  const { data: notifications } = useGetNotifications();
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  if (currentPath === "/shortsport") return null;

  const handleSignOut = async () => {
    await clear();
    queryClient.clear();
  };

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{
        background: "oklch(0.08 0.007 265 / 82%)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        borderBottom: "1px solid oklch(1 0 0 / 6%)",
        boxShadow: "0 1px 0 oklch(1 0 0 / 4%), 0 4px 24px oklch(0 0 0 / 0.3)",
      }}
    >
      <div className="flex items-center px-4 h-14 max-w-2xl mx-auto relative">
        {/* Left — Notification bell + Search */}
        <div className="flex items-center gap-1">
          {isAuthenticated && (
            <>
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setShowNotifications((v) => !v)}
                  className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                  aria-label="Notifications"
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "oklch(1 0 0 / 5%)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "transparent";
                  }}
                >
                  <Bell size={18} className="text-foreground/80" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-coral text-white text-[9px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5 leading-none">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                <NotificationsPanel
                  open={showNotifications}
                  onClose={() => setShowNotifications(false)}
                />
              </div>

              <button
                type="button"
                onClick={() => navigate({ to: "/explore" })}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                aria-label="Search"
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "oklch(1 0 0 / 5%)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
                }}
              >
                <Search size={18} className="text-foreground/80" />
              </button>
            </>
          )}

          {!isAuthenticated && (
            <button
              type="button"
              onClick={() => navigate({ to: "/explore" })}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
              aria-label="Search"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "oklch(1 0 0 / 5%)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "transparent";
              }}
            >
              <Search size={18} className="text-foreground/80" />
            </button>
          )}
        </div>

        {/* Center — Smileup wordmark */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="hover:opacity-80 transition-opacity"
            aria-label="Smileup Home"
          >
            <span
              className="font-display font-extrabold text-2xl tracking-normal whitespace-nowrap select-none"
              style={{
                background:
                  "linear-gradient(135deg, #f5c842 0%, #e8a020 50%, #ff6b6b 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Smileup
            </span>
          </button>
        </div>

        {/* Right */}
        <div className="ml-auto flex items-center gap-1">
          {!isAuthenticated && (
            <Button
              size="sm"
              onClick={() => login()}
              disabled={loginStatus === "logging-in"}
              className="gap-1.5 rounded-full text-xs font-semibold"
              style={{
                background: "linear-gradient(135deg, #f5c842, #e8a020)",
                color: "oklch(0.07 0.006 265)",
                border: "none",
              }}
            >
              {loginStatus === "logging-in" ? (
                <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <LogIn size={13} />
              )}
              Sign In
            </Button>
          )}

          {isAuthenticated && isProfilePage && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              disabled={loginStatus === "logging-in"}
              className="gap-1.5 rounded-full text-xs"
              style={{
                borderColor: "oklch(1 0 0 / 10%)",
                background: "oklch(1 0 0 / 4%)",
              }}
            >
              {loginStatus === "logging-in" ? (
                <span className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <LogOut size={13} />
              )}
              Sign Out
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
