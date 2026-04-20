"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function ForgotPasswordPageInner() {
  const searchParams = useSearchParams();
  const next = useMemo(
    () => searchParams.get("next") ?? "/shopreel",
    [searchParams],
  );

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus(null);
    setError(null);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}&type=recovery`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo,
        },
      );

      if (resetError) {
        throw resetError;
      }

      setStatus(
        "If an account exists for that email, we've sent password reset instructions.",
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to process password reset request right now.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.12),transparent_34%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-md items-center px-6">
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="mb-6">
            <div className="mb-2 text-sm uppercase tracking-[0.25em] text-cyan-300/80">
              Recover access
            </div>
            <h1 className="text-2xl font-semibold">Forgot your password?</h1>
            <p className="mt-2 text-sm text-white/70">
              Enter your email and we&apos;ll send a secure password reset link.
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

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm text-white/80">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none ring-0"
                placeholder="you@example.com"
              />
            </label>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-2xl bg-white px-4 py-3 font-medium text-black disabled:opacity-60"
            >
              {busy ? "Sending reset link..." : "Send reset link"}
            </button>
          </form>

          <p className="mt-6 text-sm text-white/70">
            Remembered your password?{" "}
            <Link
              className="text-white underline"
              href={`/login?next=${encodeURIComponent(next)}`}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#050816] text-white">
          <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
            <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="text-sm text-white/70">Loading reset page...</div>
            </div>
          </div>
        </main>
      }
    >
      <ForgotPasswordPageInner />
    </Suspense>
  );
}
