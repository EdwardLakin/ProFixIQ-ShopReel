"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";

export default function GenerationDeleteButton(props: {
  generationId: string;
  label?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm("Delete this generation?");
    if (!confirmed) return;

    try {
      setIsDeleting(true);

      const res = await fetch(`/api/shopreel/story-generations/${props.generationId}`, {
        method: "DELETE",
      });

      const json = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to delete generation");
      }

      router.push(props.redirectTo ?? "/shopreel/content");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete generation";
      window.alert(message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <GlassButton variant="ghost" onClick={() => void handleDelete()} disabled={isDeleting}>
      {isDeleting ? "Deleting..." : props.label ?? "Delete"}
    </GlassButton>
  );
}
