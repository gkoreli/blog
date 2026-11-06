---
title: "Check What AI Crawlers Can Reach on Your Site"
seoTitle: "AI Site Check: Robots Rules, Page Content and Request Evidence"
date: "2026-11-05"
description: "A free site checker and API for robots rules, page content, indexing controls and machine-readable links—with the evidence and limits behind each finding."
section: "engineering"
tags: ["ai-agents", "analytics", "http", "robots-txt", "cloudflare-workers"]
---

# Check What AI Crawlers Can Reach on Your Site

[AI Site Check](/ai-check) inspects a public page's robots rules, initial HTML, indexing controls and machine-readable discovery links. It returns the observations behind each finding, with a free API. A successful request from this checker establishes what this checker received; actual provider access and citations need separate tests.

That distinction comes directly from testing AI tools against my blog. In the [November 5 provider trials](/ai-fetcher-browser-crawler-headers#what-arrived-in-the-new-trials), Grok sent eleven Chrome- or Safari-shaped page requests, none declaring Grok. My analytics stored all eleven as Browser. Dot's browser and curl requests carried verified ChatGPT publisher signatures. Gemini declared only `Google` and remained Unresolved. The controlled task supplied context that a public header checker would not have had.

Those results make a useful design requirement: show the observations, their provenance and the decision they support. A site owner should be able to fix a blocked article without being told that a copied bot name proves ChatGPT can read it.

## Start with the page you need an agent to read

Enter a public HTTPS page URL in the [checker](/ai-check). Use the article, documentation page or product page that matters to the task. The homepage can have different routing, rendering and robots rules.

The report brings several questions together:

| Question | Evidence to inspect |
| --- | --- |
| What did the server return? | Requested and final URL, HTTP status, content type, response size and any failed fetch |
| What do the robots rules say for this path? | Selected product group and matching Allow or Disallow rule |
| Is useful content present before scripts run? | Text, headings, links and metadata found in the initial HTML |
| What indexing controls were returned? | HTTP `X-Robots-Tag` and HTML robots directives |
| What can a machine discover? | Canonical, alternate representations, sitemap and optional `llms.txt` observations |
| Does a changed User-Agent receive a different response? | Synthetic comparison requests, labeled with the declaration used |

This is a bounded inspection. It does not crawl the entire site, execute JavaScript, log in, call paid AI providers or ask a model whether it would cite the page. A failed or incomplete check stays visible. A timeout does not establish a robots prohibition.

URLs with credentials, query strings, fragments, IP literals and custom ports are outside this tool's input contract. If the page you need depends on one of those features, use a controlled test appropriate to that route rather than substituting a different page and treating its result as equivalent.

## Read robots rules as path policy

Consider this file:

```text
User-agent: GPTBot
Disallow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: *
Disallow: /private/
Allow: /private/public-example/
```

These entries express different policies for different products. OpenAI documents GPTBot, OAI-SearchBot and ChatGPT-User separately: training-related crawling, search crawling and user-initiated actions have different purposes and controls. Its documentation also says robots rules may not apply to some user-initiated ChatGPT-User actions. The table therefore reports the rule calculation for the named product; it cannot promise how every operation will behave. [OpenAI crawler documentation](https://developers.openai.com/api/docs/bots).

The path matters too. In the wildcard group, `/private/public-example/article` has a more specific allowance than `/private/`. The checker exposes the selected rule so an operator can inspect that result. Empty directives, duplicate groups, wildcard rules, encoded paths and equal-length Allow/Disallow cases deserve parser tests rather than a search for the word `Disallow`.

[RFC 9309](https://www.rfc-editor.org/rfc/rfc9309.html) defines the Robots Exclusion Protocol and distinguishes an unavailable robots file from an unreachable service. The checker keeps retrieval state alongside its parsed result. Its own fetch and safety limits can also prevent an assessment; that produces an unknown result rather than an invented permission decision.

Robots rules are public instructions to cooperating clients. They are not authentication or a way to secure private content. They also differ from indexing directives: Google documents that a robots-blocked URL can still appear in search results, while preventing a crawler from reading a page can prevent it from seeing that page's `noindex`. [Google's robots guide](https://developers.google.com/search/docs/crawling-indexing/robots/intro).

The practical sequence is to decide which product and page policy you intend, inspect the matching rule, then check the returned HTTP response. Changing the file until every row says allowed would erase legitimate choices about training, search and private routes.

## Initial HTML answers a narrower rendering question

A raw response can contain a useful article, a mostly empty application shell, an access challenge or an error page with HTTP 200. Status alone cannot distinguish them.

The checker extracts observable features from the returned HTML: title, description, headings, text, links, canonical and structured-data blocks. Sparse initial text is a reason to inspect rendering. A script count is context, not proof that the page requires JavaScript. Likewise, finding JSON-LD establishes a block in this response; it does not validate every schema requirement or establish eligibility for a search feature.

For this blog, the build pipeline produces complete article HTML before browser components load. Markdown is a separate representation with its own response headers. That gives me two concrete things to test: whether the prose is present in HTML, and whether an explicit Markdown request receives Markdown. [The publication pipeline](https://github.com/gkoreli/blog/blob/main/packages/blog/src/pipeline/build.ts) owns those representations.

If your initial HTML is sparse, the next test is to compare it with a browser-rendered page and the actual provider's output. This checker does not perform that browser comparison. If an apparent success contains a challenge message, inspect your CDN or application logs and test the relevant client path before changing the content.

## A copied bot name is a synthetic probe

Sending a request with `User-Agent: ChatGPT-User` can reveal a rule that branches on that header. It does not create a request from OpenAI. The connection still comes from this checker's infrastructure, with its own network, TLS characteristics and unsigned request context.

The comparison probes are useful within that boundary. If the baseline gets HTML and one declaration gets a 403, there is an observed response difference worth investigating. If every declaration gets a 200, the result is still limited to these requests, from this location, at this time. It does not establish provider network access, successful rendering or a usable answer.

My earlier tests show why that distinction changes the next action. Grok's controlled requests did not name Grok. A rule that checks only a Grok token would have missed that path. Dot's browser and curl paths had a verified publisher in common despite different client software. Even that signature needed a coverage check: a verified publisher and an unsigned User-Agent are separate facts. [The provider study](/ai-fetcher-browser-crawler-headers) preserves those requests and their limits.

An audit should therefore give you a reproducible lead: a matching rule, response difference, missing representation or unavailable resource. The next control should test the mechanism suggested by that lead.

## Optional files should remain optional

A sitemap can expose a published URL inventory. An alternate Markdown link can help a client choose a representation. Citation links can provide bibliographic data. `llms.txt` can provide a curated directory for a client already navigating a known site.

Each is a different observation. A sitemap's presence does not prove that a particular crawler discovered or indexed its entries. Markdown availability does not prove that an answer preserved the source's qualifications. An advertised agent endpoint does not establish that the endpoint works.

The checker reports optional discovery features without turning their absence into a universal failure score. A plain HTML article with a clear title, useful content and ordinary links can be valuable to both people and agents. Add a representation when it serves an actual client or task, then test that task.

My provider trials included a citation paired with an inaccurate answer. That is a useful reminder to keep access, source selection and answer fidelity separate. A file checklist cannot substitute for checking the answer against the page.

## Use the API, or inspect your own request

The same site assessment is available as JSON:

```bash
curl https://gkoreli.com/api/ai-check \
  -H 'Content-Type: application/json' \
  --data '{"url":"https://gkoreli.com/ai-fetcher-browser-crawler-headers"}'
```

The free allowance is ten accepted checks per public edge source address per UTC day, shared with the request inspector. People behind the same public address share that allowance. It is an operational limit, not a count of users. Rate limiting can also reject bursts. Inspect the response's quota information and HTTP status rather than automatically retrying a rejected request.

The complementary endpoint examines the request that reaches this site:

```bash
curl https://gkoreli.com/api/request-check
```

That report draws on the analytics library's existing declaration, request-shape, client-form and network evidence. It describes the request received here. Your local curl result will differ from a browser navigation or an agent's cloud browser. It cannot tell you what your own server sees unless that server collects corresponding evidence.

The quota store retains a purpose-specific HMAC derived from the UTC day and trusted edge address, plus its counter. It does not need to persist the audited URL or submitted headers. Platform request logging and the site's ordinary analytics have their own scope; the quota's narrow storage contract is not a promise that no operational system sees a request.

## Keep the domains and their evidence separate

The implementation uses three boundaries. The `site-audit` package owns target policy, parsers, report contracts and audit orchestration. The analytics library owns request interpretation. The blog owns HTTP delivery, the interface and shared quota. That separation lets parser tests exercise a robots rule without D1, while quota tests exercise concurrency without fetching a website.

The external-fetch adapter restricts targets and redirects, response bytes and elapsed time. On Cloudflare, it uses public fetch with `global_fetch_strictly_public`, which keeps same-zone requests on the public route rather than bypassing Workers and security controls. A separate DNS lookup is not address pinning: another resolution can occur before connection. The runtime's public-network boundary remains part of this deployment's security assumptions. [Cloudflare's compatibility flag](https://developers.cloudflare.com/workers/configuration/compatibility-flags/#global-fetch-strictly-public), [workerd network contract](https://github.com/cloudflare/workerd/blob/main/src/workerd/server/workerd.capnp).

The [architecture decision](https://github.com/gkoreli/blog/blob/main/docs/adr/0020-evidence-led-ai-site-check.md) records those choices and the [worklist](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/ai-site-audit/00-worklist.md) separates implementation, checks and activation evidence.

Use the report to choose the next concrete test. Fix a demonstrated path-policy mistake. Inspect a challenge response. Compare initial and rendered content. Run the actual provider operation when that is the question. Then check its answer as well as its request. Each step can establish something useful without claiming the stages that have not been observed.

---

## Sources and terms

| Source or term | What it establishes here |
| --- | --- |
| [RFC 9309](https://www.rfc-editor.org/rfc/rfc9309.html) | Robots syntax, matching and retrieval semantics; robots is not access authorization |
| [Google robots guide](https://developers.google.com/search/docs/crawling-indexing/robots/intro) | The distinction between crawl control and excluding a page from search |
| [OpenAI crawler documentation](https://developers.openai.com/api/docs/bots) | Distinct product purposes and the limits of robots controls on user-initiated actions |
| [My provider trials](/ai-fetcher-browser-crawler-headers) | Controlled requests, stored classifications, signature coverage and answer checks on this blog |
| Synthetic probe | A request this checker sends with a chosen declaration; no provider attribution follows |
| Initial HTML | The received HTML before browser JavaScript execution; no rendered-page comparison is implied |
