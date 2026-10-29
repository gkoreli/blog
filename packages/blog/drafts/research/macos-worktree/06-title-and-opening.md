# Title and opening correction — October 29, 2026

Goga identified that the published title and opening buried the strongest result: a Linux VM on the tested Mac installed dependencies faster than the host macOS in all four measured repositories, despite its smaller CPU and RAM allocation. The previous title described a possible slow worktree setup; it did not communicate that measured result.

The title is now **A Linux VM on My Mac Beat macOS at Installing Dependencies**. The opening leads with T3's 2.10-second VM versus 8.12-second Mac medians, the four-vCPU/4-GB guest versus ten-logical-CPU/24-GB host, and the three useful findings: independent versus shared files, measured Mac improvements, and the reproducible cache-write failure. Theo's motivating chart remains in the methods section. The headline remains limited to dependency installation; neither overall VM superiority nor an isolated APFS cause is claimed.

The article is 958 rendered words, about 4.79 minutes at 200 words/minute. The exact feedback message is the seventh shaping prompt. Publication date and URL remain October 28 and `/why-worktree-setup-is-slow-on-macos`; `lastModified` is October 29. The original six-message draft prompt record, v4 frozen evidence and first-publication receipt remain historical at their recorded revision.

Local acceptance: all 22 Markdown posts validate; an isolated production build against current main produces 33 posts. The rendered H1, HTML title, Open Graph, Twitter and structured-data headline all match. The description, modified date, unchanged canonical/date, Markdown twin, seven-prompt page, index and feed pass checks. The [check record](06-title-and-opening-checks.json) freezes the two revised source files. This is an editorial correction using the existing research; no timing series or mechanism claim was changed and no benchmark rerun is represented.

Source push, deployment and actual live acceptance remain to be recorded below.
