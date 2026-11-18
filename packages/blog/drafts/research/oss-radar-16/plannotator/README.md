# Plannotator reply ownership trial

Declared November 17, 2026 before execution. The earlier handoff proposed v0.28.66. Today's release is [v0.28.67](https://github.com/backnotprop/plannotator/releases/tag/v0.28.67), pinned at `969084882013ac7634283ebca06f3118e766d30d`; use that source for the new trial. The actual T3 wake file is byte-identical across those releases. The store changed elsewhere; do not infer unchanged behavior from release notes or an incomplete comparison listing.

## Question and conditions

A T3 thread writes to the Inbox before it has a usable grant. A person replies. Another agent reads first. Does that read preserve the intended recipient's reply, and can the real wake deliver it after a grant appears? Is temporary unreachability kept distinct from an authoritative ended-thread response?

Use the unchanged real `InboxStore`, its default JSONL log and the real T3 wake and credential/delivery classes where their imports can be supported. Use owned data/project directories and authored messages. Use the installed Bun 1.4.0 runtime; disable automatic dependency installation and environment-file loading. Link actual workspace packages using their exports and install only required external dependencies at the versions resolved by the pinned source/lock. No global installation or account configuration is authorized.

Declare these controls before execution:

1. An unpromised T3 message and reply survive another reader, an unnamed reader and reopening; the intended recipient's own read settles its reply.
2. Raw MCP-client identity churn retains the newcomer exception. A T3-shaped identifier under an unrelated host must not acquire T3 semantics merely from its string form.
3. A no-grant T3 reply remains pending; after a saved fixture grant appears, the actual wake sends it to a scripted T3 RPC boundary and records delivery. Inspect the submitted recipient/message and the saved log after reopening. A second sweep must not submit another copy.
4. A temporary transport failure retains the reply and must not establish `gone`. After controlled retry time and recovery it can deliver.
5. A send to a previously reached thread returning `thread_not_found` establishes gone for an unpromised thread; a new reader can then settle it. A subsequent tool call can clear the wake's known-gone state. Compare this with a lookup under a grant that never reached the thread: one environment not having it does not prove it is globally gone.
6. A message that explicitly promised `wakes: true` stays strict even when gone. Do not generalize the unpromised newcomer exception to every message.

Inspect actual pending replies, checked marks, delivery records, JSONL files and RPC submissions. Keep setup failures and unexpected results. Run a fresh portable reproduction once the fixture and source/dependency checks are concrete.

The isolated dependency setup uses the manifest's exact MCP client 2.3.1 and Zod 4.6.7 pins with lifecycle scripts disabled; its actual dependency lock is retained. This is a component dependency install, not the entire upstream workspace installation or its full lock resolution.

## Results and reproduction

Eight case groups passed in the [portable fixture](inbox_trial.ts). [Normalized results](results/inbox-2026-11-17.json), [all attempt dispositions](results/attempts-2026-11-17.json), [121 executed-source hashes](source-hashes.json) and [resolved dependency versions](results/dependencies-2026-11-17.json) accompany the [fieldwork record](../05-tuesday-inbox-ownership.md). An early fixture checked the wrong RPC field; it is retained as a fixture failure. A dependency audit found one transitive version ahead of upstream, then the final reproduction pinned it to the upstream version. All 13 final resolved package versions occur in the upstream lock.

Unpack the [pinned archive](https://codeload.github.com/backnotprop/plannotator/tar.gz/969084882013ac7634283ebca06f3118e766d30d) into an owned source directory. In a separate empty component-dependency directory, copy `component-package.json` to `package.json` and `component-lock.yaml` to `pnpm-lock.yaml`, then install with `pnpm install --frozen-lockfile --ignore-scripts`. This preserves the checked small dependency resolution without installing the whole frontend workspace.

```sh
python prepare_trial.py /path/to/source /path/to/component-dependencies
cd /path/to/source
bun --no-env-file --no-install oss-radar-inbox-trial.ts /path/to/fresh-output
```

The preparation helper verifies the source files and links actual workspace packages using their exports. It refuses conflicting files/links. The fixture verifies those source bytes before opening stores and compares its observed runtime source closure afterward. Its output path must be new; predecessor attempts are preserved. Logical clock advances exercise retry conditions; they are not a wall-clock latency measurement. The checked environment is Bun 1.4.0 on Darwin arm64. No UI, live-host, model, provider or cross-platform acceptance is claimed.

## Boundary

The T3 provider boundary is scripted. A queued response proves the Inbox accepted that service response and persisted its own state, not that a real T3 agent received a turn or completed work. The store and wake are not mocked. No real provider, paid model, personal Inbox, OAuth account or T3 server will be used. UI/host integration, different providers, load and cross-platform behavior remain separate work.

The relevant firsthand [report #3339](https://github.com/backnotprop/plannotator/issues/3339), [merged correction #3348](https://github.com/backnotprop/plannotator/pull/3348) and [maintainer's explanation](https://github.com/backnotprop/plannotator/issues/3339#issuecomment-6881466766) distinguish retaining a reply from guaranteeing eventual delivery. Without a grant or an authoritative disappearance signal, the Inbox cannot identify a dead thread from silence alone.

## November 18 browser trial

The [v0.29.0 release](https://github.com/backnotprop/plannotator/releases/tag/v0.29.0) binary was tested separately on Darwin arm64. Download and verify the Darwin ARM64 asset against the [trial receipt](results/browser-reply-2026-11-18.json). Use Node 24.14.1, Chrome 157.0.8103.79, a scratch dependency directory with `playwright-core@1.64.1`, and one with `@modelcontextprotocol/client@2.3.1` (see the existing lockfile). Run the [browser fixture](inbox_browser_trial.mjs) with paths to those directories and a fresh output directory.

```sh
node inbox_browser_trial.mjs /path/to/plannotator /path/to/chrome \
  /path/to/playwright-deps /path/to/mcp-deps /path/to/fresh-output
```

The fixture runs a scoped local Inbox with account-home reads restricted, auto-connect and updates disabled, and data in the output directory. It replies through the shipped UI and checks persisted read marks across clean shutdown and restart. The T3 identities are synthetic MCP readers. A real T3 conversation, grant, or agent turn was outside this trial.
