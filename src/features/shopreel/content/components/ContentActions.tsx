"use client";

import { deleteContentPiece, archiveContentPiece, duplicateContentPiece } from "../actions/contentActions";
import { regenerateContent } from "../actions/regenerateContent";

export default function ContentActions({ id }: { id: string }) {
  return (
    <div className="flex gap-2">

      <button
        onClick={() => regenerateContent(id)}
        className="px-3 py-1 rounded bg-white/10 hover:bg-white/20"
      >
        Regenerate
      </button>

      <button
        onClick={() => duplicateContentPiece(id)}
        className="px-3 py-1 rounded bg-white/10 hover:bg-white/20"
      >
        Duplicate
      </button>

      <button
        onClick={() => archiveContentPiece(id)}
        className="px-3 py-1 rounded bg-white/10 hover:bg-white/20"
      >
        Archive
      </button>

      <button
        onClick={() => deleteContentPiece(id)}
        className="px-3 py-1 rounded bg-red-500/20 hover:bg-red-500/40"
      >
        Delete
      </button>

    </div>
  );
}
