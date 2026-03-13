"use client";

import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";

export type OutputType = "video" | "blog" | "email" | "post";

const OPTIONS: Array<{
  value: OutputType;
  label: string;
  description: string;
}> = [
  {
    value: "video",
    label: "Short video",
    description: "Open the scene timeline editor for reels and shorts.",
  },
  {
    value: "blog",
    label: "Blog article",
    description: "Open a long-form article editor from the same angle.",
  },
  {
    value: "email",
    label: "Email newsletter",
    description: "Turn the angle into a subject line, preview text, and email body.",
  },
  {
    value: "post",
    label: "Social post",
    description: "Create a caption, thread, or text-first post.",
  },
];

export default function OutputTypeSelector(props: {
  isOpen: boolean;
  title?: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onSelect: (value: OutputType) => void;
}) {
  if (!props.isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl">
        <GlassCard
          label="Create content"
          title={props.title ?? "Choose output type"}
          description="Select the content format to generate from this angle."
          strong
          footer={
            <div className="flex justify-end">
              <GlassButton variant="ghost" onClick={props.onClose} disabled={props.isSubmitting}>
                Close
              </GlassButton>
            </div>
          }
        >
          <div className="grid gap-3 md:grid-cols-2">
            {OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => props.onSelect(option.value)}
                disabled={props.isSubmitting}
                className={cx(
                  "rounded-2xl border p-4 text-left transition",
                  glassTheme.border.copper,
                  glassTheme.glass.panelSoft,
                  "hover:bg-white/[0.06] disabled:opacity-60",
                )}
              >
                <div className={cx("text-base font-semibold", glassTheme.text.primary)}>
                  {option.label}
                </div>
                <div className={cx("mt-2 text-sm", glassTheme.text.secondary)}>
                  {option.description}
                </div>
              </button>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
