"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { archiveContentPiece, duplicateContentPiece } from "../actions/contentActions";
import { regenerateContent } from "../actions/regenerateContent";

export default function ContentActions({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<unknown>) {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => run(() => regenerateContent(id))}
        disabled={pending}
        className="rounded bg-white/10 px-3 py-1 hover:bg-white/20 disabled:opacity-50"
      >
        Regenerate
      </button>

      <button
        onClick={() => run(() => duplicateContentPiece(id))}
        disabled={pending}
        className="rounded bg-white/10 px-3 py-1 hover:bg-white/20 disabled:opacity-50"
      >
        Duplicate
      </button>

      <button
        onClick={() => run(() => archiveContentPiece(id))}
        disabled={pending}
        className="rounded bg-white/10 px-3 py-1 hover:bg-white/20 disabled:opacity-50"
      >
        Archive
      </button>
    </div>
  );
}
