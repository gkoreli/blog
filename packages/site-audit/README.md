# Public site audit

`@gkoreli/site-audit` assesses one public HTTPS page and fixed discovery paths. It returns independent evidence, policy interpretations and concrete suggestions. It does not produce a readiness score, run a browser or establish provider access, citation, ranking, training use or answer quality.

```ts
import { analyzeSite } from '@gkoreli/site-audit';

const report = await analyzeSite('https://your-site.com/article');
```

The default transport is **Cloudflare Workers only**. Production must enable `global_fetch_strictly_public` and use global `fetch`, without a private-network/service binding. URL validation and fixed-origin DNS-over-HTTPS checks reject unsafe targets before every hop; preflight DNS is not address pinning. Workers' connection-time public-network filtering is the DNS rebinding boundary. Importing and running this adapter in an unrestricted Node server does not preserve that security contract. See [Cloudflare's compatibility flag](https://developers.cloudflare.com/workers/configuration/compatibility-flags/#global-fetch-strictly-public).

The package has no database, identity or quota responsibility. The blog Worker admits requests through its persistent daily allowance before calling this application service. It owns the HTTP API, quota storage, privacy disclosure and HTML presentation. Importing `analyzeSite` directly does not enforce that allowance.

## Report contract

`SiteAuditReport` is exported from the root and `./contracts`; the client boundary guard is exported from `./report-validation`. Reports retain:

- Per-resource requested/final URL, outcome, HTTP status, content type, response bytes, elapsed time, redirect count and selected response headers.
- Robots decisions for the **final page path**, matching groups/rule and documented product-token roles. Missing policy, server failure and local policy limits stay distinct. Provider-specific unsupported behavior stays unknown.
- HTML source text estimate, title, description, language, canonical, headings, links, robots metadata, alternate links and parsed JSON-LD types. JSON parsing does not validate a schema. No CSS or JavaScript executes.
- Fixed-root `llms.txt` and `sitemap.xml` observations, and a separate `Accept: text/markdown` request. Embedded links are not fetched.
- Three synthetic User-Agent declaration probes. They originate from this audit and do not reproduce provider networks, signatures or browser behavior.
- Findings with supporting evidence and a suggested action, plus explicit limits.

`complete` means every planned resource returned a bounded response and robots parsing/evaluation did not exceed a local policy budget. It does not imply successful HTTP statuses, known answers for all vendor policies or AI-provider use. For example, Exa documents an additional search-engine fallback without specifying which applicable engine wins; that decision remains unknown when no exact ExaSearchBot group exists, even in a completed audit.

The `training-control` category groups training or secondary-reuse policy tokens. Consult each linked provider source for its precise scope: Google-Extended also controls some grounding, Applebot-Extended controls secondary reuse, and Common Crawl creates a general web corpus.

## Domain and adapters

- `robots.ts`: pure group parsing, percent-octet normalization, bounded wildcard matching and rule selection.
- `html.ts`: bounded source-level HTML inspection without execution.
- `bots.ts`: reviewed provider product-token policy profiles and primary source links. This catalogue is intentionally separate from authenticated request identity.
- `index.ts`: application plan and report/findings assembly.
- `target.ts` / `transport.ts`: input and public-network boundary adapters.

For deterministic testing, inject an `AuditTransport`; each retrieval returns `{ evidence, text }`, where text is used transiently and excluded from the public report. Inject `now` for a stable report timestamp. Transport tests can inject fetch, DNS resolver and clock independently. Never expose test injection through an HTTP request.

```ts
import { analyzeSite } from '@gkoreli/site-audit';
import type { AuditTransport } from '@gkoreli/site-audit';

// Your fixture implements retrieve(request), returning evidence plus bounded text.
declare const fixtureTransport: AuditTransport;
const report = await analyzeSite('https://your-site.com/article', {
  transport: fixtureTransport,
  now: () => new Date('2026-11-06T12:00:00Z'),
});
```

## Bounds and maintenance

The plan contains eight logical resources. The shared transport admits at most twelve target GETs including redirects, follows at most three redirects per resource, runs at most three resources concurrently, accepts at most 512 KiB per response, limits a resource to five seconds and the audit transport to twenty-two seconds. DNS uses a fixed Cloudflare resolver origin and bounded JSON responses. Every redirect URL and every returned A/AAAA address is checked. Credentials, query strings, fragments, IP literals, private/special hosts and custom ports are rejected. Caller headers and cookies are never forwarded.

Robots parsing stops with an explicit unknown result at 10,000 lines, 5,000 rules or an 8,192-character line; wildcard evaluation has a 200,000-step budget per product token. These are application policy limits, not a claim of complete crawler conformance. Header values over 2,048 characters are omitted and remain unassessed. Partial transport failures retain their own outcomes.

When changing a bot profile, inspect the current primary provider page, retain its source URL, distinguish crawling/search/user-triggered/reuse controls and add a fixture for nonstandard policy behavior. A newly recognized name is not proof of a provider identity. Bump `SITE_AUDIT_VERSION` when report meaning changes.

Run `pnpm -C packages/site-audit test` and `pnpm -C packages/site-audit typecheck`. Tests cover group/rule precedence, wildcard and UTF-8 cases, source metadata, partial reports, unsafe URL/DNS/redirect targets, concurrent request budgets, streamed body limits and deadline enforcement.
