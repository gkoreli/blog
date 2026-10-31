import { REVIEWED_ASSIGNMENT_PROFILE_PAIRS, REVIEWED_DECLARATION_PROFILES, REVIEWED_NETWORK_PROFILES } from './vendor-declaration-profiles.js';

export const NETWORK_ASSIGNMENT_PROFILE = '2026-10-31.1';
export const NETWORK_ASSIGNMENT_MAX_JSON_BYTES = 16384;
export const NETWORK_ASSIGNMENT_STATES = ['consistent', 'contradictory', 'not-assessed'] as const;
export const NETWORK_ASSIGNMENT_REASONS = [
  'classification-not-recorded', 'classification-invalid-json', 'classification-duplicate-key',
  'network-not-recorded', 'network-invalid-json', 'network-duplicate-key', 'decoder-state-invalid',
  'classification-policy-limit', 'network-policy-limit',
  'classification-envelope-invalid', 'classifier-profile-missing', 'classifier-profile-invalid',
  'classifier-profile-conflict', 'classifier-profile-unsupported', 'classification-schema-missing',
  'classification-schema-invalid', 'classification-schema-unsupported', 'classification-schema-conflict',
  'declarations-invalid', 'network-envelope-invalid', 'network-profile-missing', 'network-profile-invalid',
  'network-profile-unsupported', 'profile-pair-unreviewed', 'network-assignment-fields-invalid',
  'source-unsupported', 'declaration-count', 'configured-count', 'unmapped-count',
  'duplicate-source', 'source-set', 'source-order',
] as const;
type Reason = typeof NETWORK_ASSIGNMENT_REASONS[number];
type State = typeof NETWORK_ASSIGNMENT_STATES[number];
interface ExpectedAssignments {
  declarations: number;
  configured: number;
  unmapped: number;
  sources: string[];
}
export interface NetworkAssignmentAssessment {
  profile: typeof NETWORK_ASSIGNMENT_PROFILE;
  state: State;
  reasons: Reason[];
  classifierProfile: string | null;
  networkProfile: string | null;
  expected: ExpectedAssignments | null;
}
export interface StoredNetworkAssignmentInput {
  classificationJson: unknown;
  networkJson: unknown;
  storedClassifier: unknown;
  /** Companion SQL guard results for these exact bounded raw JSON fields. */
  classificationJsonState: unknown;
  networkJsonState: unknown;
}
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const count = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const jsonStates = ['parsed', 'not-recorded', 'invalid-json', 'duplicate-key', 'policy-limit'] as const;

/** Trusted column expressions only. json_tree is always given valid JSON, even
 * if SQLite chooses a different expression evaluation order. Reject duplicate
 * object keys before JSON.parse can discard one; array indexes are unique. */
export function networkAssignmentJsonStateSql(column: 'classification_evidence' | 'vendor_ip_evidence'): string {
  if (column !== 'classification_evidence' && column !== 'vendor_ip_evidence') throw new Error('Unsupported assignment JSON column');
  const bounded = `length(CAST(${column} AS BLOB)) <= ${NETWORK_ASSIGNMENT_MAX_JSON_BYTES}`;
  const safe = `CASE WHEN typeof(${column}) = 'text' AND ${bounded} AND json_valid(${column}) THEN ${column} ELSE '{}' END`;
  return `CASE WHEN ${column} IS NULL THEN 'not-recorded'
    WHEN NOT (${bounded}) THEN 'policy-limit'
    WHEN typeof(${column}) <> 'text' OR NOT json_valid(${column}) THEN 'invalid-json'
    WHEN EXISTS (SELECT 1 FROM json_tree(${safe}) GROUP BY parent,key HAVING COUNT(*) > 1) THEN 'duplicate-key'
    ELSE 'parsed' END`;
}

/** Compare retained assignments, not original headers, addresses, signatures,
 * provider identity or action purpose. Structural outcome/cache validity is a
 * separate assessment. Caller must pair SQL guards with the same raw fields. */
export function assessStoredNetworkAssignment(input: StoredNetworkAssignmentInput): NetworkAssignmentAssessment {
  let classifierProfile: string | null = null, networkProfile: string | null = null;
  const result = (state: State, reasons: Reason[], expected: ExpectedAssignments | null = null): NetworkAssignmentAssessment => ({
    profile: NETWORK_ASSIGNMENT_PROFILE, state, reasons, classifierProfile, networkProfile, expected,
  });
  const unassessed = (reason: Reason) => result('not-assessed', [reason]);
  if (!jsonStates.some(state => state === input.classificationJsonState) || !jsonStates.some(state => state === input.networkJsonState)) return unassessed('decoder-state-invalid');
  if (input.classificationJsonState === 'not-recorded') return unassessed('classification-not-recorded');
  if (input.classificationJsonState === 'policy-limit') return unassessed('classification-policy-limit');
  if (input.classificationJsonState === 'duplicate-key') return unassessed('classification-duplicate-key');
  if (input.classificationJsonState !== 'parsed') return unassessed('classification-invalid-json');
  if (input.networkJsonState === 'not-recorded') return unassessed('network-not-recorded');
  if (input.networkJsonState === 'policy-limit') return unassessed('network-policy-limit');
  if (input.networkJsonState === 'duplicate-key') return unassessed('network-duplicate-key');
  if (input.networkJsonState !== 'parsed') return unassessed('network-invalid-json');
  let c: unknown, n: unknown;
  try {
    if (typeof input.classificationJson !== 'string' || typeof input.networkJson !== 'string') return unassessed('decoder-state-invalid');
    c = JSON.parse(input.classificationJson);
    n = JSON.parse(input.networkJson);
  } catch { return unassessed('decoder-state-invalid'); }
  if (!object(c)) return unassessed('classification-envelope-invalid');
  if (c.classifierProfile === undefined || c.classifierProfile === null || input.storedClassifier === undefined || input.storedClassifier === null) return unassessed('classifier-profile-missing');
  if (typeof c.classifierProfile !== 'string' || c.classifierProfile === '' || typeof input.storedClassifier !== 'string' || input.storedClassifier === '') return unassessed('classifier-profile-invalid');
  const classifier = REVIEWED_DECLARATION_PROFILES.find(profile => profile.profile === c.classifierProfile);
  const storedClassifier = REVIEWED_DECLARATION_PROFILES.find(profile => profile.profile === input.storedClassifier);
  if (classifier === undefined || storedClassifier === undefined) return unassessed('classifier-profile-unsupported');
  if (classifier.profile !== storedClassifier.profile) return unassessed('classifier-profile-conflict');
  classifierProfile = classifier.profile;
  if (c.version === undefined || c.version === null) return unassessed('classification-schema-missing');
  if (typeof c.version !== 'string' || c.version === '') return unassessed('classification-schema-invalid');
  if (!REVIEWED_DECLARATION_PROFILES.some(profile => profile.schema === c.version)) return unassessed('classification-schema-unsupported');
  if (c.version !== classifier.schema) return unassessed('classification-schema-conflict');
  const declarations = c.declarations;
  if (!object(declarations) || !Array.isArray(declarations.candidates) || declarations.candidates.length > 64) return unassessed('declarations-invalid');
  const knownNames: ReadonlySet<string> = new Set(classifier.names);
  const names: unknown[] = declarations.candidates;
  if (!names.every((name: unknown): name is string => typeof name === 'string' && knownNames.has(name))
    || new Set(names).size !== names.length
    || declarations.status !== (names.length === 0 ? 'none' : names.length === 1 ? 'single' : 'multiple')) return unassessed('declarations-invalid');
  if (!object(n) || n.method !== 'published-ip-feed' || n.source !== 'local-vendor-ip') return unassessed('network-envelope-invalid');
  if (n.profile === undefined || n.profile === null) return unassessed('network-profile-missing');
  if (typeof n.profile !== 'string' || n.profile === '') return unassessed('network-profile-invalid');
  const network = REVIEWED_NETWORK_PROFILES.find(profile => profile.profile === n.profile);
  if (network === undefined) return unassessed('network-profile-unsupported');
  networkProfile = network.profile;
  if (!REVIEWED_ASSIGNMENT_PROFILE_PAIRS.some(pair => pair[0] === classifier.profile && pair[1] === network.profile)) return unassessed('profile-pair-unreviewed');
  if (!count(n.declarationCount) || !count(n.configuredDeclarationCount) || !count(n.unmappedDeclarationCount)
    || !Array.isArray(n.checks) || n.checks.length > 32) return unassessed('network-assignment-fields-invalid');
  const observedSources: string[] = [];
  const knownSources: ReadonlySet<string> = new Set(REVIEWED_NETWORK_PROFILES.flatMap(profile => profile.sources.map(source => source.id)));
  const checks: unknown[] = n.checks;
  for (const check of checks) {
    if (!object(check) || typeof check.source !== 'string') return unassessed('network-assignment-fields-invalid');
    if (!knownSources.has(check.source)) return unassessed('source-unsupported');
    observedSources.push(check.source);
  }
  const declared = new Set(names), configured = new Set<string>();
  const expectedSources: string[] = [];
  for (const source of network.sources) {
    const applicable = source.declarations.filter(name => declared.has(name));
    if (applicable.length > 0) {
      expectedSources.push(source.id);
      for (const name of applicable) configured.add(name);
    }
  }
  const expected = { declarations: names.length, configured: configured.size, unmapped: names.length - configured.size, sources: expectedSources };
  const reasons: Reason[] = [];
  if (n.declarationCount !== expected.declarations) reasons.push('declaration-count');
  if (n.configuredDeclarationCount !== expected.configured) reasons.push('configured-count');
  if (n.unmappedDeclarationCount !== expected.unmapped) reasons.push('unmapped-count');
  const observedSet = new Set(observedSources), expectedSet = new Set(expectedSources);
  if (observedSet.size !== observedSources.length) reasons.push('duplicate-source');
  const sameSet = observedSet.size === expectedSet.size && [...observedSet].every(source => expectedSet.has(source));
  if (!sameSet) reasons.push('source-set');
  else if (observedSet.size === observedSources.length && observedSources.some((source, index) => source !== expectedSources[index])) reasons.push('source-order');
  return result(reasons.length === 0 ? 'consistent' : 'contradictory', reasons, expected);
}
