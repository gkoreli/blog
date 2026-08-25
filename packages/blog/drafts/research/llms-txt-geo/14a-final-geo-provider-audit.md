# Final GEO/provider delta audit

**Audit date:** 2026-08-25  
**Article audited:** `packages/blog/drafts/019-does-llms-txt-work.md`  
**Scope:** only the newly merged provider/GEO material, checked against the first-party evidence in `12a-geo-provider-frontier-2026-08-25.md`. Research-paper claims were checked only where they are used to interpret provider behavior or publisher traffic.  
**Evidence rule:** an official provider statement establishes that provider's documented behavior or guidance. Silence is bounded to the reviewed official pages, and cross-provider synthesis must remain labeled as inference.

## Publication verdict

**FAIL pending three P0 corrections.** The provider section is substantially well sourced and preserves most important measurement boundaries, but it currently (1) assigns an unsupported August date to Google's inclusion-control rollout, (2) turns an automatic-search eligibility pattern into a universal requirement despite separately documented user-directed fetch paths, and (3) attributes negative traffic evidence to “citation visibility” even though the cited studies test generative answer surfaces rather than citation visibility itself.

After those three corrections, the section is publishable with the P1 tightening below strongly recommended. None of the P1 items changes the article's central conclusion.

## P0 — required before publication

### 1. Unsupported date for Google's property-level inclusion control

**Current sentence (Eligibility, item 1):**

> Google's August rollout also gives some verified properties a separate site-level generative-AI include/exclude control...

**Problem:** the official control page documents a rollout to a subset of verified site owners but does not establish an August launch date. Google's current optimization guide was already updated on 2026-07-10 and refers to the control. The 2026-08-20 date in the evidence ledger belongs to **Preferred Sources**, not this inclusion control.

**Required replacement:**

> Google's limited rollout also gives some verified properties a separate site-level generative-AI include/exclude control; it is not `Google-Extended`, and it does not remove the site from ordinary Search.

This matches the evidence ledger's own “limited-rollout” wording and the first-party artifact.

### 2. Automatic-search eligibility is stated as a universal provider requirement

**Current sentences:**

> the page must be crawlable, indexable, and technically eligible for the provider's search surface.

and, under “Established enough to operate on”:

> search-backed generative systems still require ordinary crawl and index eligibility;

**Problem:** this is exact for Google's automatic Search-backed generative features and directionally right for automatic provider search indexes, but it is not universal across all retrieval paths. OpenAI documents `ChatGPT-User`, Anthropic documents `Claude-User`, and Perplexity documents `Perplexity-User` as user-directed fetch paths distinct from automatic search crawling/indexing. The article itself correctly separates those classes earlier. “Still require” collapses them again.

**Required replacements:**

> For automatic, search-index-backed inclusion, the page generally needs to be crawlable and technically eligible for that provider's search surface. User-directed fetch is a separate path.

and:

> automatic, search-index-backed inclusion generally begins with crawl and index eligibility; user-directed fetch is a separate path;

Keep the following Google-specific sentence unchanged: indexed and snippet-eligible is an explicit Google requirement.

### 3. Traffic studies are misdescribed as evidence about citation visibility

**Current bullet under “Still unproven”:**

> that citation visibility produces publisher traffic; the newest field evidence points in the opposite direction for some answer surfaces, without identifying a publisher-side remedy.

**Problem:** the February Wikipedia natural experiment and August preregistered browser field experiment support the narrower statement that some **generative answer surfaces** can substitute for outbound publisher clicks. They do not isolate citation visibility, compare cited versus uncited sources, or test whether citation visibility itself reduces traffic. The first clause asks about one treatment; the second cites evidence about another.

**Required replacement:**

> that generative visibility reliably produces publisher traffic; early 2026 field evidence suggests that some answer surfaces reduce outbound clicks, without identifying a publisher-side remedy.

“Early 2026 field evidence” also preserves the fact that both sources are preprints rather than settled provider telemetry.

## P1 — tighten for source fidelity

### 4. “Authority signals” and “survives into the prompt” overstate what providers disclose

**Current sentence (Context allocation, item 3):**

> Relevance, coverage, authority signals, and the other candidates affect what survives into the prompt.

**Issue:** Google and OpenAI describe multiple relevance/reliability or quality systems, and Bing gives publisher guidance about expertise, but no reviewed first-party source exposes a shared cross-provider “authority signal” or confirms the exact internal prompt-allocation implementation. “Prompt” is unnecessarily architecture-specific.

**Recommended replacement:**

> Relevance, coverage, candidate order, and the competing sources can affect what survives into the answer context.

This should be presented as the article's cross-provider/research synthesis, not as a disclosed universal ranking formula.

### 5. Bing telemetry covers selected partner integrations, not only Microsoft surfaces

**Current table wording:**

> a covered Microsoft surface displayed a page as a citation

**Issue:** Bing's official announcement covers Copilot, Bing AI summaries, **and selected partner integrations**. “Microsoft surface” is narrower than the documented scope.

**Recommended replacement:**

> a covered Bing AI Performance surface displayed a page as a citation

The limitations that follow—no placement, authority, individual-answer role, or reader action—are accurate and should remain.

### 6. “Strategies are replacing” claims a field transition the cited evidence does not demonstrate

**Current emerging-direction bullet:**

> topic-level, multi-query, and engine-specific strategies are replacing single-query rewrite tricks in controlled studies;

**Issue:** the newer studies test broader topic-, demand-, candidate-, or engine-specific methods, but they do not measure a temporal replacement of single-query rewriting across the research field or production systems.

**Recommended replacement:**

> controlled studies are broadening from single-query rewrite tricks toward topic-level, multi-query, and engine-specific strategies;

### 7. Preferred Sources needs the user-selection boundary in the same bullet

**Current emerging-direction bullet:**

> user-selected Preferred Sources can now be highlighted in Google AI experiences, making earned audience loyalty a machine-visible choice rather than a cold-start ranking tactic;

**Assessment:** the first clause is supported. Google says a user-selected domain/subdomain can be more likely to appear and can receive a preferred badge in AI Mode and AI Overviews. The rest is a reasonable editorial inference, not provider language.

**Recommended qualification:**

> for users who selected them, Preferred Sources can be highlighted in Google AI experiences; this makes existing audience preference machine-visible, not a general ranking tactic;

This prevents readers from interpreting the feature as an across-user ranking factor.

### 8. The multimodal “matter” claim should remain a bounded trend, not a general causal rule

**Current emerging-direction bullet:**

> multimodal feeds, profiles, collection pages, and internal-link graphs matter where the underlying product is not a prose document.

**Issue:** feeds and profiles are explicitly supported provider paths; collection pages and graph construction come from one bundled Pinterest production preprint. The sources do not establish that every listed intervention independently improves generative visibility.

**Recommended replacement:**

> provider-supported feeds and profiles, plus corpus-specific collection pages and internal-link graphs, are emerging inputs where the underlying product is not a prose document.

### 9. Use the official Anthropic document date in the ledger

**Current ledger row:**

> Anthropic search, training, and user-directed crawler roles ... Accessed Aug 25, 2026

**Issue:** the official Anthropic crawler page is dated 2026-04-07. The access date is useful but should not replace the available source date.

**Recommended evidence date:**

> Apr 7, 2026; accessed Aug 25, 2026

### 10. Pinterest's 20% number should use the paper's exact metric label

**Current sentence:**

> Pinterest reports 20% organic traffic growth...

**Issue:** the research artifact records this as a **20% production traffic lift** from a bundled production system. Unless the paper's metric is quoted directly as “organic traffic growth” in the final source check, use the artifact's exact conservative label.

**Recommended replacement:**

> Pinterest reports a 20% production traffic lift...

The existing warning that the intervention bundled query modeling, VLM representations, page creation, linking, and Pinterest-scale deployment is good and should remain.

## Claims that pass as written

- Google's dedicated generative report establishes supported-feature link impressions, not grounding queries, answer influence, clicks, or conversions.
- Bing AI Performance exposes citation counts, cited-page activity, and sampled grounding phrases while explicitly withholding placement, authority/ranking, and individual-answer role.
- Google requires ordinary Search eligibility for AI Overviews/AI Mode, says no special AI schema/file is required, and explicitly says `llms.txt` neither helps nor harms Google Search visibility.
- Google's property-level generative inclusion control is distinct from `Google-Extended` and does not exclude the property from ordinary Search.
- Google query fan-out, ChatGPT targeted query rewrites, and Claude progressive/repeated search are directly documented production behaviors.
- Merchant Center, Business Profiles, Bing Places, IndexNow, and OpenAI's commerce feed are bounded, provider-supported paths; the article correctly avoids calling them generic citation guarantees.
- Google's and Bing's new publisher reports measure different stages. The article correctly refuses to collapse them into one “AI visibility” score.
- OpenAI documents search eligibility and a stable referral UTM but no general publisher citation/impression dashboard in the reviewed official pages.
- The article correctly distinguishes crawler requests, provider impressions/citations, referrals, and downstream reader outcomes.
- The statement that there is no common web protocol called GEO/AEO is a bounded synthesis of the reviewed provider documentation; none of the reviewed providers defines such a universal protocol.

## Minimum publication patch

If only blocking changes are made, fix these exact three concepts:

1. “Google's August rollout” → “Google's limited rollout.”
2. Narrow ordinary crawl/index eligibility to **automatic, search-index-backed inclusion** and preserve user-directed fetch as a separate path in both occurrences.
3. “citation visibility produces publisher traffic” → “generative visibility reliably produces publisher traffic,” with the cited studies described as early field evidence about answer surfaces and outbound clicks.

After that patch, the provider/GEO section's central position is evidence-faithful: ordinary search infrastructure remains foundational for automatic inclusion; provider controls and telemetry are fragmented and stage-specific; query expansion is real; citation, answer use, referral, and audience are different events; and no reviewed provider supports a universal GEO file, schema, or formatting recipe.
