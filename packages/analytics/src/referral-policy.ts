/** Referral evidence and reporting decisions. No storage or network operations. */
export type ReferralAction = 'include' | 'exclude';
export type ReferralScope = 'host' | 'subtree';

export interface ReferralSource {
  provider: 'matomo';
  revision: string;
  sha256: string;
  capturedAt: string;
  entryCount: number;
}

export interface LocalReferralRule {
  id: string;
  host: string;
  scope: ReferralScope;
  action: ReferralAction;
  reason: string;
  evidence: string;
}

export interface ReferralPolicy {
  version: string;
  sha256: string;
  evaluator: 'host-suffix-v1';
  source: ReferralSource;
  upstreamHosts: readonly string[];
  localRules: readonly LocalReferralRule[];
  publicHosts: readonly string[];
}

export interface ReferralRule {
  id: string;
  host: string;
  scope: ReferralScope;
  action: ReferralAction;
  source: 'matomo' | 'local';
  priority: number;
  reason: string;
  evidence: string;
}

export interface ReferralAssessment {
  policyVersion: string;
  policySha256: string;
  reportedHost: string | null;
  action: ReferralAction;
  matchedRule: ReferralRule | null;
  visibility: 'named' | 'other' | 'absent' | 'excluded';
}

/** Stored hostnames already passed URL parsing. Preserve labels such as www. */
export function normalizeReportedHost(host: string): string {
  // Match SQLite lower() exactly. Incoming HTTP(S) hosts already underwent
  // URL/IDNA parsing; never Unicode-fold a malformed historical value into DNS.
  return host.replace(/[A-Z]/g, letter => letter.toLowerCase()).replace(/\.+$/, '');
}

/** Strict source/config boundary; IDNs must be stored as their ASCII URL hostname. */
export function canonicalRuleHost(input: string): string {
  if (input !== input.trim() || /[\s/@:?#%\\]/u.test(input)) throw new Error('Expected a hostname, not a URL or pattern');
  const host = normalizeReportedHost(new URL(`https://${input}`).hostname);
  const labels = host.split('.');
  if (host.length > 253 || labels.length < 2 || labels.some(label =>
    label.length > 63 || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label))) {
    throw new Error('Invalid referral-rule hostname');
  }
  return host;
}

export function referralRules(policy: ReferralPolicy): ReferralRule[] {
  return [
    ...policy.upstreamHosts.map(host => ({
      id: `matomo:${host}`, host, scope: 'subtree' as const, action: 'exclude' as const,
      source: 'matomo' as const, priority: 0, reason: 'upstream-spam-list',
      evidence: `https://github.com/matomo-org/referrer-spam-list/blob/${policy.source.revision}/spammers.txt`,
    })),
    ...policy.localRules.map(rule => ({ ...rule, source: 'local' as const, priority: 1 })),
  ];
}

function compareRules(left: ReferralRule, right: ReferralRule): number {
  return right.priority - left.priority || right.host.length - left.host.length
    || Number(right.scope === 'host') - Number(left.scope === 'host');
}

/** Compiled once per policy. Local overrides win; then most specific host/scope. */
export function createReferralAssessor(policy: ReferralPolicy): (reportedHost: string | null) => ReferralAssessment {
  const rulesByHost = new Map<string, ReferralRule[]>();
  for (const rule of referralRules(policy)) {
    const rules = rulesByHost.get(rule.host) ?? [];
    rules.push(rule);
    rulesByHost.set(rule.host, rules);
  }
  const publicHosts = new Set(policy.publicHosts);
  return reportedHost => {
    const host = reportedHost === null ? null : normalizeReportedHost(reportedHost);
    let matchedRule: ReferralRule | null = null;
    if (host !== null && host.length <= 253) {
      let suffix = host;
      while (suffix.length > 0) {
        for (const rule of rulesByHost.get(suffix) ?? []) {
          if (rule.scope === 'host' && suffix !== host) continue;
          if (matchedRule === null || compareRules(rule, matchedRule) < 0) matchedRule = rule;
        }
        const dot = suffix.indexOf('.');
        if (dot < 0) break;
        suffix = suffix.slice(dot + 1);
      }
    }
    const action = matchedRule?.action ?? 'include';
    // www is a display alias only; evidence matching keeps the original labels.
    const displayHost = host?.replace(/^www\./, '');
    return {
      policyVersion: policy.version, policySha256: policy.sha256, reportedHost,
      action, matchedRule,
      visibility: action === 'exclude' ? 'excluded' : host === null ? 'absent'
        : displayHost !== undefined && publicHosts.has(displayHost) ? 'named' : 'other',
    };
  };
}
