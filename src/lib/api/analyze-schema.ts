/**
 * Hand-written runtime validator for the /analyze JSON response.
 * Keeps the dependency tree small (no Zod). Coerces/normalizes optional fields
 * so downstream code can trust the shape.
 */

export interface AtsReport {
  beforeScore: number;
  afterScore: number;
  keywords: Array<{ label: string; before: boolean; after: boolean; note: string }>;
  microAdjustments?: string[];
  finalAssessment: string;
}

export interface AnalyzeOutput {
  mandateAnalysis: string;
  strategicAdvantage: string;
  resume: string;
  coverLetter: string;
  atsReport: AtsReport;
  redlineChanges: Array<{
    section: string;
    type: string;
    before: string;
    after: string;
    reason: string;
  }>;
  modularAchievements: string[];
  intentDetected: string;
  completionStatus: {
    vpAnswersWhyHire: boolean;
    bulletsOutcomeFirst: boolean;
    skimmableInSixEleven: boolean;
  } | null;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function asNumber(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function asBool(v: unknown, fallback = false): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

function parseAtsReport(v: unknown): AtsReport {
  if (!isRecord(v)) {
    return { beforeScore: 0, afterScore: 0, keywords: [], finalAssessment: '' };
  }
  const keywordsRaw = Array.isArray(v.keywords) ? v.keywords : [];
  const keywords = keywordsRaw.filter(isRecord).map((k) => ({
    label: asString(k.label),
    before: asBool(k.before),
    after: asBool(k.after),
    note: asString(k.note),
  }));
  const micro = Array.isArray(v.microAdjustments) ? asStringArray(v.microAdjustments) : undefined;
  return {
    beforeScore: asNumber(v.beforeScore),
    afterScore: asNumber(v.afterScore),
    keywords,
    ...(micro ? { microAdjustments: micro } : {}),
    finalAssessment: asString(v.finalAssessment),
  };
}

export function parseAnalyzeOutput(raw: unknown): AnalyzeOutput {
  if (!isRecord(raw)) {
    throw new Error('AI output is not an object');
  }

  if (typeof raw.resume !== 'string' || raw.resume.length < 50) {
    throw new Error('AI output missing required "resume" field');
  }

  const redlineRaw = Array.isArray(raw.redlineChanges) ? raw.redlineChanges : [];
  const redlineChanges = redlineRaw.filter(isRecord).map((r) => ({
    section: asString(r.section),
    type: asString(r.type),
    before: asString(r.before),
    after: asString(r.after),
    reason: asString(r.reason),
  }));

  const completionRaw = isRecord(raw.completionStatus) ? raw.completionStatus : null;
  const completionStatus = completionRaw
    ? {
        vpAnswersWhyHire: asBool(completionRaw.vpAnswersWhyHire),
        bulletsOutcomeFirst: asBool(completionRaw.bulletsOutcomeFirst),
        skimmableInSixEleven: asBool(completionRaw.skimmableInSixEleven),
      }
    : null;

  return {
    mandateAnalysis: asString(raw.mandateAnalysis),
    strategicAdvantage: asString(raw.strategicAdvantage),
    resume: raw.resume,
    coverLetter: asString(raw.coverLetter),
    atsReport: parseAtsReport(raw.atsReport),
    redlineChanges,
    modularAchievements: asStringArray(raw.modularAchievements),
    intentDetected: asString(raw.intentDetected, 'direct_improvement'),
    completionStatus,
  };
}
