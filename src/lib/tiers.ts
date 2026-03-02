export const TIERS = {
  free: {
    name: "Free",
    price: "Free",
    analysesPerMonth: 1,
    features: ["Full analysis", "Resume + cover letter", "ATS report"],
  },
  executive: {
    name: "Executive",
    price: "$59",
    analysesPerMonth: 5,
    features: ["Everything in Free", "PDF + Word export", "Redline comparison"],
  },
  unlimited: {
    name: "Unlimited",
    price: "$99/mo",
    analysesPerMonth: Infinity,
    features: [
      "Everything in Executive",
      "Unlimited analyses",
      "Priority processing",
    ],
  },
} as const;

export type Tier = keyof typeof TIERS;
