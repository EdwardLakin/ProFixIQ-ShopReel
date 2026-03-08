export type SubtitleBlock = {
  startMs: number;
  endMs: number;
  text: string;
};

function splitIntoCaptionChunks(text: string, wordsPerChunk = 5): string[] {
  const words = text
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  const chunks: string[] = [];

  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(" "));
  }

  return chunks;
}

export function buildSubtitleBlocks(
  transcript: string,
  durationMs: number,
): SubtitleBlock[] {
  const cleaned = transcript.trim();

  if (!cleaned) {
    return [];
  }

  const chunks = splitIntoCaptionChunks(cleaned, 5);

  if (chunks.length === 0) {
    return [];
  }

  const chunkDuration = Math.max(900, Math.floor(durationMs / chunks.length));

  return chunks.map((chunk, index) => {
    const startMs = index * chunkDuration;
    const endMs =
      index === chunks.length - 1
        ? durationMs
        : Math.min(durationMs, startMs + chunkDuration);

    return {
      startMs,
      endMs,
      text: chunk,
    };
  });
}
