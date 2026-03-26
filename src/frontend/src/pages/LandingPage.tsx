import React from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LandingPage() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === "logging-in";

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error("Login error:", error);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between relative overflow-hidden"
      style={{ background: "oklch(0.05 0.008 265)" }}
    >
      {/* Background glow orbs */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        {/* Gold top-center glow */}
        <div
          className="float-orb absolute rounded-full blur-3xl opacity-25"
          style={{
            width: "520px",
            height: "320px",
            top: "-80px",
            left: "50%",
            transform: "translateX(-50%)",
            background:
              "radial-gradient(ellipse, oklch(0.78 0.16 75 / 0.6) 0%, transparent 70%)",
          }}
        />
        {/* Cyan bottom-right glow */}
        <div
          className="float-orb absolute rounded-full blur-3xl opacity-20"
          style={{
            width: "400px",
            height: "300px",
            bottom: "-60px",
            right: "-60px",
            background:
              "radial-gradient(ellipse, oklch(0.82 0.18 200 / 0.55) 0%, transparent 70%)",
            animationDelay: "3s",
          }}
        />
        {/* Purple left glow */}
        <div
          className="float-orb absolute rounded-full blur-3xl opacity-15"
          style={{
            width: "300px",
            height: "400px",
            top: "30%",
            left: "-80px",
            background:
              "radial-gradient(ellipse, oklch(0.52 0.24 300 / 0.5) 0%, transparent 70%)",
            animationDelay: "5s",
          }}
        />
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(oklch(1 0 0 / 0.025) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.025) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 w-full max-w-md mx-auto">
        {/* Wordmark */}
        <div className="mb-4 flex flex-col items-center">
          <h1
            className="font-display font-bold select-none"
            style={{
              fontSize: "clamp(3rem, 12vw, 4.5rem)",
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              background:
                "linear-gradient(135deg, #f5c842 0%, #e8a020 35%, #f97316 60%, #06b6d4 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 32px oklch(0.78 0.16 75 / 0.35))",
            }}
          >
            Smileup
          </h1>
          <p
            className="mt-3 text-sm font-medium tracking-widest uppercase"
            style={{ color: "oklch(0.55 0.015 60)", letterSpacing: "0.2em" }}
          >
            Share your world. Spread smiles.
          </p>
        </div>

        {/* Divider line */}
        <div
          className="w-16 h-px my-7"
          style={{
            background:
              "linear-gradient(90deg, transparent, oklch(0.78 0.16 75 / 0.5), transparent)",
          }}
        />

        {/* Login Button */}
        <button
          type="button"
          data-ocid="landing.primary_button"
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="w-full max-w-xs py-4 px-8 rounded-full font-semibold text-base transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
          style={{
            background:
              "linear-gradient(135deg, #f5c842 0%, #e8a020 45%, #06b6d4 100%)",
            color: "oklch(0.05 0.008 265)",
            boxShadow:
              "0 4px 32px oklch(0.78 0.16 75 / 0.35), 0 0 0 1px oklch(0.78 0.16 75 / 0.15)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 8px 48px oklch(0.78 0.16 75 / 0.5), 0 0 0 1px oklch(0.78 0.16 75 / 0.25)";
            (e.currentTarget as HTMLButtonElement).style.transform =
              "translateY(-1px) scale(1.02)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 4px 32px oklch(0.78 0.16 75 / 0.35), 0 0 0 1px oklch(0.78 0.16 75 / 0.15)";
            (e.currentTarget as HTMLButtonElement).style.transform = "";
          }}
        >
          {isLoggingIn ? (
            <>
              <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <span style={{ fontSize: "1.1rem" }}>✦</span>
              Get Started
            </>
          )}
        </button>

        <p
          className="mt-4 text-xs text-center"
          style={{ color: "oklch(0.40 0.010 265)" }}
        >
          Secured by Internet Identity
        </p>

        {/* Feature cards */}
        <div className="mt-12 grid grid-cols-3 gap-3 w-full">
          {[
            {
              emoji: "📸",
              label: "Posts",
              accent: "oklch(0.78 0.16 75 / 0.6)",
              border: "oklch(0.78 0.16 75 / 0.25)",
            },
            {
              emoji: "🎬",
              label: "ShortSport",
              accent: "oklch(0.82 0.18 200 / 0.6)",
              border: "oklch(0.82 0.18 200 / 0.25)",
            },
            {
              emoji: "💬",
              label: "Connect",
              accent: "oklch(0.52 0.24 300 / 0.6)",
              border: "oklch(0.52 0.24 300 / 0.22)",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-2.5 p-4 rounded-2xl transition-all duration-200"
              style={{
                background: "oklch(0.10 0.010 265 / 70%)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: `1px solid ${item.border}`,
                boxShadow: `0 4px 24px -4px ${item.accent.replace("0.6", "0.15")}`,
              }}
            >
              <span
                className="text-2xl"
                style={{ filter: `drop-shadow(0 0 8px ${item.accent})` }}
              >
                {item.emoji}
              </span>
              <span
                className="text-xs font-semibold tracking-wide"
                style={{ color: "oklch(0.80 0.010 60)" }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer
        className="relative z-10 w-full py-5 px-6 text-center"
        style={{ borderTop: "1px solid oklch(1 0 0 / 5%)" }}
      >
        <p className="text-xs" style={{ color: "oklch(0.35 0.008 265)" }}>
          © {new Date().getFullYear()} Smileup &nbsp;·&nbsp; Built with{" "}
          <span style={{ color: "#f5c842" }}>♥</span> using{" "}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "smileup-app")}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "oklch(0.55 0.015 60)" }}
            className="underline hover:opacity-80 transition-opacity"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
