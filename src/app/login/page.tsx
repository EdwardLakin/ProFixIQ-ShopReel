"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LandingAuthShell, LandingInput, LandingSubmitButton } from "@/features/landing/components/LandingAuthShell";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = useMemo(() => searchParams.get("next") ?? "/shopreel", [searchParams]);
  const error = searchParams.get("error");
  const oauthError = searchParams.get("oauth_error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      router.push(next);
      router.refresh();
    } catch (submitError) {
      setStatus(submitError instanceof Error ? submitError.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <LandingAuthShell
      eyebrow="Welcome back"
      title="Sign in to ShopReel"
      subtitle="Return to your AI creative operating system."
      footer={<>Need an account? <Link className="text-cyan-100 underline" href={`/signup?next=${encodeURIComponent(next)}`}>Sign up</Link></>}
    >
      {error ? <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{decodeURIComponent(error)}</div> : null}
      {oauthError ? <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">{decodeURIComponent(oauthError)}</div> : null}
      {status ? <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white/80">{status}</div> : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <LandingInput label="Email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-white/82">Password</span>
            <Link href={`/forgot-password?next=${encodeURIComponent(next)}`} className="text-xs text-cyan-100/80 underline hover:text-white">Forgot password?</Link>
          </div>
          <LandingInput label="" type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" />
        </div>
        <LandingSubmitButton busy={busy} busyLabel="Signing in...">Sign in</LandingSubmitButton>
      </form>
    </LandingAuthShell>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<main className="min-h-screen bg-[#02040d] text-white" />}><LoginPageInner /></Suspense>;
}
