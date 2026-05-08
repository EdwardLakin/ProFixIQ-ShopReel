"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LandingAuthShell, LandingInput, LandingSubmitButton } from "@/features/landing/components/LandingAuthShell";

function SignupPageInner() {
  const searchParams = useSearchParams();
  const next = useMemo(() => searchParams.get("next") ?? "/shopreel", [searchParams]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus(null);

    try {
      if (password.length < 8) throw new Error("Password must be at least 8 characters.");
      if (password !== confirmPassword) throw new Error("Passwords do not match.");

      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/onboarding")}&type=signup`;
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });
      if (error) throw error;
      setStatus("Account created. Check your email to confirm your address, then continue onboarding.");
    } catch (submitError) {
      setStatus(submitError instanceof Error ? submitError.message : "Unable to sign up.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <LandingAuthShell
      eyebrow="Get started"
      title="Create your ShopReel account"
      subtitle="Start with a brand-ready creative workspace and operator-controlled AI workflows."
      footer={<>Already have an account? <Link className="text-cyan-100 underline" href={`/login?next=${encodeURIComponent(next)}`}>Sign in</Link></>}
    >
      {status ? <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white/80">{status}</div> : null}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <LandingInput label="Email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
        <LandingInput label="Password" type="password" required autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" />
        <LandingInput label="Confirm password" type="password" required autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Re-enter your password" />
        <LandingSubmitButton busy={busy} busyLabel="Creating account...">Create account</LandingSubmitButton>
      </form>
    </LandingAuthShell>
  );
}

export default function SignupPage() {
  return <Suspense fallback={<main className="min-h-screen bg-[#02040d] text-white" />}><SignupPageInner /></Suspense>;
}
