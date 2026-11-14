# Omarchy VM trial: a working desktop, a tied verification loop

November 14, 2026, America/Los_Angeles. Agent-operated trial on the existing Mac; no author assessment of daily ergonomics is recorded. This is a follow-up to the [source research](README.md) and [experiment worklist](05-vm-experiment.md).

The full blog verification loop showed essentially equal elapsed time: **14.87 seconds on macOS and 14.94 seconds in the Omarchy VM**, across ten paired runs. Desktop customization worked through user-owned interfaces, with a shell restart needed to display the edited clock. Two existing application workflows did not carry over unchanged. These results support continuing a reversible trial while retaining the Mac.

## What ran

| Area | Observed result | Boundary |
| --- | --- | --- |
| Blog verification | All 20 measured pipelines passed typechecks, 457 blog tests, 36 Markdown validations and a build of 47 posts. | One repository and warm execution conditions; includes an unpublished local preview fixture. |
| Terminal and browser | The default terminal shortcut opened Foot. A command entered through the VM keyboard produced a file readable on the Mac. Chromium rendered the actual article draft. | QEMU keyboard input and guest-native screenshots were used; physical Mac shortcut capture was not qualified. |
| Keep the Mac interface | The same Linux-served preview rendered in the Mac's in-app browser through a loopback SSH tunnel. | The Linux backend was held fixed. Human review time and desktop preference were not measured. |
| Customize the desktop | A cloned clock displayed UTC alongside local time. A user menu entry and rebound shortcut opened the blog workspace. | Packaged clock files remained unchanged. The edited clock needed a supported shell restart. |
| Replacement and recovery | The clone and workspace files survived a **same-version** Omarchy package reinstall. Removing the handmade clone kept a recoverable backup and restored the built-in clock. Original menu/binding files were restored. | This does not establish compatibility with a future release. |
| Owned photo application | Pinned dependencies installed, the Linux build passed and an editable project was created. Processing-capability and real HEIC-import operations failed because the macOS native helpers were unavailable. | Photo editing/export was not qualified. Existing Mac helpers read the same HEIC and reported the native engine available; they were existing artifacts, not a matched rebuild. |
| Existing MLX evaluation profile | Its locked Python 3.12 environment installed, then its inference-backend import failed. The lock installs MLX through a macOS-conditioned dependency. | A Linux backend/profile adaptation remains necessary. No model weights or inference benchmark were run. MLX separately documents [Linux CPU and CUDA backends](https://ml-explore.github.io/mlx/build/html/install.html). |
| Containers | Rootless Podman ran all 457 blog tests in an official Node 24.14.1 container inside the guest, with nested virtualization disabled. | Functional acceptance, not a container-performance comparison or acceptance of every evaluation image. |

## Paired measurement

| Condition | Runs | Median total | Minimum–maximum |
| --- | ---: | ---: | ---: |
| Native macOS | 10 | 14.869 s | 13.849–16.491 s |
| Omarchy Linux VM | 10 | 14.941 s | 12.684–16.830 s |

The baseline/candidate median ratio was **0.995×**. That difference is small relative to the observed spread. There is no measured whole-loop time saving here. Linux's build median was lower (7.081 versus 7.982 seconds), while its test median was higher (5.726 versus 5.130 seconds). Totals were computed for each complete run; separate stage medians need not sum to the median total.

The [20 numerical observations](data/2026-11-14-blog-pipeline.csv) retain order, versions, stage times, totals and acceptance. They contain no raw logs or private source material.

Conditions:

- Host: Apple M5, 10 logical CPUs, 24 GiB, macOS 27.2, AC power. Other applications and concurrent work were preserved.
- Guest: official Try Omarchy v1.2.0, updated from its older edge factory to stable Omarchy **4.5.0-3**, kernel **7.3.0-3.1-omarchy**; four vCPUs and 8 GiB. The desktop remained running during both conditions.
- Both copies: Node **24.14.1**, pnpm **9.15.4**, frozen dependencies and the same committed blog snapshot plus the same local-only article preview. The source revision and input hashes are in the [worklist](05-vm-experiment.md).
- Guest project/cache files lived on its own Btrfs filesystem. The Mac share transferred inputs and results. The earlier worktree investigation used ext4 and a different workload/allocation.
- After successful warmups, ten pairs ran serially. Seed `20261114` shuffled five Mac-first and five Linux-first pairs. No host and guest measurement legs ran simultaneously. Timers ran inside each environment around the child commands; SSH/tool round trips were excluded.
- Each pipeline ran `pnpm typecheck`, the blog-package test suite, Markdown validation and `pnpm build`, retaining the full checks. All measured attempts passed. Earlier failed setup/warmup attempts remain in private receipts.

These are two complete execution paths with different CPU/RAM allocations, filesystems and platform binaries. Background load was not controlled. There was no separately installed generic-Linux timing control, so this does not estimate an Omarchy-specific performance effect. The retained-Mac and guest-browser tests qualify two interface routes over the same Linux backend.

The [worktree investigation](../../../posts/032-why-worktree-setup-is-slow-on-macos.md) remains evidence about dependency installation. This experiment measures verification and rendering. A faster installer can coexist with a tied complete loop.

## Setup and maintenance observations

The official app's checksum, code signature and notarization checks passed. Automation used the project's [seeded owner-setup procedure](https://github.com/omacom/try-omarchy/blob/v1.2.0/tests/e2e/run.sh); normal password-entry effort was not measured. Temporary guest update authorization was removed. The agent did not grant host Accessibility, microphone or camera permissions; those integrations were not qualified.

Three observations matter when assessing readiness:

1. **The updated kernel initially did not boot by default.** The generated menu retained the factory machine's old kernel entry alongside the current entry. After backing up the boot partition and removing only the obsolete entry with `limine-entry-tool`, the next boot selected the installed 7.3 kernel. This was one image/update path, not a measured failure rate.
2. **A real dependency install needed configuration.** Sharp detected system libvips 8.18.7 and attempted a source build that lacked a required build dependency. Its documented [`SHARP_IGNORE_GLOBAL_LIBVIPS` option](https://sharp.pixelplumbing.com/install/#building-from-source) selected the bundled implementation; frozen installation and the full checks then passed.
3. **A valid clone was not immediately a visible change.** The clone registered and validated, and the shell detected the edit, but the original clock remained visible until `omarchy-restart-shell`. The modified clock, original IPC target, same-version package replacement and removal were then exercised. This gives a concrete example of [documented component reuse](https://github.com/omacom/omarchy/blob/ac2690cd7be4f47e4a255f5e2e78d904d436b068/manual/32-shell-plugins.md) with an observed maintenance step.

Harness repairs were kept separate: the computer-use tool could not attach to the VM subprocess; QEMU's screen dump returned a black buffer while a guest-native capture showed the working desktop. An SSH wrapper also needed its working directory and a trial-created directory's ownership corrected. The edge-to-stable switch deliberately stopped at a security-policy boundary and required a fresh invocation. None of these is a measured everyday repair rate.

## What this changes about the switching decision

Omarchy supplied a coherent desktop and useful configuration/plugin surfaces. An agent could modify a component, add a workspace action, keep the package-owned source intact and restore the defaults. That is demonstrated capability. A daily productivity or enjoyment improvement is still unmeasured, and comparable automation on the current Mac was not timed.

The strongest current reason to retain the Mac is workflow continuity: the verification loop gained no total time, while the photo pipeline and current model profile need adaptation. A Linux execution path can also retain the existing Mac browser and agent harness, as exercised here.

Resolve, photo-library integration, macOS application delivery and music workflows were not qualified. Resolve 21.2's [Linux baseline](https://www.blackmagicdesign.com/support/content/readme/801a108506a54a908ffcd497f13b60de) specifies 32 GB and a supported discrete compute GPU; this 8 GiB graphics-virtualized trial is not that environment. It cannot qualify a physical laptop's battery, suspend, docks, displays, meetings or peripherals.

Next bounded experiment: an ordinary author-operated engineering session in the retained VM, including a change, browser review, interruption and project reopening. Record accepted output, attended waiting, maintenance and preference separately. A physical laptop trial becomes useful after the desktop offers a benefit worth preserving and the essential application gaps have an accepted plan.

## Disposition

The VM and project copies are retained locally. Raw captures, private source inputs, the photograph and credentials remain outside Git. The article remains unpublished and needs an editorial reconciliation with these agent-operated results before publication. No migration or hardware purchase was made.
