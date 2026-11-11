import { ACTIVE_REFERRAL_POLICY } from './referral-policy.generated.js';
import { createReferralAssessor, type ReferralPolicy } from './referral-policy.js';
import { referralAssessmentCtes, referralRulesJson } from './referral-sql.js';

/** Exclusion policy and evaluator are independently versioned from evidence. */
export const REFERRAL_REPORT_RULE_SHA256 = '34afd432d3a220c94317f3ed9597170ce6f73045da2c08d5ed950fae4f6f9609';
export const REFERRAL_REPORT_RULES_JSON = referralRulesJson(ACTIVE_REFERRAL_POLICY);
export const assessProjectedReferral = createReferralAssessor(ACTIVE_REFERRAL_POLICY);

export function matchesProjectedReferralPolicy(policy: ReferralPolicy): boolean {
  return policy === ACTIVE_REFERRAL_POLICY || referralRulesJson(policy) === REFERRAL_REPORT_RULES_JSON;
}

/** Fixed ID ranges; source repairs delete facts, so this update reads and writes
 * one atomic fact snapshot without touching retained observations.
 */
function evaluatorCtes(): string {
  return referralAssessmentCtes(`
    SELECT DISTINCT referrer_host AS original, lower(rtrim(referrer_host,'.')) AS normalized
    FROM page_observation_report_facts WHERE observation_id > ?1 AND observation_id <= ?2
      AND referrer_host IS NOT NULL AND length(rtrim(referrer_host,'.')) <= 253
  `,3);
}
export function referralReportRuleDefinition(): string {
  return JSON.stringify({ policy: ACTIVE_REFERRAL_POLICY.sha256, evaluator: evaluatorCtes() });
}
export function referralReportProjectionSql(): string {
  return `WITH RECURSIVE ${evaluatorCtes()}
    UPDATE page_observation_report_facts SET report_referral_excluded=COALESCE(referrer_host IN (SELECT original FROM abusive_hosts),0),
      report_referral_rule_sha256='${REFERRAL_REPORT_RULE_SHA256}'
    WHERE observation_id > ?1 AND observation_id <= ?2
      AND (report_referral_rule_sha256 IS NOT '${REFERRAL_REPORT_RULE_SHA256}' OR report_referral_excluded IS NULL)`;
}
