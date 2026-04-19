export type ProductSurfaceClass =
  | "canonical"
  | "experimental"
  | "deprecated"
  | "contextual";

export type ProductSurface = {
  capability: string;
  route: string;
  classification: ProductSurfaceClass;
  notes?: string;
};

export const SHOPREEL_PRODUCT_SURFACES: ProductSurface[] = [
  { capability: "home", route: "/shopreel", classification: "canonical" },
  { capability: "create", route: "/shopreel/create", classification: "canonical" },
  { capability: "opportunities", route: "/shopreel/opportunities", classification: "canonical" },
  { capability: "generations_review", route: "/shopreel/generations", classification: "canonical" },
  { capability: "generation_detail", route: "/shopreel/generations/[id]", classification: "canonical" },
  { capability: "render_queue", route: "/shopreel/render-queue", classification: "canonical" },
  { capability: "publish_center", route: "/shopreel/publish-center", classification: "canonical" },
  { capability: "publish_queue", route: "/shopreel/publish-queue", classification: "canonical" },
  { capability: "settings", route: "/shopreel/settings", classification: "canonical" },
  { capability: "campaigns", route: "/shopreel/campaigns", classification: "experimental" },
  { capability: "video_creation_studio", route: "/shopreel/video-creation", classification: "experimental" },
  { capability: "upload", route: "/shopreel/upload", classification: "canonical" },
  { capability: "video_editor", route: "/shopreel/editor/video/[id]", classification: "canonical" },
  { capability: "editor_hub", route: "/shopreel/editor", classification: "contextual" },
  { capability: "library", route: "/shopreel/content", classification: "canonical" },
  { capability: "ai_requests", route: "/shopreel/creator-requests", classification: "experimental" },
  { capability: "workspace_account_detail", route: "/shopreel/account", classification: "contextual" },
  { capability: "legacy_dashboard", route: "/shopreel/dashboard", classification: "deprecated" },
];

export type ApiOwnership = {
  capability: string;
  canonicalFamily: string;
  legacyFamilies?: string[];
};

export const SHOPREEL_CANONICAL_API_OWNERSHIP: ApiOwnership[] = [
  {
    capability: "generations",
    canonicalFamily: "/api/shopreel/generations/*",
    legacyFamilies: ["/api/shopreel/story-generations/*"],
  },
  {
    capability: "render_jobs",
    canonicalFamily: "/api/shopreel/render-jobs/*",
    legacyFamilies: ["/api/shopreel/render-job/*"],
  },
  {
    capability: "publishing",
    canonicalFamily: "/api/shopreel/publications/* + /api/shopreel/publish-queue",
    legacyFamilies: ["/api/shopreel/publish"],
  },
];
