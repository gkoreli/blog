# TypeScript OSS Radar posts

Inspect existing exports and nearby posts before adding markup or a component.

## Components

- Use `CompareTable` for exact mappings or a two-sided decision.
- Use `FlowDiagram` for a real order or ownership chain.
- Use `Callout` for one bounded warning.
- Use `Prognosis` only when a release test helps the decision.
- Use `Sources` for each material source and its `why` sentence.
- Use a shared component only when it replaces prose.
- Group repeated siblings in one data-driven factory when the component supports it.
- Make a reusable component derive its layout from its item count.
- Do not place a component beside prose that repeats it.

Keep one rendered `<h1>`. Never fill a cell with `&nbsp;`, a blank item, or filler text. Do not use `<br>` to fix a broken layout.

## Sources and research state

- Add a `why` value to every `Sources` item even when the type marks it optional.
- Put live issue and pull-request states, the check date, and each repository's baseline SHA in the rendered research note.
- Link a live issue or pull request in the body when its current state changes the claim.
- Keep each code link on its repository's baseline SHA.
- Check that every material body link appears in `Sources`, and that no source card lacks a body claim.

## SEO and metadata

- Keep the H1 specific and memorable.
- Add a concrete `seoTitle` of about 40–60 characters with the project and category near the front.
- Keep the description under about 155 characters.
- Use the publication date in ISO form.
- Count rendered prose words before `Sources`; divide by 200 and round up for `readTime`.

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
- [ ] No unpinned GitHub code link
- [ ] Every source has a reason it matters
- [ ] Research note has date, baseline SHA, and live states
- [ ] `readTime` matches the rendered word count
