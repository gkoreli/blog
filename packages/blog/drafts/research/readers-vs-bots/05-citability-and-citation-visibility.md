# Citability and citation visibility for the blog

Research worker: Claude opus, primary sources with live API probes, 2026-09-03 02:40 UTC. Probes marked [probe] were executed against the live APIs.

## 1. Google Scholar: blogs are out of scope

- Inclusion guidelines (https://scholar.google.com/intl/en/scholar/inclusion.html), verbatim: "The content hosted on your website must consist primarily of scholarly articles - journal papers, conference papers, technical reports, or their drafts, dissertations, pre-prints, post-prints, or abstracts. Content such as news or magazine articles, book reviews, and editorials is not appropriate for Google Scholar."
- Only route for an individual: upload a PDF shaped like a paper (title in large font on page one, authors on the next line, a References section) and link it from a publications page.
- Supported tags: "Google Scholar supports Highwire Press tags (e.g., citation_title), BE Press tags (e.g., bepress_citation_title), and PRISM tags (e.g., prism.title). Use Dublin Core tags (e.g., DC.title) as a last resort". Minimum: title, first author full name, year. `citation_publication_date` format "2010/5/12". `citation_pdf_url` must be in the same subdirectory as the HTML page.
- Verdict: Highwire tags are cheap and harmless; Scholar inclusion is not a realistic target for essays. Scholar "Cited by" counts only Scholar-indexed documents.

## 2. DOIs for blog posts

### Rogue Scholar (Front Matter), purpose-built
- "The Rogue Scholar is an archive for scholarly blog posts, hosted by Front Matter." DOIs via Crossref (standard prefix 10.59350), full-text search, Internet Archive Archive-It long-term archiving. https://docs.rogue-scholar.org/
- Requirements (https://docs.rogue-scholar.org/guidelines.html): full text in a public RSS/Atom/JSON feed; title, authors, date per post; a landing page URL per post; and "The full-text content must be made available via a Creative Commons Attribution (CC-BY) license." Recommended: JSON-LD schema.org, HTML meta tags for reference managers, BibTeX download. This blog already meets everything except the CC-BY license.
- Free: "Rogue Scholar is free to use for blog authors", "is and will always be free to use and reuse". https://rogue-scholar.org/faq
- DOI strings can be pre-minted by the blog and shipped as the RSS guid. https://docs.rogue-scholar.org/doi.html
- Acceptance is a human decision; they say they cover "blogs about all forms of scholarship" and reject predominantly AI-generated posts.

### Zenodo (CERN), fallback
- Anyone may deposit (https://about.zenodo.org/policies/). No blog-post resource type; use `publication-other` or `publication-technicalnote` [probe of the vocabulary API].
- Concept DOI (all versions) plus version DOI per release; version suffixes in DOIs are rejected as "not machine readable". https://support.zenodo.org/help/en-gb/1-upload-deposit/97-what-is-doi-versioning
- GitHub integration: enable a repo, every GitHub release is archived and gets a DOI; metadata from `CITATION.cff` or `.zenodo.json`. https://help.zenodo.org/docs/github/enable-repository/
- Creators are ORCID-backed. https://help.zenodo.org/docs/deposit/describe-records/creators/
- OSF also mints free DOIs (https://help.osf.io/article/392-create-dois). figshare not verified (help URLs 404).

## 3. Citation counts for a DOI

- OpenAlex, free, no key: `filter=cites:<OpenAlex ID>` returns citing works. [probe] `works/https://doi.org/10.53731/6kfyy-nq280` (a Rogue Scholar blog post) → `W4406444132`, `cited_by_count: 7`; `filter=cites:W4406444132` returns 6 citing works, all themselves blog posts with 10.53731 and 10.59350 DOIs. Blog-to-blog citation counting works when both sides carry Crossref DOIs and deposit references. Docs source of truth: https://github.com/ourresearch/openalex-docs/blob/main/api-entities/works/filter-works.md
- Crossref: `is-referenced-by-count` free on the public API ([probe] the same DOI → 8); the citing list needs membership. Crossref Event Data was sunset 2026-04-23 (https://www.crossref.org/deprecated/), which removes the one service that tracked DOI mentions on blogs and social media.
- Semantic Scholar: does not carry Zenodo or blog DOIs [probe].
- Altmetric: keyless API gone since 2025-11-10; key required.

## 4. References without a DOI

- Google Search Console Links report is UI only; the API has no links resource (https://developers.google.com/webmaster-tools/v1/api_reference_index).
- Bing Webmaster Tools `GetUrlLinks(siteUrl, link, page)` is a free, keyed, scriptable inbound-links API. https://learn.microsoft.com/en-us/dotnet/api/microsoft.bing.webmaster.api.interfaces.iwebmasterapi.geturllinks
- Hacker News Algolia search by URL, free and keyless [probe returned the real Linux signal submission, story 48229058]. https://hn.algolia.com/api
- Common Crawl: capture index only, and gkoreli.com is not in the August 2026 crawl [probe 404]. Page-level links would need WAT processing.
- Reddit JSON needs OAuth now; Bluesky searchPosts returned 403 in this session (unverified); X has no free tier.

## 5. "Cite this" blocks in the wild (verbatim shapes)

- Distill: `@article{...}` with `journal = {Distill}`, `note = {url}`, real `doi`. Prose line: "For attribution in academic contexts, please cite this work as ...".
- Lilian Weng: `@article{weng2023agent, title, author = "Weng, Lilian", journal = "lilianweng.github.io", year, month, url}` plus a "Cited as:" prose line.
- Sander Dieleman: `@misc{dieleman2024distillation, author, title, url, year}` introduced with "If you would like to cite this post in an academic context, you can use this BibTeX snippet:".
- Pattern: `@misc` + url is the honest shape without a DOI; `@article` with the publication name as journal is a convention for nicer rendering.

## 6. ORCID
Free for anyone (https://info.orcid.org/researchers/). Crossref and DataCite DOIs that carry the ORCID auto-populate the record. Zenodo links accounts to ORCID.

## 7. Machine-readable citation metadata
- schema.org `BlogPosting`: `identifier` (DOI as PropertyValue with propertyID "DOI"), `sameAs`, `citation`, `isBasedOn`. https://schema.org/BlogPosting
- RFC 8574 `cite-as` (https://www.rfc-editor.org/rfc/rfc8574.html): `<link rel="cite-as" href="https://doi.org/...">` and the HTTP `Link:` header form; conveys a preference, does not compel clients.
- FAIR Signposting (https://signposting.org/FAIR/): `cite-as`, `describedby`, `author`, `type`, `license`, `linkset`; Level 1 is typed links in HTML and HTTP Link headers. Workers can add the headers centrally; the Markdown and JSON endpoints already exist for `describedby`.

## Synthesis
1. Rogue Scholar is the only service built for this: free, Crossref DOI, archiving, and proven OpenAlex counts. Its one cost is CC-BY on the full text, which is Goga's decision.
2. Zenodo plus GitHub releases is the fallback: DataCite concept DOI per post, indexed by OpenAlex, no blog-native discovery.
3. "Cited by N" = OpenAlex `cites` count (free, scriptable) or Crossref `is-referenced-by-count`.
4. "Referenced by" without DOI = Bing `GetUrlLinks` + HN Algolia; Search Console is manual export.
5. Do not contort the site for Google Scholar.

## Uncertain
figshare terms; Bluesky search auth; Rogue Scholar acceptance and current API export formats; exact Semantic Scholar rate limits; a verbatim "free" statement on Zenodo's policy pages.
