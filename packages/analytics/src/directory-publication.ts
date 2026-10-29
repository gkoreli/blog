import { signatureLocalStateSql } from './signature-basis.js';
import type { KnownAgentName } from './classify.js';
import type { WebBotAuthResult } from './webbotauth.js';
import { DIRECTORY_PUBLICATION_PROFILE, DIRECTORY_PUBLICATION_REVIEWED_ON, DIRECTORY_PUBLICATION_STATUSES, type DirectoryPublicationEvidence, type DirectoryPublicationStatus } from './directory-publication-contract.js';
export { isDirectoryPublicationBasis } from './directory-publication-contract.js';
export type { DirectoryPublicationEvidence, DirectoryPublicationBasis } from './directory-publication-contract.js';

/** Reviewed first-party endpoints, not per-client signing promises or a verifier trust list.
 * HTTPS captures and request replays: analytics-retrospective research 32, 83 and 84.
 * Key rotation is allowed; the comparison concerns the publisher origin, not frozen keys.
 */
export const DIRECTORY_PUBLICATIONS = [
  { origin: 'https://crawler.exa.ai', declarations: ['ExaSearchBot', 'ExaUser'],
    source: 'https://crawler.exa.ai/.well-known/http-message-signatures-directory' },
  { origin: 'https://ahrefs.com', declarations: ['AhrefsBot', 'AhrefsSiteAudit'],
    source: 'https://ahrefs.com/.well-known/http-message-signatures-directory' },
  { origin: 'https://agent.bot.goog', declarations: ['Google-Agent'],
    source: 'https://agent.bot.goog/.well-known/http-message-signatures-directory' },
  { origin: 'https://shapbot.parallel.ai', declarations: ['ShapBot'],
    source: 'https://shapbot.parallel.ai/.well-known/http-message-signatures-directory' },
  { origin: 'https://shap-user.parallel.ai', declarations: ['Shap-User'],
    source: 'https://shap-user.parallel.ai/.well-known/http-message-signatures-directory' },
] as const;
/** Reuses the local verifier result; performs no discovery, network call or authorization. */
export function directoryPublicationEvidence(names: readonly KnownAgentName[], result: WebBotAuthResult, injected = false): DirectoryPublicationEvidence {
  const namesSet = new Set(names);
  const publications = DIRECTORY_PUBLICATIONS.filter(entry => entry.declarations.some(name => namesSet.has(name)));
  const mapped = new Set(publications.flatMap(entry => entry.declarations.filter(name => namesSet.has(name))));
  const origins = new Set(publications.map(entry => entry.origin));
  const unmapped = namesSet.size - mapped.size;
  const status: DirectoryPublicationStatus = injected ? 'test-injected'
    : namesSet.size === 0 ? 'no-declaration' : mapped.size === 0 ? 'not-configured'
      : origins.size > 1 ? 'conflicting-publishers' : unmapped > 0 ? 'partial-mapping'
        : result.status !== 'verified' ? 'not-verified'
          : publications.every(entry => entry.origin === result.agent) ? 'matching-publisher' : 'different-publisher';
  return { profile: DIRECTORY_PUBLICATION_PROFILE, method: 'reviewed-first-party-directory', reviewedOn: DIRECTORY_PUBLICATION_REVIEWED_ON,
    configuredDeclarationCount: mapped.size, unmappedDeclarationCount: unmapped, status };
}

/** Closed grouping of stored evidence. Never reinterpret history through today's registry. */
export function directoryPublicationBasisSql(): string {
  const field = "json_extract(signature_evidence, '$.directoryPublication.status')";
  return `CASE
    WHEN json_type(signature_evidence, '$.directoryPublication') IS NULL THEN 'not-recorded'
    WHEN json_extract(signature_evidence, '$.version') IS NOT '2026-10-27.5'
      OR NOT (
        (json_extract(signature_evidence, '$.directoryPublication.profile') IS '2026-10-27.1'
          AND json_extract(signature_evidence, '$.directoryPublication.reviewedOn') IS '2026-10-27')
        OR (json_extract(signature_evidence, '$.directoryPublication.profile') IS '2026-10-28.1'
          AND json_extract(signature_evidence, '$.directoryPublication.reviewedOn') IS '2026-10-28')
        OR (json_extract(signature_evidence, '$.directoryPublication.profile') IS '${DIRECTORY_PUBLICATION_PROFILE}'
          AND json_extract(signature_evidence, '$.directoryPublication.reviewedOn') IS '${DIRECTORY_PUBLICATION_REVIEWED_ON}'))
      OR json_extract(signature_evidence, '$.directoryPublication.method') IS NOT 'reviewed-first-party-directory'
      OR COALESCE(json_type(signature_evidence, '$.directoryPublication.configuredDeclarationCount'), '') <> 'integer'
      OR COALESCE(json_type(signature_evidence, '$.directoryPublication.unmappedDeclarationCount'), '') <> 'integer'
      OR json_extract(signature_evidence, '$.directoryPublication.configuredDeclarationCount') < 0
      OR json_extract(signature_evidence, '$.directoryPublication.unmappedDeclarationCount') < 0
      OR COALESCE(json_extract(signature_evidence, '$.source'), '') NOT IN ('local-webbotauth','test-injected') THEN 'unrecognized-record'
    WHEN (${field} = 'test-injected') <> (json_extract(signature_evidence, '$.source') = 'test-injected') THEN 'unrecognized-record'
    WHEN ${field} = 'no-declaration' AND
      (json_extract(signature_evidence, '$.directoryPublication.configuredDeclarationCount') <> 0
        OR json_extract(signature_evidence, '$.directoryPublication.unmappedDeclarationCount') <> 0) THEN 'unrecognized-record'
    WHEN ${field} = 'not-configured' AND
      (json_extract(signature_evidence, '$.directoryPublication.configuredDeclarationCount') <> 0
        OR json_extract(signature_evidence, '$.directoryPublication.unmappedDeclarationCount') < 1) THEN 'unrecognized-record'
    WHEN ${field} = 'partial-mapping' AND
      (json_extract(signature_evidence, '$.directoryPublication.configuredDeclarationCount') < 1
        OR json_extract(signature_evidence, '$.directoryPublication.unmappedDeclarationCount') < 1) THEN 'unrecognized-record'
    WHEN ${field} = 'conflicting-publishers' AND json_extract(signature_evidence, '$.directoryPublication.configuredDeclarationCount') < 2 THEN 'unrecognized-record'
    WHEN ${field} = 'not-verified' AND
      ((${signatureLocalStateSql()}) NOT IN ('unverified','absent') OR COALESCE(json_extract(signature_evidence, '$.localStatus'), '') NOT IN ('absent','unverified')
        OR json_extract(signature_evidence, '$.directoryPublication.configuredDeclarationCount') < 1
        OR json_extract(signature_evidence, '$.directoryPublication.unmappedDeclarationCount') <> 0) THEN 'unrecognized-record'
    WHEN ${field} IN ('matching-publisher','different-publisher') AND
      ((${signatureLocalStateSql()}) <> 'verified' OR signature_status IS NOT 'verified' OR json_extract(signature_evidence, '$.localStatus') IS NOT 'verified'
        OR json_extract(signature_evidence, '$.directoryPublication.configuredDeclarationCount') < 1
        OR json_extract(signature_evidence, '$.directoryPublication.unmappedDeclarationCount') <> 0) THEN 'unrecognized-record'
    WHEN ${field} IN (${DIRECTORY_PUBLICATION_STATUSES.map(status => "'" + status + "'").join(',')}) THEN ${field}
    ELSE 'unrecognized-record' END`;
}
