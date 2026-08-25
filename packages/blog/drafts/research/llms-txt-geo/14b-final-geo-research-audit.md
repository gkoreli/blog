# Final GEO Research Delta Audit

**Draft audited:** `packages/blog/drafts/019-does-llms-txt-work.md`  
**Cutoff:** 2026-08-25  
**Scope:** Newly merged academic GEO claims, evidence status, numbers, and the boundary between research results and article advice.  
**Method:** Checked the draft against the primary papers and official proceedings already mapped in `12b-geo-research-frontier-2026-08-25.md`, then rechecked the highest-risk claims at ACL Anthology, ICLR proceedings, the SIGIR DOI, and the authors' arXiv records. The article was not edited.

## Verdict

**FAIL pending P1 corrections. No P0 errors found.**

The merged GEO section is unusually disciplined for this topic. Its central distinction—eligibility, selection, citation, absorption, referral, and outcome are separate events—is well supported and should remain. The venue labels and headline numbers are also substantially correct.

Six passages still widen controlled, observational, or first-party results into broader claims than the evidence earns. None overturns the article. All can be fixed locally without flattening its living center.

## P0 findings

None.

- No fabricated or materially wrong paper was found.
- Competitive GEO is correctly labeled SIGIR 2026 and peer-reviewed.
- AutoGEO is correctly labeled ICLR 2026 and peer-reviewed.
- FeatGEO, Mind Reader, MAGEO, the NAACL coverage study, and the Findings ACL live audit are correctly attached to archival proceedings.
- Pinterest, the Wikipedia natural experiment, the browser field experiment, citation absorption, and the 45-study survey are correctly presented as preprints rather than peer-reviewed findings.

## P1 findings and exact changes

### P1-1 — One first-party production preprint is called a trend

**Draft location:** line 273, “The emerging production trend is corpus-specific GEO.”

**Problem:** The Pinterest paper is a valuable production example, but it is one first-party preprint with a bundled intervention. It cannot establish a field-wide production trend. The next sentence correctly preserves the bundle and scale boundary; the opening sentence overstates only the evidence count.

**Exact change:**

Replace:

> The emerging production trend is corpus-specific GEO.

With:

> One emerging production example is corpus-specific GEO.

Keep the rest of the paragraph. The reported **20% organic traffic growth** is faithful to the paper, and “Pinterest reports” correctly attributes rather than independently validates it.

**Primary source:** [Pinterest production preprint](https://arxiv.org/abs/2602.02961), especially the abstract and production-system description.

### P1-2 — Mind Reader's controlled query augmentation becomes a live editorial rule

**Draft location:** line 285.

**Problem:** Mind Reader generates latent intents and query variants, then optimizes reasoning coverage on GEO-Bench and PC-GEO. That supports a controlled query-family hypothesis. It does not observe real provider fan-out, organic entry, human demand, or traffic. “It supports covering the real question family” drops those freezes and makes generated latent demands sound like observed reader needs.

**Exact change:**

Replace the Mind Reader bullet with:

> - [Mind Reader, ACL 2026](https://aclanthology.org/2026.acl-long.1894/) tests generated query variants and reasoning coverage on GEO-Bench and PC-GEO. It supports a query-family hypothesis inside controlled visibility benchmarks, not a claim about a provider's hidden fan-out or live organic discovery.

The later practical advice may still say “start with a real reader question.” That advice comes from the publication's values and provider guidance, not from Mind Reader's generated query families.

### P1-3 — The NAACL percentages sound like observation of the hidden candidate pool

**Draft location:** line 289.

**Problem:** The percentages are correct: the systems' source evidence covered roughly 63–67% of core subquestions, while answers covered 42–54%. But the commercial engines remained black boxes, and the study reconstructed knowledge coverage from the sources exposed with the answers. Saying the systems “retrieved information” can be read as direct telemetry over their complete retrieval pools.

**Exact change:**

Replace the first two sentences with:

> The gap between source evidence and answered material is no longer only a preprint idea. A [NAACL 2025 study of sub-question coverage](https://aclanthology.org/2025.naacl-long.301/) found that the source sets exposed by commercial answer systems contained knowledge for roughly 63–67% of core subquestions, while their final answers covered only 42–54%.

Keep the existing boundary sentences that follow. This preserves the strongest result without claiming proprietary retrieval observability.

### P1-4 — The “established” list mixes a stage-specific result with broader editorial beliefs

**Draft location:** lines 299–300.

**Problem A:** “Search-backed generative systems still require ordinary crawl and index eligibility” is too universal. Google explicitly documents that gate for its organic surfaces, and other providers document eligibility controls, but the academic papers do not establish one shared indexing requirement across every generative system or user-directed fetch path.

**Problem B:** Controlled studies support topical relevance beating generic formatting **after candidates are supplied**. They do not establish that “original evidence” is a more durable organic selection lever. Original evidence is excellent reader-first advice and appears in provider guidance, but it belongs in a separate epistemic lane.

**Exact change:**

Replace the first two “Established enough to operate on” bullets with:

> - for a publisher page to enter the provider-documented organic search surfaces reviewed here, it must satisfy that surface's crawl and index rules; most academic GEO content experiments begin only after candidates are supplied;
> - in controlled post-retrieval experiments, topical relevance outweighs formatting-only changes; original evidence remains a reader-first and provider-supported editorial strategy, but the cited experiments do not establish its organic selection effect;

This is the most important correction in the audit because the section label says **established**.

### P1-5 — The fan-out advice has stronger primary support than the article cites, while “replacing” overstates the trend

**Draft locations:** line 266 and line 310.

**Problem:** Provider documentation establishes that query fan-out or rewriting happens. It does not establish the article's “finite noise and attention budget” advice. Peer-reviewed EACL 2026 work does: adaptive decomposition improves retrieval coverage/precision, while unnecessary or noisy searching can harm abstention and compound across turns. The article has the correct conclusion but omits the direct academic support. Separately, “strategies are replacing” single-query tricks implies a field transition that a small set of controlled studies cannot establish.

**Exact changes:**

After line 266, add:

> Controlled RAG research makes the limit concrete: [adaptive query decomposition](https://aclanthology.org/2026.eacl-long.322/) improved precision and diverse coverage under a retrieval budget, while [over-searching](https://aclanthology.org/2026.eacl-long.361/) harmed abstention when search was unnecessary or retrieved evidence was noisy. These are controlled RAG results, not observations of provider fan-out, but they explain why more searches are not automatically better.

Replace line 310 with:

> - controlled studies are testing topic-level, multi-query, and engine-specific strategies beyond single-query rewrite heuristics;

Add both EACL papers to the evidence ledger and label them peer-reviewed.

### P1-6 — Referral studies do not isolate the effect of citation visibility

**Draft location:** line 321.

**Problem:** The Wikipedia natural experiment and preregistered browser field experiment study the effect of generative answer **surfaces** on publisher traffic. Neither randomizes whether a particular publisher is cited, nor estimates the click effect of citation visibility itself. The current wording—“field evidence points in the opposite direction”—can imply that being cited causes traffic loss.

**Exact change:**

Replace the final speculative bullet with:

> - that citation visibility produces publisher traffic; early field studies find that some generative answer surfaces reduce outbound clicks overall, but neither study isolates the effect of a particular publisher being cited or tests a publisher-side remedy.

The earlier paragraph at line 275 already states this boundary well and can remain unchanged.

## P2 cleanup opportunities

These are not blockers.

1. **Make archival status consistent in the evidence ledger.** FeatGEO, MAGEO, and Mind Reader currently show venue/date but omit the explicit “peer-reviewed” label used for Competitive GEO, AutoGEO, NAACL coverage, and the Findings ACL live audit. No status is wrong; consistent labels would reduce scanning ambiguity.
2. **Prefer the archival GEO link.** The article labels GEO as KDD 2024 but links to arXiv. Link the text to the [KDD DOI](https://doi.org/10.1145/3637528.3671900) and retain the preprint date in the ledger if useful.
3. **Replace vague “authority signals” at line 267.** The causal evidence is more specific: candidate order, relevance, source labels in a political-news experiment, and small/conditional trust cues. “Authority” risks becoming an unfalsifiable bucket. A safer phrase is “relevance, coverage, candidate order, source identity in some domains, and the other candidates.”
4. **Keep the citation-absorption preprint descriptive.** The current paragraph does this correctly. Do not later turn its associations with length, structure, definitions, or numerical facts into causal writing instructions.

## Claims and numbers that pass

| Draft claim | Audit result | Boundary preserved? |
|---|---|---|
| GEO's main benchmark begins with Google's top five and its Perplexity arm supplies files | Pass | Yes: explicitly says this begins after retrieval |
| Competitive GEO: 252,000 paired supplied-candidate trials; relevance and list position beat formatting | Pass | Yes: “supplied-candidate” is present |
| AutoGEO: global adoption returns relative advantage near baseline while answer utility generally improves | Pass | Yes: constructed fixed-candidate engines are named |
| FeatGEO beats token-level baselines across supplied candidates | Pass | Yes: organic entry is denied |
| MAGEO uses frozen retrieval and engine-specific learning | Pass | Yes |
| Citation absorption preprint: 602 prompts across named platforms | Pass | Yes: explicitly observational and labeled preprint |
| Live audit: 4,706 queries; AIO URL overlap 18% versus organic 45%; 9–27% short-window answer flips | Pass | Yes: repeated measurement, not a stable ranking claim |
| Pinterest: reported 20% organic traffic growth | Pass | Yes after P1-1: first-party, bundled, platform-scale preprint |
| Wikipedia and browser field studies point toward referral substitution | Pass | Yes in line 275; repair line 321 as specified |
| “No reviewed search provider promises organic visibility from `llms.txt`” | Pass within the declared provider audit | Yes: client workflows are kept separate from search-provider claims |

## Research-to-advice boundary after the fixes

The article can safely retain this operating position:

- ordinary technical eligibility remains necessary on provider surfaces that document it;
- topical relevance and substantive coverage beat generic formatting inside controlled post-retrieval tests;
- query-family coverage is worth testing, but guessed hidden queries are not a content plan;
- citations, absorption, referrals, and audience outcomes require separate instruments;
- repeated runs are mandatory for live-system measurement;
- `llms.txt` remains a cheap navigation option for known-site clients, not an acquisition claim.

It should not imply that academic GEO studies have established:

- organic discovery lift from content rewriting;
- one cross-provider indexing model;
- original evidence as a measured ranking factor;
- provider fan-out as an observable publisher keyword set;
- citation visibility as a causal source of referral gains or losses;
- Pinterest's bundled first-party result as an independently replicated production trend.

## Living-center check

The article's living center survives these corrections: Goga built an “AI Reads” layer because he wanted readers, then discovered that the metric could not observe the event it claimed to count. The academic section earns its place when it extends that same failure into a general measurement discipline.

Do not expand the literature ledger further in the article body. Apply the six boundary fixes, keep the first-person implementation and measurement failure dominant, and let the evidence ledger carry provenance.

## Final decision

**Publish after the six P1 changes.** The draft has no P0 factual failure, no wrong venue status, and no headline numerical error. Its remaining risk is epistemic overreach at the sentence boundary, not a broken thesis.
