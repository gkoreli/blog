# Omarchy Is Taking Off. Should I Leave My Mac?

Omarchy is making Linux easier to choose: a finished desktop, visible hardware work, and agents that help change the system. I haven't used it. I have measured Linux beating macOS at dependency installs. The question is whether those advantages justify replacing the rest of my computer.

That distinction matters because I find the idea appealing. An operating system I can reshape, with tools that help me do it, deserves a serious look. I want to understand how much better it could make my work and everyday use, and what I would lose along the way.

There is enough evidence to explain the enthusiasm. Making a personal switching decision needs another layer of evidence.

## What is coming together in 2026

Omarchy combines Arch Linux with the Hyprland window manager and a Quickshell desktop. It supplies the application selection, configuration, appearance and maintenance path around them. That assembly is useful work. A developer can know how to configure a Linux desktop and still prefer to have someone else maintain a coherent starting point. [The manual](https://omarchy.org/manual/) describes the intended experience.

The adoption path is also getting broader. Omarchy 4.5, announced November 4, adds floating workspaces with a dock alongside tiling, an installer for selected Apple Silicon Macs, more language and input support, and captive Wi-Fi portal handling. These address things people encounter during ordinary use. They make the proposition easier to try without immediately adopting every desktop convention. [Release announcement](https://omarchy.org/news/2026/11/omarchy-4-5/).

Agents give the project a second proposition. In his April essay, [The malleable computer](https://world.hey.com/dhh/the-malleable-computer-7c187a9b), DHH argues that AI reduces the expertise and effort needed to change open-source software, including the desktop itself. Omarchy puts that idea into its product through agent launchers, shared instructions and a system whose configuration and implementation are available to inspect.

My interpretation is that this changes the perceived cost of Linux. An unfamiliar configuration problem can become a task an agent helps investigate. A missing feature can become something a user tries to build. That possibility is exciting even before there is evidence that it reduces total maintenance time.

I already use agents on my Mac. Including the same models or launchers would add little by itself. The useful comparison is whether Omarchy makes the complete loop easier: asking for a change, making it, inspecting the result and keeping it working.

There is identifiable engineering work behind the project too. Dell's [April account of XPS enablement](https://www.dell.com/en-us/blog/year-of-the-linux-laptop-omarchy-on-xps/) describes collaboration with Intel and Omarchy, roughly twenty kernel backports, camera work and power-management integration. The foundation now [lists full-time staff](https://omarchy.org/staff/) covering kernel, shell, infrastructure, and design/community. Those are concrete commitments to improving the system.

Together, these make a plausible explanation for the momentum: a more complete entry point, an appealing way to change it, visible improvements and people funded to keep working. That is my reading of the evidence, not a measured attribution of growth to any single cause.

The scale claims still need their labels. Omarchy [reported 100,000 ISO downloads in one August week](https://omarchy.org/news/2026/08/100000-downloads-in-a-week/). Its maintainers report more than 180 contributors to 4.5. Those indicate distribution interest and development activity. Neither establishes how many people kept using it or whether their working days improved.

## My benchmark answers one part of this

In [my dependency-install investigation](/why-worktree-setup-is-slow-on-macos), T3 Code took **8.12 seconds on macOS and 2.10 seconds inside a Linux VM on the same M5 Mac**. Linux was faster in all four repositories I tested.

The repositories and cache lived on the VM's own ext4 filesystem. These were populated-cache, offline installs with pinned tools. The VM had different CPU and memory allocations from the host, so this compared complete software and storage paths rather than isolating APFS alone.

I also found useful improvements on the Mac. Four installer workers reduced T3's median to 6.55 seconds. And the faster Linux path exposed an important tradeoff: a build wrote into hardlinked dependencies and changed the package cache. Independent copies prevented that failure.

The result gives me a reason to consider Linux execution. It also gives me an existing alternative to a laptop migration: I obtained that benefit inside a VM while retaining macOS.

For the switching decision, Omarchy has to improve on that alternative. The comparison should include the desktop, agent workflow, maintenance and the rest of the applications I use.

## What would a large improvement actually mean?

A package install running four times faster does not multiply the whole day by four. It helps in proportion to how much that operation blocks progress.

For a fixed task, suppose one stage becomes four times faster and everything else stays the same:

| Share of original elapsed time in that stage | Overall task speedup |
| --- | ---: |
| 5% | 1.04× |
| 20% | 1.18× |
| 50% | 1.60× |

These are illustrative calculations, not measurements of my day. The calculation is `1 / ((1 - p) + p / 4)`, where `p` is the original share spent in the improved stage. It assumes comparable output and no new costs.

That makes the first measurement fairly obvious: how much time do I actually lose to the things Linux might improve? Concurrent agents make this especially important. Waiting while I review another task is different from being unable to continue. Adding every agent's compute time would exaggerate the time available to recover.

For the same accepted work, a 1.2× improvement in completion rate requires about 17% less time. Three times the rate requires about 67% less; five times requires 80% less. A claim that large needs evidence across the work, with quality held comparable.

A new environment could also make a previously impractical project possible. That is a different outcome from finishing a fixed task faster. I would document the new capability and its cost rather than assign it an arbitrary speedup.

Time is only one reason to choose a computer. More control, a more enjoyable environment or a newly possible workflow can matter. I would record those effects separately. A preference rating cannot establish that my life became several times better.

## Can I build on Omarchy without carrying a fork?

On November 9, [I asked about reusing selected parts of Omarchy](https://x.com/GogaKoreli/status/2119883860880265416): whether it could provide a foundation for a substantially different setup through supported interfaces.

The source provides part of the answer. At the 4.5 release I inspected, Omarchy already has several extension surfaces:

- User configuration overrides defaults, with separate files for bindings, monitors and other behavior.
- Hooks run custom scripts on events such as startup, updates and theme changes. User menu entries can add or replace actions.
- Shell plugins can implement widgets, panels, menus, services or a replacement bar. A documented clone command copies a built-in component into the user's configuration so it can be changed independently.

For example, the [documented command](https://github.com/omacom/omarchy/blob/ac2690cd7be4f47e4a255f5e2e78d904d436b068/manual/32-shell-plugins.md) is:

```sh
omarchy plugin clone omarchy.clock
```

The [implementation](https://github.com/omacom/omarchy/blob/ac2690cd7be4f47e4a255f5e2e78d904d436b068/bin/omarchy-plugin-clone) copies the component into the user's plugin directory, gives it a local identity and switches to it while preserving calls to the original component identity. I inspected that path; I haven't run it.

This is meaningful extensibility. It means changing a component need not require maintaining a fork of the entire distribution.

The deeper question remains: what happens to my version over time? Copying a component gives me an implementation to maintain. The [shell reference](https://github.com/omacom/omarchy/blob/ac2690cd7be4f47e4a255f5e2e78d904d436b068/docs/omarchy-shell.md) documents manifests, entry points and communication interfaces, but also limits some integrations under replacement bars. These interfaces do not by themselves establish a long-term contract for assembling an independent product from arbitrary pieces.

The experiment I care about is therefore one useful customization followed by an update. Can I keep the change, receive upstream improvements and recover when the interface changes? Initial editing effort and continuing ownership are both part of the cost.

## Readiness belongs to a particular setup

The public Apple installer makes the distinction between availability and qualification unusually concrete. Its [inspected model matrix](https://github.com/omacom/omarchy-mac-installer/blob/c07e54c2134a8ec1415e7e2b917589ae1d3d7dc9/scripts/supported-models.json) admits M3 and Neo boards while marking them untested. The accompanying [README](https://github.com/omacom/omarchy-mac-installer/blob/c07e54c2134a8ec1415e7e2b917589ae1d3d7dc9/README.md#supported-macs) excludes M4 and later from public installs. That includes the M5 used in my research. A VM is a separate route.

Recovery has a similarly specific boundary. Omarchy's [snapshot documentation](https://omarchy.org/manual/system-snapshots/) says restoration reverts the root filesystem, while the home directory, user configuration and migration records survive. That can repair a broken system update, but it does not restore every part of the previous working environment.

Agent assistance also has an authority cost. The launcher selects automatic or permissive modes for several agents; [passwordless sudo](https://omarchy.org/manual/security/) is a separate optional setting. Giving an agent more authority can help it carry a repair through. The result still needs checking, and broader authority increases the consequences of mistakes.

The firsthand accounts are useful precisely because they contain mixed outcomes. Jared Smith [keeps Omarchy after seven weeks across three machines](https://sublimecoding.com/blog/omarchy-review-seven-weeks), while reporting update repairs and explicitly leaving Mac sleep, external displays and the webcam untested. Another user [left after thirteen months](https://www.reddit.com/r/omarchy/comments/1xkfsk7/13_months_on_omarchy_as_a_nonprogrammer_and_why_i/), grateful for the introduction to Linux but increasingly dissatisfied when deep customization fought the managed setup.

Those experiences explain both the appeal and the limits of curation. They don't establish a failure rate. My qualitative review of six public discussion and review pages also found objections to leadership and governance, separately from reports about software behavior. Sentiment toward supporting a project and evidence that it completes a task deserve separate consideration.

## The rest of the laptop counts

My computer covers engineering, research and writing, creative work and ordinary personal use. A development improvement can be valuable while another part of that workload gets worse.

Application names are insufficient evidence here. Blackmagic publishes separate platform tables for Resolve. Its [September 2026 Resolve 21.1 codec document](https://documents.blackmagicdesign.com/SupportNotes/DaVinci_Resolve_21_Supported_Codec_List.pdf) lists Studio conditions for H.264/H.265 in its Rocky Linux/CUDA section and no AAC decoding or encoding. A newer build, a different GPU or a conversion workflow needs its own check with actual media. Getting the editor to launch leaves the round trip untested.

A music workflow that depends on Ableton has another boundary: its [current supported-system requirements](https://help.ableton.com/hc/en-us/articles/115001663530-Live-Minimum-System-Requirements) list Windows and macOS. Local model inference needs a comparison of the actual backend, model, memory capacity and accepted output. And developing a macOS application still entails qualifying the macOS product, even if some development moves elsewhere.

An alternative can be acceptable. Its setup, quality, ongoing effort and any extra machine or service belong in the comparison. So does a hybrid arrangement that keeps the Mac for some tasks and uses Linux for others.

## The experiments that would change my decision

I would run these in order, so each stage answers a question before increasing the cost of the next. They are proposed experiments; I haven't performed them on Omarchy.

| Stage | Comparison | What it can establish |
| --- | --- | --- |
| Observe the baseline | A short record of ordinary work and creative sessions on the current Mac | Which delays, interruptions and missing capabilities actually matter; how much waiting blocks progress. |
| Move execution | Tuned macOS versus Linux on the VM's own filesystem, using a real repository workload and correctness checks | How much Linux helps while retaining the existing desktop and applications. |
| Try the Omarchy workflow | A reversible VM trial with the same agents and representative tasks, plus one documented customization | Whether its defaults, tools and extension path add value beyond Linux execution. |
| Check complete workflows | Copies of real creative projects, the actual local-model task, browser/agent tooling and file handoffs | Which tasks survive, which need alternatives and what those alternatives cost. |
| Qualify the laptop | The exact supported candidate hardware under normal battery, meeting, display, sleep and update use | Whether that complete setup is suitable for daily use. A VM cannot establish these physical behaviors. |

For repeatable commands, I would fix inputs, versions, cache conditions and acceptance checks, then use paired runs with varied order. For less repeatable work, I would compare matched sessions, retain failed tasks and record the learning period separately. A different laptop changes hardware and operating system together; that is a valid purchasing comparison, with a broader explanation than an isolated OS effect.

The ledger needs completed outcomes, time spent attending them, maintenance and recovery. Agent-generated activity is not enough. Neither is a fast first installation.

At each stage, the next option has to earn its additional cost. If Linux execution captures most of the useful gain, a full desktop migration needs another reason. If Omarchy removes recurring friction or enables something I couldn't reasonably do before, that is evidence worth following.

I cannot know a future machine's behavior for sure. I can replace a vague expectation with a tested set of tasks, a record of failures and an understood way back.

My benchmark already gives Linux a place in this decision. What remains is to find out whether Omarchy improves enough of the rest of my computing to earn a larger one.

---

## Sources and terms

Evidence checked November 14, 2026. Source inspection and other users' reports are identified above; no firsthand Omarchy-use result is claimed.

| Term / evidence | Source | What it establishes |
| --- | --- | --- |
| Measured Linux execution | [My worktree investigation](/why-worktree-setup-is-slow-on-macos) | Install times, filesystem/import behavior, correctness checks and conditions for four repositories. |
| Current release | [Omarchy 4.5](https://omarchy.org/news/2026/11/omarchy-4-5/) | Maintainer-documented shipped changes and contribution counts. |
| Changeable desktop | [DHH's April essay](https://world.hey.com/dhh/the-malleable-computer-7c187a9b) | The product argument for agent-assisted modification. |
| Extension contracts | [Pinned shell reference](https://github.com/omacom/omarchy/blob/ac2690cd7be4f47e4a255f5e2e78d904d436b068/docs/omarchy-shell.md) | Plugin, configuration and communication interfaces at the inspected release. |
| Native Mac admission | [Pinned installer model matrix](https://github.com/omacom/omarchy-mac-installer/blob/c07e54c2134a8ec1415e7e2b917589ae1d3d7dc9/scripts/supported-models.json) | Admitted, excluded and untested boards in that source revision. |
| Application compatibility | [Resolve codec table](https://documents.blackmagicdesign.com/SupportNotes/DaVinci_Resolve_21_Supported_Codec_List.pdf), [Ableton requirements](https://help.ableton.com/hc/en-us/articles/115001663530-Live-Minimum-System-Requirements) | Version/platform-specific vendor support, with no Omarchy runtime acceptance. |
