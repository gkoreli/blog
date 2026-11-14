# Omarchy on the current Mac: experiment worklist

Started November 14, 2026, America/Los_Angeles. This starts the previously proposed VM experiment. Article publication and physical laptop migration remain outside this phase.

## Objective and acceptance

Run the full Omarchy desktop in a separate VM on the author's Mac, exercise copies of actual projects and workflows, and measure the incremental contribution of its desktop/tool integration beyond Linux execution. Preserve concurrent projects, servers and VMs.

- [x] Obtain and verify the official Mac VM application/image; record versions, resources, storage and channel.
- [x] Boot and inspect a working Omarchy desktop; establish a repeatable guest command path and project-copy route.
- [x] Exercise the real blog development workflow through correctness checks, a local application and browser inspection.
- [x] Exercise an actual creative-project workflow through editable state and exported output, or document a reproduced platform/capability limit. The photo import/native processing path is blocked; export is not qualified.
- [x] Test the agent/terminal/browser working loop and one supported desktop extension, including removal/recovery and an available update boundary. The system update and same-version package replacement were tested; forward compatibility remains unproven.
- [x] Compare Linux execution with Omarchy-assisted desktop work under named conditions. Separate setup, steady task time, manual interventions and failures; retain all attempts. The same Linux preview worked with the retained Mac browser and guest Chromium; human interface efficiency was not timed.
- [x] Inspect local-model/container and media-application constraints relevant to the existing workflow, without substituting launch success for useful task completion.
- [x] Deliver the usable VM, results, remaining boundaries and the next personal acceptance action. Do not claim a human productivity or enjoyment multiplier from automated timings.

## Initial observations

The current host reports Apple Silicon and macOS 27.2. The task volume has about 40 GiB available. A default Lima listing returned no instance; the earlier benchmark VM is not treated as currently available. Some host process and hardware queries are sandbox-restricted and need an authorized execution path before using their results.

The official [Try Omarchy v1.2.0 release](https://github.com/omacom/try-omarchy/releases/tag/v1.2.0) supplies a Mac application and a multipart ARM factory image. Its [release documentation](https://github.com/omacom/try-omarchy/blob/v1.2.0/README.md) describes the full desktop and Mac integrations, with CPU video decoding, unavailable Vulkan and opt-in nested virtualization. These were the starting claims; observed factory and updated guest versions are recorded below, with runtime acceptance and its limits in the results.

## Working conditions

Raw logs, screenshots, source copies, guest disks, media and credentials stay in ignored local worklog storage. Only sanitized methods/results belong here. Timed project files must live on the guest's own filesystem. A host-shared directory is used for transfer and tested separately. Production credentials, private archive contents and whole personal libraries are not part of the guest project snapshot.

Use an explicit committed source revision or a fingerprinted copy of a selected working state. Keep inputs and correctness criteria attached to each result. Do not run host and guest benchmark legs simultaneously or stop unrelated work to create a cleaner number.

## Runtime setup observed

| Item | Observed condition |
| --- | --- |
| Host | Apple M5, 10 logical CPUs, 24 GiB; macOS 27.2 (26B123) |
| App | Official Try Omarchy v1.2.0, build 464, published October 22, 2026 |
| App integrity | Release SHA-256 `403e7695c824dc67448d9f273bd105c6a17db2e89fd120d9fc7df1d647af30ba` matched; macOS code-signature verification passed and Gatekeeper accepted its notarized Developer ID |
| Guest allocation | Four vCPUs, 8 GiB RAM, 32 GiB sparse disk; separate persistent workspace |
| Factory | ARM64 edge image; identity `319f046156dfae25e39e6386e03683fa3bf5b51c0ba92fb3ace4243f7b66d14d`; initially `omarchy-dev 4.0.0.r7218.gbe54892-1`, kernel `7.2.8-23-omarchy`, Try Omarchy integration `0.1.0-33` |
| Execution and storage | QEMU 11.1.1/HVF; guest home on its own Btrfs subvolume; transfer-only Mac share mounted separately |
| Access | Guest desktop confirmed by guest-native screenshot; isolated SSH key and host-loopback-only port forwarding |
| Host permissions | The agent did not grant Accessibility, camera or microphone access; physical Mac shortcut capture and conferencing were not qualified |

The computer-use tool configured the launcher but timed out when attaching to the separate VM window. QEMU's control protocol remained responsive, but its screen dump returned a black buffer. A later guest-native capture showed the working desktop, so neither observation is evidence of an Omarchy desktop boot failure.

For automation, the trial follows the project's [seeded first-boot test method](https://github.com/omacom/try-omarchy/blob/v1.2.0/tests/e2e/run.sh), including its [disk preparation](https://github.com/omacom/try-omarchy/blob/v1.2.0/tests/e2e/prepare-disk.sh) and [owner setup](https://github.com/omacom/try-omarchy/blob/v1.2.0/guest/tests/desktop/provision-seeded.sh). A separate temporary Alpine/Lima helper mounted only the stopped trial disk, installed the reviewed seed, unmounted it and stopped before Omarchy resumed. The desktop was then captured from inside the guest. This is an agent-operated test environment; the author has not personally evaluated its ergonomics. Automation setup effort is not a normal installer-time benchmark.

## Inputs and Mac setup checks

The blog snapshot is committed revision `cfbacaaf623feffb8079a4aa25f57f8d48962285`, transferred as an archive with SHA-256 `c16e6bae22b2de7a9e971e3e91b6a8c3246d3c295de07b46ca7c7259439df246`. Runtime and package manager are pinned to Node 24.14.1 and pnpm 9.15.4 on both sides. The Linux Node archive was checked against Node's published SHA-256 manifest; package archives are checked against the registry's published SHA-512 integrity values.

The isolated Mac copy initially passed workspace typechecks, 35 Markdown-post validations, all 457 blog-package tests and a production build generating 46 posts. These are setup/correctness checks, not paired timing evidence. The first offline install lacked a cached tarball, so a frozen-lockfile online install was required. The first sandboxed build could not create tsx's IPC socket; the same build passed outside that sandbox. Both failed attempts are retained as harness/setup observations.

Both snapshots then received the same local-only draft preview, SHA-256 `42e8452562bd75a4c0eccc6b7c417a3b15dd41512d2fcaa5f5692196449b0ac6`. All 20 measured pipelines passed 457 tests, 36 Markdown validations and a build of 47 posts. The preview never entered the real site's `posts/` directory.

Status: completed first VM trial. Stable Omarchy 4.5.0-3 boots kernel 7.3.0-3.1 after a backed-up stale boot-entry repair. The full results, failed attempts, extension recovery and qualification limits are in [the experiment report](06-vm-results.md). The VM and inputs remain in ignored local storage; the temporary binding/menu changes were restored and the clock clone was removed recoverably. Next bounded action: author-operated work in the retained VM, recording attended time and preference separately from the automated results.
