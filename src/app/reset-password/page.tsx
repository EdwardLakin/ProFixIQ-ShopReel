"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LandingAuthShell, LandingInput, LandingSubmitButton } from "@/features/landing/components/LandingAuthShell";

function ResetPasswordPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = useMemo(() => searchParams.get("next") ?? "/login", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) setError("This reset link is invalid or has expired. Request a new password reset email.");
      setReady(true);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setError(null);
        setReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus(null);
    setError(null);

    try {
      if (password.length < 8) throw new Error("Password must be at least 8 characters.");
      if (password !== confirmPassword) throw new Error("Passwords do not match.");
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setStatus("Password updated successfully. Redirecting you back to sign in...");
      await supabase.auth.signOut();
      window.setTimeout(() => router.push(next), 1200);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to update password right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <LandingAuthShell
      eyebrow="Secure reset"
      title="Set a new password"
      subtitle="Choose a strong password for your ShopReel account."
      footer={<>Need a fresh link? <Link className="text-cyan-100 underline" href="/forgot-password">Request another reset email</Link></>}
    >
      {status ? <div className="mb-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{status}</div> : null}
      {error ? <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}
      {!ready ? <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white/80">Validating your reset link...</div> : null}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <LandingInput label="New password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" />
        <LandingInput label="Confirm new password" type="password" required minLength={8} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Re-enter your new password" />
        <LandingSubmitButton busy={busy} busyLabel="Updating password..." disabled={!ready || Boolean(error)}>Update password</LandingSubmitButton>
      </form>
    </LandingAuthShell>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<main className="min-h-screen bg-[#02040d] text-white" />}><ResetPasswordPageInner /></Suspense>;
}
