import path from "node:path";
import { promises as fs } from "node:fs";
import type { DiscoveredGrowthFeature } from "./types";

const ROUTE_ROOT = path.join(process.cwd(), "src", "app", "shopreel");

function titleFromSegment(segment: string): string {
  return segment.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

export async function scanShopReelRoutes(): Promise<DiscoveredGrowthFeature[]> {
  const entries = await fs.readdir(ROUTE_ROOT, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => {
    const routePath = `/shopreel/${entry.name}`;
    const title = titleFromSegment(entry.name);
    return {
      featureKey: `route:${entry.name}`,
      title,
      description: `${title} is a first-party ShopReel surface that can be marketed with practical outcomes and workflows.`,
      routePath,
      sourceFiles: [`src/app/shopreel/${entry.name}/page.tsx`],
      audience: "Operators and founders who need repeatable content workflows",
      valueProps: ["Shorter path from idea to shippable content", "Operational clarity from one canonical product surface"],
      launchAngle: `Show how ${title} fits into the end-to-end ShopReel lifecycle.`,
    };
  });
}
