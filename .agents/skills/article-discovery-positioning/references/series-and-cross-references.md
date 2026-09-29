# Series Trails and Editorial Cross-References

Read before publishing a continuation or changing a series or contextual article link.

## Series Trails and Editorial Cross-References

Some posts are not standalone artifacts — they are part of a thread of thinking. When a post extends, revisits, or bounds an earlier post, connect them explicitly. Cross-references preserve the publication's memory: readers follow the evolution of an idea, agents understand which posts belong together, future posts become part of a visible body of work instead of isolated pages.

The goal is continuity, not "related posts" spam.

### Mechanisms

| Mechanism | Use when | Output |
|---|---|---|
| `series` metadata | Posts form a deliberate reading sequence | Auto-renders trail in HTML article + `.md` endpoint |
| Hard prose link | One post directly continues, corrects, or bounds another | One sentence in the body where it naturally belongs |

These are complementary, not alternatives. A series trail at the bottom + one contextual link in the prose is the full pattern.

### `series` metadata

```ts
series: {
  id: "ghx-field-notes",   // stable grouping key — never changes
  title: "ghx field notes", // display label — what readers see
  order: 2                  // reading order within the series
}
```

Rules:
- `id` is the grouping key. `title` is the display label. They are independent fields — do not derive one from the other.
- Use the real post `title` in the trail. Do not invent a separate `seriesTitle` unless the system explicitly supports it.
- The series trail renders on both the HTML article and the `.md` agent-readable endpoint.
- Build validates: duplicate `series.order` within the same `id` throws before any HTML is written.

### Hard prose links

```md
For the origin story behind ghx — from GitHub HTML dumps to `ghx read --map` — read [Build the GitHub Exploration Tool, No Mistakes](/how-ghx-was-born).
```

Rules:
- Use root-relative links (`/how-ghx-was-born`), not absolute URLs.
- Put the link where it helps the reader — not as a forced footer block.
- One contextual link per relationship. Do not repeat it.
- Add a link when one post is a predecessor, sequel, correction, deeper dive, or product-boundary companion. Do not add links because two posts share tags.

### Checklist before publishing a new post

1. Does this post continue an existing thread? Add it to the series with `order: N + 1`.
2. Does an older post need a forward link to this one? Add one prose sentence to that post.
3. Does this post need a backward link to an earlier piece? Add one prose sentence in the body.
