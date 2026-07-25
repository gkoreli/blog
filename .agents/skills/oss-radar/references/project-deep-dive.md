# Project deep dive

Use four parts. Adapt headings to the project.

## 1. Verdict

Name the project, date, job, market focus, and present limit inside the first 100 words. Write one claim that the evidence can prove wrong.

Good:

> Buzz gives AI agents signed workspace accounts, but its approval and delivery controls are unfinished.

Weak:

> Buzz may change how teams work with AI in many ways.

Use nearby products only to set the scope. Do not turn the market section into a second article.

## 2. Mechanism

Explain the one feature that changes the product.

- Trace the shipped code path.
- State what the code checks, stores, or sends.
- Use a diagram only when order or ownership would be hard to follow in prose.
- Separate account authorization from approval of an action.

## 3. Audit limits

Show the main claim's limits.

- Use one or two gaps that change the verdict.
- Attribute reports you did not reproduce.
- Treat an open pull request as proposed work.
- Use first-hand field reports to spot missed surfaces, then check those claims in code or issues.
- Include context, Git, privacy, security, or operations only when they test the main claim.
- Say what works before saying what fails.

The last third must still give proof or a decision. Do not let it shrink into a recap.

## 4. Decision

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
- [ ] Strongest feature receives code-backed credit
- [ ] Shipped, reported, and proposed claims stay separate
- [ ] Side topics test the main claim
- [ ] Adoption advice states who should try and who should wait
- [ ] Any release test matches a limit named in the verdict
- [ ] The close makes one decision and stops
