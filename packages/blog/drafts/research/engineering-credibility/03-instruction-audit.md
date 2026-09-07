# Writing-instruction credibility audit

September 6, 2026 Pacific time. Scope: firsthand attribution, evidence selection, and distinctions between human credibility, machine source selection, and discovery. This is a targeted correction, not a revalidation of every historical SEO or sharing claim in the skills.

## Corrections

| File | Previous problem | Resulting instruction |
|---|---|---|
| [AGENTS.md](../../../../../AGENTS.md) | No concise rule distinguished firsthand ownership from proven credibility; the shareable-skill synopsis overstated GEO and rejected all further `llms.txt` investment. | Add a sourced firsthand-evidence rule and align the synopsis with the existing bounded supplied-source and known-site workflow findings. |
| [blog-writing](../../../../../.agents/skills/blog-writing/SKILL.md) | A strict source hierarchy preferred prominent builders/companies over research regardless of the claim; a ten-link objection conflicted with evidence-heavy work. | Choose primary evidence according to the claim. Use sufficient relevant sources. Clarify first person as attribution, with no invented firsthand experience. |
| [article-discovery-positioning](../../../../../.agents/skills/article-discovery-positioning/SKILL.md) | Firsthand standing could shape a title without an explicit promise check for the author's relationship to the work. | Add the firsthand basis to the article passport and require the ownership claim to match inspectable work. No pronoun performance guarantee. |
| [shareable-engineering](../../../../../.agents/skills/shareable-engineering/SKILL.md) | Unsupported first-person human-signal assertion; guaranteed title preservation; universal trust claims about failed attempts and praising alternatives. | Replace these with scoped attribution, documented title behavior, relevant failures/counterevidence, and a source-preference versus accuracy distinction. Mark this review separately from the older broad audit. |
| [Focused reference](../../../../../.agents/skills/blog-writing/references/firsthand-evidence-and-credibility.md) | Needed one reusable place for the claim-to-evidence reasoning and source boundaries. | Add a reference inside the existing governing skill rather than another standalone skill. |

## Manual scenario review

These are editorial checks of the revised instructions, not a behavioral benchmark of a newly invoked agent.

| Scenario | Decision under the revised guidance |
|---|---|
| Article 024 describes measurements on the author's blog. | First-person ownership fits its provenance; the title's subject remains bot detection. Its classification reduction still cannot become accuracy. |
| A new article synthesizes papers without running their experiments. | Name the synthesis and attribute the experiments to their researchers. Do not imply Goga ran them to obtain a firsthand title. |
| A famous engineer's statement conflicts with the relevant protocol standard. | Use the standard for specified behavior and inspect implementation separately. Reputation alone does not settle the claim. |
| A model cites the article after a crawler request. | Record the request and captured citation separately; inspect support before calling the answer evidence-based. Neither observation identifies human intent. |
| An exposed essay has no measurement claim. | Preserve its governing form and author-written voice. No new experiment, failure confession, or first-person title quota is imposed. |

## Verification

All three edited skills pass the skill-creator validator. The initial run exposed a pre-existing unquoted colon in the discovery skill's YAML description; converting that value to a folded scalar preserves its wording and makes the metadata valid. The validator used an ephemeral `uv --with pyyaml` environment because the system Python lacked PyYAML; no project dependency was added.

Relative links and Markdown target fragments resolve across the changed documents. The existing root-relative website route in AGENTS.md was excluded from the filesystem check. New-document whitespace checks, `git diff --check`, the five manual scenarios above, and final diff review pass. No application build or analytics test run is warranted by this documentation-only change.

Published article files, prompt totals, research-footprint manifests, and analytics code are outside this change. Concurrent repository work is preserved and excluded from the commit.
