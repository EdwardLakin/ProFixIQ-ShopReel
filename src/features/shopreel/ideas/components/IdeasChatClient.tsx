"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type IdeaAngle = {
  title: string;
  angle: string;
  hook: string;
  whyItWorks: string;
  suggestedCta: string;
};

type IdeasChatResponse = {
  reply: string;
  angles: IdeaAngle[];
  recommendedPrompt: string;
  followUpQuestions: string[];
};

const STARTERS = [
  "Launch a new app using screenshots",
  "Turn a product demo into social posts",
  "Create founder-led content ideas",
  "Repurpose one video into a campaign",
  "Brainstorm hooks for a new feature",
  "Create a launch sequence for Instagram and Facebook",
];

function encodeCreatePrompt(prompt: string) {
  return `/shopreel/create?prompt=${encodeURIComponent(prompt)}`;
}

export default function IdeasChatClient() {
  const [idea, setIdea] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [angles, setAngles] = useState<IdeaAngle[]>([]);
  const [recommendedPrompt, setRecommendedPrompt] = useState("");
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const latestAssistant = useMemo(
    () => [...messages].reverse().find((message) => message.role === "assistant"),
    [messages],
  );

  async function sendIdea(text?: string) {
    const content = (text ?? idea).trim();
    if (!content) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];

    setMessages(nextMessages);
    setIdea("");
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/shopreel/ideas/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          idea: content,
          messages: nextMessages,
        }),
      });

      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        result?: IdeasChatResponse;
      };

      if (!res.ok || !json.ok || !json.result) {
        throw new Error(json.error ?? "Failed to brainstorm idea.");
      }

      setAngles(json.result.angles);
      setRecommendedPrompt(json.result.recommendedPrompt);
      setFollowUpQuestions(json.result.followUpQuestions);
      setMessages((current) => [
        ...current,
        { role: "assistant", content: json.result?.reply ?? "Here are some angles to explore." },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to brainstorm idea.");
    } finally {
      setBusy(false);
    }
  }

  function useAngle(angle: IdeaAngle) {
    const prompt = [
      angle.hook,
      "",
      angle.angle,
      "",
      `Why this works: ${angle.whyItWorks}`,
      "",
      `CTA: ${angle.suggestedCta}`,
    ].join("\n");

    setRecommendedPrompt(prompt);
    setIdea(`Make this stronger for Instagram and Facebook:\n\n${prompt}`);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-4">
        <GlassCard label="Ideas chat" title="Brainstorm with ShopReel AI" strong>
          <div className="space-y-4">
            <div className="rounded-3xl border border-violet-300/25 bg-[radial-gradient(circle_at_10%_0%,rgba(122,92,255,0.22),transparent_36%),rgba(255,255,255,0.035)] p-4">
              <p className="text-sm leading-6 text-white/75">
                Start with a rough product idea, campaign concept, app screenshot, launch angle, founder story, or social media question. ShopReel will turn it into angles you can use in Create.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.18em] text-white/45">
                Your idea or question
              </label>
              <textarea
                value={idea}
                onChange={(event) => setIdea(event.target.value)}
                placeholder="Example: I want to launch PayProof to flat-rate technicians. Give me strong Facebook and Instagram angles."
                className="min-h-36 w-full rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-white outline-none placeholder:text-white/40 focus:border-cyan-300/40"
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-300/30 bg-rose-500/10 p-3 text-sm text-rose-100">
                {error}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <GlassButton onClick={() => void sendIdea()} disabled={busy}>
                {busy ? "Brainstorming…" : "Brainstorm angles"}
              </GlassButton>
              {recommendedPrompt ? (
                <Link href={encodeCreatePrompt(recommendedPrompt)}>
                  <GlassButton variant="ghost">Create from recommended prompt</GlassButton>
                </Link>
              ) : null}
            </div>
          </div>
        </GlassCard>

        {messages.length > 0 ? (
          <GlassCard label="Conversation" title="Brainstorming thread">
            <div className="space-y-3">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={
                    message.role === "user"
                      ? "rounded-2xl border border-cyan-300/20 bg-cyan-500/[0.07] p-3"
                      : "rounded-2xl border border-white/10 bg-white/[0.035] p-3"
                  }
                >
                  <div className="mb-1 text-xs uppercase tracking-[0.16em] text-white/45">
                    {message.role === "user" ? "You" : "ShopReel AI"}
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-white/82">{message.content}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        ) : null}

        {angles.length > 0 ? (
          <GlassCard label="Angles" title="Content angles to explore" strong>
            <div className="grid gap-3 md:grid-cols-2">
              {angles.map((angle) => (
                <article key={`${angle.title}-${angle.hook}`} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="text-sm font-semibold text-white">{angle.title}</div>
                  <p className="mt-2 text-sm leading-6 text-white/75">{angle.angle}</p>
                  <div className="mt-3 rounded-xl border border-violet-300/20 bg-violet-400/[0.06] p-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-violet-100/60">Hook</div>
                    <p className="mt-1 text-sm font-medium text-white">{angle.hook}</p>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-white/60">
                    <span className="text-white/80">Why it works:</span> {angle.whyItWorks}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-white/60">
                    <span className="text-white/80">CTA:</span> {angle.suggestedCta}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <GlassButton variant="ghost" onClick={() => useAngle(angle)}>
                      Use this angle
                    </GlassButton>
                    <Link href={encodeCreatePrompt(`${angle.hook}\n\n${angle.angle}\n\nCTA: ${angle.suggestedCta}`)}>
                      <GlassButton variant="ghost">Create</GlassButton>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </GlassCard>
        ) : null}
      </section>

      <aside className="space-y-4">
        <GlassCard label="Prompt starters" title="Start faster">
          <div className="space-y-2">
            {STARTERS.map((starter) => (
              <button
                key={starter}
                type="button"
                onClick={() => setIdea(starter)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-left text-sm text-white/75 transition hover:bg-white/[0.07]"
              >
                {starter}
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard label="Follow-ups" title="Ask the next question">
          {followUpQuestions.length > 0 ? (
            <div className="space-y-2">
              {followUpQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => void sendIdea(question)}
                  className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-left text-sm text-white/75 transition hover:bg-white/[0.07]"
                >
                  {question}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-6 text-white/65">
              After your first brainstorm, ShopReel will suggest follow-up questions to sharpen the idea.
            </p>
          )}
        </GlassCard>

        <GlassCard label="Recommended prompt" title="Send to Create">
          <p className="whitespace-pre-wrap text-sm leading-6 text-white/72">
            {recommendedPrompt || latestAssistant?.content || "Your refined creation prompt will appear here."}
          </p>
          {recommendedPrompt ? (
            <div className="mt-3">
              <Link href={encodeCreatePrompt(recommendedPrompt)}>
                <GlassButton>Create from this</GlassButton>
              </Link>
            </div>
          ) : null}
        </GlassCard>
      </aside>
    </div>
  );
}
