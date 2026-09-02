---
name: launch-article-on-x
description: Design, render, publish, and measure evidence-led X launches for finished gkoreli.com articles. Use when turning an article or its preamble into a high-quality looping MP4 or GIF, writing a single post or short thread, inspecting the author's recent X baseline, publishing through the signed-in browser when explicitly requested, or iterating on distribution without clickbait.
---

# Launch Article On X

## Overview

Turn the article's most honest visual or evidentiary surprise into a native X artifact that earns attention before asking for a click. Optimize for qualified reader contact and durable sharing, not an ungrounded promise of virality.

Use this skill after the article is shaped, fact-checked, and positioned. It may improve a preamble's social capture mode, but it must not reopen the article's living center merely to manufacture a hook.

## Authority and sequence

Run the blog skills in this order when they apply:

1. `shape-article`
2. The governing form skill: `personal-essays`, `blog-writing`, or `oss-radar`
3. `article-discovery-positioning`
4. `shareable-engineering`
5. `launch-article-on-x`
6. `polish-prose` for final social copy only

`personal-essays` still wins every voice conflict. `oss-radar` still governs evidence and verdicts. This skill owns the distribution artifact, capture quality, publication workflow, and post-launch learning loop.

## Working directory

Create `packages/blog/drafts/social/<slug>/` for a new launch. Keep:

- `launch-brief.md`: reader, honest breakout concept, evidence, and success signal
- `shot-list.md`: exact visual states and capture timing
- `copy.md`: approved post or thread text
- `metrics.md`: baseline, snapshots, replies, corrections, and decision
- rendered MP4/GIF and any poster frame

Do not mix social artifacts into the article's research-footprint directory. Distribution work performed after the final footprint freeze is not article research provenance.

## Workflow

### 1. Establish the honest baseline

Read the article, launch metadata, preamble implementation, and relevant evidence artifacts. State in one sentence why a technically serious reader should care now.

When the user asks what performs on their account, inspect 10–20 recent original posts. Prefer the X analytics export (Premium: Analytics → Content → export CSV, columns Post id, Date, Post text, Post Link, Impressions, Likes, Engagements, Bookmarks, Shares, New follows, Replies, Reposts, Profile visits, Detail Expands, URL Clicks) over reading the profile in a browser; it gives exact counts for every post in the window. Treat a post whose text starts with `@` as a reply. The export path is `~/Downloads/account_analytics_content_<from>_<to>.csv`; do not commit it. Separate originals from replies, reposts, and quote posts. Compare posts at similar ages; a six-month total is not comparable to a one-hour total. Record visible impressions, likes, replies, reposts, bookmarks when available, media type, opening move, topic, link placement, and whether the post created qualified conversation.

Use one focused current X search when external examples could change the decision. Do not imitate a large account's absolute numbers or infer causation from a handful of posts.

### 2. Choose one breakout concept

Choose the article's strongest truthful share trigger:

- a visual mechanism the reader can understand without context;
- a result that changes an engineering decision;
- a personal constraint that makes familiar numbers newly consequential;
- a surprising reproduction, boundary, or failure; or
- a useful artifact readers will save and reuse.

Write the concept as `claim → visual proof → reader consequence`. If the visual cannot support the claim, narrow the claim. Token spend, agent count, or research time may be a curiosity hook, never a quality claim; pair it with what the research changed or caught.

Never promise virality. The useful goal is to increase the chance of voluntary reshares, qualified replies, article visits, and future recognition.

### 3. Design the native visual

Read [references/media-and-motion.md](references/media-and-motion.md) before producing or changing media.

Default to a native H.264 MP4 loop at 1200×1200, 30–40 fps, and 5–10 seconds. Use GIF as a lighter-motion fallback, not the quality master. Do not default to WebM for an ordinary browser post: X documents it in an API media-type schema, while its ordinary upload guidance centers MP4/MOV.

Prefer capturing the real article or preamble component over rebuilding a social-only facsimile. Add a deterministic capture mode when needed: seek CSS/Web Animations to an explicit time, wait for fonts and layout, expose a ready marker, and capture exact frames. Real-time screenshot loops create uneven motion and should not be the master.

The clip may simulate scrolling or camera movement through two to four named states. X media itself is linear, not interactive. If the post claims interactivity, the linked article must contain the real interaction.

Use `scripts/encode_social_clip.py` to create and inspect delivery files from numbered frames. The script accepts PNG or JPEG bytes even when a browser mislabeled the extension.

### 4. Write the post or thread

Make the first post complete enough to earn attention on X:

- first line: concrete tension, result, or question;
- native media: the proof, not decoration;
- body: why the result matters to the target engineer;
- link: direct canonical article URL;
- reply invitation: a real decision or experience readers can answer.

Use a single post when one claim and one visual carry the whole doorway. Use a thread only when each additional post adds a distinct payload. Keep most threads to three to five posts:

1. main claim + media + article link;
2. personal or operational stake;
3. surprising evidence or mechanism;
4. practical consequence or call to action + the article link again, with no media attached.

Thread mechanics (owner's rules, 2026-09-02):

- Every post stays at or under 280 characters. X allows more, but anything longer is cut behind a "Show more" click. Count any URL as 23 characters and record each post's length in `copy.md`.
- The first and last posts of a thread both appear on the author's profile. Post one carries the clip and the link; the attached media replaces the article's OG card. The last post carries the call to action and repeats the link with no media attached, so X renders the OG card there. Both profile-visible posts then have media.

Do not repeat the same claim across the thread, delay all value until the link, or use engagement bait. Keep each post independently legible if a reply is shown out of context.

### 5. Preview and publish safely

Inspect the final media at phone width and at full resolution. Confirm the URL, title, alt text, media order, and thread reply chain. Use descriptive alt text for meaningful visuals. For spoken or sound-dependent video, attach captions; for a silent visual, make every claim legible without audio.

Publishing is an external write:

- If the user asks only for copy, strategy, or a preview, do not publish.
- If the user explicitly asks to post or publish, that authorizes the scoped X post. Show or preserve the exact final copy and media, then publish through the signed-in browser.
- Never add follow-up posts, delete, quote-post, or reply beyond the approved scope.

After publishing, reopen the canonical status URL and verify the text, media playback, link, and thread order. Save the URL in `metrics.md`.

### 6. Learn without laundering noise into a lesson

Read [references/learning-loop.md](references/learning-loop.md). Freeze the post for the planned measurement window unless a factual error, broken link, or broken media requires repair. Capture comparable snapshots near one hour, 24 hours, and seven days when practical.

Classify the next action as one of:

- article correction;
- distribution repair;
- visual/copy experiment for the next launch;
- follow-up response to reader evidence; or
- no action.

Update this skill only when a pattern recurs across launches or a missing rule caused a costly, preventable failure. Store one-off lessons in the launch's `metrics.md`.

## Completion checklist

- The concept is true, specific, and supported by the article.
- The first frame works when autoplay is off.
- Motion begins quickly, ends with a readable hold, and loops cleanly.
- The MP4 passes the ordinary X limits in the media reference.
- Any GIF passes both the web limit and the mobile target if mobile posting matters.
- Fine text, gradients, and dark/light colors were inspected after encoding.
- The opening post contains value before the click.
- Claims, numbers, dates, and link destination were rechecked.
- Publication occurred only when explicitly requested.
- The live status was verified and added to the measurement record.
