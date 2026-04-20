"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function ResetPasswordPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = useMemo(
    () => searchParams.get("next") ?? "/login",
    [searchParams],
  );

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const initialize = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("This reset link is invalid or has expired. Request a new password reset email.");
      }

      setReady(true);
    };

    void initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setError(null);
        setReady(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus(null);
    setError(null);

    try {
      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters.");
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw updateError;
      }

      setStatus("Password updated successfully. Redirecting you back to sign in...");

      await supabase.auth.signOut();

      window.setTimeout(() => {
        router.push(next);
      }, 1200);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to update password right now.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(236,72,153,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_34%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-md items-center px-6">
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="mb-6">
            <div className="mb-2 text-sm uppercase tracking-[0.25em] text-violet-300/80">
              Secure reset
            </div>
            <h1 className="text-2xl font-semibold">Set a new password</h1>
            <p className="mt-2 text-sm text-white/70">
              Choose a strong new password for your ShopReel account.
            </p>
          </div>

          {status ? (
            <div className="mb-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              {status}
            </div>
          ) : null}

          {error ? (
            <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {!ready ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
              Validating your reset link...
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm text-white/80">New password</span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none ring-0"
                placeholder="At least 8 characters"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-white/80">Confirm new password</span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none ring-0"
                placeholder="Re-enter your new password"
              />
            </label>

            <button
              type="submit"
              disabled={busy || !ready || Boolean(error)}
              className="w-full rounded-2xl bg-white px-4 py-3 font-medium text-black disabled:opacity-60"
            >
              {busy ? "Updating password..." : "Update password"}
            </button>
          </form>

          <p className="mt-6 text-sm text-white/70">
            Need a fresh link?{" "}
            <Link className="text-white underline" href="/forgot-password">
              Request another reset email
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#050816] text-white">
          <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
            <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="text-sm text-white/70">Loading password reset...</div>
            </div>
          </div>
        </main>
      }
    >
      <ResetPasswordPageInner />
    </Suspense>
  );
}
