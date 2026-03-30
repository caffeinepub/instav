import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";
import React from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface AuthPromptModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AuthPromptModal({
  open,
  onClose,
}: AuthPromptModalProps) {
  const { login, isLoggingIn } = useInternetIdentity();

  const handleLogin = () => {
    login();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-sm mx-auto rounded-2xl border text-center"
        style={{
          background: "oklch(0.11 0.009 265)",
          borderColor: "oklch(1 0 0 / 8%)",
        }}
      >
        <DialogHeader>
          <div className="flex justify-center mb-3">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, #f5c842, #e8a020, #ff6b6b)",
              }}
            >
              <UserPlus className="w-6 h-6 text-black" />
            </div>
          </div>
          <DialogTitle className="text-foreground text-lg">
            Create your profile first
          </DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm mt-1 mb-5">
          Sign in with Internet Identity to like, comment, follow, and post on
          Smileup.
        </p>
        <button
          type="button"
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-60"
          style={{
            background: "linear-gradient(135deg, #f5c842, #e8a020)",
            color: "oklch(0.07 0.006 265)",
            boxShadow: "0 2px 16px oklch(0.78 0.16 75 / 0.35)",
          }}
        >
          {isLoggingIn ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Connecting…
            </span>
          ) : (
            "Sign In with Internet Identity"
          )}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Maybe later
        </button>
      </DialogContent>
    </Dialog>
  );
}
