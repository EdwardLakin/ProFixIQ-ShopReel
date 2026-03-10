"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginPageInner() {
  const searchParams = useSearchParams();
  const next = useMemo(
    () => searchParams.get("next") ?? "/shopreel/settings",
    [searchParams],
  );

  const error = searchParams.get("error");
  const oauthError = searchParams.get("oauth_error");

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus(null);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: false,
        },
      });

      if (signInError) {
        throw signInError;
      }

      setStatus("Check your email for the sign-in link.");
    } catch (submitError) {
      setStatus(
        submitError instanceof Error ? submitError.message : "Unable to sign in.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold">Sign in to ShopReel</h1>
            <p className="mt-2 text-sm text-white/70">
              Use your email to continue into ShopReel.
            </p>
          </div>

          {error ? (
            <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {decodeURIComponent(error)}
            </div>
          ) : null}

          {oauthError ? (
            <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              {decodeURIComponent(oauthError)}
            </div>
          ) : null}

          {status ? (
            <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
              {status}
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
              {busy ? "Sending link..." : "Send sign-in link"}
            </button>
          </form>

          <p className="mt-6 text-sm text-white/70">
            Need an account?{" "}
            <Link
              className="text-white underline"
              href={`/signup?next=${encodeURIComponent(next)}`}
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-white">
          <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
            <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="text-sm text-white/70">Loading login...</div>
            </div>
          </div>
        </main>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}