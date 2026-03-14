"use client";

export default function RunAutomationButton({ shopId }: { shopId: string }) {
  async function run() {
    await fetch("/api/shopreel/automation", {
      method: "POST",
      body: JSON.stringify({ shopId }),
    });

    alert("Automation started");
  }

  return (
    <button
      onClick={run}
      className="px-4 py-2 rounded bg-blue-600 text-white"
    >
      Run Automation
    </button>
  );
}
