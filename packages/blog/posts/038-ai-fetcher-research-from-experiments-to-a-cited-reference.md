---
title: "AI Fetcher Research: From Experiments to a Cited Reference"
date: "2026-10-31"
description: "Arcjet used my AI-fetcher study as technical evidence. New signature experiments, clearer analytics and a standalone Worker show how I am strengthening the research behind it."
section: engineering
tags: [ai-agents, analytics, http, observability, agentic-engineering]
series:
  id: "measurement-boundaries"
  title: "Measurement boundaries"
  order: 7
---

# AI Fetcher Research: From Experiments to a Cited Reference

Arcjet uses a request I captured on this blog to explain Web Bot Auth. In its [technical guide](https://arcjet.com/learn/web-bot-auth#signature-base), my DuckAssistBot capture sits beside SeatGeek's ChatGPT example. The comparison teaches a concrete difference: one signature covers the destination host; the other also covers the request method and path. Arcjet links directly to [my study](/which-ai-fetchers-send-which-headers).

That is an earned backlink and visible use of the research as evidence. It is the kind of publishing I want to do with AI agents: investigate a real question, publish enough of the work for someone else to inspect, and give them something useful to build on.

The original question was simple: when an assistant says it fetched an article, what reaches my server? Maintaining the answer has become a larger engineering task. I have corrected claims, recovered signing inputs, tested log transformations, improved the analytics and made a fresh installation possible outside this blog. For this follow-up, I ran a new experiment against a protocol change published on October 29.

Three lessons now shape the reference:

- Record the signed fields and verification profile alongside a successful result.
- Separate bad cryptography, unavailable evidence and a format the implementation does not support.
- Count technical reuse, agent access and supporting-material access as outcomes in their own right.

## The experiment became a source

The September study asked ten assistants to fetch assigned URLs and recorded what arrived at a Cloudflare Worker. Its published files contain 37 requests for the assigned probes, with attributed side requests kept separately. That gave another writer an inspectable example of a real signing choice.

Arcjet's passage uses that example correctly. It explains that the captured DuckAssistBot signature covers `@authority` and `signature-agent`, leaving the path unsigned. Its SeatGeek comparison makes the consequences easier to understand. This is demonstrated technical reuse of the original experiment.

The capture also exposed a mistake in my explanation. I initially treated successful signing as a broader identity guarantee. The October 29 replay made the covered boundary explicit: both saved proofs still verified after changing the unsigned method, path, query or User-Agent. Changing signed components or the signature failed. Node, local workerd and a pinned independent RFC implementation agreed across the [20 recorded contexts](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/96-fetcher-reference-coverage-correction.md).

Those tests use saved proofs, a later directory capture and an explicit historical clock. They explain the September evidence. They do not turn the September trial into a current vendor survey.

Keeping the original URL matters here. I have strengthened its wording and linked this follow-up while preserving its publication date, captures and frozen research accounting. A reader following Arcjet's citation should find both the original observation and the subsequent correction.

## A new protocol can change the meaning of a URL

For implementers, the next problem is deciding which discovery model a verifier actually supports.

Our earlier profile reads a `Signature-Agent` origin and appends `/.well-known/http-message-signatures-directory` to find keys. The [October 29 Web Bot Auth draft](https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-01#section-4.1) instead identifies the signer by a full URL. A directory can live at a particular path. That draft remains work in progress; publication of a new profile does not establish that existing clients have adopted it.

Consider these two synthetic assertions:

```text
Signature-Agent: "https://keys.example"
```

```text
Signature-Agent: proof="https://keys.example/tenant-a/jwks.json"
```

The first fits our origin-discovery profile. The second names a particular resource. Dropping its path and fetching the host's well-known directory would change the assertion we were trying to verify. Two tenants on one host can have different key sets and identities.

I froze **20 signed synthetic cases** before changing the implementation. They include the older forms, explicit directory paths, different keys at the root and well-known resources, unsafe locations, malformed input and two damaged signatures. The signer constructs its canonical bytes independently of the verifier. A separate WebCrypto check establishes which supplied bases match their signatures; it is a mathematical control, not a complete protocol-conformance test.

The same frozen inputs ran through the normal verifier, an explicitly selected candidate and the exhaustive audit, in Node 24.14.1 and local workerd. All key responses came from an exact in-memory map. No vendor or production endpoint received these requests.

| Condition | Before | Hardened result |
| --- | --- | --- |
| Three supported origin-form controls | Verified with the expected well-known lookup | Preserved |
| Explicit well-known or tenant directory path | Invalid before any key lookup | Unsupported discovery location; no lookup |
| Damaged proof naming an explicit directory | Rejected before cryptography | Still unsupported; no claim that its signature was checked |
| Origin-form proof signed by a different root-resource key | Key unavailable from the selected well-known resource | Preserved |
| Damaged proof under the supported origin profile | Signature-invalid | Preserved |
| IP literal or local hostname with a directory path | Rejected before lookup | Explicit local-policy rejection; no lookup |

Five explicit-path cases now retain an unsupported result. Their exhaustive audits remain partial because that profile was not assessed. The three supported positives and the distinct unavailable and cryptographic-negative controls keep their results. Node and workerd agree exactly across all three API paths. [Result, reproduction and final receipts](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/fetcher-study-v2/06-discovery-profile-results.md).

I kept the narrower fetch policy. Supporting direct URL identities properly also requires deliberate cache keys, identity storage, publisher mappings and query handling. Silently broadening a resolver would conceal those decisions. Query-bearing forms and other excluded inputs retain their existing local-profile rejection rules; this repair does not implement the whole new draft.

The verifier profile now identifies these semantics as `2026-10-31.3`. A separate local collector/D1 test checks that unsupported discovery survives storage and reporting while the event remains counted. The useful improvement is a result that says what the implementation established.

## A valid request can fail replay from its trace

The next boundary is the evidence saved after verification. A log entry may contain a transformed version of the signed request.

In the [October 29 native tracing experiment](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/74-native-trace-redaction-and-covered-urls.md), twelve synthetic requests verified inside a local producer Worker. Only seven verified when reconstructed from the default Tail Worker views. All twelve verified from the unredacted synthetic views. The thirteenth request, an intentionally invalid proof, failed throughout.

The five lost replays involved redacted covered headers or URL components. This exercised actual local workerd tracing through Miniflare, rather than an imitation that replaced strings in JavaScript. It demonstrates a mechanism under those recorded runtime versions; it does not establish that every historical production export followed that path.

The operator lesson is to compare representations before judging the original request. Preserve the verification time, source profile, covered components, key provenance and capture surface. If a retained value changed, a failed replay describes the retained input. Enabling unrestricted production capture would introduce a different retention and privacy decision. Synthetic fixtures let us test the mechanism without collecting readers' credentials.

## The analytics now preserve more of those distinctions

Our old grouping could turn a signed SEO crawler into an AI assistant. The repair keeps the client's declaration, signing evidence, documented role and known trigger separate. A signed crawler is useful access to the publication; the signature alone does not establish an assistant conversation.

The later [52-proof historical recovery](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/75-frozen-signed-cohort-and-export-boundaries.md) recovered complete retained chains, replayed the selected profiles and matched exact storage projections. That is a concrete improvement over having only a stored verified flag. The selected requests still left the resource and User-Agent unsigned.

Reports needed hardening too. In local tests, missing counts could become plausible zeroes and chart rows could disappear beside a nonzero headline. The [report-integrity repair](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/discovery-experiment-02/06-public-report-integrity.md) validates returned fields and complete partitions. A failed report now stays a failure; a valid empty result remains zero. Separate [coverage checks](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/discovery-experiment-02/12-signature-coverage-producer-invariants.md) withhold impossible detailed binding claims while preserving the event and its original verified outcome.

These changes make the evidence more useful. They also keep future comparisons from depending on a label whose meaning quietly changed.

## Growth includes people using the evidence

The Arcjet reference is the clearest outcome here: another technical publication used the original experiment as a source. The study also appears in an attributed Web Pulse reproduction and a Daily Artifact source link. The [captured reference ledger](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/backlink-value-trials/reference-results.json) distinguishes those pages, repeated anchors and link qualifiers. Web Pulse still carries older wording; a correction sheet is prepared.

Two agent-operated search runs each returned the canonical study for three of four sampled questions: headers, signature coverage and the late Codex fetch. Those are [observed discovery results](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/discovery-experiment-02/01-repeat-and-decision.md) under their recorded method. They are separate from citations inside generated answers.

The retained access data gives context. Across four complete UTC weeks, the fetcher article recorded:

| UTC week | Browser-selected article events | Outside fixed unexplained source R1 |
| --- | ---: | ---: |
| October 2–8 | 11 | 11 |
| October 9–15 | 20 | 20 |
| October 16–22 | 14 | 14 |
| October 23–29 | 22 | 18 |

These are [dated delivery observations](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/126-retained-windows-and-resource-trends.md). Measurement stamps are missing for much of the historical data, so I do not present the sequence as a normalized readership growth rate. It does show continuing recorded access outside the concentrated source.

Supporting work receives access too. A separate retained 397-event selection from October 29–30 contains **243 article events, 68 prompt/evidence-resource events and 86 site events**. Keeping those [resource categories distinct](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/analytics-retrospective/124-retained-agent-reach-delta.md) recognizes access to the research process without inflating canonical article views. People and agents are both part of the audience I want this publication to serve.

## Give the next operator something they can run

The analytics have also taken a step beyond this site's history. A fresh installation originally failed because the migration chain expected a legacy table and included this blog's historical backfills.

The [minimal Worker example](https://github.com/gkoreli/blog/tree/main/packages/analytics/examples/minimal-worker) now has a separate empty-install schema and runs the real collector, owner endpoint and report without the blog router, article catalogue or newsletter. The [accepted October 31 local test](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/discovery-experiment-02/14-fresh-install-portability.md) applied the migration and exercised 22 requests. Six events were stored; matching owner marks left three public. HTML and negotiated Markdown collected; excluded methods and representations did not add observations.

That is a runnable portability result. Independent operator adoption is the next test. The example still needs a separate database per site. It is a workspace package in this repository, with its deployment and retention decisions documented.

Working with agents has made this much investigation practical for one publication. The part I want to repeat is the connection between the work and the article: ask a consequential question, run controls that could change the answer, expose the evidence, and maintain the reference when someone else starts using it. Arcjet's citation is a concrete reason to keep doing that.

---

## Glossary

| Term | Meaning and primary basis | Date |
| --- | --- | --- |
| Signature coverage | The selected message components protected by a proof; [RFC 9421 §7.2](https://www.rfc-editor.org/rfc/rfc9421.html#section-7.2). | February 2024 |
| Discovery profile | The implemented rules for interpreting a signing identifier and obtaining keys; compare our recorded origin-only subset with [Web Bot Auth draft `-01`](https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-01). It remains work in progress. | October 29, 2026 |
| Technical reuse | An external explanation uses the published capture as evidence; [Arcjet's signature-base comparison](https://arcjet.com/learn/web-bot-auth#signature-base). | Retrieved October 31, 2026 |
| Local verification | Our implementation's result under its recorded policy; distinct from the provider-managed verifier and from human purpose. [New experiment and acceptance](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/fetcher-study-v2). | October 31, 2026 |

The September captures and October experiments retain their own dates and methods. This follow-up adds the local discovery-profile experiment; it does not report new vendor fetch trials. The [evidence inventory](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/fetcher-study-v2/02-growth-and-improvements.md) links the completed improvements and their original receipts.
