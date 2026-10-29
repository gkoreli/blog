# Five documented address methods and a missing Meta declaration

October 29, 2026 UTC. Continues [client-method reconciliation](65-client-methods-and-directory-failures.md). That turn changed code, accepted deployment and yielded new evidence: progress. Human-operated trials remain deferred. This investigation does not rescan the retained population or reclassify history.

## Meta's documented role is not a verification method

The web reader returns 429 for Meta's crawler page. The ordinary browser loads its [canonical public documentation](https://developers.facebook.com/documentation/sharing/webmasters/web-crawlers), displayed as updated May 21, 2026, without login. It describes Meta-WebIndexer as a search crawler but supplies no per-client IP feed or signing-origin rule on this page. Its FacebookExternalHit section's general allowlisting advice does not establish a method for every Meta client. Neither a broad Meta ASN nor a directory URL inferred from an unverified request is adopted as client authentication.

The same page documents **Meta-ExternalAds** for advertising/business crawling. The existing catalogue did not recognize it. The new exact product rule retains that declaration as **Other bot**, including when a signature is verified. Substrings, URL placement and malformed versions remain unmatched; conflicting ad/search declarations remain Unresolved. No historical Meta-ExternalAds count is claimed: unknown original User-Agent products were not retained in D1.

## Primary documentation exposes five missing feed mappings

| Declaration | Publisher-linked source | Captured format | Parsed entries |
|---|---|---|---:|
| Applebot | [Applebot CIDRs](https://search.developer.apple.com/applebot.json) | JSON CIDRs | 24 |
| Bingbot | [Bingbot feed](https://www.bing.com/toolbox/bingbot.json) | JSON CIDRs | 28 |
| Amazonbot | [Amazonbot addresses](https://developer.amazon.com/amazonbot/ip-addresses/) | HTML code block, bare IPv4 hosts | 1,292 |
| Amzn-SearchBot | [Amazon search addresses](https://developer.amazon.com/amazonbot/searchbot-ip-addresses/) | HTML code block, `ip_prefix` CIDRs | 816 |
| Amzn-User | [Amazon live-fetch addresses](https://developer.amazon.com/amazonbot/live-ip-addresses/) | HTML code block, bare IPv4 hosts | 1,023 |

Counts are publisher entries parsed from captured bodies, not measured requests, unique readers or independently authenticated operators. [Source commitments](documented-feeds-sources.json) retain URLs, formats, hashes and runtime versions; raw responses remain private.

[Apple's guide](https://support.apple.com/en-sg/119829) links its feed and distinguishes Applebot from the non-crawling Applebot-Extended control token. Its US page returned a web-reader 429; the English Singapore page supplied the method. No feed is extended to Applebot-Extended or other Apple products.

Bing's [2012 guidance](https://blogs.bing.com/webmaster/2012/8/How-to-Verify-that-Bingbot-is-Bingbot/) says it publishes no list. Its [2022 guidance](https://blogs.bing.com/webmaster/2022/5/SEO-best-practice-for-subscription-based-and-paywall-content/) links the live feed and recommends daily review. An authoritative source can still describe an obsolete capability. The collector uses bounded freshness and live source retrieval, rather than copying ranges into code.

[Amazon's guide](https://developer.amazon.com/amazonbot) links three separate lists. Those client boundaries are preserved; general AWS ranges are not substituted. The captured HTML responses are 129,492–152,486 bytes, inside the existing 262,144-byte transport bound. All five sources return HTTP 200; media types are checked from the actual responses rather than inferred from the publisher's wording.

The catalogue becomes **49 recognized declarations, 15 sources and 16 IP-mapped declarations**. Together with three signing-mapped declarations, including one overlap, **18 have either configured method and 31 have neither**. These count configured capabilities. Nine records in the frozen earlier cohort declared Amazonbot, Applebot or Bingbot; new mappings do not re-verify those original addresses or change their stored unconfigured outcomes. Its other 46 previously unconfigured named events still lack either mapping. The full 712-record census is not repeated.

## Adapt the publisher's format without weakening the shared parser

[`vendor-ip-document.ts`](../../../../analytics/src/vendor-ip-document.ts) is a dedicated source adapter. For Amazon only, native HTMLRewriter extracts **one complete `pre > code` block**, concatenating text chunks before JSON parsing. Multiple/missing/unclosed blocks are rejected. It does not execute scripts, load page assets or scrape address-looking strings from arbitrary page text. [Cloudflare's chunk documentation](https://developers.cloudflare.com/workers/runtime-apis/html-rewriter/#text-chunks) explains why one handler call cannot be assumed to contain a complete text node. Each lookup has its own parser state, including concurrent lookups.

The documented host format becomes `/32`; the search format's `ip_prefix` becomes the corresponding family-specific CIDR key. UTC `+00:00` becomes equivalent `Z` without dropping the advertised precision. Then the unchanged strict shared parser checks every entry, family, public-unicast range, prefix length and host bits. One malformed entry rejects the whole feed. Ordinary JSON sources still reject bare-host `ipv4Prefix` values. The snapshot hashes the original bounded response bytes, not the normalized JSON.

The pinned installed `ipaddr.js` 2.5.0 source is inspected for family-sensitive matching and four-part decimal validation; no library upgrade or new runtime dependency is introduced. The existing 1.5-second deadline, four-source fanout, 4,096-entry limit and refresh cooldown remain. New sources are appended after the original ten, preserving their budget order. Listed, not-listed, unavailable and not-assessed remain distinct; membership does not sign an unsigned client name or reveal a human trigger.

## Native evidence and preserved history

[Native acceptance](documented-feeds-native.json) executes the previous `c379c79` analytics source and the current implementation in workerd with intercepted public captures. Each of the five declarations changes from unconfigured to its exact dedicated source. Thirty-six single-source controls cover listed/nonlisted addresses, HTTP failure, relay exclusion, malformed data, chunked bodies, ambiguous/incomplete markup, wrong media type, body limit and no-store cooldown. Captured-body hashes, parsed entry counts and normalized publisher timestamps agree.

One additional mixed-declaration control parses JSON and HTML sources concurrently: five configured methods yield four fetches and one explicit budget skip. The resulting conflicting role remains Unresolved. This tests parser isolation and bounded availability, not native-provider detection accuracy.

Fourteen actual collector controls produce exact returned-reference D1 readbacks. The existing receipt's classifier, kind, declaration and signature projections agree. **The receipt has no published-address-assessment child**; that assessment is checked directly in the exact stored row. The first harness incorrectly expected such a child and failed; no production code is changed to manufacture that assumption. This is a concrete remaining visibility gap.

Two controls are owner/referral-excluded. With one supplied historical unconfigured Applebot record, the report includes 13 observations and preserves that historical payload/profile unchanged. New sources under older method profiles remain unrecognized instead of inheriting today's scope. All supplied native bot booleans remain unavailable; optional request evidence stays absent.

An initial collector fixture forced `no-store`, so its immediate second check correctly became not-assessed/refresh-cooldown. Captured responses have no Cache-Control header. The accepted fixture uses that absence with in-process fresh response timing; a separate no-store control preserves the observed abstention. It is not a full replay of captured HTTP age/freshness state. No production URL or vendor is contacted by this native harness.

Fresh checks pass: **265 analytics tests, 117 site tests, workspace types and three targeted adapter/role tests**. The new exact two-reference SQL also passes workerd/D1 with adjacent IDs above JavaScript's safe integer boundary and a primary-key query plan. [Release evidence](documented-feeds-release.json) separates source, activation and observed production behavior. Collection becomes `2026-10-29.2`, classifier/IP method `2026-10-29.1` and report/cache `2026-10-29.2`; verifier remains `2026-10-29.1`. No schema, raw-capture or history mutation accompanies the repair. The README's stale missing-metadata and general-Slackbot descriptions are corrected against current code.

The article adds the source-boundary lesson at 1,347 words/31 prompts. Proposed live acceptance is separate: two labelled agent-operated, referral-excluded GETs with explicit synthetic UA claims, a filtered tail and one native-tested two-reference SELECT with a 100-read post-execution review threshold. Up to two collection-ineligible direct Markdown GETs may establish served/build equality and positive readiness in the same filtered JSON tail before eligible controls. This avoids inferring readiness from a live CLI process: Wrangler 4.71 emits its Connected banner only in pretty format. The revised private plan supersedes its original readiness assumption before execution. Neither eligible control is a genuine vendor request or human calibration trial. No broad data query or public-report fill is planned.

Next: accept activation and the bounded controls, then give stored published-address facts a versioned receipt projection. Human/device/native-verifier accuracy, Meta identity, R1 attribution, historical proof recovery and privacy decisions remain open in [the goal audit](current-goal-audit.json).

The frozen source/native archive contains 51 private files with 0700/0600 modes. Manifest SHA-256: `35d42f69548bf17f61a0d3f5311b67c2cedbdcc5a335253218aa68362a60b7f5`. October 31 is a review date, not automatic deletion. It preserves source captures, initial failed fixtures, accepted controls, source snapshots, build logs and the superseding live plan. Source publication and measured production acceptance are recorded separately below when established.
