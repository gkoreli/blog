# Internal page transitions and a defensible funnel design

September 9 UTC / September 8 PDT, 2026. Goga approved recording how one public blog page leads to another. The immediate reader question is whether article 024 leads people to more of the publication. Preserving internal referrals lets us measure reported page transitions; a complete multi-step conversion funnel additionally needs explicit sequence, time, identity, and outcome rules.

## Prior art and its consequences for this blog

Sources below are primary provider documentation or web specifications, checked September 9 UTC. Their product semantics guide design; their audience-accuracy or causal UX claims are not imported as measured results for this blog.

| Source | Relevant behavior | Decision for this implementation |
|---|---|---|
| [Matomo Page Transitions](https://matomo.org/faq/reports/transitions-analyze-the-previous-and-following-actions-of-your-visitors-for-each-page/) | Separates previous internal pages, external sources, following pages, and reloads; selecting a page changes the view | Keep internal movement distinct from outside referrals. Show incoming and outgoing transitions when a page is selected; separate self-referrals from movement to another page. |
| [Plausible referral sources](https://plausible.io/docs/top-referrers) | Attributes acquisition sources at session entry; explains why apps, email, and bookmarks can lack referrers | Our per-request report must not imply session acquisition. Preserve the immediate source and explain missing evidence. |
| [Plausible funnels](https://plausible.io/docs/funnel-analysis) | Distinguishes sequential steps from strictly consecutive steps; recommends journeys for discovering unspecified paths | Begin with observed transitions to discover useful routes. Do not label sums of unrelated page totals a completed funnel. |
| [PostHog funnels](https://posthog.com/docs/product-analytics/funnels) | Specifies event order, first matching occurrence, conversion window, and conversion denominators | A future multi-step funnel must declare these choices and test incomplete windows, duplicates, and skipped steps. |
| [Matomo referrer minimization](https://matomo.org/faq/how-to/how-do-i-anonymize-the-referrer-information/) | Supports retaining referrer type while removing URL detail | A useful category does not require retaining arbitrary URLs. Keep only recognized public blog paths for internal sources. |
| [Referrer Policy](https://w3c.github.io/webappsec-referrer-policy/) and [Fetch Metadata](https://www.w3.org/TR/fetch-metadata/) | The source can suppress referrer detail; navigation context is a separate header | Retain the declared referrer state and existing navigation evidence separately. No inferred historical HN attribution. |

## Accepted first implementation

- Store whether the header represents an external referral, an internal referral, an absent value, or an unusable value. Old nulls remain explicitly unknown; they are not relabeled as observed absences or internal clicks.
- For internal referrals, retain only a recognized public page path from the site's published routes. Remove query strings and fragments. Keep API paths, confirmation tokens, arbitrary internal paths, and full external URLs out of this field.
- Preserve the existing external hostname evidence and versioned referral exclusions. Unreviewed public-display names remain grouped, not erased.
- Show referral categories that reconcile with the selected report. Show observed internal page pairs, with source and destination, and meaningful empty states for history predating collection.
- Keep self-referrals separate. A same-page referrer alone does not prove a reload, and absence of a subsequent request does not prove an exit or abandonment.
- Apply owner, traffic, time, and referral-abuse rules consistently. A page-focused transition view needs both incoming and outgoing observations; its counts are not the selected page's audience denominator.
- Validate locally through parser/storage/report tests and local D1 before migration or production acceptance. Record schema activation, deployed code, bounded test observations, report cost, and cache behavior separately.

## What a later multi-step funnel must specify

A useful candidate is HN-reported entry → another analytics article → confirmed subscription. These stages are not currently joined into a defensible person-level sequence. A newsletter confirmation can happen later, on another device, or after the daily identifier changes. Do not connect an address to browsing records merely to make a funnel chart complete.

Before publishing a completion rate, choose whether the unit is an observed transition, a bounded session, or a daily pseudonymous client; choose strict or sequential order; choose a time window; define repeated steps, page reloads, tab branching, cache-only navigation, missing events, and midnight behavior. Record actual confirmation separately from form submission or mail-provider acceptance. Cases without the needed evidence remain unknown, rather than failed conversions.

A small controlled route through published test pages should establish what the collection sees with normal referrers, suppressed referrers, internal query strings, repeated pages, and owner marking. Human-operated runs and scripted requests need separate labels. This can supply an engineering section in the next article once the measurements exist.

Current status: request analysis, prior-art review, implementation, migration, and deployment acceptance complete. [Release acceptance](07-transition-release-acceptance.md) records code `c338059`, local checks, the nine excluded scripted observations, the metered report, and live cache reuse. Real-browser calibration and complete multi-step funnels remain separate work.
