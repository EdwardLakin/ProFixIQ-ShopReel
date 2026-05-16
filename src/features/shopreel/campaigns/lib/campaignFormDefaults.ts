import type { ParsedCampaignBrief } from "@/features/shopreel/campaigns/lib/campaignIntakeTypes";

export type CampaignFormFields = {
  title: string;
  coreIdea: string;
  audience: string;
  offer: string;
  campaignGoal: string;
  productContext: string;
  tone: string;
  platformFocus: string;
};

export function emptyCampaignFormDefaults(): CampaignFormFields {
  return {
    title: "",
    coreIdea: "",
    audience: "",
    offer: "",
    campaignGoal: "",
    productContext: "",
    tone: "",
    platformFocus: "",
  };
}

export function buildCampaignFormDefaultsFromParsedBrief(parsedBrief: ParsedCampaignBrief | null, sourcePrompt: string): CampaignFormFields {
  if (!parsedBrief) return emptyCampaignFormDefaults();

  if (parsedBrief.mode === "internal_self_marketing") {
    return {
      title: "ShopReel vs Traditional Marketing",
      coreIdea: "Compare ShopReel to traditional marketing methods and introduce ShopReel as the future of business marketing.",
      audience: "Repair shops, local businesses, and creators",
      offer: "Turn real work into marketing automatically",
      campaignGoal: "Brand awareness and product introduction",
      productContext: "ShopReel",
      tone: "Confident and practical",
      platformFocus: "instagram, facebook, tiktok, youtube",
    };
  }

  if (parsedBrief.mode === "business_advertising") {
    const title = parsedBrief.businessName
      ? `${parsedBrief.businessName} local advertising campaign`
      : parsedBrief.businessType && parsedBrief.location
        ? `${parsedBrief.businessType} advertising campaign in ${parsedBrief.location}`
        : "Local business advertising campaign";
    return {
      title,
      coreIdea: sourcePrompt,
      audience: parsedBrief.targetCustomer || parsedBrief.audience || "Local customers",
      offer: parsedBrief.offer || parsedBrief.servicePromise || "",
      campaignGoal: parsedBrief.goal || "Get local customers and bookings",
      productContext: parsedBrief.businessName || parsedBrief.businessType || parsedBrief.serviceCategory || "",
      tone: parsedBrief.localTone || parsedBrief.tone || "Local, trustworthy, direct",
      platformFocus: parsedBrief.platformFocus.length > 0 ? parsedBrief.platformFocus.join(", ") : "facebook",
    };
  }

  if (parsedBrief.mode === "launch_campaign") {
    const base = parsedBrief.productName || parsedBrief.businessName || "Product";
    return {
      title: `${base} launch campaign`,
      coreIdea: sourcePrompt,
      audience: parsedBrief.audience || "",
      offer: parsedBrief.offer || "",
      campaignGoal: parsedBrief.goal || "Launch awareness and conversions",
      productContext: parsedBrief.productName || parsedBrief.businessName || parsedBrief.businessType || "",
      tone: parsedBrief.tone || "",
      platformFocus: parsedBrief.platformFocus.join(", "),
    };
  }

  if (parsedBrief.mode === "weekly_content") {
    const base = parsedBrief.businessType || parsedBrief.productName || "Business";
    return {
      title: `${base} weekly content plan`,
      coreIdea: sourcePrompt,
      audience: parsedBrief.audience || "",
      offer: parsedBrief.offer || "",
      campaignGoal: parsedBrief.goal || "Consistent content and audience engagement",
      productContext: parsedBrief.productName || parsedBrief.businessName || parsedBrief.businessType || "",
      tone: parsedBrief.tone || "",
      platformFocus: parsedBrief.platformFocus.join(", "),
    };
  }

  return {
    title: "",
    coreIdea: sourcePrompt,
    audience: parsedBrief.audience || parsedBrief.targetCustomer || "",
    offer: parsedBrief.offer || parsedBrief.servicePromise || "",
    campaignGoal: parsedBrief.goal || "",
    productContext: parsedBrief.productName || parsedBrief.businessName || parsedBrief.businessType || parsedBrief.serviceCategory || "",
    tone: parsedBrief.tone || parsedBrief.localTone || "",
    platformFocus: parsedBrief.platformFocus.join(", "),
  };
}
