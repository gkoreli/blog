# Opening, Section, and Result Discipline

Read before drafting or reviewing openings and section structure. The dated owner corrections below govern across forms, with the stated exposed-essay exception. Existing quotations are preserved as recorded, not newly certified against private transcripts.

### Opening and Section Discipline (owner tenet, 2026-09-01)

Every article opens with why it matters, then breaks that down, and only then explains the background. Chronology is a mold, not a rule. The first and last paragraph of every section must carry the section's point on their own, so a reader who reads only those still leaves with the whole argument, if not the depth.

Concretely:

1. **First paragraph: the significance.** What was achieved or released, why it matters, why the reader is here, what they will learn. Catchy is allowed; every catchy statement in it must be explained later in the body.
2. **Then bullets** that break the significance down into the article's main findings or claims, each one a promise the body keeps.
3. **Then background**, mechanism, and history, each leading back to and paying off the first paragraph. Twist the order of facts to keep the reader; never twist the facts.
4. **Every section:** first paragraph states the point in plain language; last paragraph states the takeaway. Deep technical material lives between them. Jargon goes where it matters most, not in the opening.
5. **Two registers per article.** Some sections are for every reader; some are for the person who will run the thing. Say which is which in one sentence when the register changes.

The owner's words, recorded verbatim on 2026-09-01 while reviewing OSS Radar #06:

> You should start with the significant achievements, reasons, why this article or the release matters at all, why am I reading this article, what am I going to learn? Then some bullet points to further break it down, and only then in a next section or paragraph you can start explaining the background and all of that need to lead to and connect to the first paragraph, all the main reasons and catchy statements need to get explained afterall. Imagine like a Christopher Nolan movie or martin scorsese movie, do you think they just start the movie with how it all started and just follow the chronological order, because they have to? No, they start with something very interesting and they use chronology and facts as like a flexible mold, they can twist them as they need, because its all about catching and keeping the reader and viewer, then explaining facts, like even if you only read first and last paragraphs of each section, that should give you the full understanding of the article without the deep technological understanding, morale or rationale, which is still good enough of a takeaway. Think from this perspective when writing articles.

Earlier the same day: "the initial section needs to be catchy, why is this a big deal, in human understandable ways, don't use lots of jargon right away, you can use jargon wherever it matters the most but there are sections that needs to be human friendly, easy to follow and comprehend, and there can be sections that are highly technical." And: "the first paragraph is the highest value section/space, the real estate value is the highest at the beginning."

This tenet governs all forms. `shape-article` still chooses the living center and the ending; `personal-essays` still wins on voice for exposed essays, where the opening may be a scene or a wound rather than a summary, but even there the first paragraph must be the reason to keep reading. See also `NORTH_STAR.md` "What Guides Readership".

**Title significance (owner correction, September 8, 2026):** distinguish the main reader problem or result from supporting implementation constraints. A true, specific detail can still be the wrong emphasis. Article 025's title gave historical retention more weight than the central problem of referrer abuse gaining exposure and distorting reports. Preserve such constraints in the explanation; headline them when they define the reader's reason to care or a necessary boundary of the result. Apply this through `shape-article` and `article-discovery-positioning`, without promising higher traffic from a title change.

### Open With a Result That Creates Questions (owner correction, 2026-09-22)

For evidence-led engineering and OSS Radar articles, find the most consequential supported result before choosing the opening. Search the article's research and experiments, including findings buried in later sections. Lead with a result a stranger can understand immediately and has a reason to investigate. A meaningful count, percentage, measured change, or comparison can make the problem concrete in the first sentence.

The purpose is to make the reader ask: **Why did that happen? How did they test it? What does it mean for my work? Can it be fixed, and who is working on it?** The article then answers those questions through the experiment, explanation, evidence, and engineering response. These questions guide the progression; they need not appear as a list or become prescribed headings. Explain unresolved questions honestly rather than promise a solution the evidence does not establish.

**Curiosity requires comprehension.** A reader should understand what happened before needing to know the paper, its scoring system, or its terminology. Translate research into the observed action and consequence. Define what was counted or compared in ordinary language. Put specialized metric definitions and implementation details where the reader needs them. An unexplained percentage creates confusion even when it is accurate.

Choose and check the opening this way:

1. **Inventory the strongest results.** Consider both original experiments and external research. Select by consequence, relevance to the article's central question, understandable magnitude, and strength of evidence. The largest percentage, newest paper, or author's own experiment does not automatically win.
2. **State the result directly.** Name the system or actor, what happened, and the measured size where available. Prefer a concrete observation over an abstract warning. Avoid mannered prose, dramatic adjectives, and claims about how surprising the result is; make the result understandable enough for readers to judge.
3. **Preserve the measurement's meaning.** Keep the population, comparator, and essential condition attached to the number. Distinguish a percentage from a percentage-point change or a composite score. Identify external research as external research. Link the supporting evidence beside the claim.
4. **Explain enough now; develop the method next.** The opening must stand on its own without implying a broader result than was measured. Put remaining denominator details and experimental setup immediately afterward when necessary to interpret it. Never hide a material exclusion or qualification late in the article to make the opening stronger.
5. **Make the body answer the resulting questions.** A project, study, or technical section earns its space by advancing the explanation or response. Return to the opening result as the reader gains the knowledge needed to assess it. Deliver the promised understanding rather than following the chronology of the research.

The OSS Radar #07 review exposed the failure. “Good organization ratings rose from 45% to 70% compared with an outline-driven retrieval baseline” required readers to learn an unfamiliar rubric before understanding the stakes. The citation-manipulation finding was a stronger candidate: **273 of 476 cases retaining the original statement newly cited a deliberately altered document (57.4%).** The action and frequency give the reader a reason to ask how the experiment worked. Explain that this was one adversarial Command-R+ condition, with 702 attempted cases; it is not a general AI citation error rate or proof of intentional lying. The [source audit](../../../../packages/blog/drafts/research/oss-radar-07/26-source-credibility-and-citation-evidence.md#the-denominator-behind-wallats-up-to-57) records the measurement and its limits.

This strengthens the existing significance-first rule. It does not impose statistics on every form: use numbers when they convey the important result, and never manufacture a percentage or select weak evidence for a more dramatic opening. Exposed essays retain their existing form and authorship rules.
