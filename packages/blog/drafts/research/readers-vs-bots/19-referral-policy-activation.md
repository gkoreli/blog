# Referral policy activation and live verification

Policy `2026-09-06.2` is active in production. The public API excludes the investigated 35-observation cluster, exposes only reviewed referrer names, and reports its policy/source commitments. Retained D1 observations still supply the exclusion count. This closes the release portion of [TASK-0121](../../../../../docs/tasks/TASK-0121.md); manual browser interaction/visual QA remains unperformed because this session has no browser.

## Release identity

| Item | Evidence |
|---|---|
| Code commit | [`fe9456e011e3e2dd7c0f691fe8ba8c247cd03a6d`](https://github.com/gkoreli/blog/commit/fe9456e011e3e2dd7c0f691fe8ba8c247cd03a6d) |
| Cloudflare build | `be21b0df-7abe-41b7-9f91-92cd5d92e4af`; GitHub's Workers Builds check completed successfully for that commit |
| Deployment | `b2a44fdf-9291-40e3-8aae-85e4f191e016`, 100% |
| Worker version | `662f06cd-2b80-425d-ac70-cc54d5002167` |
| Deployment creation | `2026-09-07T00:23:54.049584Z` |
| Report capture | `2026-09-07T00:24:48.184Z` |
| Final live checks | `2026-09-07T00:25:26.863Z` |
| Policy SHA-256 | `25d4655bd67b0a63e9fc1f59586c6d85f924671024874198a678e8b82a00d7c4` |
| Captured response SHA-256 | `1592332e6663043b09dda35315243623a0cb96a11296e1cf4e746adec75304b9` |
| Private release-manifest SHA-256 | `3ec2031da20b973d4051fc6aa9dab985888b73ca20766e0bb96e8f480b090961` |

Deployment creation is Cloudflare's recorded event time, not a claim of simultaneous propagation worldwide. Later documentation-only deployments may carry the same policy; this records its first verified activation. The append-only [activation record](../../../../analytics/policies/activations/2026-09-07.1.json) binds the code, deployment, policy, and verification artifact. The source snapshot and policy definition remain those reviewed in [artifact 18](18-matomo-referral-policy-verification.md).

## Published report and scoped checks

`capture-report` successfully fetched `https://gkoreli.com/api/stats?range=30d&traffic=browser`, validated the version/hash/source against the archive, and saved the exact received text privately. The report's own `updatedAt` is `2026-09-07T00:24:47.928Z`; capture happened afterward. Its window is August 9–September 7 inclusive, including a partial current UTC day. Artifact 18's fixed August 8–September 6 window remains a separate comparison.

| Published measure | Count |
|---|---:|
| Included Browser observations | 936 |
| Included daily client IDs | 635 |
| Excluded observations | 35 |
| Reviewed referrer views | 60 |
| Other reported referrer views | 7 |
| No-referrer views | 869 |

60 + 7 + 869 = 936. No offending or unapproved referrer name appears in this public response. The live All selection reports 4,178 included observations and 35 exclusions. Browsers scoped to `/` reports 321 included observations and 17 exclusions. In each response, paths, time series, devices, and reader kinds sum to included views, and the referral buckets reconcile. These separate live reads do not establish a cross-query transaction or validate human-count accuracy.

The served `/stats` HTML contains the reported-referrer heading, Matomo/local-policy disclosure, and ADR link. The served client bundle contains the generic other-referrer label and exclusion-count handling. This verifies the shipped artifacts over HTTP; it is not interactive browser or screenshot verification. Local SQLite tests cover every traffic group, scoped agent/kind/path selection, historical rows, rotation/lookalikes, and all-excluded states.

## Retention and completed checks

The private report, two scoped responses, build check, and sanitized deployment/version records are stored under `/Users/goga/.local/share/gkoreli/analytics-evidence/2026-09-07-referral-policy/`, with `release-manifest.json` hashing each file. The earlier candidate manifest is unchanged. Files are mode 0600 in a 0700 directory. These private captures preserve what was reported; recalculating a policy over later D1 state answers a different question.

All 46 analytics tests, 19 blog tests, workspace typechecks, the strict policy-script typecheck, and the production build passed before the implementation commit. The build verified the upstream bytes and generated policy offline. Cloudflare's build check then passed for the pushed commit, and the live checks above passed. No database migration or data deletion was performed. The implementation and bookkeeping are committed under the repository's direct-to-main delivery rule.
