"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function SignupPageInner() {
  const searchParams = useSearchParams();
  const next = useMemo(
    () => searchParams.get("next") ?? "/shopreel/settings",
    [searchParams],
  );

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

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true,
        },
      });

      if (error) {
        throw error;
      }

      setStatus("Check your email to finish sign up.");
    } catch (submitError) {
      setStatus(
        submitError instanceof Error ? submitError.message : "Unable to sign up.",
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
            <h1 className="text-2xl font-semibold">Create your ShopReel account</h1>
            <p className="mt-2 text-sm text-white/70">
              Start with your email, then come back into the app from the link.
            </p>
          </div>

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
              {busy ? "Sending link..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-sm text-white/70">
            Already have an account?{" "}
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

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-white">
          <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
            <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="text-sm text-white/70">Loading sign up...</div>
            </div>
          </div>
        </main>
      }
    >
      <SignupPageInner />
    </Suspense>
  );
}