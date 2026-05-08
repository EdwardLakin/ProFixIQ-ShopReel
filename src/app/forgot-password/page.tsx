"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LandingAuthShell, LandingInput, LandingSubmitButton } from "@/features/landing/components/LandingAuthShell";

function ForgotPasswordPageInner() {
  const searchParams = useSearchParams();
  const next = useMemo(() => searchParams.get("next") ?? "/shopreel", [searchParams]);
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
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (resetError) throw resetError;
      setStatus("If an account exists for that email, we sent password reset instructions.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to process password reset request right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <LandingAuthShell
      eyebrow="Recover access"
      title="Reset your password"
      subtitle="We’ll send a secure recovery link so you can get back into your creative workspace."
      footer={<>Remembered your password? <Link className="text-cyan-100 underline" href={`/login?next=${encodeURIComponent(next)}`}>Sign in</Link></>}
    >
      {status ? <div className="mb-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{status}</div> : null}
      {error ? <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <LandingInput label="Email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
        <LandingSubmitButton busy={busy} busyLabel="Sending reset link...">Send reset link</LandingSubmitButton>
      </form>
    </LandingAuthShell>
  );
}

export default function ForgotPasswordPage() {
  return <Suspense fallback={<main className="min-h-screen bg-[#02040d] text-white" />}><ForgotPasswordPageInner /></Suspense>;
}
