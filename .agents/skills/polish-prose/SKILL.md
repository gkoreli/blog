---
name: polish-prose
description: Draft and polish concise, direct, natural prose. Use when writing, editing, or reviewing articles, documentation, PR descriptions, release notes, and messages, especially when asked to tighten writing, remove mechanical phrasing, or apply Orwell-style prose rules. Apply only to prose; preserve code, commands, identifiers, quotations, and precise technical terms.
---

# Polish Prose

Use this skill as a final prose pass. Preserve the author's meaning, facts, voice, and degree of certainty.

## Protect Precision

- Leave code, commands, paths, identifiers, API names, and other literal technical text unchanged.
- Preserve technical terms when an everyday substitute would lose precision.
- Keep direct quotations verbatim unless the user asks to edit them.
- Do not change facts, citations, claims, or intended emphasis merely to make a sentence smoother.
- Protect deliberate fragments, repetition, self-interruptions, casing, and roughness when they carry voice, thought, pressure, or form.

## Apply the Rules

1. Avoid any metaphor, simile, or figure of speech commonly seen in print.
2. Prefer a short word when it carries the same meaning as a long one.
3. Cut every word that the sentence does not need.
4. Prefer the active voice when it makes the actor and action clearer.
5. Replace foreign phrases, scientific terms, and jargon with everyday English only when precision survives.
6. Break any rule above before writing something ugly, misleading, or unnatural.
7. Do not build a straw man to knock down. Use the “not X, but Y” sentence pattern, including close grammatical variants, no more than once per piece. Do not confuse this limit with a ban on testing or reversing ideas.
8. Use two examples when examples help. Do not add a third for rhythm or appearance; include every case that evidence or completeness requires.
9. Do not announce what comes next. Say it.
10. Do not end two neighboring paragraphs with punchlines.
11. Vary the length and shape of neighboring sentences.
12. Break any rule before writing like a machine.

## Review the Prose

1. Mark protected text before editing.
2. Cut throat-clearing, previews, empty transitions, and dead repetition. Keep repetition that changes pressure, meaning, rhythm, or the state of thought.
3. Replace needlessly long or abstract wording without weakening the meaning.
4. Make passive clauses active when the actor matters and is known.
5. Check for straw men, repeated reversals, padded example lists, and consecutive punchline endings.
6. Read neighboring sentences and paragraphs for repeated length, syntax, and cadence. Vary them where the pattern feels mechanical.
7. Restore anything whose edit changed the claim, voice, technical precision, or natural rhythm.
8. Review all prose in the response against these rules before delivering it.

## Match the Requested Mode

- When asked to write or edit, return the polished prose without narrating every change.
- When asked only to review, report the most important violations and give focused fixes. Do not rewrite the whole piece unless requested.
- Run `shape-article` before polishing an article. Use this skill only at the sentence level after the form and protected passages are known.
- In an exposed essay, flag sentence-level problems for the author instead of rewriting the prose.
- When another writing skill governs structure, sourcing, or voice, keep those rules. Let the more specific voice rule win when the two conflict.
