# Parser and provenance release verification

September 6, 2026 UTC. PR #15 merged to `main` as `43dd6b57b9736ede46b2a1ce7767720613a8f756` at 23:48:30 UTC. Cloudflare activated Worker version `2dcfb917-7d24-4769-9dc3-0fee983a262a` at 23:49:02.284640 UTC; `wrangler versions view` records creation at 23:49:01.938439 UTC. Deployment and Git revision are recorded separately; the subsequent-write check below verifies the expected provenance behavior.

The SQL was executed read-only after activation:

```sql
SELECT asn_source, COUNT(*) AS observations,
       SUM(CASE WHEN asn IS NULL THEN 1 ELSE 0 END) AS missing_asn
FROM page_observations
WHERE observed_at >= '2026-09-06 23:49:02'
GROUP BY asn_source;
```

| asn_source | observations | missing_asn |
|---|---:|---:|
| request | 7 | 0 |

D1 reported zero rows written. This is a small subsequent-write check, not a population accuracy measurement. No historical row was reconstructed by this repair. The local experiment and 39 tests establish parser behavior; this aggregate does not recover live Accept headers or measure the parser's production impact.

The main checkout's concurrent referral-defense edits were preserved through the merge. The one conflict was between two imports in `metadata.ts`; keeping both restored both features. All 43 analytics tests pass in that combined local workspace. The additional referral-defense changes remain uncommitted and are not included in this release.

## Article sharing audit

The live article's title, description, X large-image card metadata, prompts link, and citation representations were checked. All 23 distinct external links in the pre-release-update article returned HTTP 200; their source support was reviewed in the earlier [article audit](../readers-vs-bots/17-article-revision-2026-09-06.md). The article links authoritative HTTP/browser/protocol documentation, selected pinned implementation sources, its own queries and aggregates, and its two direct predecessor studies. HTTP success alone is not source validation.

The article has sufficient results for its bounded question: what the rules classify and what they cannot establish. The 95-versus-14 explanation remains a separate investigation. This release adds the compact parser/provenance repair status and the executed local result, without importing the full follow-up draft.

**Research footprint is absent.** The article has a raw-prompt provenance page but no `researchFootprint` frontmatter or token-accounting manifest. Original research is attributed to the Fable session and research workers; the exact source-session set has not been reconciled with subsequent independent investigations and this revision. Do not substitute another article's total, infer ownership from timing, or describe an incomplete count as the full article's footprint. Use the existing accounting scripts once the session scope is verified.

For Hacker News, this article fits a regular link submission. The [Show HN rules](https://news.ycombinator.com/showhn.html) exclude blog posts from Show HN. Use the article's original title and source link; author comments must follow the [HN guidelines](https://news.ycombinator.com/newsguidelines.html), including the restriction on generated or AI-edited comment text. Checked September 6. No HN or X submission was made during this audit.
