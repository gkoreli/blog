# November 23 missed release for OSS Radar #17

## What happened

GitHub created the scheduled run at 18:43 Pacific on November 23, ten hours and 43 minutes after the 08:00 release time. GitHub's run record gives the actual start time. The cause of the delay is unknown. The run history contains a single attempt for the date. [GitHub Actions run](https://github.com/gkoreli/blog/actions/runs/45314433189).

The runner reached `pnpm install --frozen-lockfile`. The `onnxruntime-node@1.21.0` postinstall assumed CUDA 12 on Linux x64 and tried to fetch its optional GPU archive. The download returned HTTP 404 and halted the job. GitHub skipped article selection, validation, the publication commit, and live verification. [Failed job](https://github.com/gkoreli/blog/actions/runs/45314433189/job/138177739458) · [Pinned npm package](https://www.npmjs.com/package/onnxruntime-node/v/1.21.0).

On November 24, the November 23 snapshot was still in the queue at SHA-256 `41627811aae914a9a3b2cdd147e0f195bfe2f29806feabf134c5407410f43927`. The live site served #16 and returned 404 for #17. GitHub confirmed the workflow state was `disabled_manually` after restoring the publication pause. [Manifest](../../../publication-schedule.json) · [Issue #16](https://gkoreli.com/oss-radar-16-saved-skills-and-inbox-replies) · [Hosted workflow](https://github.com/gkoreli/blog/actions/workflows/november-publication.yml).

## Install repair

The repository's npm configuration tells the ONNX Runtime installer to use its bundled CPU libraries and skip the CUDA download. Explicit GPU experiments can opt in with `ONNXRUNTIME_NODE_INSTALL_CUDA`. This applies to both GitHub Actions and Workers Builds. [Install setting](../../../../../.npmrc).

Two clean frozen-lockfile installs used the pinned pnpm 9.15.4 and the shipped ONNX Runtime installer, with its platform inputs set to Linux x64 and the GPU request answered with a controlled HTTP 404. The control requested the same URL and failed. With the new setting, pnpm passed `skip` into the package hook, the request was absent, and the install finished with package lifecycle scripts enabled.

In that isolated checkout, a simulated November 23 08:00 release promoted the exact reviewed bytes. Workspace typecheck, validation of 39 Markdown posts, and a 50-post production build passed. The build contained the article in HTML and Markdown, the OSS Radar archive, the dated post catalog, and RSS.

The queued source has passed the [Sunday editorial and render checks](2026-11-22-release-readiness.md). The November 23 release window has closed. A catch-up needs a new approved date.
