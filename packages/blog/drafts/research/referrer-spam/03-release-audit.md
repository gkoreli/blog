# Referrer spam note: publication checks

Prepared September 7, 2026 UTC, with September 6 as the author's local publication date. Post 025 is a 982-word short engineering note including its headings, code, and glossary. It links the deployed repair to its evidence and preserves the unresolved identity/readership questions.

## Review acceptance

The [bounded independent review](02-independent-review.md) found three wording issues, all corrected before the build:

1. The opening now says **unreviewed included hostnames**, matching the API's distinction between excluded traffic and included unnamed traffic.
2. The claim that all 35 exclusions came from the local rule now appears alongside the fixed August 8–September 6 window. The initial ranking and later live report remain separate captures.
3. The unsupported first-person assessment of implementation difficulty was removed. The replacement states the evidence-preservation requirement.

Parent acceptance also changed the opening to identify an explicit report-capture command, clarified the private/public evidence boundary, and tied validation to reconciled counts rather than a lower total alone. The full owner quotation matches a complete selected prompt. No additional research question was made a publication gate.

## Editorial and discovery checks

The [passport](00-article-passport.md) fixes the form, reader job, three metadata candidates, chosen package, link plan, non-promises, and September 28 observation checkpoint. The [claim ledger](01-evidence-ledger.md) separates external primary documentation, inspected code, the author's observations, and inference. It does not treat the author's repository and article as independent corroboration.

The chosen SEO title is 53 characters; the description is 146. The title names referrer spam and analytics history. The opening states the reported problem and actual repair before background. The code section explicitly addresses implementers. The note includes measured cost, correction paths, and the conditions that limit the result. It makes no human-authentication, novel-technique, search-volume, or discovery-performance claim.

The prompt record contains twelve complete shaping messages in order, preserving spelling, punctuation, spaces, and line breaks. The rendered transparency page was compared back to every selected message after decoding HTML and its line-break elements. Later repository maintenance and generic delivery discussion are outside this article's prompt scope.

The new note is Measurement boundaries order 5. Article 024 receives a contextual forward link; its historical counts, original date, current September 6 modification date, and research footprint stay unchanged. The unpublished edge-versus-RUM draft and its worklist now distinguish the new referral policy from the historical population. FLDR-0008 records the bounded note without adding another promised lane slot.

## Executed checks

- `pnpm -C packages/blog validate`: all 16 Markdown posts valid.
- `pnpm build`: all 25 posts built; the build's offline referral-policy integrity check passed for `2026-09-06.2` and its committed hash.
- Independently recomputed all three archived Matomo source-file hashes; 2,348 unique canonical hosts, with the local hostname absent.
- All ten distinct external article references returned HTTP 200 at their cited URLs. Their claim-bearing content was inspected separately; an HTTP success alone is not source validation. See [link results](04-external-links.json).
- Twenty-one generated-output checks passed: H1/title/description/canonical, structured metadata and dates, original Markdown body plus expected series/citation appendix, complete quotation, twelve exact rendered prompts, transparency link, code highlighting, tables, internal links, predecessor link, series, post index, sitemap, RSS date, citation endpoints, OG metadata/asset, and no link to the suspected destination. See [built results](05-built-checks.json).
- Visually inspected the generated 1200×600 OG card: full title is readable and within the card, with no clipping. This is image inspection, not interactive browser verification of the article.
- Research-directory relative links resolve; project-authored diff whitespace checks pass.

An initial ad hoc Markdown comparison assumed the generated `.md` endpoint contained YAML frontmatter. Inspection of `src/pipeline/build.ts` showed it serves the source body followed by series and citation sections. The comparison was corrected for that documented output; the product required no change.

This is a content and bookkeeping release. No runtime implementation changed and no new tests were added for prose. The engineering release's 46 analytics tests, 19 blog tests, typechecks, and production activation remain recorded in the cited engineering artifacts; they are not claimed as newly executed by this article pass.

## Release record

The publication commit and live checks will be appended after the push and Cloudflare's build complete. Concurrent editorial-skill edits belong to another active work stream and are preserved outside this article commit.
