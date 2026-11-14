# Extension surfaces and the boundary of reuse

Source inspection on November 14, 2026. Core files are pinned to Omarchy v4.5.0, commit `ac2690cd7be4f47e4a255f5e2e78d904d436b068`. No Omarchy commands or desktop were run.

Later evidence: the [agent-operated VM follow-up](06-vm-results.md) exercised clock cloning/editing, user menu/binding changes, same-version package replacement and restoration. The source-inspection statements below describe the earlier phase; future-version compatibility is still unqualified.

## Findings

| Question | Inspected evidence | Supported answer and boundary |
| --- | --- | --- |
| Can a user override defaults without patching the distribution? | [Dotfiles chapter](https://github.com/omacom/omarchy/blob/ac2690cd7be4f47e4a255f5e2e78d904d436b068/manual/31-dotfiles.md) | Documents user-owned configuration, keybinding overrides, menu entries and lifecycle hooks. Packaged files are a separate ownership boundary. |
| Can a user replace an individual desktop component? | [Plugin manual](https://github.com/omacom/omarchy/blob/ac2690cd7be4f47e4a255f5e2e78d904d436b068/manual/32-shell-plugins.md) and [clone implementation](https://github.com/omacom/omarchy/blob/ac2690cd7be4f47e4a255f5e2e78d904d436b068/bin/omarchy-plugin-clone) | The clone command copies a built-in into the user's plugin directory, assigns a local ID and `clonedFrom` metadata, rescans/enables it and routes the original component identity to the clone. This is code-inspected behavior, not runtime acceptance. |
| Is there a defined plugin interface? | [Shell reference](https://github.com/omacom/omarchy/blob/ac2690cd7be4f47e4a255f5e2e78d904d436b068/docs/omarchy-shell.md) | Documents a versioned manifest schema, QML entry points, component kinds, IPC, configuration and shared UI contracts. Both built-in and third-party components use manifests. A schema version does not establish a perpetual API-compatibility promise. |
| Does replacing the whole bar preserve every widget integration? | Same shell reference | It documents reduced integration for service-backed third-party widgets under an untrusted replacement bar. This is a consequential limit to interchangeability. |
| Is a plugin an isolated or harmless extension? | Same shell reference | It explicitly describes unsandboxed code in the shell process. Scoped interfaces are API boundaries, not a same-process security sandbox. No broader security assessment was performed. |
| Can selected components become an independently reusable platform? | Above configuration, plugin, shell and clone sources | Local extension is established. A supported minimal distribution, cross-host SDK or long-term compatibility contract for assembling an independent product was not established in this inspected scope. It is not a claim that no other documentation or future contract exists. |
| Must the user abandon macOS to explore some of the experience? | [omarchy4mac README](https://github.com/dividendsolo/omarchy4mac) | This independent project describes recreating selected workflows with AeroSpace, SketchyBar and macOS tooling. It is a port with replacement implementations; no install, completeness or compatibility claim was verified here. |

## The architectural distinction

DHH's [April 15 essay](https://world.hey.com/dhh/the-malleable-computer-7c187a9b) argues that agents reduce the knowledge and effort needed to modify open-source applications and the desktop. That is a claim about practical changeability. Supporting someone who builds an independent product from selected components additionally requires dependency boundaries, documented contracts and an ongoing upgrade story.

Omarchy already supplies meaningful extension surfaces. It would be inaccurate to describe the product as requiring a full distribution fork for every customization. It would also be inaccurate to interpret the existence of plugins, or a manifest's `schemaVersion: 1`, as proof of maintenance-free reuse across desktop versions or host operating systems.

The useful runtime test is small and reversible: override one binding, add one menu action and clone one component; make a useful change; confirm the packaged source is untouched; disable/remove the customization; and exercise a real update when available. Record repair effort as well as the initial change. This would establish a particular extension's behavior and maintenance cost. It would not establish every component as a stable platform API.

## Source acquisition limits

The supplied November 9 public X post was visible in the attached screenshot. The web reader could not retrieve its live URL. The article can link and paraphrase the architecture question; it does not reproduce its wording or claim to have audited whether a reply exists. An earlier private conversation helped recover the intended distinction; its raw author messages remain in the private archive and are not reproduced here.

For creative-workflow context, Ableton's [current system requirements](https://help.ableton.com/hc/en-us/articles/115001663530-Live-Minimum-System-Requirements) list Windows and macOS. Blackmagic's [published Resolve 21.1 codec table](https://documents.blackmagicdesign.com/SupportNotes/DaVinci_Resolve_21_Supported_Codec_List.pdf), dated September 2026, has a Rocky Linux/CUDA section with Studio/NVIDIA conditions for H.264/H.265 and no AAC decode/encode entries. It does not certify Omarchy or every newer Resolve build. Actual media, license, GPU and version need their own test. No codec or creative application was run in this research.
