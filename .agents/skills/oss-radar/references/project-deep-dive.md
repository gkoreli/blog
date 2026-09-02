# Project deep dive

Use five parts. Adapt headings to the project. Research each part; combine headings when the prose reads better.

## 1. Verdict

Open with the significance before anything else: why this release matters, why the reader is here, what they will learn. Then a short bullet list of the issue's main findings, each a promise the body keeps. Only then the background. This is the owner's opening tenet in `AGENTS.md` ("Opening and Section Discipline"); it binds every issue.

Name the project, date, job, market focus, and present limit inside the first 100 words. Write one claim that the evidence can prove wrong. Keep jargon out of the opening; put it where it does the most work.

Every section's first paragraph states its point in plain language and its last paragraph states the takeaway, so a reader who reads only those two paragraphs per section still leaves with the argument.

Good:

> Buzz gives AI agents signed workspace accounts, but its approval and delivery controls are unfinished.

Weak:

> Buzz may change how teams work with AI in many ways.

Use nearby products only to set the scope. Do not turn the market section into a second article.

## 2. Shipped system

Explain the one feature that changes the product.

- Trace the path from user action or agent event through the backend, store, network, and result.
- Check defaults, feature flags, release builds, and pinned dependencies.
- State what the code checks, stores, or sends.
- State what the project leaves to a harness, provider, host, relay, or outside service.
- Use a diagram only when order or ownership would be hard to follow in prose.
- Separate account authorization from approval of an action.

Do not stop at a class, route, or schema that has no call site. Do not call a reserved type a feature.

## 3. Product theory and direction

Reconstruct why the system has this shape.

Write this map in research notes:

| Role | Product or layer | Evidence |
|---|---|---|
| Replaces | The workflow or product surface it takes over | |
| Wraps | The tools or runtimes it coordinates | |
| Extends | The system it adds a new role or use to | |
| Relies on | The infrastructure it still needs | |
| May enter | A nearby lane enabled by shipped work | |

This map prevents false competitor claims. Using Git does not make a project a GitHub rival. Taking review talk
from GitHub may attack one GitHub workflow while still relying on Git itself.

State the maintainer thesis in plain words. Then test one other sound theory. Useful views include:

- the user or operator: what gets easier, slower, cheaper, riskier, or harder to inspect;
- the ecosystem or standard: what becomes portable, shared, or open to other clients;
- the competitor: which task moves and which infrastructure stays;
- the skeptic: which missing rule or weak proof could break the thesis.

Use only views that change the verdict. Do not quote an outside view just to look balanced.

Label each future with one of the four direction states in `SKILL.md`.

Look for direction in data models, ownership rules, protocol choices, extension points, repeated issue work, and
the order in which maintainers close gaps. One unused symbol proves little.

Use the shipped-part chain in `SKILL.md` for each future. Keep the best two paths. Say which is near and which
needs a different product. If the project does not claim the idea, attribute it to the field report or author.

## 4. Audit limits

Show the main claim's limits.

- Use one or two gaps that change the verdict.
- Attribute reports you did not reproduce.
- Treat an open pull request as proposed work.
- Use first-hand field reports to spot missed surfaces, then check those claims in code or issues.
- Include context, Git, privacy, security, or operations only when they test the main claim.
- Say what works before saying what fails.

The last third must still give proof or a decision. Do not let it shrink into a recap.

## 5. Decision

End once:

1. say who should try the project now;
2. say who should wait;
3. name zero to two results that would change the verdict;
4. end with one plain paragraph.

Turn each result into a test. Set the task, conditions, and pass mark before running it. A cost test must use the same task, repository state, agent runtime, and acceptance check in both runs.

Hosted and self-hosted trials need separate advice when data access or operating work differs.

Stop after the decision. Do not add a recap, explain the title, or repeat every gap.

## Review

- [ ] Main verdict appears in the first 100 words
- [ ] Market scope stays narrow
- [ ] Strongest feature receives an end-to-end code trace
- [ ] Defaults, release flags, outside services, and pinned dependencies do not hide a key limit
- [ ] Product map separates what the project replaces, wraps, extends, and relies on
- [ ] Maintainer thesis and one sound rival theory were tested before writing
- [ ] Direction claims say stated, in progress, enabled, or speculative
- [ ] Each future path starts from shipped work and names its missing link
- [ ] Shipped, reported, and proposed claims stay separate
- [ ] Side topics test the main claim
- [ ] Adoption advice states who should try and who should wait
- [ ] Any release test matches a limit named in the verdict
- [ ] The close makes one decision and stops
