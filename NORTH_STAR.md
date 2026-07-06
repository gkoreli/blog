# North Star

This document is the direction of gkoreli.com. Every design change, section decision, and content call gets steered against it. When a proposal conflicts with this document, the proposal loses — or this document gets deliberately revised first. `AGENTS.md` holds the rules; this holds the *why* and the *where to*.

Last revised: 2026-07-05 (the second pivot).

## What This Publication Is

A personal publication by Goga Koreli. One person's builder log made public: engineering articles, personal essays, opinions, and philosophical writing — from someone who builds with agents daily and writes from the inside of that work.

It is not a magazine of everything. The first pivot (ADR-0013) framed the site as a four-section publication — Essays, Engineering, OSS Radar, Frames — a container wide enough for any future content. The second pivot narrows it back to what is personal and true: the sections earn their place from writing that actually exists and drives that actually recur.

The form stays what ADR-0013 established: **stable shell, expressive interior**. The navigation, identity, and outer frame stay coherent and calm; each post is free to be its own crafted artifact inside it.

## The Second Pivot

Frames is out. A photography section belonged to the "studio for everything" ambition, not to this publication. Zero Frames posts were ever written — the section existed only as scaffolding (schema value, `/frames` route, gallery component). The urge that is real is the urge to *write*: personal essays and engineering articles. The publication follows the real urge, not the imagined one.

What this means practically:

- The publication presents two confident sections: **Essays** and **Engineering**.
- **OSS Radar** is under reflection (see below) — it stays for now but does not get promoted.
- Frames disappears from navigation, homepage, and the section schema. The code scaffolding gets removed, not hidden.
- No new section is added until at least three posts exist that don't fit the current sections. Content first, container second.

## Sections

### Essays

Personal essays, opinions, philosophical articles. Reflections on attention, work, procrastination, life. This is the section with the strongest current pull — the urge to come back and write these is the engine of the second pivot.

Voice: first-person, reflective, literary. The Lora serif and the essay layout exist for these.

### Engineering

Engineering articles and essays with real range — this is not one template energy:

- **technical** — deep-dives into tools and systems (ghx, codemap, signal stacks)
- **exploratory** — following an idea to see where it goes (topologies of thoughts)
- **broad** — the agentic engineering landscape, workflows, principles
- **personal** — builder-log energy, what I actually did and what it cost
- **research-paper energy** — structured, evidence-driven, closer to a paper than a post

The design system must serve this range: an engineering post can be a narrative essay or a dense reference piece, and the interior layout flexes per post while the shell stays stable.

### OSS Radar — under reflection

OSS Radar exists (2 issues published) but the recurring cadence never stuck. That is a signal worth respecting, not papering over. Open outcomes:

1. **Collapse into Engineering** — radar issues become engineering articles with a series trail
2. **Rename/reframe** — the research-analysis energy is real but "Radar" implies a cadence that isn't
3. **Keep as-is** — commit to the cadence deliberately

No decision yet. Until decided: existing posts stay canonical at their URLs, the section stays functional, but no design work invests in OSS Radar as a first-class destination. The decision comes from reflection on *why* the cadence didn't stick, not from a design session.

## What Guides Design Work

- **Two strong doors, not four equal ones.** Navigation and homepage present Essays and Engineering as the publication's core. OSS Radar remains reachable without being promoted.
- **Stable shell, expressive interior.** The outer frame (sidebar, identity, typography system) changes rarely and deliberately. Posts are where expression lives.
- **Restraint.** One section signature, not three stacked decorations. Trust typography and spacing before adding visual elements.
- **One surface at a time.** Design changes are proposed and reviewed per surface (homepage, section page, article shell) — never as a batch redesign.
- **Each post is a crafted artifact.** The unit of quality is the post, not the site. Infrastructure and design serve the writing.

## Open Questions

- OSS Radar's fate (collapse / rename / keep) — needs reflection, owner: Goga
- What the homepage says now that the four-section framing is gone — the description line ("essays, engineering notes, OSS Radar, and Frames") is stale
- Whether "builder log" deserves explicit surfacing (a phrase in the identity, not necessarily a section)

## Relationship to Prior Direction

- **ADR-0013** (pivot to publication) — still the foundation: sectioned publication, stable shell, section-aware routing. This document supersedes its *four-section content model*: Frames is removed, OSS Radar is provisional.
- **`pivoting-to-publication.md`** — the raw thinking behind the first pivot; historical record, superseded where it conflicts with this document.
- A future ADR should record the Frames removal and the OSS Radar decision once made.
