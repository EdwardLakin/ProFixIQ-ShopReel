export type DefaultCampaignAngle = {
  key: string;
  label: string;
  name: string;
  description: string;
};

export const DEFAULT_CAMPAIGN_ANGLES: DefaultCampaignAngle[] = [
  {
    key: "problem",
    label: "Problem",
    name: "Problem",
    description: "Call out the pain, frustration, or problem the audience is dealing with.",
  },
  {
    key: "old_way",
    label: "Old Way",
    name: "Old Way",
    description: "Show the outdated or frustrating way this is usually handled.",
  },
  {
    key: "new_way",
    label: "New Way",
    name: "New Way",
    description: "Show the better, simpler, or faster way your product or process solves it.",
  },
  {
    key: "how_it_works",
    label: "How It Works",
    name: "How It Works",
    description: "Break down how the product, service, or workflow actually works.",
  },
  {
    key: "outcome",
    label: "Outcome",
    name: "Outcome",
    description: "Show the result, transformation, or benefit after using it.",
  },
  {
    key: "call_to_action",
    label: "Call To Action",
    name: "Call To Action",
    description: "Invite the audience to take the next step.",
  },
];
