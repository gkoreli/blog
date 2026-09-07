# Referrer spam article: scope and publication decision

Created September 6, 2026 PDT / September 7 UTC. This is a short engineering note about the referral policy already deployed in commit `fe9456e011e3e2dd7c0f691fe8ba8c247cd03a6d`. It reuses the engineering investigation in `../readers-vs-bots/15-*` and `17-*` through `19-*`; those artifacts and article 024's frozen research accounting are unchanged.

## Article passport

- **Living center:** a suspicious hostname led a public ranking, and the owner wanted it removed while retaining the observations for historical provenance.
- **Form:** short evidence-led engineering investigation / decision case study. AI-assisted drafting is appropriate; this is not an exposed essay.
- **Role:** bridge. A problem in the author's own dashboard yields a decision another analytics implementer can use.
- **Reader job:** filter suspected referral abuse, preserve the evidence needed to correct a mistaken exclusion, and distinguish recalculated history from a saved report.
- **Before / failure / repair:** arbitrary reported hostnames became public rankings; name visibility and consistent report exclusions now follow an explicit policy, while stored evidence remains available.
- **Protected uncertainty:** the supplied hostname does not establish the operator or motive. Inclusion does not establish human readership. Community-list membership can be wrong.
- **Bounded position:** this public dashboard should retain its existing evidence and version the reporting decision. Excluding matches at query time and restricting public names meet that need, with query and review costs.
- **Ending:** retain the observation, explain the decision, and preserve the report that actually appeared. No claim that the audience measurement problem is finished.
- **Length:** approximately 700–1,000 words; links carry the full ADR, precedence rules, and benchmarks.

## Discovery brief

Primary doorway: **filter referrer spam**. Secondary language: **Matomo referrer spam list**, **analytics history**, **public analytics dashboard**. These phrases come from the actual implementation and Matomo's primary documentation, not measured search-volume research. Excluded intent: GA4 configuration, complete bot detection, identifying a spam operator, blocking all automated access, and recovering headers never stored.

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

A best preserves the owner's provenance requirement and the repair another implementer can reuse. B underrepresents saved reports; C makes list integration sound like the whole problem. No keyword insertion into the body is needed.

## Promise and link plan

| Promise / reader question | Body evidence |
|---|---|
| What happened to the suspicious 35 views? | Initial ranking, fixed-window policy comparison, and separate deployment verification |
| Why retain excluded traffic? | Correction path, retained fields, versioned decision, and exact report snapshots |
| What does adopting Matomo mean here? | Pinned 2,348-host list, absent local hostname, and narrower matching semantics |
| Does the repair solve readership? | Explicitly no: unknown headers, false positives, and forged approved names remain possible |

Headings name the mechanism or decision: public ranking, observations versus reporting decisions, Matomo rules, historical reports, deployed result and cost. The implementation section marks its register change before code. Each section begins with its point and ends with its implication.

The new post is Measurement boundaries order 5. A contextual forward link goes in article 024; the new note links to articles 020 and 024. The unpublished edge-versus-RUM draft receives a short account and link, preserving its pending browser-experiment gate. This note does not occupy another promised row in FLDR-0008's existing lane.

Link-worthy artifacts already exist: the ADR, pinned evaluator, source archive, verification tables, benchmark, and report-capture command. Link to those instead of republishing the full engineering record. No custom visual is needed beyond the existing generated OG card and a small domain-concept table.

Distribution hypothesis: engineers operating public analytics or maintaining an ingestion/filtering pipeline may find the correction and report-provenance distinction useful. Publication and internal links are authorized. Social/community posting is not part of this release. No search ranking, traffic, citation, or backlink outcome is promised.

Observe through **September 28, 2026** before reacting to discovery noise. At that checkpoint inspect page-filtered search queries, attributable referrals, reader replies, corrections, and implementer evidence; record unavailable sources as unavailable. Correct factual errors immediately. Otherwise choose explicitly among content correction, discovery change, distribution change, a new experiment, or no action. The initial observation window is a review date, not a requirement for statistical significance.

## Prompt and research provenance

The prompt file preserves complete messages that shaped this case: the initial request to ground the analytics iteration, the requests for missing-data evidence and authoritative prior art, the reported referral problem and defense requirements, both provenance messages, the engineering instruction, the article/publication question, and the final authorization to proceed. Intervening generic status/bookkeeping prompts and the commit instruction are delivery context, not article substance; repository instructions are not article prompts. No message is shortened, corrected, or spliced.

Only the complete provenance question is quoted in the article. The raw prompt record preserves the owner's stronger suspicions, while the published argument limits its claims to observed requests and the chosen reporting policy. This note adds no separate research-footprint token claim: it reuses engineering work already disclosed within article 024's broader, non-exclusive scope.

Sources and claim dispositions are in [the evidence ledger](01-evidence-ledger.md). Publication checks and any bounded review belong in this directory, so the prior article's committed artifact set remains stable.
