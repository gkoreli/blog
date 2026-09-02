# Metrics: OSS Radar #06, interp-engine

## Baseline (2026-09-02, before the thread)

Source: X account analytics export, 2026-08-20 to 2026-09-02 (`account_analytics_content_2026-08-20_2026-09-02.csv`, owner's download; not committed). 44 posts: 29 originals, 15 replies. Ages differ (two hours to two weeks), so the comparison is rough.

| Group | Posts | Impressions (sum / median / max) | Engagements | Likes | URL clicks | New follows |
|---|---:|---:|---:|---:|---:|---:|
| Originals | 29 | 919 / 20 / 97 | 97 | 6 | 11 | 1 |
| Replies | 15 | 1,201 / 11 / 360 | 39 | 2 | 10 | 0 |

Originals that created qualified contact (replies, detail expands, URL clicks), ranked by engagements:

| Date | Opening move | Link in post | Impr. | Eng. | Replies | Expands | URL clicks |
|---|---|---|---:|---:|---:|---:|---:|
| Aug 25 | Question in plain words: "do you know how llms.txt and GEO works?" then two facts that both hold | no | 72 | 22 | 3 | 19 | 0 |
| Aug 26 | "I built first-party analytics… The SQL was correct. The event was wrong." | yes | 84 | 16 | 5 | 5 | 5 |
| Aug 26 | Provenance list (prompts, sessions, tokens, hours) + #BuildInPublic | yes | 47 | 11 | 1 | 6 | 2 |
| Aug 27 | Bun 1.4 numbers (p99 CPU 24%→10%) + "my review" + media | yes | 71 | 9 | 1 | 7 | 0 |
| Aug 23 | Fable/Sol subscription opinion | yes | 38 | 9 | 1 | 0 | 0 |
| Aug 22 | "I built ghx… One problem: I still don't reach for it." | yes | 68 | 5 | 0 | 3 | 2 |

Highest impressions among originals: Aug 27 Bun post that names the owner's own machine ("My M5 MacBook Pro has 24 GB of RAM and still feels slow…"), 97 impressions, 1 reply.

Thread decay (Bun 1.4, four posts, Aug 27): 71 → 97 → 15 → 21 → 19 impressions. Posts three onward reach a fifth of post one. The verdict post (post five) had zero engagement.

Replies to large accounts reach five to fifteen times an original (360, 299, 146, 127 impressions) but convert to almost nothing: 0–13 engagements, no follows.

## What this says for the interp-engine thread

1. Open in plain words with the failure a non-specialist can picture. The two best originals opened with a question or a two-sentence "correct / wrong" contrast; the jargon-first Bun spec post and the verdict post did worst.
2. Keep the link in post one. Link posts produced every URL click in the window; there is no evidence that withholding the link helps this account.
3. Put the strongest number and the owner's machine in posts one and two. Post three onward is read by a fifth of the audience.
4. End with one specific question, not a verdict. The only originals with three or more replies asked something concrete.
5. Skip hashtags; #BuildInPublic did not raise impressions.
6. After posting, one on-topic reply under the interp-engine announcement post is worth more reach than any second original. That is a reply with the reproduction result, not a bare link.

Success signal stays as in the launch brief: a reply or correction from the maintainers, a reshare from the interpretability community, or someone running the scripts.

## Snapshots

(record at +1 h, +24 h, +7 d after posting: impressions, expands, URL clicks, replies, follows, and any corrections)
