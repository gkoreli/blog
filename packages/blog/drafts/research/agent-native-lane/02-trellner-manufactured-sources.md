# Research audit: Trellner TR-2026-009

**Subject:** *Manufactured Sources Behind AI Recommendations*  
**Report ID:** TR-2026-009  
**Trellner publication date:** 2026-09-02  
**Audit fetch date:** 2026-09-02 in America/Los_Angeles (2026-09-03 UTC for all network fetches)  
**Scope:** report, methodology, published scripts, every linked data artifact, selected live evidence pages, and publisher/conflict checks

## Overall assessment

The release is a useful descriptive snapshot of URLs returned by two Perplexity tiers routed through OpenRouter whose outputs overlap strongly. Trellner publishes enough cleaned data and code to independently recompute most headline counts. It is not evidence that a formally identified manufactured-source class causes AI recommendations. That label has no operational definition, no classifier, and no column in the dataset. Three domains are selected after collection and hard-coded in the analysis.[^report][^method][^analyze]

The strongest reusable contribution is the artifact design: call-level records, flat recommendation and citation tables, a pinned Tranco list, archive and liveness enrichment, evidence extracts, a method, a report ID, a PDF, and a CC BY 4.0 licence. The most serious defect is the Wayback treatment: failed lookups become blank exported dates and are then counted as absent from the archive. Three obviously archived domains account for at least 271 of the 343 citation occurrences carrying blank dates, so the published 4.6% derived value cannot be interpreted as a verified no-capture rate.[^enrich][^export][^citations][^wb-reddit][^wb-nytimes][^wb-x]

## 1. What the report claims

### Exact scope and units

| Quantity | Exact value | What it actually counts |
|---|---:|---|
| Categories | 380 | English buyer-intent software/service category strings |
| Models | 2 | `perplexity/sonar` and `perplexity/sonar-pro`, both through OpenRouter |
| Calls | 760 | One call per category per model |
| Recommendation slots | 3,800 | Five parsed positions per call |
| Distinct products | 1,807 | Distinct normalized product-name strings, not entity-resolved companies |
| Citation occurrences | 7,534 | Provider-returned citation URL entries; 3,767 per model |
| Distinct citation URLs | 3,879 | Exact URL strings after export |
| Derived cited domains | 2,055 | The script’s last-two-host-label keys |
| Recommended homepage domains | 1,502 | Distinct domains supplied by the models inside the requested answer objects |

These units come from the report, `numbers.json`, the exported CSVs, and my independent row-level recomputation.[^report][^numbers][^answers][^citations][^domains][^vendors]

The central popularity result is citation-weighted:

- 1,766 of 7,534 citation occurrences, or 23.4%, have a derived domain absent from Tranco K9QPW’s top million.
- 4,508 of 7,534, or 59.8%, either rank numerically greater than 100,000 (worse than #100,000) or are absent. The implementation assigns absent domains an effective rank of one billion for this calculation.
- 5,768 citation occurrences have a Tranco rank; their citation-weighted median rank is 71,611.
- 751 of 2,055 distinct derived domains, or 36.5%, are absent from that Tranco list.
- The ten most-cited derived domains account for 1,302 occurrences, or 17.3%. Wikipedia accounts for three occurrences.

The report presents the 59.8% figure as a source share. Technically, it means 59.8% of citation **occurrences**, including missing ranks; it does not mean 59.8% of distinct URLs or domains.[^numbers][^analyze]

The report also compares archive ages among domains for which a first-capture date was exported: the median first-capture year is 2020 for Tranco-absent domains and 2011 for ranked domains; 16.6% versus 1.6% were first captured in 2025 or later. Those figures exclude blank archive values and should be treated cautiously because the blanks contain confirmed lookup failures, discussed in Sections 2 and 3.[^numbers][^enrich]

### Named actors

Guideflow is the strongest single-domain content-marketing example. It receives 194 citation occurrences, 2.57% of the corpus, across 96 categories and 96 distinct URLs; it ranks third among derived domains and was Tranco rank 177,039. Its sitemap contained 3,351 blog URL entries representing 2,176 distinct posts. Trellner manually describes it as an interactive-demo vendor whose blog publishes listicles outside its product category. There is no dataset-wide vendor/review/publisher classification supporting that description.[^report][^numbers]

There is a numerical wording error in the report: it says each of Guideflow’s 194 citations is a different URL, then immediately reports 96 distinct URLs. Both cannot be true. The data support 194 occurrences and 96 unique URLs; repeated URLs across the two model tiers are the natural explanation.[^report][^citations][^numbers]

For the three domains Trellner groups together:

| Domain | Citation occurrences | Categories | Distinct cited URLs | Sitemap URLs | `/best/` pages |
|---|---:|---:|---:|---:|---:|
| `wifitalents.com` | 71 | 27 | 40 | 105,541 | 72,713 |
| `worldmetrics.org` | 60 | 22 | 31 | 103,578 | 70,731 |
| `gitnux.org` | 50 | 23 | 31 | 107,083 | 71,684 |
| **Combined** | **181** | **41 unique categories** | — | — | **215,128** |

The 181 occurrences are 2.4% of all citations and touch 10.8% of categories. The sites share a Cloudflare nameserver pair, a page template, navigation/taxonomy, and cross-promotional blogs. Trellner correctly calls common control circumstantial rather than proven.[^numbers][^sitemaps][^report]

Trellner’s saved WHOIS extraction gives creation timestamps of 2023-12-04T17:10:49Z for Gitnux, 2024-04-17T14:43:26Z for WifiTalents, and 2024-05-01T18:03:06Z for Worldmetrics; all three list NameCheap as registrar. These are domain-registration facts, not dates for individual buying-guide pages.[^numbers]

The homepage metadata is live: Worldmetrics and Gitnux use the `Facts & Grounding Page` title; ZipDo, the fourth cross-promoted brand, uses it too. WifiTalents currently uses a different homepage title.[^worldmetrics][^gitnux][^zipdo][^wifitalents]

The homepage-domain audit finds 10 names with no A-record resolution, four resolving names with no response on either path, two HTTP 404s, and one HTTP 502. That is 17 of 1,502, or 1.1%, classed as gone or unreachable. Another 92, or 6.1%, redirect outside the supplied domain. Combining those groups yields the report’s 109-domain wrong/stale group, 7.3%, but off-domain redirects include ordinary acquisitions and rebrands and are not inherently wrong.[^numbers][^vendors][^redirect]

### Exact definitions—and the missing ones

The quoted term **“manufactured source”** is not operationally defined anywhere in the report, README, METHOD, CSVs, or published scripts. There is no rule for inclusion, no model or human coding protocol, no threshold, no negative examples, no blinded review, and no inter-rater check. `analyze.py` simply hard-codes `worldmetrics.org`, `gitnux.org`, and `wifitalents.com` into a three-element list after data collection. The claim that the pages were machine-generated is also an inference from scale and templates; the report publishes no generator trace or detector validation.[^report][^method][^analyze]

**“Facts & Grounding Page”** is an exact HTML title on Worldmetrics, Gitnux, and ZipDo. The report defines grounding as **“the name of the step in which a retrieval system fetches documents to condition an answer on.”** That explains why the wording is noteworthy, but it does not prove who the intended reader was or why Perplexity selected a page.[^report][^worldmetrics][^gitnux][^zipdo]

The effective classifications are:

- **Vendor:** the domain that the model supplied as the product’s official homepage in the requested `name`/`domain` answer object. This is model output, not a verified business-type label.
- **Review site:** not systematically defined or coded. G2, Capterra, Gartner, and similar sites are discussed by name in prose.
- **Manufactured:** an editorial, post-hoc label applied to the three hard-coded domains above.
- **Guideflow:** manually interpreted as a vendor with a broad content-marketing blog, not assigned by a reusable classifier.

Accordingly, the corpus can support statements about returned citations, domains, ranks, and page similarities. It cannot support a measured prevalence of vendor, review, or manufactured source types.[^orlib][^answers][^analyze][^report]

## 2. Method audit

### Collection design

The question list contains 380 hand-written English category strings spanning mainstream B2B software, developer infrastructure, and vertical software. Trellner says the list was fixed before viewing results, but there is no preregistration, timestamped hash, or repository history that independently establishes that chronology.[^method][^cats]

The prompt shape was one buyer-intent question:

```text
What are the best {category} in 2026?
```

It then demanded only an array of exactly five ranked objects, each shaped:

```json
{"name": "<product name>", "domain": "<official website domain, no www or https>"}
```

This was a natural-language formatting instruction, not an API-enforced JSON Schema. The request body contains one user message and `max_tokens: 700`; it sets no system message, `response_format`, seed, or temperature. The parser searches for the first bracketed span, JSON-decodes it, and accepts every dictionary with a truthy `name`; it does not enforce five objects or a nonempty domain. All 760 published calls nevertheless contain exactly five picks.[^method][^orlib][^raw]

The calls used `perplexity/sonar` and `perplexity/sonar-pro` through OpenRouter. They are two tiers from one vendor family, not independent vendor observations: 289 of 380 category pairs have byte-identical citation lists, the tiers’ unique-URL sets have Jaccard similarity 0.898, they choose the same top product in 290 categories, and their top-five product-name sets have mean Jaccard similarity 0.763. This suggests shared retrieval components but does not establish the provider’s internal architecture.[^method][^numbers]

The public records’ request-start timestamps run from 2026-09-02T11:53:54Z through 11:57:53Z, a roughly four-minute snapshot. Completion timestamps are absent. The collector allows up to three attempts, but the cleaned JSONL removes error, attempt, raw response ID, response text, and usage fields, so retries and exact provider responses cannot be audited from the release.[^run][^raw][^export]

### Requested output and citation collection

`orlib.py` collects both top-level response `citations` and URLs inside `message.annotations[].url_citation`, concatenating them without a source-type field. It does not map a citation to a particular one of the five recommendations. The resulting data therefore answer “which URLs did the provider return with this call?” rather than “which source supports this product?” or “which origin server did Perplexity fetch during this call?”[^orlib][^raw]

The 760 records return a mean 9.91 citations: 700 calls contain 10 URLs, 55 contain 9, four contain 8, and one contains 7. That strongly suggests a ten-result response ceiling, but the exact ceiling is **UNVERIFIED**. Within a call there are no duplicate exported URL strings.[^raw]

### Enrichment

- **Tranco:** daily list K9QPW, generated 2026-09-01. “Unranked” means the script’s derived key is absent from that exact top-one-million file. Tranco is used as a popularity proxy, not a reliability score.[^method][^tranco]
- **Domain reduction:** the host is reduced to its last two labels instead of using the Public Suffix List. This works for many `.com`-like names but is not a correct registrable-domain algorithm.[^enrich][^psl]
- **Wayback:** the script asks the CDX API for the first HTTP-200 capture with `matchType=domain` and `limit=1`. It retries three times but stores an error beside a null date. Export drops that error field.[^enrich][^export]
- **Vendor liveness:** each supplied homepage was checked directly and through a rotating proxy, then considered reachable if either path succeeded. DNS was local; 403 and 429 were treated as blocking rather than disappearance. TLS verification was disabled.[^method][^enrich][^merge]
- **Evidence:** named pages were refetched near write time and represented by visible-text extracts plus a 21-row manifest containing source URL, status, final URL, byte count, fetch time, and route.[^method][^manifest]

The METHOD says all non-OpenRouter web requests went through the proxy, but `enrich.py` performs its initial homepage and Wayback calls directly. This is an internal documentation/code mismatch.[^method][^enrich]

### Sample size, window, and cost

The primary sample is 380 categories × two tiers × one run = 760 calls, yielding 3,800 answer positions and 7,534 citation occurrences. Collection spans about four minutes on 2026-09-02; named evidence was refetched around 12:16Z. The stated OpenRouter cost is $23.77, measured as the account-usage difference before and after the run. That is $0.031276 per call and $0.06255 per two-tier category at this run’s observed blended rate. The starting and ending account responses are not published, so the charge cannot be independently reconciled.[^method][^numbers][^raw][^manifest][^spend]

No direct Perplexity API key is needed to run the published route; it requires an `OPENROUTER_API_KEY`. A direct Perplexity replication would use a different route. Perplexity’s current documentation says Sonar Chat Completions will be supported until 2026-09-27 and directs new work toward its Agent API, so a future replication should record the exact endpoint and migration state.[^orlib][^perplexity]

### What is strong

- The question list, exact prompt template, models, call count, collection date, and stated spend are public.
- Call-level data make model/category pairing and repeated URLs inspectable.
- Tranco is pinned to a list ID and date rather than silently using a current rank.
- Recommendation, citation, domain, liveness, sitemap, and named-page evidence are separated into useful tables.
- The two-path liveness rule is conservative about bot blocking.
- Trellner explicitly limits the finding to Perplexity, disclaims causality, and calls common control circumstantial.
- The data licence permits reuse with attribution.[^method][^readme][^report]

### What is weak

- **One vendor family with high overlap:** two Perplexity tiers routed through OpenRouter share most citation URLs.
- **One English prompt form:** no language, geography, persona, task-stage, or “best” versus “popular” sensitivity test.
- **One run:** no repeat sampling, confidence intervals, or temporal replication.
- **Hand-built categories:** broad but not sampled from an external frame; niche mix can affect prevalence.
- **No version controls:** no provider route, model snapshot, system configuration, seed, or effective temperature is recorded.
- **Provider-reported citations only:** no raw network observation, source-fetch timestamp, citation-to-claim mapping, or proof every returned URL was fetched during that call.
- **Post-hoc source typing:** no operational classifier for vendor, review, publisher, SEO listicle, or manufactured content.
- **No causal test:** the study does not remove a source, alter a page, or show that any cited page changed a recommendation.
- **Lax output parser:** the requested five-object shape is not enforced.
- **Incorrect registrable-domain logic:** public suffixes are sometimes treated as domains.
- **Archive errors become absence:** the most consequential data bug.
- **Liveness is not user-equivalent:** IPv4-only local DNS resolution, disabled TLS checks, root-page requests, short timeouts, and custom proxy paths do not reproduce an assistant crawler or browser.
- **“Raw” is cleaned:** the published JSONL omits response envelopes, text, IDs, usage, attempts, and errors.[^method][^orlib][^enrich][^export][^raw]

## 3. Dataset

### Files and size

The data index links 46 artifacts totaling 2,765,195 bytes, all of which returned HTTP 200 during this audit. The eight core data files total 2,325,818 bytes. A 162,996-byte PDF is reachable from the report but omitted from the directory index. There is no archive download, but the complete linked bundle is far below 50 MB; I fetched it for this audit and did not retain a second local copy because this task permits only the report output file.[^data][^pdf]

Core files:

| File | Bytes | Role |
|---|---:|---|
| `answers.csv` | 270,568 | One product recommendation per row |
| `answers_raw.jsonl` | 803,802 | One cleaned call record per line |
| `citations.csv` | 1,047,091 | One returned citation occurrence per row |
| `cited_domains.csv` | 70,077 | Aggregated derived-domain table |
| `vendor_domains.csv` | 86,809 | Homepage liveness results |
| `numbers.json` | 22,175 | Derived report metrics |
| `redirect_check.json` | 22,489 | Off-domain redirect checks |
| `sitemaps.json` | 2,807 | Counts for named sites |

The index also publishes METHOD and README files, 14 scripts, 21 named-page text extracts, and `evidence/manifest.json`.[^data][^readme]

### Exact columns

```text
answers.csv
model,category,position,product_name,vendor_domain

citations.csv
model,category,citation_url,domain,tranco_rank,wayback_first_capture

cited_domains.csv
domain,citations,categories_cited_in,tranco_rank,wayback_first_capture

vendor_domains.csv
domain,times_recommended,dns_resolves,http_status,final_url,direct_status,proxy_status
```

`answers_raw.jsonl` records `model`, `cat`, `ts`, `picks`, and `citations`; each pick has `name` and `domain`. `redirect_check.json` records the supplied domain and names, destination, status and byte count, whether a product name was found, and the matched string. `sitemaps.json` records sub-sitemap count, total URLs, `best` pages, blog pages, and samples. The evidence manifest records name, requested URL, status, final URL, bytes, error, fetch time, and route.[^readme][^raw][^redirect][^sitemaps][^manifest]

The stated licence is CC BY 4.0 with attribution to Trellner Research and a link to the report. There is no separate software licence for the scripts, so whether the CC licence is intended to govern code is ambiguous.[^readme]

### Quick integrity and quality checks

| Check | Result |
|---|---|
| Parsed calls | 760; all have five picks |
| Recommendation rows | 3,800; no missing model/category/position/name/domain and no duplicate position within a call |
| Citation rows | 7,534; no exact duplicate row and no duplicate URL within a model/category call |
| Derived-domain rows | 2,055 unique keys; aggregate citation counts sum to 7,534 |
| Vendor rows | 1,502 unique domains; recommendation counts sum to 3,800 |
| Missing Tranco rank | 1,766 citation rows and 751 domain rows |
| Missing Wayback date | 343 citation rows and 27 domain rows |

These checks were independently recomputed from the four CSVs and JSONL.[^answers][^raw][^citations][^domains][^vendors]

There are no duplicate domain rows, but five “domain” keys are actually public suffixes: `com.au`, `com.mx`, `github.io`, `ac.uk`, and `net.nz`. They represent nine citation occurrences. For example, `baeseokjae.github.io` is collapsed to `github.io` and inherits that suffix’s Tranco rank, while `bodleian.ox.ac.uk` and `catalyst.net.nz` lose their true registrable domains. The report discloses approximate last-two-label grouping, but the resulting ranks are still wrong for those rows. A Public Suffix List/eTLD+1 implementation should replace it.[^citations][^enrich][^psl][^tranco]

The archive field has a larger problem. `enrich.py` distinguishes `wayback_first: null` from `wayback_error`, but `export.py` discards the error and emits a blank date for both. `analyze.py` then treats every blank as never archived. Yet the Wayback availability API confirms captures for:

- `reddit.com`: 261 blank-date citation occurrences; a capture is returned from 2006.
- `nytimes.com`: eight blank-date occurrences; a capture is returned from 1996.
- `x.com`: two blank-date occurrences; a capture is returned from 1999.

Those three domains alone account for 271 of 343 blank-date citation occurrences. At most 72 occurrences remain unresolved after correcting these demonstrable false negatives. The release’s 4.6% no-capture value is therefore not valid as stated; the reason each remaining lookup is blank is **UNVERIFIED**.[^enrich][^export][^analyze][^citations][^wb-reddit][^wb-nytimes][^wb-x]

### Reproducibility

**Recomputing the main descriptive tables from the release:** mostly reproducible. The CSVs and `numbers.json` permit independent counts, shares, model overlap, and named-domain results. Several report-only numbers, including Guideflow’s 2,176 distinct posts, are not present in `numbers.json`, contrary to the METHOD’s claim that every quoted figure is stored there.[^numbers][^report][^method]

**Re-running the whole study from scratch:** not turnkey:

- The exact Tranco `top-1m.csv` input and its checksum are not included, although the list ID is.
- The proxy URL/credential, environment specification, dependency lockfile, and account-spend baseline are absent.
- The published run order does not line up cleanly with intermediate filenames: the enrichment and merge scripts expect differently named direct/merged JSON artifacts.
- `farm_facts.py` depends on saved HTML/WHOIS material that is not all published as raw inputs, and no published collector fully recreates the sitemap facts.
- Exported “raw” responses have been deliberately reduced and cannot reproduce parsing, retries, usage, or the provider’s response envelope.
- The model revision, OpenRouter routing state, and provider-side retrieval configuration are not pinned.
- There is no release checksum manifest, git commit, tagged version, or DOI.[^readme][^method][^run][^enrich][^merge][^farm][^export][^spend]

The fair characterization is: **the published analysis is substantially auditable; exact end-to-end reproduction is not currently possible from the public bundle alone.**

## 4. Who is Trellner?

### What it presents itself as

Trellner describes itself as an independent research firm studying brands, products, and market positioning. Its about page says subjects do not pay it, it accepts no sponsorship, and it issues no ratings, rankings, or investment advice. Its leadership page names Konrad Trellner as founder/director, Margaret Ellis as principal analyst, and Sofia Marek as senior analyst.[^about][^leadership]

The public reports index lists eight items: TR-2026-001 through 007 and TR-2026-009. Their subjects cluster around AI visibility, entity signals, citation concentration, software-buyer research, the difference between machine retrieval and human visits, and AI reference layers. Most are short narrative research pieces rather than downloadable empirical releases; TR-2026-009 is the most complete public data package on the index. The public podcast feed contains episodes for TR-2026-001, 002, 008, and 010, including the two reports omitted from the site index.[^reports][^podcast]

Across representative reports TR-2026-003, 004, and 006, the site uses contextual inline links rather than a conventional bibliography. TR-2026-009 links its external benchmark (Tranco), then moves most verification into its internal data directory: cleaned source data, scripts, named-page extracts, and a manifest. The manifest covers selected pages discussed in the prose, not all 7,534 citation occurrences. This is better provenance than unsupported narrative, but it still requires readers to distinguish captured first-party claims from independent corroboration.[^tr003][^tr004][^tr006][^report][^data][^manifest]

### Commercial-interest audit

I found no Trellner-branded paid product for AI-citation measurement, optimization, or publishing on the inspected public pages. The site advertises free research reports and a contact address. Thus no direct product-sales conflict tied to TR-2026-009 was established; undisclosed services or ownership interests remain **UNVERIFIED**.[^about][^reports]

There is a direct inconsistency on Trellner’s own site. Its about page says it issues no rankings, while two live, consecutively numbered reports do exactly that:

- TR-2026-008 ranks ExhibitorLens first among ten trade-show exhibitor-list providers and describes a $199 one-time product.
- TR-2026-010 ranks TAM Graph first among ten B2B data APIs and describes a $199/month product.

Both pages are dated 2026-09-02 and state that rank cannot be bought and Trellner receives no payment or affiliate benefit. Neither report appears on the reports index or sitemap fetched for this audit, although both have entries in the podcast feed.[^about][^tr008][^tr010][^reports][^trellner-sitemap][^podcast]

TAM Graph is explicitly listed on the Hatchling Labs homepage. TAM Graph and ExhibitorLens both load `pulse-rvrb.onrender.com/p.js` and `support.js`; the shared support script’s failure message directs users to `jakob@hatchlinglabs.com`. This establishes TAM Graph as a listed Hatchling product and shows an apparent shared support/analytics relationship across both products. It does **not** by itself establish who owns ExhibitorLens or Trellner.[^hatchling][^tamgraph][^exhibitorlens][^pulse]

There are additional coordination signals:

- `trellner.com`, `hausresearch.com`, and `fentner.com` were registered at the exact same second, 2026-09-01T12:07:27Z, through the same registrar and with the same default nameserver pair.
- The Hacker News account `jakobgreenfeld` submitted a report from each domain between 13:49:23Z and 13:59:59Z on 2026-09-02—a 10 minute 36 second window.
- `trellner.com` was therefore registered one day before TR-2026-009’s stated publication date. Some indexed Trellner reports carry August dates that predate the current domain registration.[^rdap-trellner][^rdap-haus][^rdap-fentner][^hn-trellner][^hn-haus][^hn-fentner][^reports]

These facts strongly indicate a coordinated launch. They do not prove common legal ownership, and they do not prove that the TR-2026-009 dataset was altered to benefit a product. A Companies House text search for “Trellner” returned no exact company match, but that cannot exclude another jurisdiction or a trading name. I found no independent basis in the inspected sources to validate the three leadership biographies.[^companies][^leadership]

**Conflict verdict:** a direct ownership conflict between Trellner and Hatchling Labs, TAM Graph, or ExhibitorLens is **UNVERIFIED**. TR-2026-008 and 010 concern separate product rankings, not the citation-source question in TR-2026-009, and no evidence reviewed here shows that those products shaped this dataset. Even so, the omitted product-ranking reports, synchronized research-site launches, one promoter account, and shared support/analytics endpoints create a material disclosure concern. Trellner should disclose the operating legal entity, ownership, funding, staff profiles, and any personal or corporate relationship to every ranked subject. Until then, its independence statement is a first-party claim, not an independently established fact.[^report][^tr008][^tr010][^tamgraph][^exhibitorlens][^pulse]

## 5. What we can learn and reuse

### A better dataset schema

Trellner’s four-level shape is worth reusing:

1. **Call:** model, query/category, timestamp, parsed picks, returned citations.
2. **Recommendation:** one row per ranked product.
3. **Citation:** one row per returned URL occurrence.
4. **Domain:** aggregate occurrences/categories plus popularity and archive enrichment.

For our work, add:

- `run_id`, `call_id`, provider response ID, attempt, request-start and response-end timestamps;
- endpoint, provider route, exact model revision, temperature, seed, locale, geography, and prompt-family/variant;
- the untouched response envelope and usage object, stored privately if necessary, plus a committed hash;
- citation ordinal, provider result type, annotation span, and citation-to-claim or citation-to-product mapping when available;
- correct PSL/eTLD+1, full host, requested URL, final URL, HTTP status, and content hash;
- separate `archive_checked`, `archive_found`, `archive_error`, request URL, response status, and first-capture timestamp;
- source-side `request_observed`, Worker event ID, timestamp, path, headers, ASN, IP classification, and cache status;
- human-coded source type with a published rubric, multiple labels where necessary, reviewer IDs, and disagreement/adjudication fields.

That would let one dataset distinguish a provider-returned citation, a verified origin request, a recommendation, and an analyst’s source classification instead of blending them.[^raw][^answers][^citations][^domains][^gkoreli-data]

### Tranco and Archive verification

Keep the pinned Tranco step, but publish the exact input file or its SHA-256 and use the Public Suffix List to calculate eTLD+1. Preserve both full host and eTLD+1; a documentation subdomain and its parent may have different roles even when they share an organization.[^tranco][^psl]

Keep the archive step, but make it tri-state: `captured`, `not_found`, or `lookup_error`. Save the exact CDX request, status, response hash, and retry history. Treat first archive capture as a lower bound on page/domain web presence, not the registration date or proof of publication history.[^enrich][^wb-reddit]

### Detectable grounding-page signature

The reusable homepage signature, normalized by brand, is:

```html
<title>{Brand} — Facts &amp; Grounding Page</title>
<meta property="og:title" content="{Brand} — Facts &amp; Grounding Page"/>
<meta name="twitter:title" content="{Brand} — Facts &amp; Grounding Page"/>
<meta name="robots" content="index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1"/>
```

The exact description-bearing tag structure is:

```html
<meta name="description" content="{description}"/>
<meta property="og:description" content="{description}"/>
<meta name="twitter:description" content="{description}"/>
```

Within each site, those three decoded `content` values are byte-identical; across the sites, only the brand differs. To make the full 28-word value exactly testable without needlessly reproducing it, strip no whitespace, UTF-8 encode the decoded attribute value, and compare SHA-256:[^worldmetrics][^gitnux][^zipdo]

| Brand | SHA-256 of exact decoded description |
|---|---|
| Worldmetrics | `4e255affe947cddd595d9601748ccfd73c27805da6dce0b7e5b99118ad586eaa` |
| Gitnux | `30e4ca3e73b8f78fa0dfe19ce3fa8770be392814136b7a00f2eec78ab6bf8657` |
| ZipDo | `c59580e78c6262bbd9d36145689eecda11445a4e3ba2eb7d90d1025c3f842822` |

This signature is present on Worldmetrics, Gitnux, and ZipDo as fetched; WifiTalents is part of Trellner’s three-domain citation group but currently has different title and description text. A crawler analyst should treat the signature as a fingerprint for clustering and review, not as proof of ownership, automation, deception, quality, or causal influence on citations.[^worldmetrics][^gitnux][^zipdo][^wifitalents]

### The report as a citable artifact

Useful publication mechanics to copy:

- stable report ID `TR-2026-009`;
- canonical HTML report plus a dated PDF;
- JSON-LD `Article` metadata with an identifier;
- stable data directory linked from the report;
- README, METHOD, cleaned JSONL/CSV files, scripts, derived `numbers.json`, and named evidence;
- explicit licence and attribution instruction.[^report][^data][^readme][^pdf]

We should improve the pattern with a versioned release, git commit, checksums for every public artifact and external input, immutable raw-prefix commitments, a correction log, explicit software licence, and a data page that is indexable and uses the current report title. Trellner’s data page is `noindex`, and its link text retains an older title, which weakens discovery and artifact coherence.[^data][^export]

## 6. Ranked article angles for our lane

Cost estimates below use Trellner’s observed $23.77/760-call blended rate, about $0.0313 per call. They are planning estimates, not current price quotes. The published Trellner path needs an OpenRouter key, **not** a direct Perplexity key.[^method][^orlib]

### 1. Which sources does Perplexity use for AI-fetcher headers, `llms.txt`, and first-party blog analytics?

**Search question:** “Which sources does Perplexity cite for AI crawler headers, llms.txt, and first-party analytics—and does gkoreli.com appear?”

**Data needed:** Four topic families—AI fetcher headers, AI crawler identification, `llms.txt`, and privacy-preserving first-party analytics—with ten natural queries each, two model tiers, and three repeats: 240 calls. Preserve full responses, citation order, search-result metadata where available, and exact timestamps. Check both `gkoreli.com` citations and named recommendations; informational queries matter because gkoreli.com is a publication, not a software vendor.

**Key/cost:** No Perplexity key if we follow the OpenRouter route; OpenRouter key required. Estimated API cost: **$7.51**.

**Source-side link:** Run the questions while the Worker capture is live. Join provider-returned citation URLs to incoming requests by a narrow timestamp window, requested path, User-Agent, ASN, and headers. This directly extends our published header captures from “who fetched?” to “which question and returned citation coincided with the fetch?”[^gkoreli][^gkoreli-data]

### 2. Do AI-cited domains ever send measurable traffic to an independent engineering site?

**Search question:** “Do the domains AI assistants cite most often send readers, referrers, or crawler activity to independent sites?”

**Data needed:** Normalize Trellner’s 2,055 derived domains correctly with PSL, then join them to our stored `Referer` hosts, attributable AI referrals, and requested paths. Split human referral sessions from AI fetch events and report match counts, dates, pages, and conversion to a real read.[^domains][^gkoreli-data]

**Key/cost:** No model API key. **$0 API cost.**

**Source-side link:** This uses our first-party analytics directly. Important constraint: an AI crawler request originates from assistant infrastructure, not from the cited publisher’s domain. A match against the 2,055-domain list is meaningful only in a referrer/URL field; it must not be inferred from bot IP or User-Agent alone.

### 3. Which generated recommendation pages do AI fetchers actually request?

**Search question:** “Do AI assistants actually fetch machine-generated ‘best software’ pages, or merely return them as citations?”

**Data needed:** Origin logs from Worldmetrics, Gitnux, WifiTalents, or a cooperating operator would be decisive: path, timestamp, User-Agent, headers, ASN, cache state, and response. Without cooperation, the direct historical question is **UNVERIFIED**. The ethical controlled alternative is to publish matched instrumented pages on domains we control whose substantive content is identical and whose metadata signature differs, then issue a preregistered prompt set.[^report][^worldmetrics][^gitnux][^wifitalents]

**Key/cost:** No key for donated origin logs. A controlled pilot with ten questions, two metadata variants, two tiers, and three repeats is 120 calls: about **$3.75** via OpenRouter.

**Source-side link:** Reuse the same Cloudflare Worker JSONL/CSV schema from our fetcher-header article, adding experiment and page-variant IDs. This is the clean source-side counterpart Trellner does not have.[^gkoreli][^gkoreli-data]

### 4. Does `llms.txt` change citations, fetches, neither, or both?

**Search question:** “Does llms.txt help a site get cited by AI assistants?”

**Data needed:** Matched, genuinely useful pages on controlled hosts; randomized presence/absence or content of `llms.txt`; identical page content and internal links; repeated prompts over a predeclared window; API citations plus origin request logs. A before/after design on one host is confounded by time, so paired hosts or alternating randomized exposure is better.

**Key/cost:** A 20-query × two-condition × two-tier × three-repeat experiment is 240 calls, about **$7.51**, via OpenRouter.

**Source-side link:** Our captures can determine whether assistants request `/llms.txt`, whether they then request listed pages, and whether those same pages appear in returned citations.

### 5. How common is the `Facts & Grounding Page` pattern?

**Search question:** “How many sites publish pages explicitly designed to ground AI answers?”

**Data needed:** Crawl the 2,055 citation domains’ homepages and a bounded sitemap/page sample with rate limits and robots-aware behavior. Match title/description signatures, then cluster shared templates, nameservers, analytics IDs, structured data, and internal taxonomies. Manually review every positive and a random negative sample. Call them signature matches, not manufactured sources.[^domains]

**Key/cost:** No model API key. **$0 model cost;** ordinary crawl and storage costs only.

**Source-side link:** Compare signature clusters with the pages and bot families visible in our own referral/fetch data. This separates “designed to be machine-legible” from “observably fetched.”

### 6. What can a site owner actually control if they want honest AI citations?

**Search question:** “How can a website owner get cited by AI assistants without publishing SEO spam?”

**Data needed:** Preregistered interventions on useful gkoreli.com pages: explicit title/description, concise answer block, authorship/date/provenance, linked raw data, stable canonical URL, structured data, internal links, and machine-readable download. Change one factor at a time or use a small factorial design; measure fetches, returned citations, citation accuracy, and human referrals over weeks.

**Key/cost:** A 40-query × three-page-condition × two-tier × three-repeat round is 720 calls, about **$22.52**. Repeat rounds multiply that cost.

**Source-side link:** This joins controllable page changes to our strongest evidence: what the server received. The article’s honest conclusion may be that owners control clarity, accessibility, provenance, and measurement—not inclusion.

### 7. How sensitive are AI citation audits to one adjective and one run?

**Search question:** “Do AI sources change when you ask for the ‘best,’ ‘most popular,’ ‘most trustworthy,’ or ‘best for small teams’?”

**Data needed:** Ten categories from each of four relevant topic families, four prompt forms, two tiers, and three repeats: 960 calls. Compare citation URL/domain Jaccard, top-product agreement, gkoreli inclusion, rank distribution, and origin fetches. Publish all prompt variants and multiple-comparison rules.

**Key/cost:** OpenRouter key; no direct Perplexity key. Estimated cost: **$30.03**.

**Source-side link:** Timestamp every call and test whether changing wording changes not only returned URLs but actual request paths and headers.

## 7. Verification

### Verification rules

- Every factual claim above points to a source below. All sources were fetched with text-only HTTP requests on **2026-09-02 America/Los_Angeles (2026-09-03 UTC)**.
- Published CSV/JSON counts labelled as my recomputation were derived directly from the linked artifacts, without writing a second dataset copy.
- First-party statements are described as statements, not independent proof.
- Inferences are labelled as such. Unknown ownership, causality, model internals, and archive-error causes remain **UNVERIFIED**.

### Explicitly unverified

1. **UNVERIFIED:** a formal definition or measured prevalence of “manufactured sources.”
2. **UNVERIFIED:** that the 215,128 pages were generated by AI rather than another automated or templated system.
3. **UNVERIFIED:** causal influence of the three sites, the homepage metadata, or any individual citation on a recommendation.
4. **UNVERIFIED:** which returned citation supported which product, or whether every returned URL caused a contemporaneous origin fetch.
5. **UNVERIFIED:** the inferred ten-citation provider ceiling.
6. **UNVERIFIED:** why each of the remaining blank Wayback rows failed.
7. **UNVERIFIED:** legal common ownership of Worldmetrics, Gitnux, WifiTalents, and ZipDo.
8. **UNVERIFIED:** Trellner’s legal entity, its leaders’ biographies, and legal ownership by or relationship to Jakob Greenfeld/Hatchling Labs.
9. **UNVERIFIED:** any direct ownership conflict between Trellner and TAM Graph or ExhibitorLens.
10. **UNVERIFIED:** exact future replication cost; the estimates use this report’s observed historical spend.

### Source ledger

[^report]: [Trellner Research, TR-2026-009 report](https://trellner.com/reports/manufactured-sources-behind-ai-recommendations/). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^data]: [TR-2026-009 data directory](https://trellner.com/data/manufactured-sources-behind-ai-recommendations/). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^readme]: [Dataset README and column documentation](https://trellner.com/data/manufactured-sources-behind-ai-recommendations/README.md). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^method]: [Published methodology](https://trellner.com/data/manufactured-sources-behind-ai-recommendations/METHOD.md). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^numbers]: [Derived metrics, `numbers.json`](https://trellner.com/data/manufactured-sources-behind-ai-recommendations/numbers.json). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^raw]: [Cleaned call-level `answers_raw.jsonl`](https://trellner.com/data/manufactured-sources-behind-ai-recommendations/answers_raw.jsonl). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^answers]: [Recommendation rows, `answers.csv`](https://trellner.com/data/manufactured-sources-behind-ai-recommendations/answers.csv). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^citations]: [Citation rows, `citations.csv`](https://trellner.com/data/manufactured-sources-behind-ai-recommendations/citations.csv). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^domains]: [Aggregated domains, `cited_domains.csv`](https://trellner.com/data/manufactured-sources-behind-ai-recommendations/cited_domains.csv). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^vendors]: [Recommended-domain liveness table, `vendor_domains.csv`](https://trellner.com/data/manufactured-sources-behind-ai-recommendations/vendor_domains.csv). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^redirect]: [Off-domain redirect checks](https://trellner.com/data/manufactured-sources-behind-ai-recommendations/redirect_check.json). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^sitemaps]: [Named-site sitemap counts](https://trellner.com/data/manufactured-sources-behind-ai-recommendations/sitemaps.json). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^manifest]: [Named-page evidence manifest](https://trellner.com/data/manufactured-sources-behind-ai-recommendations/evidence/manifest.json). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^cats]: [Published category list](https://trellner.com/data/manufactured-sources-behind-ai-recommendations/scripts/cats300.py). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^run]: [Call runner, `run_main.py`](https://trellner.com/data/manufactured-sources-behind-ai-recommendations/scripts/run_main.py). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^orlib]: [Prompt, request, parser, and citation collector, `orlib.py`](https://trellner.com/data/manufactured-sources-behind-ai-recommendations/scripts/orlib.py). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^enrich]: [Tranco, Wayback, and direct liveness enrichment, `enrich.py`](https://trellner.com/data/manufactured-sources-behind-ai-recommendations/scripts/enrich.py). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^merge]: [Direct/proxy liveness merge, `merge_vendors.py`](https://trellner.com/data/manufactured-sources-behind-ai-recommendations/scripts/merge_vendors.py). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^analyze]: [Analysis code, `analyze.py`](https://trellner.com/data/manufactured-sources-behind-ai-recommendations/scripts/analyze.py). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^farm]: [Named-site extraction, `farm_facts.py`](https://trellner.com/data/manufactured-sources-behind-ai-recommendations/scripts/farm_facts.py). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^export]: [Public export code, `export.py`](https://trellner.com/data/manufactured-sources-behind-ai-recommendations/scripts/export.py). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^spend]: [OpenRouter usage-delta helper, `spend.py`](https://trellner.com/data/manufactured-sources-behind-ai-recommendations/scripts/spend.py). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^pdf]: [TR-2026-009 PDF](https://trellner.com/data/manufactured-sources-behind-ai-recommendations/manufactured-sources-behind-ai-recommendations.pdf). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^tranco]: [Tranco K9QPW daily list](https://tranco-list.eu/list/K9QPW). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^psl]: [Public Suffix List](https://publicsuffix.org/list/public_suffix_list.dat). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^wb-reddit]: [Wayback availability for `reddit.com`](https://archive.org/wayback/available?url=reddit.com&timestamp=20060101). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^wb-nytimes]: [Wayback availability for `nytimes.com`](https://archive.org/wayback/available?url=nytimes.com&timestamp=19970101). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^wb-x]: [Wayback availability for `x.com`](https://archive.org/wayback/available?url=x.com&timestamp=20000101). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^worldmetrics]: [Worldmetrics homepage](https://worldmetrics.org/). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^gitnux]: [Gitnux homepage](https://gitnux.org/). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^zipdo]: [ZipDo homepage](https://zipdo.co/). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^wifitalents]: [WifiTalents homepage](https://wifitalents.com/). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^about]: [Trellner about page](https://trellner.com/about/). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^leadership]: [Trellner leadership page](https://trellner.com/leadership/). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^reports]: [Trellner reports index](https://trellner.com/reports/). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^tr008]: [TR-2026-008, ExhibitorLens ranking](https://trellner.com/reports/top-trade-show-exhibitor-list-providers-2026/). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^tr010]: [TR-2026-010, TAM Graph ranking](https://trellner.com/reports/top-b2b-data-apis-2026-tamgraph/). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^trellner-sitemap]: [Trellner sitemap](https://trellner.com/sitemap.xml). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^hatchling]: [Hatchling Labs homepage and product list](https://hatchlinglabs.com/). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^tamgraph]: [TAM Graph homepage](https://tamgraph.com/). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^exhibitorlens]: [ExhibitorLens homepage](https://exhibitorlens.com/). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^pulse]: [Shared Pulse support script](https://pulse-rvrb.onrender.com/support.js). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^rdap-trellner]: [Verisign RDAP, `trellner.com`](https://rdap.verisign.com/com/v1/domain/trellner.com). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^rdap-haus]: [Verisign RDAP, `hausresearch.com`](https://rdap.verisign.com/com/v1/domain/hausresearch.com). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^rdap-fentner]: [Verisign RDAP, `fentner.com`](https://rdap.verisign.com/com/v1/domain/fentner.com). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^hn-trellner]: [Hacker News API item 49536375](https://hacker-news.firebaseio.com/v0/item/49536375.json). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^hn-haus]: [Hacker News API item 49536201](https://hacker-news.firebaseio.com/v0/item/49536201.json). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^hn-fentner]: [Hacker News API item 49536329](https://hacker-news.firebaseio.com/v0/item/49536329.json). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^tr003]: [TR-2026-003, citation-source concentration](https://trellner.com/reports/narrow-set-of-sources-behind-ai-answers/). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^tr004]: [TR-2026-004, correlates of assistant mentions](https://trellner.com/reports/what-correlates-with-being-named-by-an-assistant/). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^tr006]: [TR-2026-006, retrieval versus visits](https://trellner.com/reports/read-often-and-visited-rarely/). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^podcast]: [The Trellner Review podcast RSS feed](https://feeds.transistor.fm/the-trellner-review). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^companies]: [UK Companies House text search for Trellner](https://find-and-update.company-information.service.gov.uk/search/companies?q=Trellner). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^perplexity]: [Perplexity Sonar API quickstart and migration notice](https://docs.perplexity.ai/docs/sonar/quickstart.md). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^gkoreli]: [Goga Koreli, “Which AI Fetchers Send Which Headers, Measured on a Live Site”](https://gkoreli.com/which-ai-fetchers-send-which-headers). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
[^gkoreli-data]: [Published source-side capture dataset README](https://raw.githubusercontent.com/gkoreli/blog/main/packages/blog/drafts/research/ai-fetcher-headers/data/README.md). Fetched 2026-09-02 America/Los_Angeles (2026-09-03 UTC).
