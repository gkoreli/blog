# What the supplied Ahrefs backlink table reveals

November 4, 2026. Continues the [Ahrefs baseline](04-ahrefs-baseline.md) and [TASK-0106](../../../../../docs/tasks/TASK-0106.md). Goga supplied a normalized CSV and two HTML table captures. This analysis covers all 133 supplied rows; the earlier UI review inspected only 50 rows of the filtered report.

## Coverage and method

The CSV contains **133 distinct source–target pairs**, from **89 referring page URLs** on **68 hostnames**, pointing to **41 target URLs**. These are exact URL/hostname counts, not 133 publishers or a count of independent recommendations. Target fragments are removed for grouping; query parameters remain distinct. Hostnames are not collapsed to registrable domains.

The two companion HTML captures contain 100 and 33 table rows. Every CSV source–target pair matches its corresponding HTML row after inheriting the referring URL in seven blank grouped-source cells. This verifies the normalized pairs against the supplied captures; it does not independently verify each external page or every extracted field.

The row count matches the earlier 133-group report excluding Ahrefs' known spam domains. The CSV itself does not encode the report filters, so that scope comes from the earlier UI observation. Links were not restricted to those independently checked live now. The earlier all-links crawl's article totals use a different scope: a lower count here does not demonstrate a decline.

## The articles with the widest distribution

| Canonical article | Source–target rows | Referring pages | Hostnames |
| --- | ---: | ---: | ---: |
| [Bot detection without JavaScript](https://gkoreli.com/how-i-separate-readers-from-bots-without-javascript) | 52 | 52 | 44 |
| [AI fetcher headers](https://gkoreli.com/which-ai-fetchers-send-which-headers) | 13 | 13 | 13 |
| [Backlog development story](https://gkoreli.com/one-hundred-pull-requests) | 8 | 8 | 6 |
| [First-party analytics guide](https://gkoreli.com/first-party-analytics-for-a-personal-blog) | 6 | 6 | 6 |
| [Linux signal-stack investigation](https://gkoreli.com/linux-signal-stack-conflict) | 4 | 4 | 4 |
| [Referrer-spam defense](https://gkoreli.com/filter-referrer-spam-without-deleting-analytics-history) | 3 | 3 | 3 |

One additional bot-detection link uses `?ref=ki48.no` and stays separate in these exact-URL totals. The homepage has eight rows from eight hostnames. Counts overlap across articles and should not be summed to claim a unique audience.

The strongest observed distribution belongs to the measured bot/analytics work. That supports keeping concrete observations, reproducible methods and useful explanations central to the publication. This snapshot does not isolate which topic, title, launch or artifact caused another site to link, or measure demand for an unwritten follow-up.

## Following the sources upstream

**Arcjet provides a checked example of research use.** Its [Web Bot Auth guide](https://arcjet.com/learn/web-bot-auth) links the canonical fetcher study while explaining that the captured DuckAssistBot signature covers the authority and signature-agent fields with a ten-minute expiry. The public guide was retrieved again on November 4. This is the previously known reference, reconfirmed here, and a concrete use of a particular observation rather than just a link in a list. It does not establish visits or AI-answer citations.

**A launch can produce many distribution surfaces.** Fourteen rows, representing eleven distinct referring pages across six hostnames, explicitly contain HN story ID `49594130` in their source URLs. Other titles and contexts suggest additional mirrors, feeds and translations. They are useful discovery surfaces; the URL evidence does not make each one an independent review. Twenty-three rows carry language labels other than exclusively English, which is a lead for checking cross-language reach rather than a verified translation count.

**Some apparent multiplicity comes from shared underlying material.** Six social frontend hostnames display the same Soren Beck Jensen identity and share text for the fetcher study. These source URLs are profiles, so the table alone does not prove an exact original-post identity. Two Linux-study rows use the same Nostr event identifier on different frontends. Directory pages can likewise redistribute maintainer-supplied material: the earlier baseline verified that Glama displays the Backlog repository README containing the development-story link. Preserve these as distribution while reviewing original authorship separately.

**Elseweb explains the apparent burst of new links.** It contributes 33 rows, all first seen by Ahrefs on November 4. Thirty-two come from one `elseweb.net/sites/gkoreli.com` page linking many of our articles; one comes from an Elseweb category page. These are 33 source–target pairs from two pages on one hostname. The dates establish crawler discovery, not 33 newly published endorsements. This is evidence of catalog distribution without measured downstream visits or use.

**Groas and 47+AI remain review leads.** The Groas row's surrounding text discusses an observed Claude-User test but points to `/blog/chatgpt-claude-gemini-grok-fetcher-headers-measured`, rather than the canonical study path. A 47+AI row appears to introduce the header study in Chinese and links the canonical URL. Both public-page retrievals failed through the web tool. The stored contexts are provider observations; source fidelity, current availability and the Groas target's behavior remain unchecked. No redirect or outreach follows from the table alone.

## Fields that need restraint

All 133 rows have zero URL Rating, estimated page traffic and keywords. Those fields cannot distinguish these sources within this extract, and they do not establish zero real readers. Repeated domain traffic estimates must not be summed. Domain Rating is a provider metric, not an observed search position or assistant-selection rate.

Seventy-five rows omit an absolute last-seen date and retain only a relative label. Category text is marked truncated in 131 rows. The unlabeled column has an unknown meaning and is excluded from totals. There are 27 rows carrying NOFOLLOW, three UGC and seven JS flags; these labels describe links, not whether anyone used the research. Blank labels do not establish editorial endorsement.

This dataset measures indexed links and their recorded context. It supplies no Google query/impression data, measured referral visits, complete AI-citation count, or answer explaining why an assistant selected the T3 clone. Those require their own source evidence.

## Decisions and next bounded work

Retain the existing article framing. The snapshot supports useful original investigations as a source of references, without justifying a bulk title rewrite, link purchase or new keyword-driven article. Keep methods and evidence easy for another publisher or agent to cite.

Review the Groas passage and unusual target next, then inspect selected translated or republished coverage for attribution and claim fidelity. Record verified research use separately from catalog, launch, social and README distribution. Those are complementary outcomes rather than interchangeable quality scores. Existing contextual continuations should be reviewed only where they answer the reader's next question; no internal-link intervention was made here.

For ranking and acquisition decisions, pair this map with a defined-window native Search Console page/query export and our own article-level access evidence. That can show whether linked articles also receive search impressions or referrals. This analysis does not open a new experiment, schedule a report, or build the public reference surface awaiting the owner's choice in TASK-0106.

The [derived receipt](05-ahrefs-backlink-analysis.json) records exact target totals, contributing row numbers, host counts, source leads, calculation rules and limits. The original CSV's SHA-256 is `650d40c02077478d1a4fea14be60a936628d4d143b1216106595ae3c37b8158a`. The CSV and companion captures are preserved outside Git under `~/.local/share/gkoreli/research-evidence/2026-11-04-ahrefs-backlinks/`; the owner's supplied files remain unchanged. No site content, runtime, account settings, crawl or deployment was changed.

The subsequent [Groas source verification](06-groas-reference-verification.md) resolves that lead: its link supports the OpenAI policy quoted in our study, the adjacent Claude experiment cites another publisher, and the malformed target currently returns 404 without a redirect. Its actual discovery route remains unknown. This supersedes the Groas retrieval gap above; the original dated CSV observations remain intact.
