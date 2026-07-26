# TypeScript OSS Radar posts

Inspect existing exports and nearby posts before adding markup or a component.

## Components

- Use `CompareTable` for exact mappings, two tested theories, or two future paths.
- Use `FlowDiagram` for a real order, ownership chain, or path from shipped work through a missing link.
- Use `Callout` for one bounded warning.
- Use `Prognosis` only when a release test helps the decision.
- Use `Sources` for each material source and its `why` sentence.
- Use a shared component only when it replaces prose.
- Group repeated siblings in one data-driven factory when the component supports it.
- Make a reusable component derive its layout from its item count.
- Do not place a component beside prose that repeats it.

Keep one rendered `<h1>`. Never fill a cell with `&nbsp;`, a blank item, or filler text. Do not use `<br>` to fix a broken layout.

Do not render the working claim or theory tables. Turn their result into one small reader-facing table or diagram
only when it cuts prose. Label shipped, in progress, enabled, and speculative steps so the visual does not make
a future idea look complete.

## Sources and live state

- Add a `why` value to every `Sources` item even when the type marks it optional.
- Keep the check date, baseline SHA, and full issue and pull-request state in working notes.
- Do not render that ledger. Put live state next to a claim when it changes the result.
- Add a short cutoff note only when the cutoff changes the reader's decision.
- Link a live issue or pull request in the body when its current state changes the claim.
- Keep each repository code and document link on its baseline SHA.
- Check that every material body link appears in `Sources`, and that no source card lacks a body claim.

## SEO and metadata

- Keep the H1 specific and memorable.
- Add a concrete `seoTitle` of about 40–60 characters with the project and category near the front.
- Keep the description under about 155 characters.
- Use the publication date in ISO form.
- Count the rendered title and body through the final decision paragraph. Stop before `Sources & Evidence`;
  source cards do not count. Divide by 200 and round up for `readTime`.

## Checks

Run:

```bash
pnpm -C packages/blog typecheck
pnpm -C packages/blog build
git diff --check
```

Then check:

- [ ] One `<h1>`
- [ ] No `&nbsp;`
- [ ] No empty component cells
- [ ] No row/header count mismatch
- [ ] No repeated adjacent callouts that should be one factory
- [ ] No unpinned GitHub code or document link
- [ ] Every source has a reason it matters
- [ ] Reader copy omits the raw research ledger
- [ ] Time-sensitive claims state what is open, closed, merged, or proposed
- [ ] `readTime` matches the rendered word count
