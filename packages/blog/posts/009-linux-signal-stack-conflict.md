---
title: "One bitmask in task_struct: how a 10-line kernel patch resolves 15 years of multi-runtime signal conflicts on Linux"
date: "2026-05-21"
description: "SA_ONSTACK is process-wide. sigaltstack is per-thread. When Go, Bun, .NET, and the JVM share a process, signals land on the wrong stack. One kernel field fixes the class."
section: engineering
tags: [linux-kernel, signals, go, bun, wasm, systems-architecture, posix]
---

# One bitmask in `task_struct`: how a 10-line kernel patch resolves 15 years of multi-runtime signal conflicts on Linux

I spent the last two days debugging why a Bun server on Linux would permanently freeze the moment a Go shared library and a WebAssembly module coexisted in the same process. The strace showed 8,500 SIGPWR signals per second flooding the main thread. The event loop never recovered.

A fix is in progress — Bun's team is patching their WebKit fork to work around it. But the root cause isn't a bug in any one project. It's a kernel feature that doesn't exist yet — one that would take about 10 lines to implement.

## The bug

A server process on Linux loads two things:
1. A Go CGo shared library via `dlopen()` (for authentication)
2. A WebAssembly module (for collaborative editing)

The first WASM function call permanently kills the event loop. `setTimeout` never fires. `fetch` never resolves. Microtasks still work (Promise.resolve is fine), but all macrotasks are dead. The process burns 100% CPU doing nothing useful.

Strace reveals the cause:

```
[pid 555498] tgkill(555498, 555498, SIGPWR) = 0
[pid 555498] tgkill(555498, 555498, SIGPWR) = 0
[pid 555498] tgkill(555498, 555498, SIGPWR) = 0
... (25,678 times in 3 seconds)
```

A compilation helper thread sends SIGPWR to the main thread in an infinite retry loop. The signal handler never acknowledges. The helper never stops.

## Why it happens

Three facts about Linux signal delivery:

1. **`sigaction` flags (including `SA_ONSTACK`) are process-wide.** All threads share one signal disposition per signal.
2. **`sigaltstack` is per-thread.** Each thread can configure its own alternate signal stack.
3. **The kernel delivers on the alt stack if and only if BOTH are true:** `SA_ONSTACK` is set on the handler AND the receiving thread has a `sigaltstack` configured.

Now the sequence:

1. **Bun starts.** Main thread calls `sigaltstack(512KB)` for its crash handler (needs alt stack to report stack overflows). Installs a SIGPWR handler **without** `SA_ONSTACK` — SIGPWR is used for thread suspension and must run on the normal stack for the handler's stack-position check to work.

2. **Go `.so` loaded via `dlopen`.** Go's runtime calls `setsigstack()` on every signal with a non-default handler. This reads the current `sigaction`, ORs in `SA_ONSTACK`, and reinstalls it. It's one line in Go's `runtime/signal_unix.go`:

```go
// Even if we are not installing a signal handler,
// set SA_ONSTACK if necessary.
if fwdSig[i] != _SIG_DFL && fwdSig[i] != _SIG_IGN {
    setsigstack(i)
}
```

3. **Next SIGPWR delivery.** Kernel checks: `SA_ONSTACK`? Yes (Go added it). Thread has `sigaltstack`? Yes (Bun's crash handler). Delivers on the alt stack.

4. **Handler runs on wrong stack.** The handler's stack-position check fails (it's on the alt stack, not the normal stack). It doesn't acknowledge the suspension. The sender retries. Forever.

## This isn't a bug in Go, Bun, or WebKit

Go's behavior is [documented and intentional](https://pkg.go.dev/os/signal#hdr-Non_Go_programs_that_call_Go_code):

> "If there is an existing signal handler, the Go runtime will turn on the SA_ONSTACK flag and otherwise keep the signal handler."

Go **needs** `SA_ONSTACK` because goroutine stacks are 8KB. Without it, a signal arriving on a goroutine thread would overflow. Go configures per-thread `sigaltstack` on its own threads, but the kernel requires `SA_ONSTACK` on the handler too — otherwise the alt stack won't be used.

Bun **needs** `sigaltstack` on its main thread for crash reporting. Without it, a stack overflow followed by SIGSEGV would have no stack to run the crash handler on.

Both are correct. Both are necessary. They're incompatible because POSIX was designed for single-runtime processes — a world where one process meant one runtime with one signal handling policy.

## The same bug, everywhere

Once I understood the mechanism, I found it recurring across the ecosystem:

| Year | Project | Issue | Impact |
|------|---------|-------|--------|
| 2015 | Go | [#13034](https://github.com/golang/go/issues/13034) | Signal forwarding broken with embedders |
| 2016 | Linux kernel | [bugzilla #153531](https://bugzilla.kernel.org/show_bug.cgi?id=153531) | AVX-512 overflows MINSIGSTKSZ → memory corruption (P1, **still open**) |
| 2025 | Go + .NET | [#78883](https://github.com/golang/go/issues/78883) | CoreCLR SIGSEGV when loaded with Go |
| 2026 | Bun + Go | [#31158](https://github.com/oven-sh/bun/issues/31158) | Event loop permanently dead |
| 2026 | Bun + Go + Prisma | [#29843](https://github.com/oven-sh/bun/issues/29843) | Database queries hang |
| — | Valve/Proton | [#6762](https://github.com/ValveSoftware/Proton/issues/6762) | Games crash on Linux |
| — | Duplicati | [#5793](https://github.com/duplicati/duplicati/issues/5793) | .NET + Go backup crashes |
| — | AFLplusplus | [#2545](https://github.com/AFLplusplus/AFLplusplus/issues/2545) | Fuzzer sigaltstack failure |
| — | LLVM | [#48092](https://github.com/llvm/llvm-project/issues/48092) | libFuzzer breaks ASAN stack-overflow detection |

Each team thought it was their bug. Each shipped their own workaround:
- Bun: read the interrupted SP from `ucontext` instead of the handler's own SP ([WebKit #235](https://github.com/oven-sh/WebKit/pull/235))
- .NET: increase alt stack size ([dotnet/runtime#110368](https://github.com/dotnet/runtime/issues/110368))
- LLVM: preserve `SA_ONSTACK` flag in libFuzzer
- Go: "host must use SA_ONSTACK" (documentation, not a fix)
- Valve: unfixed

Nobody stepped back and asked: why does this keep happening?

## The missing kernel primitive

The answer is simple: **`SA_ONSTACK` is process-wide, but `sigaltstack` is per-thread.** There's no per-thread, per-signal way to control alt-stack delivery.

A thread cannot say: "use my alt stack for SIGSEGV (crash handler) but NOT for SIGPWR (thread suspension)." It's all signals or none. `SS_DISABLE` exists but disables the alt stack for everything — you lose crash handling to fix the event loop hang. Nobody accepts that tradeoff.

```
What exists today:

sigaction SA_ONSTACK flag:    PROCESS-WIDE (one setting per signal)
sigaltstack configuration:    PER-THREAD (each thread has its own)
SS_DISABLE:                   PER-THREAD, ALL-OR-NOTHING

What's missing:

Per-signal alt-stack exclusion: PER-THREAD, PER-SIGNAL ← this
```

## The fix: one bitmask, one check

Current kernel code (`arch/x86/kernel/signal.c` — `get_sigframe()`):

```c
unsigned long sp = regs->sp;

if (ka->sa.sa_flags & SA_ONSTACK) {
    if (sas_ss_flags(sp) == 0) {
        sp = current->sas_ss_sp + current->sas_ss_size;
        entering_altstack = true;
    }
}
```

With per-signal exclusion:

```c
unsigned long sp = regs->sp;

if (ka->sa.sa_flags & SA_ONSTACK) {
    if (sas_ss_flags(sp) == 0 && !sigismember(&current->sas_ss_exclude, sig)) {
        sp = current->sas_ss_sp + current->sas_ss_size;
        entering_altstack = true;
    }
}
```

New field in `task_struct` (next to existing `sas_ss_*` fields):

```c
unsigned long       sas_ss_sp;
size_t              sas_ss_size;
unsigned int        sas_ss_flags;
sigset_t            sas_ss_exclude;  // NEW: per-thread, per-signal alt-stack exclusion
```

Userspace API:

```c
prctl(PR_SET_SIGALTSTACK_EXCLUDE, SIGPWR);  // this thread: no alt stack for SIGPWR
```

Default: empty set. Current behavior preserved. Fully backward compatible. No existing program changes behavior.

## The precedent

This exact pattern was accepted into Linux 4.7 (July 2016): [`SS_AUTODISARM`](https://github.com/torvalds/linux/commit/2a74213838104a41588d86fd5e8d344972891ace).

| | SS_AUTODISARM (Linux 4.7) | Per-signal exclusion (proposed) |
|---|---|---|
| Author | Stas Sergeev | — |
| Merged by | Ingo Molnar → Linus | — |
| Problem | Nested signal on alt stack corrupts swapcontext | SA_ONSTACK forces wrong-stack delivery |
| Motivation | dosemu signal handling (niche) | Multi-runtime processes (Go + Bun + .NET + JVM) |
| Implementation | One flag, one check | One bitmask, one check |
| Backward compat | Default off | Default empty |

Linus's merge message:

> "improve the sigaltstack interface by extending its ABI with the SS_AUTODISARM feature"

Our proposal extends the same interface with the same philosophy.

## What changes if this lands

**For Go:** Can stop calling `setsigstack` on signals it doesn't own — or keep doing it. Host threads opt out independently. The [15-year impasse](https://github.com/golang/go/issues/13034) dissolves.

**For Bun/JSC:** One `prctl` call at startup. Delete the ucontext SP workaround.

**For .NET:** Stop increasing alt stack sizes. Exclude GC signals from alt stack on managed threads.

**For the kernel:** [Bug 153531](https://bugzilla.kernel.org/show_bug.cgi?id=153531) (P1, open 9 years — "missing size check in sigaltstack" causing memory corruption) becomes preventable. Threads exclude signals whose frames don't fit their alt stack. No overflow, no detection needed, no crash.

**For Linux as a platform:** macOS uses Mach ports for thread suspension — no signal conflicts possible. Windows uses SEH — per-thread by design. Linux is the only major platform where multi-runtime processes fight over signal delivery stacks. This fix closes that gap.

## Why now

The ecosystem is moving toward more multi-runtime processes, not fewer:

- **WASM** — every WASM module is a separate compilation target in the host process
- **FFI** — `bun:ffi`, Node's `ffi-napi`, Python's `ctypes` all load native `.so` files
- **Polyglot services** — Go sidecars, Rust crypto, C ML inference in one process
- **AI/ML** — Python + C++ + CUDA + Go inference servers
- **Edge computing** — polyglot functions in minimal containers

Every year, more processes are multi-runtime. Every year, more teams independently rediscover the SA_ONSTACK conflict. The kernel feature costs 10 lines. The ecosystem savings are cumulative and permanent.

## How to reproduce

Pure C, no runtime dependencies beyond `gcc` and a Go shared library:

```c
// Full reproduction: https://gist.github.com/gogakoreli/b5e53e045728ec106e8f2ef719dd1cf1
// 1. Host configures sigaltstack + installs SIGPWR handler without SA_ONSTACK
// 2. dlopen(go_library.so) — Go's setsigstack adds SA_ONSTACK
// 3. Signal delivery switches to alt stack — host had no say in this

// strace shows:
// BEFORE: rt_sigaction(SIGPWR, {sa_flags=SA_SIGINFO})
// AFTER:  rt_sigaction(SIGPWR, {sa_flags=SA_ONSTACK|SA_SIGINFO})  ← Go added it
```

The full reproduction with strace output, the SIGPWR storm demo, and the SS_DISABLE workaround proof are in the [Bun investigation gist](https://gist.github.com/gogakoreli/b5e53e045728ec106e8f2ef719dd1cf1).

The complete kernel-level analysis — including Go team quotes, .NET precedent, security implications, SS_AUTODISARM precedent details, kernel `task_struct` implementation proof, and the full list of affected projects — is in the [kernel feature request gist](https://gist.github.com/gogakoreli/46031843e2226a872341607612bd9dda).

## The bottom line

The POSIX signal model was designed for a world of single-runtime processes. That world is gone. One bitmask field in `task_struct`, one conditional check in `get_sigframe()`, one `prctl` — and 15 years of workarounds become unnecessary.

The fix is smaller than most of the workarounds it replaces.

---

*Discussion: [oven-sh/bun#31158](https://github.com/oven-sh/bun/issues/31158) | Bun investigation: [gist](https://gist.github.com/gogakoreli/b5e53e045728ec106e8f2ef719dd1cf1) | Full kernel analysis: [gist](https://gist.github.com/gogakoreli/46031843e2226a872341607612bd9dda) | Reproduction: `kernel-repro.c`*

---

## Glossary

| Term / Claim | Source | Date |
|---|---|---|
| SA_ONSTACK is process-wide, sigaltstack is per-thread | [sigaltstack(2)](https://man7.org/linux/man-pages/man2/sigaltstack.2.html), [signal(7)](https://man7.org/linux/man-pages/man7/signal.7.html) — "If the signal handler was installed with SA_ONSTACK and the thread has defined an alternate signal stack, then that stack is installed" | POSIX / Linux |
| Go adds SA_ONSTACK to all non-default handlers on dlopen | [Go os/signal docs](https://pkg.go.dev/os/signal#hdr-Non_Go_programs_that_call_Go_code) — "the Go runtime will turn on the SA_ONSTACK flag and otherwise keep the signal handler" | Documented since Go 1.5+ |
| Go's `setsigstack` implementation | [runtime/os_linux.go](https://github.com/golang/go/blob/master/src/runtime/os_linux.go) — reads sigaction, ORs SA_ONSTACK, reinstalls | Go runtime source |
| Go team: "not our bug, host must use SA_ONSTACK" | [golang/go#78883](https://github.com/golang/go/issues/78883) — Ian Lance Taylor: "The only real requirement that Go imposes on Unix systems is that any signal handler must be installed with the SA_ONSTACK flag set" | May 2025 |
| .NET team: "reasonable requirement, imposes constraints" | [golang/go#78883](https://github.com/golang/go/issues/78883) — Aaron Robinson (Microsoft): "those requirements then impose constraints on other runtimes that may have a different set of trade offs" | May 2025 |
| Bun overrides SIGUSR1 → SIGPWR for thread suspension | [oven-sh/WebKit commit `ceb3e74`](https://github.com/oven-sh/WebKit/commit/ceb3e7466fa43aae8cf2c75353c59bd821f03d06) — "several npm packages use SIGUSR1... We tell it to use SIGPWR instead" | Feb 2025 |
| Bun fix: use ucontext SP in signal handler | [oven-sh/WebKit#235](https://github.com/oven-sh/WebKit/pull/235) — "read the interrupted SP from the ucontext (kernel-saved register state)" | May 2026 |
| SS_AUTODISARM precedent (Linux 4.7) | [kernel commit `2a742138`](https://github.com/torvalds/linux/commit/2a74213838104a41588d86fd5e8d344972891ace) — Stas Sergeev, merged by Ingo Molnar. Linus: "improve the sigaltstack interface by extending its ABI" | Jul 2016 |
| Kernel bug: MINSIGSTKSZ too small, memory corruption | [bugzilla.kernel.org #153531](https://bugzilla.kernel.org/show_bug.cgi?id=153531) — Florian Weimer (Red Hat): "MINSIGSTKSZ is too small... results in memory corruption." P1, open 9 years. | Aug 2016 |
| Kernel signal delivery code path | [arch/x86/kernel/signal.c](https://github.com/torvalds/linux/blob/master/arch/x86/kernel/signal.c) — `get_sigframe()`: checks SA_ONSTACK + sas_ss_flags to decide alt-stack delivery | Linux kernel source |
| `task_struct` sas_ss fields | [include/linux/sched.h](https://github.com/torvalds/linux/blob/master/include/linux/sched.h) — `sas_ss_sp`, `sas_ss_size`, `sas_ss_flags` (per-thread alt stack state) | Linux kernel source |
| Valve/Proton crash from sigaltstack overflow | [ValveSoftware/Proton#6762](https://github.com/ValveSoftware/Proton/issues/6762) — "winedevice.exe overflowed signalstack" | Open |
| Duplicati .NET+Go sigaltstack crash | [duplicati/duplicati#5793](https://github.com/duplicati/duplicati/issues/5793) — ".NET TP Worker overflowed sigaltstack" on Linux/Docker with Storj (Go) backend | Open |
| LLVM libFuzzer breaks ASAN detection | [llvm-project#48092](https://github.com/llvm/llvm-project/issues/48092) — libFuzzer drops SA_ONSTACK, ASAN can't detect stack overflow | Closed (fixed in libFuzzer) |
| AFLplusplus sigaltstack overflow | [AFLplusplus#2545](https://github.com/AFLplusplus/AFLplusplus/issues/2545) — "afl-fuzz crashes with sigaltstack failure" | Closed |
| Go signal conflicts with embedders (15 years) | [golang/go#13034](https://github.com/golang/go/issues/13034) (2015), [#9896](https://github.com/golang/go/issues/9896) (2015), [#35814](https://github.com/golang/go/issues/35814) (2020) — all closed, no resolution for embedders | 2015–2020 |
| SIGPWR storm: 25,678 signals in 3 seconds | strace output from [oven-sh/bun#31158](https://github.com/oven-sh/bun/issues/31158) — `tgkill(pid, tid, SIGPWR)` in infinite retry loop | May 2026 |
| V8 uses cooperative safepoint polling (no signals) | [v8/src/heap/safepoint.h](https://github.com/v8/v8/blob/main/src/heap/safepoint.h) — relaxed atomic load on per-thread state word; no pthread_kill, no SIGPWR | V8 source |
| macOS uses Mach ports for thread suspension | [WebKit WTF/posix/ThreadingPOSIX.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WTF/wtf/posix/ThreadingPOSIX.cpp) — signal-based suspension is Linux/FreeBSD-only; macOS uses `thread_suspend()` | WebKit source |
| Multi-threaded signal handling (95k views) | [StackOverflow](https://stackoverflow.com/questions/11679568/signal-handling-with-multiple-threads-in-linux) — confirms POSIX: dispositions process-wide, masks per-thread, alt stacks per-thread. The gap: no per-thread SA_ONSTACK override. | Jul 2012 |
