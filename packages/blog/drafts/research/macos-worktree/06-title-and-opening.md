# Title and opening correction — October 29, 2026

Goga identified that the published title and opening buried the strongest result: a Linux VM on the tested Mac installed dependencies faster than the host macOS in all four measured repositories, despite its smaller CPU and RAM allocation. The previous title described a possible slow worktree setup; it did not communicate that measured result.

The title is now **A Linux VM on My Mac Beat macOS at Installing Dependencies**. The opening leads with T3's 2.10-second VM versus 8.12-second Mac medians, the four-vCPU/4-GB guest versus ten-logical-CPU/24-GB host, and the three useful findings: independent versus shared files, measured Mac improvements, and the reproducible cache-write failure. Theo's motivating chart remains in the methods section. The headline remains limited to dependency installation; neither overall VM superiority nor an isolated APFS cause is claimed.

The article is 958 rendered words, about 4.79 minutes at 200 words/minute. The exact feedback message is the seventh shaping prompt. Publication date and URL remain October 28 and `/why-worktree-setup-is-slow-on-macos`; `lastModified` is October 29. The original six-message draft prompt record, v4 frozen evidence and first-publication receipt remain historical at their recorded revision.

Local acceptance: all 22 Markdown posts validate; an isolated production build against current main produces 33 posts. The rendered H1, HTML title, Open Graph, Twitter and structured-data headline all match. The description, modified date, unchanged canonical/date, Markdown twin, seven-prompt page, index and feed pass checks. The [check record](06-title-and-opening-checks.json) freezes the two revised source files. This is an editorial correction using the existing research; no timing series or mechanism claim was changed and no benchmark rerun is represented.

## Source delivery, deployment and live acceptance

Source commit `b8888fd10d374bfff6468c05314265b8ea8ef214` is on `main`; both frozen source hashes survived integration unchanged. The automatic Git build did not appear in either the commit checks or Cloudflare deployment activity. No cause is inferred and no build configuration was changed. The exact source was therefore rebuilt in an isolated checkout with UTC and the existing public Turnstile build key read from the current Cloudflare build settings, then published directly using Wrangler 4.71.0.

Deployment `6427addb-9e55-4f63-8b55-5933593b4298` activated Worker version `5927b920-b90b-40d0-b4b3-f697cdf4442c` at 100% on `2026-10-29T15:04:25.115536Z`. Its deployment message identifies source `b8888fd`. The build changed thirteen static assets; existing bindings and configuration were preserved.

At `2026-10-29T15:05:09Z`, the article, seven-prompt page, Markdown twin, negotiated Markdown, post index, feed and sitemap returned HTTP 200 and passed checks. Served Markdown exactly matches the release build. Article and prompt HTML match after removing exactly one Cloudflare-injected Insights script from each response; their original hashes are retained separately. The browser also shows the new title and first paragraphs. Publication date remains October 28; the URL remains stable. The temporary build checkouts were removed after acceptance. This requested editorial correction is complete.
