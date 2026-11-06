export const TECHNICAL_ASSESSMENT_PROFILE = 'technical-access/2026-11-06.1';
export const REPORT_DIFF_PROFILE = 'site-report-diff/2026-11-06.1';
export const ROBOTS_WORKBENCH_PROFILE = 'robots-workbench/2026-11-06.1';
export type TechnicalCheckState = 'pass' | 'fail' | 'unknown';
export interface TechnicalCheck {
  id: string;
  title: string;
  state: TechnicalCheckState;
  weight: number;
  evidence: string;
  nextStep: string;
}
export interface TechnicalComponent {
  id: 'delivery' | 'content' | 'indexing';
  title: string;
  earned: number;
  unknown: number;
  max: number;
  checks: TechnicalCheck[];
}
export interface OptionalCapability {
  id: 'llms' | 'sitemap' | 'markdown' | 'structured-data';
  title: string;
  state: 'available' | 'not-provided' | 'not-negotiated' | 'http-error' | 'unavailable' | 'unexpected-content';
  evidence: string;
  nextStep: string;
}
export interface TechnicalAssessment {
  profile: typeof TECHNICAL_ASSESSMENT_PROFILE;
  label: 'Technical access score';
  score: { lower: number; upper: number; max: 100; coveragePercent: number };
  counts: { passed: number; failed: number; unknown: number };
  components: TechnicalComponent[];
  optional: OptionalCapability[];
  limits: string[];
}
export interface ReportChange {
  path: string;
  label: string;
  before: string;
  after: string;
  meaning: 'improved' | 'regressed' | 'changed' | 'unknown';
}
export interface SiteReportDiff {
  profile: typeof REPORT_DIFF_PROFILE;
  comparable: boolean;
  reasons: string[];
  baselineTarget: string;
  currentTarget: string;
  baselineAt: string;
  currentAt: string;
  changes: ReportChange[];
  limits: string[];
}
export interface RobotsWorkbenchInput { robots: string; token: string; path: string }
export interface RobotsWorkbenchResult {
  profile: typeof ROBOTS_WORKBENCH_PROFILE;
  decision: 'allowed' | 'disallowed' | 'unknown';
  matchedGroups: string[];
  matchedRule: string | null;
  reason: string;
  groups: number;
  rules: number;
  complete: boolean;
  limits: string[];
}
