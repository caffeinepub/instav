import { Smile } from "lucide-react";
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
    <div className="min-h-screen flex flex-col items-center justify-between bg-background">
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 w-full max-w-md mx-auto">
        {/* Wordmark */}
        <div className="mb-8 flex flex-col items-center">
          <span
            className="font-display font-extrabold text-5xl tracking-normal whitespace-nowrap select-none"
            style={{
              background:
                "linear-gradient(135deg, #C026D3 0%, #7C3AED 50%, #38BDF8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Smileup
          </span>
        </div>

        {/* Tagline */}
        <div className="text-center mb-10">
          <p className="text-muted-foreground text-base leading-relaxed">
            Share your moments, spread smiles, and connect with people who make
            you happy.
          </p>
        </div>

        {/* Login Button */}
        <button
          type="button"
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="w-full max-w-xs py-3.5 px-8 rounded-full font-semibold text-base text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background:
              "linear-gradient(135deg, #C026D3 0%, #7C3AED 50%, #38BDF8 100%)",
          }}
        >
          {isLoggingIn ? (
            <>
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <Smile size={20} />
              Get Started
            </>
          )}
        </button>

        <p className="mt-4 text-xs text-muted-foreground text-center">
          Secure login powered by Internet Identity
        </p>

        {/* Feature highlights */}
        <div className="mt-14 grid grid-cols-3 gap-4 w-full">
          {[
            { emoji: "📸", label: "Share Posts" },
            { emoji: "🎬", label: "Short Videos" },
            { emoji: "💬", label: "Connect" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border"
            >
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-xs font-medium text-muted-foreground">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-5 px-6 text-center border-t border-border">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Smileup &nbsp;·&nbsp; Built with{" "}
          <span style={{ color: "#C026D3" }}>♥</span> using{" "}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "smileup-app")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
