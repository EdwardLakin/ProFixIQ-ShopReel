"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [shopName, setShopName] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus(null);

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("You must be signed in to continue.");
      }

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim() || null,
          shop_name: shopName.trim() || null,
          onboarding_completed: true,
        },
      });

      if (updateError) {
        throw updateError;
      }

      router.push("/shopreel");
      router.refresh();
    } catch (submitError) {
      setStatus(
        submitError instanceof Error
          ? submitError.message
          : "Unable to complete onboarding.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-xl items-center px-6">
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold">Welcome to ShopReel</h1>
            <p className="mt-2 text-sm text-white/70">
              Finish a few basics, then head into the app.
            </p>
          </div>

          {status ? (
            <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
              {status}
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm text-white/80">Your name</span>
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none ring-0"
                placeholder="Edward Lakin"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-white/80">Shop name</span>
              <input
                type="text"
                value={shopName}
                onChange={(event) => setShopName(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none ring-0"
                placeholder="ProFixIQ Shop"
              />
            </label>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-2xl bg-white px-4 py-3 font-medium text-black disabled:opacity-60"
            >
              {busy ? "Saving..." : "Finish onboarding"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
