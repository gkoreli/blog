# Reader questions and answer map

Checked 2026-10-27 through the signed-in X browser. Method: read the supplied Peter Steinberger post and Jarred Sumner testing video, then follow the quoted trimming thread, the memory reply, the runtime-code-generation thread and the real-use report. Scroll bounded portions in X's displayed Relevant order. This is a selected qualitative sample, not a complete comment corpus or a measurement of audience prevalence. Ads, unrelated replies and engagement counters are excluded from the analysis. Questions below are paraphrases; the linked posts preserve their wording. Truncated replies were not treated as fully read.

## Memory and deployment

| Reader question | Original | Answer or next evidence |
| --- | --- | --- |
| Does the speedup hold on a long-running server? | [karn](https://x.com/gyankarn/status/2114947516164960491) | Separate startup from warmed throughput. Local server measurements and the maintainer's framework comparisons test this. |
| Why is memory lower before DFG/FTL code exists? | [karn's follow-up](https://x.com/gyankarn/status/2115022381358166098) | Trace bytecode, image mapping, lazy initialization and object representations. The 64-bit-reference control tests one part; do not claim a complete allocation breakdown. |
| Will OpenClaw use it on a small VPS? | [Krrish](https://x.com/KrrishKapoor8/status/2114896503651369174) | Peter [wants it as an option](https://x.com/steipete/status/2114931103287087447); this is intent, not an available released migration. |
| Can cheaper hardware run it? | [司徒K](https://x.com/situking/status/2114883440344773011) | Peter [says OpenClaw already runs on a Pi](https://x.com/steipete/status/2114931309911126253). Lower process memory can improve capacity, but no hardware capacity test was run here. |
| Will the memory drop apply to a NestJS service? | [Jatin](https://x.com/jatinsj710/status/2114938323571749188) | A different application needs its own measurement; do not transfer Peter's ratio. |
| Does it make the agent loop or model inference faster? | [Asmir](https://x.com/asmirkn/status/2114880620132548723) | Peter [distinguishes gateway gains from inference](https://x.com/steipete/status/2114881876322312359). The compiler does not speed a remote model's generation. |
| Does cold start improve too? | [Hansel](https://x.com/hansel_hansl/status/2114891672391938420) | Peter [reports a further cold-start gain](https://x.com/steipete/status/2114931186560823551). Local startup measurements must have explicit endpoints. |
| Is this in stable Bun 1.4.4? | [Sonny](https://x.com/sonnylazuardi/status/2114928583647093244) | Peter [used his own fork](https://x.com/steipete/status/2114933452357452194). Check PR/release status; our binary is an official CI preview. |
| Is switching drop-in? | [Denis](https://x.com/deni0107/status/2114884896845877255) | Peter [identifies hot-reloadable plugins as unfinished work](https://x.com/steipete/status/2114885726701785500). Local validation also shows intentionally locked built-ins. |
| What about native dependencies? | [Khakha](https://x.com/khakha_x/status/2114955530284499405) | The pinned compatibility document describes N-API embedding and disk loading; no broad native-addon reproduction was run. |
| Is memory or binary size the important number? | [Mohammad](https://x.com/mohammadvazin/status/2114882652528410628) | Distinguish file bytes, RSS and physical/private memory. None is a substitute for a measured worker-capacity test. |

## Dynamic behavior, libraries and trimming

| Reader question | Original | Answer or next evidence |
| --- | --- | --- |
| What breaks with eval-heavy or dynamically imported dependencies? | [Willy](https://x.com/willyxfuture/status/2114885489555825080) | Generated code is interpreted. Computed imports with discoverable file prefixes and disk-plugin opt-in need different tests. |
| Are validators involved? | [Mert](https://x.com/mecaltin/status/2114973220981915794) | Local Zod 4.3.6 measurements demonstrate the runtime-code-generation tradeoff. |
| Can we compare runtime-generated and static validators? | [João](https://x.com/pantos99/status/2114035639893287335) | The local experiment compares Zod's default generator with its jitless option; jitless is not a build-time-generated validator. Keep that distinction. |
| Could macros generate functions at build time? | [Devon](https://x.com/devongovett/status/2114024794836656550) | A concrete proposed library integration; not a reproduced Bun feature in this article. |
| Could libraries detect a portable no-eval mode? | [Colin](https://x.com/colinhacks/status/2114380217515216985) | A proposal. The reply was truncated in the initial view; do not quote its unseen ending. |
| Does Elysia's own AOT switch remove all generated code? | [Davron](https://x.com/YulDavr/status/2114013110717632767) | A detailed field report about transitive TypeBox/cleaner generation. Not independently audited here; do not turn it into a universal finding. |
| Is an AOT-detection flag a build-time constant? | [Farseen](https://x.com/farseen/status/2113982988665123290), [Rohan](https://x.com/proxy_vector/status/2113947976192450680) | Requires code inspection for the exact flag and revision. The initial announcement describes a proposed flag. |
| Can the compiler warn about runtime code generation? | [Jatin](https://x.com/jatingargiitk/status/2113932413646807213) | Check current warning paths and the actual build report; warnings for dynamic imports are reproduced. |
| Does trim have gotchas? | [Sam](https://x.com/sam_commonly/status/2114894823715193105) | Test optional feature paths, not just the default request. Read `docs/compiler/size.mdx`. |
| Can trimming work without AOT? | [Gerben](https://x.com/Rampaart/status/2114836502744084850) | Jarred [says yes](https://x.com/jarredsumner/status/2114836705715134672); test four combinations to separate the flags. |
| Why is trimming opt-in? | [Ankkala](https://x.com/ankkala/status/2114996985308836124), [John](https://x.com/jadengis/status/2115087970114130007) | The runtime has native API reachability that an ordinary linker's roots do not express. Explain static analysis and late/dynamic feature requirements rather than claim every unused symbol is already removed. |
| How does trim handle dynamic imports? | [Jatin](https://x.com/jatingargiitk/status/2114842021840179470) | Inspect feature retention and test built-in access reached dynamically; no blanket safe-trimming promise. |
| Are trimmed builds byte-identical? | [NeuralAlpha](https://x.com/NeuralAlphaAI/status/2114874010521743418) | Test repeated identical builds if retained in the article. Not established by a file-size comparison. |
| Why is even the small executable tens of MB? | [Jarred's explanation](https://x.com/jarredsumner/status/2114835397528420493) | The runtime and collector remain. A native executable does not imply no runtime. |
| How is React SSR affected? | [Tommy](https://x.com/__morse/status/2114848647200559222) | Jarred [reports better-than-JIT behavior with additional types](https://x.com/jarredsumner/status/2114899981408854113). Not reproduced; omit a general SSR verdict. |

## What the real-use memory report counts

[Jarred's four-hour Claude Code report](https://x.com/jarredsumner/status/2113933905300742383) gives a process memory observation without a matched JIT session. [Dario asks whether subagents have separate processes](https://x.com/DarioGieselaar/status/2113945447936983277); [Jarred answers that they share the process](https://x.com/jarredsumner/status/2113958666747654562). [Daniel asks whether the shells are included](https://x.com/daniiie7/status/2113941923513700620). No answer to that last question was observed. Do not describe the number as a measured total for the entire process tree.

## Editorial priorities

The article should answer memory accounting, startup versus warm performance, library-generated code, and migration readiness in the body. Keep the wider question map here so five-minute scope does not require deleting useful evidence. Do not claim that repeated questions in this ranked sample establish representative demand, or that a question is false merely because its premise needs qualification.
