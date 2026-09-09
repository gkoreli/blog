---
id: TASK-0139
title: Explain public-referrer abuse and refocus article 025
status: done
parent_id: FLDR-0008
evidence:
  - >-
    Released article revision in e0e1fa2 and pushed main. Cloudflare build
    ee5b909d-b533-405f-9593-7c6922e767af succeeded at 2026-09-09T02:06:10Z.
  - >-
    Production build, shape-article validator, seven generated-output checks,
    and independent editorial review passed. Live HTTP/content acceptance at
    2026-09-09T02:10:21Z is recorded in
    packages/blog/drafts/research/referrer-spam/14-public-transparency-live.json.
  - >-
    Public-risk argument and residual abuse limits are explicit; D1 is one
    supporting paragraph. All 21 exact prompts render; frozen footprint numbers
    and commitments remain unchanged.
created_at: '2026-09-09T01:48:00.405Z'
updated_at: '2026-09-09T02:12:04.271Z'
type: task
---
The owner wants article 025 to explain why a suspicious hostname topping publicly visible analytics harms credibility, can promote an unsafe destination, and creates unsupported claims of readership and referral success. The owner also questioned the large D1 section; keep its measured operating tradeoff briefly and link the existing incident/ADR instead of making optimization a coequal article promise.

Preserve the owner's assessment of the destination as an assessment. The saved public ranking and request patterns do not prove malware, identify the operator, or establish zero legitimate click-throughs. Keep that evidentiary boundary explicit while making the public-reporting defense decisive. Preserve exact shaping prompts and the already frozen research footprint; identify later prompts/edits as outside its cutoff.

Acceptance: update article opening/body/metadata, public prompt record and editorial decisions; verify primary mechanism reference and saved captures; build and check served content; commit and push scoped work and release receipts. No traffic measurement, database changes, destination visit, or social posting is required.
