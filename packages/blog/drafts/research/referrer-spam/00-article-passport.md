# Referrer spam article: scope and publication decision

Created September 6, 2026 PDT / September 7 UTC; editorial focus revised September 8 PDT. This engineering case study covers the referral policy deployed in commit `fe9456e011e3e2dd7c0f691fe8ba8c247cd03a6d` and its subsequent D1 cost repair. It reuses the engineering investigation in `../readers-vs-bots/15-*` and `17-*` through `19-*`; those artifacts and article 024's frozen research accounting are unchanged. The [reader-feedback worklist](07-reader-feedback-and-article-focus.md) records the current title decision, private source location, and release checks.

## Article passport

- **Living center:** the blog's public analytics gave an untrusted hostname exposure and made reported referrals look like evidence of an audience. The owner wants transparency that supports honest judgments about readership without promoting abuse.
- **Form:** evidence-led engineering investigation / decision case study. AI-assisted drafting is appropriate; this is not an exposed essay.
- **Role:** bridge. A problem in the author's own dashboard yields a decision another analytics implementer can use.
- **Reader job:** defend public analytics from referral abuse through consistent exclusions, reviewed name visibility, and explicit evidence limits. Retained observations support correcting mistakes; database cost is a supporting operating tradeoff.
- **Before / failure / repair:** arbitrary reported hostnames became public rankings; name visibility and consistent report exclusions now follow an explicit policy, while stored evidence remains available.
- **Protected uncertainty:** the supplied hostname does not establish the operator or motive. Inclusion does not establish human readership. Community-list membership can be wrong.
- **Bounded position:** this public dashboard should retain its existing evidence and version the reporting decision. Excluding matches at query time and restricting public names meet that need, with query and review costs.
- **Ending:** explain what the public report can establish, disclose its exclusions, and correct mistaken rules. No claim that filtering authenticates the remaining audience.
- **Scope:** a focused case study of public-referrer abuse and credible transparency. The D1 incident initially expanded the note, but the owner questioned its weight. The article now keeps one measured cost paragraph and links the complete incident and repair.

## Discovery brief

Primary doorway: **referrer spam defense for public analytics**. Secondary language: **Matomo referrer spam list**, **public referrer rankings**, **analytics transparency**, **versioned reporting rules**. These phrases come from the implementation, owner's concern, and primary documentation, not measured search-volume research. Excluded intent: GA4 configuration, complete bot detection, identifying a spam operator, blocking all automated access, a D1 optimization tutorial, and recovering headers never stored.

### Initial publication choice, superseded September 8 PDT

Three coherent candidates were considered after fixing the living center:

| Field | A — selected: historical provenance | B — public exposure | C — list implementation |
|---|---|---|---|
| H1 | How I Filter Referrer Spam Without Deleting Analytics History | Referrer Spam in a Public Analytics Dashboard | Using Matomo's Referrer Spam List in My Analytics |
| SEO title | Filter Referrer Spam Without Losing Analytics History | Referrer Spam in a Public Analytics Dashboard | Matomo Referrer Spam Filtering With Local Exceptions |
| Alternative headline | Versioned Matomo rules, local exceptions, and saved reports keep referral filtering reversible. | A supplied hostname reached my public rankings; visibility now requires review. | A pinned community list supplies rules; local evidence supplies exceptions. |
| Description | A public dashboard ranked a suspicious referrer first. I added Matomo rules, local exceptions, and saved reports while retaining the observations. | My dashboard promoted a supplied hostname. Reviewed names and consistent exclusions now limit that exposure while preserving evidence. | I pinned Matomo's referrer spam list, added local exceptions, and applied hostname rules without deleting the recorded observations. |
| Standfirst job | State the suspicious first-place result and the deployed retention-preserving repair. | Explain how a request field became a public ranking. | Explain why the upstream list needed local rules and explicit matching semantics. |
| Slug | filter-referrer-spam-without-deleting-analytics-history | referrer-spam-public-analytics-dashboard | matomo-referrer-spam-list-local-exceptions |
| Tags | analytics, http, cloudflare-workers, open-source | analytics, http, security | analytics, matomo, open-source |
| Internal links | First-party analytics architecture; request-classification investigation | Public stats; first-party analytics architecture | First-party analytics architecture; request-classification investigation |
| Non-promise | No complete raw-header archive or human-count accuracy claim | No complete traffic blocking or prevention guarantee | No Matomo integration tutorial or claim of equivalent matching semantics |

The initial rationale selected A because it preserved the owner's provenance requirement. It rejected B as underrepresenting saved reports and C as making list integration sound like the whole problem. The owner subsequently identified the mistake in that weighting: historical retention is a supporting design constraint, while abuse of the dashboard is the main reader problem. The current revision adopts B's public-exposure emphasis with the title **How I Defend My Analytics Against Referrer Spam**. Its complete metadata and checks are in [the revision worklist](07-reader-feedback-and-article-focus.md). The original URL stays stable.

## Promise and link plan

| Promise / reader question | Body evidence |
|---|---|
| What happened to the suspicious 35 views? | Initial ranking, fixed-window policy comparison, and separate deployment verification |
| Why retain excluded traffic? | Correction path, retained fields, versioned decision, and exact report snapshots |
| What does adopting Matomo mean here? | Pinned 2,348-host list, absent local hostname, and narrower matching semantics |
| Which practices were actually tested? | Rotating-name API fixture, complete-list and cross-evaluator checks, all-excluded state, integrity checks, and scoped live reconciliation |
| Does the repair solve readership? | Explicitly no: unknown headers, false positives, and forged approved names remain possible |

Headings name the mechanism or decision: public ranking, observations versus reporting decisions, Matomo rules, historical reports, deployed result and cost. The implementation section marks its register change before code. Each section begins with its point and ends with its implication.

The new post is Measurement boundaries order 5. A contextual forward link goes in article 024; the new note links to articles 020 and 024. The unpublished edge-versus-RUM draft receives a short account and link, preserving its pending browser-experiment gate. This note does not occupy another promised row in FLDR-0008's existing lane.

Link-worthy artifacts already exist: the ADR, pinned evaluator, source archive, verification tables, benchmark, and report-capture command. Carry selected consequential results into the article beside the practice they support; link the full artifacts for reproduction and detail. A link alone does not teach what the experiment established. The practice/result and live-scope tables make these connections without republishing the complete engineering record.

Distribution hypothesis: engineers operating public analytics or maintaining an ingestion/filtering pipeline may find the correction and report-provenance distinction useful. Publication and internal links are authorized. Social/community posting is not part of this release. No search ranking, traffic, citation, or backlink outcome is promised.

Observe through **September 28, 2026** before reacting to discovery noise. At that checkpoint inspect page-filtered search queries, attributable referrals, reader replies, corrections, and implementer evidence; record unavailable sources as unavailable. Correct factual errors immediately. Otherwise choose explicitly among content correction, discovery change, distribution change, a new experiment, or no action. The initial observation window is a review date, not a requirement for statistical significance.

## Prompt and research provenance

The prompt file preserves complete messages that shaped this case: the initial request to ground the analytics iteration, the requests for missing-data evidence and authoritative prior art, the reported referral problem and defense requirements, both provenance messages, the engineering instruction, the article/publication question, and the final authorization to proceed. Intervening generic status/bookkeeping prompts and the commit instruction are delivery context, not article substance; repository instructions are not article prompts. No message is shortened, corrected, or spliced.

Only the complete provenance question is quoted in the article. The raw prompt record preserves the owner's stronger suspicions, while the published argument limits its claims to observed requests and the chosen reporting policy. The owner subsequently requested a measured research footprint. The [accounting note](10-research-footprint.md) defines its contributing-session scope and overlap with article 024. The new measurement includes later implementation, publication, D1 repair, and editorial work; article 024's frozen manifest remains unchanged. The totals cannot be added together without deduplicating their shared session prefixes.

Sources and claim dispositions are in [the evidence ledger](01-evidence-ledger.md). Publication checks and any bounded review belong in this directory, so the prior article's committed artifact set remains stable.
