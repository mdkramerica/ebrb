export const TIERS = {
  free: {
    name: "Free",
    price: "Free",
    analysesPerMonth: 1,
    features: [
      "Full mandate decoding",
      "Strategic analysis",
      "Resume + cover letter preview",
      "ATS gap overview",
      "Traction diagnostic",
    ],
    flags: {
      downloadDocx: false,
      downloadPdf: false,
      coverLetter: true,        // visible in preview; download gated
      atsReport: true,          // visible but full report gated
      extendedDocs: false,      // executive bio, linkedin, interview stories
      chatMode: false,
      modularAchievements: false,
      boardBio: false,
      speakingIntro: false,
    },
  },
  executive: {
    name: "Executive",
    price: "$59",
    analysesPerMonth: 5,
    features: [
      "Everything in Free",
      "Full resume + cover letter (2 tone variants)",
      "Complete ATS keyword report",
      "PDF + Word export",
      "Redline comparison",
      "Executive bio & LinkedIn summary",
      "Interview story conversion",
      "Guided chat sessions",
      "Modular achievement library",
    ],
    flags: {
      downloadDocx: true,
      downloadPdf: true,
      coverLetter: true,
      atsReport: true,
      extendedDocs: true,       // bio, linkedin, interview stories, positioning brief
      chatMode: true,
      modularAchievements: true,
      boardBio: false,
      speakingIntro: false,
    },
  },
  unlimited: {
    name: "Unlimited",
    price: "$99/mo",
    analysesPerMonth: Infinity,
    features: [
      "Everything in Executive",
      "Unlimited analyses",
      "Board bio & speaking intro",
      "Priority processing",
      "Version history",
    ],
    flags: {
      downloadDocx: true,
      downloadPdf: true,
      coverLetter: true,
      atsReport: true,
      extendedDocs: true,
      chatMode: true,
      modularAchievements: true,
      boardBio: true,
      speakingIntro: true,
    },
  },
} as const;

export type Tier = keyof typeof TIERS;
export type TierFlags = typeof TIERS[Tier]['flags'];

/** Returns the feature flags for a given tier */
export function getTierFlags(tier: Tier | string): typeof TIERS['free']['flags'] {
  const validTier = (tier as Tier) in TIERS ? (tier as Tier) : 'free';
  return TIERS[validTier].flags as typeof TIERS['free']['flags'];
}

/** Returns the analyses-per-month limit for a given tier */
export function getAnalysisLimit(tier: Tier | string): number {
  const validTier = (tier as Tier) in TIERS ? (tier as Tier) : 'free';
  return TIERS[validTier].analysesPerMonth;
}

/** Human-readable labels for each extended document type */
export const DOC_TYPE_LABELS: Record<string, string> = {
  resume: 'Resume',
  cover_letter: 'Cover Letter',
  ats_report: 'ATS Report',
  executive_bio: 'Executive Bio',
  linkedin_summary: 'LinkedIn Summary',
  board_bio: 'Board Bio',
  speaking_intro: 'Speaking Introduction',
  interview_stories: 'Interview Stories',
  traction_diagnostic: 'Traction Diagnostic',
  positioning_brief: 'Positioning Brief',
};

/** Which tier is required to generate each extended doc type */
export const DOC_TYPE_TIER: Record<string, Tier> = {
  resume: 'free',
  cover_letter: 'free',
  ats_report: 'free',
  executive_bio: 'executive',
  linkedin_summary: 'executive',
  interview_stories: 'executive',
  traction_diagnostic: 'free',
  positioning_brief: 'executive',
  board_bio: 'unlimited',
  speaking_intro: 'unlimited',
};
