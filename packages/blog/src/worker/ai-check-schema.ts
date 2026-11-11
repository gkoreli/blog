import { SITE_AUDIT_VERSION } from '@gkoreli/site-audit/contracts';
import { TECHNICAL_ASSESSMENT_PROFILE } from '@gkoreli/site-audit/product';
import { REQUEST_ASSESSMENT_VERSION } from '@gkoreli/analytics/request-assessment';
import { RETAINED_CLIENT_PRODUCT_PROFILE } from '@gkoreli/analytics/retained-client-products';
import { READER_KINDS } from '@gkoreli/analytics/contracts';

const text = { type: 'string' } as const;
const nullableText = { type: ['string', 'null'] } as const;
const count = { type: 'integer', minimum: 0 } as const;
const timestamp = { type: 'string', format: 'date-time' } as const;
const uri = { type: 'string', format: 'uri' } as const;
const boolean = { type: 'boolean' } as const;
const nullableBoolean = { type: ['boolean', 'null'] } as const;
const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const list = (items: object) => ({ type: 'array', items });
const choices = (values: readonly string[]) => ({ type: 'string', enum: values });
function object(properties: Record<string, unknown>, description?: string, required = Object.keys(properties)) {
  return { type: 'object', additionalProperties: false, required, properties, ...(description ? { description } : {}) };
}
function optionalObject(properties: Record<string, unknown>, optional: readonly string[], description?: string) {
  return object(properties, description, Object.keys(properties).filter(key => !optional.includes(key)));
}
/** Lower-level analytics evidence evolves under its own retained profile. */
function profiledEvidence(description: string, properties: Record<string, unknown>, required: string[]) {
  return { type: 'object', description, additionalProperties: true, required, properties };
}
const browserFamily = choices(['chromium', 'firefox', 'webkit', 'unrecognized']);
const quotaHeaders = {
  'X-RateLimit-Limit': { description: 'Daily allowance; present after daily admission is assessed.', schema: { type: 'integer', const: 10 } },
  'X-RateLimit-Remaining': { description: 'Remaining daily checks after this admission; zero on daily exhaustion.', schema: { type: 'integer', minimum: 0, maximum: 9 } },
  'X-RateLimit-Reset': { description: 'Next UTC midnight as Unix epoch seconds.', schema: { type: 'integer', minimum: 0 } },
} as const;
const jsonContent = (schema: object) => ({ 'application/json': { schema } });
function errorResponse(description: string) {
  return { description, headers: quotaHeaders, content: jsonContent(ref('Error')) };
}
const exhausted = {
  ...errorResponse('Daily or short-burst allowance exhausted. Daily quota fields are present for daily exhaustion; burst rejection occurs before daily admission.'),
  headers: { ...quotaHeaders, 'Retry-After': { description: 'Seconds until the UTC reset, or 60 seconds for burst rejection.', required: true, schema: { type: 'integer', minimum: 1 } } },
};
const methodRejected = {
  ...errorResponse('Unsupported method; use the operation documented for this path.'),
  headers: { Allow: { description: 'Supported method for this path.', required: true, schema: choices(['GET', 'POST']) } },
};
const forbidden = errorResponse('Cross-origin browser request rejected. Browser calls must use this origin; server clients may omit Origin.');
const unavailable = errorResponse('Missing trusted edge/configuration evidence, admission-store failure or assessment failure. Fails closed; an already admitted assessment failure can consume one daily check.');

export const aiCheckSchema = {
  openapi: '3.1.0',
  info: {
    title: 'Evidence-led AI site check', version: SITE_AUDIT_VERSION,
    description: 'Free public API; no API key or account. Ten admitted checks per trusted public Cloudflare edge source address per UTC day, shared by the site audit, request inspector and HTML form. Partial and failed admitted checks count; shared networks share an allowance. Native short-burst controls are local and eventually consistent; the daily D1 allowance is atomic. Reports preserve unavailable evidence and method versions. They do not establish provider access, JavaScript rendering, citation, human identity or organic discovery.',
    license: { name: 'MIT (code); CC BY-NC-ND 4.0 (publication content)', url: 'https://gkoreli.com/license' },
  },
  servers: [{ url: 'https://gkoreli.com' }],
  security: [],
  externalDocs: { description: 'Tool, API examples and evidence limits', url: 'https://gkoreli.com/ai-check' },
  paths: {
    '/api/ai-check': { post: {
      operationId: 'checkAiSite', summary: 'Inspect one public HTTPS page and bounded origin discovery files',
      description: 'Accepts a public DNS hostname with optional path. Bare hostnames receive https://. Credentials, IP literals, private/special hostnames, custom ports, queries and fragments are rejected. The JSON body is limited to 4096 UTF-8 bytes and three seconds to read. HTML is inspected without executing JavaScript. Every declared-UA comparison is a synthetic request from this service. Optional discovery files have no readiness-score penalty.',
      requestBody: { required: true, content: jsonContent(object({ url: { type: 'string', minLength: 1, maxLength: 2048, description: 'Public page URL or bare hostname; no credentials, query, fragment or custom port.', examples: ['https://gkoreli.com/ai-fetcher-browser-crawler-headers'] } })) },
      responses: {
        '200': { description: 'Assessment completed, possibly with partial or unavailable resources. Inspect report.complete and each resource.outcome.', headers: quotaHeaders, content: jsonContent(ref('SiteCheckResponse')) },
        '400': errorResponse('Malformed JSON, unexpected fields, invalid UTF-8 or unsupported target.'),
        '403': forbidden, '405': methodRejected, '408': errorResponse('The request body did not finish within three seconds; daily admission has not occurred.'),
        '413': errorResponse('Request body exceeds 4096 bytes.'), '415': errorResponse('Use Content-Type: application/json.'),
        '429': exhausted, '503': unavailable,
      },
    } },
    '/api/request-check': { get: {
      operationId: 'checkIncomingRequest', summary: 'Assess the actual request arriving at this endpoint',
      description: 'Shares the daily allowance. Returns referrer state, parsed site-relationship claim, independent lexical declarations, reader category/reason, navigation and form claims, network context and local/native signature evidence. Referrer and navigation context do not authenticate a source, new arrival or search click. No JSON header bag is accepted, and no raw IP, raw User-Agent, referrer hostname/URL or arbitrary request headers are echoed or persisted by this assessment. The endpoint cannot inspect requests arriving at another site. The browser button sends a fetch request; navigating to this URL sends a navigation request with potentially different evidence.',
      responses: {
        '200': { description: 'Versioned evidence for this received request and its remaining quota.', headers: quotaHeaders, content: jsonContent(ref('RequestCheckResponse')) },
        '403': forbidden, '405': methodRejected, '413': errorResponse('User-Agent exceeds the 8192-character request-assessment input limit.'),
        '429': exhausted, '503': unavailable,
      },
    } },
    '/api/ai-check/schema': { get: {
      operationId: 'getAiCheckSchema', summary: 'Read this OpenAPI contract without consuming a check',
      responses: { '200': { description: 'OpenAPI 3.1 document.', content: jsonContent({ type: 'object' }) }, '405': methodRejected },
    } },
  },
  components: { schemas: {
    Quota: object({ limit: { const: 10 }, remaining: { type: 'integer', minimum: 0, maximum: 9 }, resetAt: timestamp }, 'Daily admission state. Address sharing is possible; this is not an identified-person quota.'),
    Error: object({ error: text, quota: ref('Quota'), schema: { type: 'string', const: '/api/ai-check/schema' } }, 'Closed error message. Quota is included only after daily admission is assessed; schema is an optional contract link.', ['error']),
    SiteCheckResponse: object({ report: ref('SiteAuditReport'), quota: ref('Quota') }),
    RequestCheckResponse: object({ request: ref('RequestAssessment'), quota: ref('Quota') }),
    SiteAuditReport: optionalObject({
      version: { const: SITE_AUDIT_VERSION }, checkedAt: timestamp, target: uri,
      complete: { type: 'boolean', description: 'All planned resources were received and robots parsing/evaluation stayed within policy limits; does not mean every vendor policy is known, HTTP success, provider access or absence of findings.' },
      resources: list(ref('ResourceEvidence')), page: ref('PageEvidence'), robots: ref('RobotsEvidence'), discovery: ref('DiscoveryEvidence'), findings: list(ref('Finding')), limits: list(text), assessment: ref('TechnicalAssessment'),
    }, ['assessment'], 'Assessment is an additive derived field; historical reports may omit it. The site observation version remains unchanged; scoring has its own profile.'),
    ResourceEvidence: optionalObject({
      kind: choices(['page', 'robots', 'llms', 'sitemap', 'markdown', 'probe']), requestedUrl: uri, finalUrl: uri,
      outcome: choices(['received', 'blocked-target', 'dns-error', 'network-error', 'timeout', 'too-large', 'redirect-limit', 'budget-exhausted']),
      status: { type: ['integer', 'null'], minimum: 100, maximum: 599 }, contentType: nullableText,
      bytes: count, elapsedMs: { type: 'number', minimum: 0 }, redirects: count,
      probeAgent: { ...nullableText, description: 'Synthetic User-Agent product used by this checker, or null for ordinary resources. Never provider authentication.' },
      headersOmitted: { ...list(choices(['contentType', 'robots', 'link', 'contentLocation', 'vary'])), uniqueItems: true, description: 'Fields omitted by capture-size policy, rather than observed absent. Historical reports may omit this completeness marker.' },
      headers: object({ robots: nullableText, link: nullableText, contentLocation: nullableText, vary: nullableText }, 'Selected bounded response headers: X-Robots-Tag, Link, Content-Location and Vary. Null means no value was captured; inspect headersOmitted to distinguish policy omission from absence.'),
    }, ['headersOmitted']),
    PageEvidence: optionalObject({
      title: nullableText, description: nullableText, canonical: nullableText, language: nullableText,
      textCharacters: count, headings: count, links: count, scriptElements: count,
      metaRobots: list(object({ agent: text, value: text })), structuredDataTypes: list(text), structuredDataBlocks: count, invalidStructuredDataBlocks: count,
      alternateLinks: list(object({ type: text, href: text })), parseState: choices(['parsed', 'not-html', 'unavailable']),
      indexingAssessmentComplete: { type: 'boolean', description: 'Whether the initial HTML indexing metadata was assessed completely within capture bounds. Historical reports may omit it, which is unassessed rather than true.' },
      textPreview: { type: 'string', maxLength: 1200, description: 'Bounded text from the initial HTML, not browser-rendered or model-specific extraction.' },
      headingOutline: { ...list(object({ level: { type: 'integer', minimum: 1, maximum: 6 }, text: { type: 'string', maxLength: 160 } })), maxItems: 12 },
    }, ['indexingAssessmentComplete', 'textPreview', 'headingOutline'], 'Observations from initial HTML only. Canonical/alternate href values are untrusted claims. JSON-LD observations do not establish schema validity or rich-result eligibility.'),
    RobotsEvidence: object({ state: choices(['parsed', 'missing', 'unreachable', 'unavailable']), groups: count, rules: count, sitemaps: list(text), bots: list(ref('BotRuleAssessment')) }),
    BotRuleAssessment: object({
      token: text, provider: text, role: choices(['training-control', 'search', 'assistant', 'other']), source: uri,
      decision: choices(['allowed', 'disallowed', 'unknown']), matchedGroups: list(text), matchedRule: nullableText, reason: text,
    }, 'Path-policy evaluation for a reviewed product token. Provider labels/source documents are catalogue context; neither policy nor a copied declaration authenticates a request.'),
    DiscoveryEvidence: object({
      llms: choices(['present', 'missing', 'unavailable']), llmsLinks: count,
      sitemap: choices(['xml-observed', 'missing', 'unavailable', 'unexpected-content']), markdown: choices(['negotiated', 'not-negotiated', 'unavailable']),
    }, 'Optional discovery and representation observations. Presence does not prove indexing, ranking, citations or endpoint behavior.'),
    Finding: object({ id: text, severity: choices(['action', 'review', 'info']), title: text, evidence: text, recommendation: text }),
    TechnicalAssessment: object({
      profile: { const: TECHNICAL_ASSESSMENT_PROFILE }, label: { const: 'Technical access score' },
      score: object({ lower: { type: 'integer', minimum: 0, maximum: 100 }, upper: { type: 'integer', minimum: 0, maximum: 100 }, max: { const: 100 }, coveragePercent: { type: 'integer', minimum: 0, maximum: 100 } }, 'Fixed 100 points: earned=lower; unknown=upper−lower; lost=100−upper. Coverage is assessed weighted points (100−unknown), not statistical confidence. Unknown points never shrink the denominator.'),
      counts: object({ passed: count, failed: count, unknown: count }),
      components: { ...list(ref('TechnicalComponent')), minItems: 3, maxItems: 3 },
      optional: list(ref('OptionalCapability')), limits: list(text),
    }, 'Heuristic public-HTML technical rubric, not calibrated AI-readiness, actual provider access, indexing or citation. Profile 2026-11-06.1 weights: delivery 40 (status30+HTML10), source40 (text20+title10+heading10), general indexing20. Optional formats/files and intentional training blocks deduct no points. Derived values can be recomputed from historical reports; missing completeness flags keep affected checks unknown.'),
    TechnicalComponent: object({
      id: choices(['delivery', 'content', 'indexing']), title: text, earned: { type: 'integer', minimum: 0, maximum: 40 }, unknown: { type: 'integer', minimum: 0, maximum: 40 }, max: { enum: [20, 40] }, checks: list(ref('TechnicalCheck')),
    }, 'Versioned rubric component. Earned, unknown and max are sums of check weights; the three component maxima reconcile to100.'),
    TechnicalCheck: object({
      id: choices(['page-status', 'page-html', 'source-text', 'page-title', 'page-heading', 'general-indexing']), title: text,
      state: choices(['pass', 'fail', 'unknown']), weight: { enum: [10, 20, 30] }, evidence: text, nextStep: text,
    }, 'Stable check identifier and public weight under the assessment profile. Network/capture failure is unknown, not a silent pass or an invented page defect.'),
    OptionalCapability: object({
      id: choices(['llms', 'sitemap', 'markdown', 'structured-data']), title: text,
      state: choices(['available', 'not-provided', 'not-negotiated', 'http-error', 'unavailable', 'unexpected-content']), evidence: text, nextStep: text,
    }, 'Informational capability; never changes the fixed score. A successful HTML response to a Markdown request is not-negotiated, distinct from HTTP/network errors.'),
    RequestAssessment: object({
      version: { const: REQUEST_ASSESSMENT_VERSION }, checkedAt: timestamp, provenance: { const: 'incoming-request' },
      context: object({ referrerState: choices(['external', 'internal', 'absent', 'unusable']), fetchSite: { enum: ['none', 'same-origin', 'same-site', 'cross-site', null] } }, 'Closed derived context. A null site claim is unavailable; the parsing state remains in evidence.fetchMetadataBits. No referrer hostname, path or query is exposed. Neither a compatible context nor a user-agent-initiated claim authenticates a source or search click.'),
      classification: object({ trafficClass: choices(['browser', 'bot', 'ai']), readerKind: choices(READER_KINDS), reason: text }),
      evidence: ref('ClassificationEvidence'), clientForm: ref('ClientFormEvidence'),
      network: object({ asn: { type: ['integer', 'null'], minimum: 1, maximum: 4294967294 }, vendorNetwork: ref('VendorNetworkEvidence') }),
      signature: ref('SignatureEvidence'), limits: list(text),
    }, 'Current-request assessment; declarations, network, local verification and native provider evidence remain independent. Raw request headers and addresses are not returned.'),
    ClassificationEvidence: profiledEvidence('Closed derived facts under the reported classifierProfile and evidence version. Bit fields retain separately versioned encodings; missing evidence is not a negative identity result.', {
      version: { const: '2026-11-06.1' }, classifierProfile: text,
      declarations: object({
        status: choices(['none', 'single', 'multiple']), candidates: list(text), browserFamily,
        productProfile: { const: RETAINED_CLIENT_PRODUCT_PROFILE },
        matchedProductBits: {
          type: 'string', minLength: 1, maxLength: 19,
          pattern: '^(?:0|[1-9a-f][0-9a-f]{0,17}|[1-3][0-9a-f]{18})$',
          description: 'Canonical minimal lowercase hexadecimal bitset, at most 74 bits. Decode with retainedMatchedProducts from @gkoreli/analytics/retained-client-products; the immutable RETAINED_CLIENT_PRODUCTS_20261106 alias order belongs to productProfile, independently of the live registry. Unknown profiles or malformed encodings are unavailable evidence.',
        },
      }),
      declaredCategoryBits: count, fetchMetadataBits: count,
      categoryAgreement: choices(['no-match', 'single-match', 'multiple-same-category', 'multiple-categories']),
      network: choices(['missing', 'hosting-listed', 'archiver-listed', 'not-listed']), navigationShaped: boolean,
      activation: choices(['true-claim', 'absent', 'other-value', 'invalid', 'policy-limit', 'not-assessed']),
      referrerContext: choices(['external-with-same-origin', 'no-conflict-observed', 'not-assessed']),
    }, ['version', 'classifierProfile', 'declarations', 'declaredCategoryBits', 'fetchMetadataBits', 'categoryAgreement', 'network', 'navigationShaped', 'activation', 'referrerContext']),
    ClientFormEvidence: object({
      profile: text, form: choices(['mobile-marker', 'tablet-marker', 'conflicting-markers', 'mobile-preference', 'non-mobile-preference', 'no-form-marker', 'unknown']),
      markers: list(choices(['Mobile', 'iPhone', 'iPod', 'IEMobile', 'iPad', 'Tablet', 'PlayBook'])), browserFamily,
      mobileHint: choices(['mobile', 'non-mobile', 'absent', 'unsupported']), comparison: choices(['aligned-mobile', 'different-indicators', 'not-comparable']),
      legacyCompatibility: object({ value: choices(['desktop', 'mobile', 'tablet']), defaulted: boolean }, 'Deprecated compatibility label, not identified hardware.'),
    }, 'Claims already sent in the request; no active device probe or high-entropy client-hint request.'),
    VendorNetworkEvidence: profiledEvidence('Published client-specific IP-feed membership, independent from ASN list context and signatures. No reader address is returned. Feed freshness and failure semantics are versioned by profile.', {
      profile: text, method: { const: 'published-ip-feed' }, source: { const: 'local-vendor-ip' }, checkedAt: timestamp,
      address: object({ state: choices(['usable', 'missing', 'invalid', 'special-range', 'worker-subrequest', 'edge-context-unavailable']), header: { enum: ['cf-connecting-ip', 'cf-connecting-ipv6', null] }, family: { enum: ['ipv4', 'ipv6', null] } }),
      declarationCount: count, configuredDeclarationCount: count, unmappedDeclarationCount: count,
      summary: object({ listed: boolean, notListed: boolean, unavailable: boolean, notAssessed: boolean }),
      checks: list(object({ source: text, outcome: choices(['listed', 'not-listed', 'unavailable', 'not-assessed']), reason: nullableText,
        snapshot: { anyOf: [ref('FeedSnapshot'), { type: 'null' }] },
        cache: { anyOf: [profiledEvidence('Versioned cache-access and policy facts, not current reader identity.', { access: choices(['fetched', 'revalidated', 'memory', 'coalesced', 'cooldown', 'failed']), policy: { type: ['object', 'null'], additionalProperties: true } }, ['access', 'policy']), { type: 'null' }] },
      })),
    }, ['profile', 'method', 'source', 'checkedAt', 'address', 'declarationCount', 'configuredDeclarationCount', 'unmappedDeclarationCount', 'summary', 'checks']),
    FeedSnapshot: object({ sha256: { type: 'string', pattern: '^[a-f0-9]{64}$' }, fetchedAt: timestamp, validatedAt: timestamp, freshUntil: timestamp, publisherVersion: nullableText, prefixCount: count }),
    SignatureEvidence: profiledEvidence('Local verification outcome under verifierProfile, plus separately sourced native and vendor-method evidence. test-injected has no production coverage/profile claim. A verified publisher may leave the User-Agent unsigned. Replay policy is expiry-only.', {
      version: text, source: choices(['local-webbotauth', 'test-injected']), verifierProfile: nullableText, signerDisplayProfile: text,
      localStatus: choices(['verified', 'unverified', 'absent']), localReason: nullableText, localReasons: list(text),
      localOutcome: choices(['verified', 'absent', 'test-injected', 'invalid', 'unsupported', 'unavailable', 'policy-rejected', 'not-applicable', 'indeterminate']),
      signer: { ...nullableText, description: 'Reviewed public display label for a verified publisher; not a raw signer URI or the declared software identity.' },
      vendor: profiledEvidence('Per-client documented signing-method assessment, independent from the local cryptographic verdict.', {
        profile: text, method: { const: 'documented-signing-origin' }, documentedDeclarationCount: count, unmappedDeclarationCount: count, expectedOriginCount: count,
        matchingDeclarationCount: { type: ['integer', 'null'], minimum: 0 }, differentOriginDeclarationCount: { type: ['integer', 'null'], minimum: 0 },
        status: choices(['no-declaration', 'not-configured', 'not-verified', 'matching-origin', 'different-origin', 'conflicting-origins', 'test-injected']), userAgentCovered: nullableBoolean,
      }, ['profile', 'method', 'documentedDeclarationCount', 'unmappedDeclarationCount', 'expectedOriginCount', 'matchingDeclarationCount', 'differentOriginDeclarationCount', 'status', 'userAgentCovered']),
      directoryPublication: profiledEvidence('Reviewed publisher-directory publication assessment. Publication does not by itself prove key possession.', {
        profile: text, method: { const: 'reviewed-first-party-directory' }, reviewedOn: { type: 'string', format: 'date' }, configuredDeclarationCount: count, unmappedDeclarationCount: count,
        status: choices(['no-declaration', 'not-configured', 'not-verified', 'matching-publisher', 'different-publisher', 'partial-mapping', 'conflicting-publishers', 'test-injected']),
      }, ['profile', 'method', 'reviewedOn', 'configuredDeclarationCount', 'unmappedDeclarationCount', 'status']),
      coverage: { anyOf: [ref('SignatureCoverage'), { type: 'null' }] },
      native: object({ verifiedBot: nullableBoolean, signedAgent: nullableBoolean,
        category: object({ version: text, status: choices(['known', 'empty', 'unavailable', 'unrecognized']), value: nullableText }),
      }, 'Available request.cf fields, independently supplied by Cloudflare. Null does not mean false.'),
    }, ['version', 'source', 'verifierProfile', 'localStatus', 'localReason', 'localReasons', 'localOutcome', 'signer', 'vendor', 'directoryPublication', 'coverage', 'native']),
    SignatureCoverage: profiledEvidence('Components covered by the selected locally verified proof. Coverage is not content use or human-trigger evidence. contentDigest records signed header coverage, not comparison with a body.', {
      version: text, headerForm: choices(['dictionary', 'legacy-string', 'bare-uri']),
      covered: object({ authority: boolean, targetUri: boolean, method: boolean, path: boolean, query: boolean, userAgent: boolean, contentDigest: boolean }),
      otherComponentCount: count, validitySeconds: { type: 'number' }, ageSeconds: { type: 'number' }, replayPolicy: { const: 'expiry-only' },
      selection: object({ policy: { const: 'first-valid-in-input-order' }, matchedCandidates: count, taggedCandidates: count, attemptedCandidates: count, unassessedCandidates: count }),
    }, ['version', 'headerForm', 'covered', 'otherComponentCount', 'validitySeconds', 'ageSeconds', 'replayPolicy']),
  } },
} as const;
