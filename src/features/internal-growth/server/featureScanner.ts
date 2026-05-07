import path from "node:path";
import { promises as fs } from "node:fs";
import type { DiscoveredGrowthFeature } from "./types";

const ROUTE_ROOT = path.join(process.cwd(), "src", "app", "shopreel");
const FEATURE_KEYWORDS = ["campaign", "publish", "review", "dashboard", "editor", "automation", "render", "library", "upload", "opportunities"];

function titleFromSegment(segment: string): string {
  return segment
    .replace(/[()]/g, "")
    .split(/[-_]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function normalizeFeatureKey(parts: string[]): string {
  return `route:${parts.join("/").replace(/[^a-zA-Z0-9/_-]/g, "").toLowerCase()}`;
}

function extractMatch(content: string, pattern: RegExp): string | null {
  const match = content.match(pattern);
  return match?.[1]?.trim() ?? null;
}

function extractMetadata(content: string) {
  const title = extractMatch(content, /title\s*:\s*["'`]([^"'`]+)["'`]/);
  const navLabel = extractMatch(content, /(navLabel|label)\s*:\s*["'`]([^"'`]+)["'`]/) ?? extractMatch(content, /aria-label\s*=\s*["'`]([^"'`]+)["'`]/);
  const header = extractMatch(content, /<h1[^>]*>([^<]{3,120})<\/h1>/i);
  const marketingStrings = Array.from(content.matchAll(/([A-Z][^\n"`]{12,80}(launch|workflow|faster|publish|growth)[^\n"`]{0,60})/gi)).slice(0, 3).map((m) => m[1].trim());
  const keywords = FEATURE_KEYWORDS.filter((keyword) => content.toLowerCase().includes(keyword));
  return { title, navLabel, header, keywords, marketingStrings };
}

export async function scanShopReelRoutes(): Promise<DiscoveredGrowthFeature[]> {
  const features = new Map<string, DiscoveredGrowthFeature>();
  const entries = await fs.readdir(ROUTE_ROOT, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const routeGroup = entry.name.startsWith("(") ? titleFromSegment(entry.name) : null;
    const sourceFile = path.join(ROUTE_ROOT, entry.name, "page.tsx");
    let content = "";
    try { content = await fs.readFile(sourceFile, "utf8"); } catch { content = ""; }
    const metadata = extractMetadata(content);
    const routePath = `/shopreel/${entry.name}`;
    const fallbackTitle = titleFromSegment(entry.name);
    const title = metadata.title ?? metadata.navLabel ?? metadata.header ?? fallbackTitle;
    const featureKey = normalizeFeatureKey([entry.name, title.toLowerCase().replace(/\s+/g, "-")]);

    if (features.has(featureKey)) {
      const current = features.get(featureKey)!;
      current.sourceFiles = Array.from(new Set([...current.sourceFiles, `src/app/shopreel/${entry.name}/page.tsx`]));
      continue;
    }

    features.set(featureKey, {
      featureKey,
      title,
      description: `${title} is a first-party ShopReel surface that can be marketed with practical outcomes and workflows.${metadata.marketingStrings.length ? ` Signal copy: ${metadata.marketingStrings.join(" | ")}` : ""}`,
      routePath,
      sourceFiles: [`src/app/shopreel/${entry.name}/page.tsx`],
      audience: "Operators and founders who need repeatable content workflows",
      valueProps: [
        "Shorter path from idea to shippable content",
        "Operational clarity from one canonical product surface",
        ...(routeGroup ? [`Route group: ${routeGroup}`] : []),
        ...(metadata.keywords.map((keyword) => `Keyword: ${keyword}`)),
      ],
      launchAngle: `Show how ${title} fits into the end-to-end ShopReel lifecycle.`,
      scanMetadata: {
        navLabel: metadata.navLabel,
        routeGroup,
        keywords: metadata.keywords,
      },
    });
  }

  return Array.from(features.values());
}
