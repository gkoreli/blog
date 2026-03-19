---
title: "OSS Radar #01: Vercel's Winter 2026 Cohort"
date: 2026-03-19
description: "A new series: I find a source, go through it, distill what's worth your time, and tell you what I actually think. First up — Vercel's Open Source Program Winter 2026 cohort."
tags: [oss-radar, open-source, vercel, research, distillation]
series: oss-radar
---

# OSS Radar #01: Vercel's Winter 2026 Cohort

I read a lot. Engineering blogs, release announcements, cohort spotlights, community threads. Most of it I process privately and it never goes anywhere. This series is me changing that.

**OSS Radar** is about going through a source — a cohort, a list, a newsletter, an announcement — and distilling it into something useful. Not a summary. Not a repost. My actual take on what matters, what's surprising, and what I'd explore further.

The format: one source per issue. I read it, I extract the signal, I share my thinking.

---

## The Source

[Vercel's Open Source Program: Winter 2026 Cohort](https://vercel.com/blog/vercel-open-source-program-winter-2026-cohort) — by Alli Pope, published March 17, 2026.

Vercel runs a program that gives selected open source projects **$3,600 in platform credits** over 12 months, plus an OSS starter pack with third-party credits. The program runs seasonally — spring, summer, fall, winter. Each cohort is a signal: what kind of projects are gaining traction? What problems are developers building around right now?

Winter 2026 had **32 projects**. That's more than I expected — and the range is wider than any previous cohort. UI libraries, AI infrastructure, biomedical research, infrastructure tooling, a Japanese learning platform, a virtual pet. Let me walk through everything worth knowing.

---

## The Projects

### [Answer Overflow](https://www.answeroverflow.com/) — Rhys Sullivan

Makes content from public Discord servers **searchable by search engines and AI agents**. 300+ communities use it. 1.5 million monthly active users. GitHub: [AnswerOverflow/AnswerOverflow](https://github.com/AnswerOverflow/AnswerOverflow)

- **Solves:** Discord's walled-garden problem — Q&A generated in communities vanishes from the open web
- **For:** OSS maintainers, developer community managers, anyone running a public Discord help channel
- **Why care:** Discord has more active developer Q&A than Stack Overflow today. All of it is invisible to search engines and AI agents. Every unanswered Google search for a Cloudflare Workers edge case is a community knowledge failure.
- **Why now:** MCP (Model Context Protocol) makes community knowledge queryable by AI agents — this is no longer just SEO
- **Controversial question:** If AI agents can query your Discord directly via MCP, does Answer Overflow's web indexing layer become obsolete before it reaches critical mass — or is the SEO surface still necessary for discoverability by humans?

This is the one I'd actually use. Discord has become the de-facto home for developer communities — Nuxt, C#, Cloudflare, Valorant all run their communities there. But it's a black hole for search engines. All that knowledge — support threads, architectural decisions, workarounds, release discussions — completely invisible.

The AI angle is increasingly important. As more workflows involve agents indexing and querying the web, making your community's knowledge accessible isn't just SEO — it's becoming infrastructure. Answer Overflow is quietly positioning for that shift.

**Under the hood:** The stack is unusually thoughtful — [Effect](https://effect.website/) (typed functional error handling), [Convex](https://www.convex.dev/) (reactive serverless database), Next.js 16, Bun. ~1,800 GitHub stars. The bot tracks Discord's native ✅ solution reactions to surface canonical answers. The repository has dedicated `packages/ai/` and `packages/agent/` directories — AI is already in the architecture, not on the roadmap.

They've built explicit support for [MCP](https://modelcontextprotocol.io/) — Anthropic's open protocol for connecting AI agents to external data sources, adopted by OpenAI in March 2025. If community knowledge is MCP-accessible, a coding agent working on a Nuxt or Cloudflare project can pull relevant Discord Q&A directly into its context window. That's a meaningfully different infrastructure value proposition than "better SEO."

---

### [UI TripleD](https://ui.tripled.work/) — Moumen Soliman

UI blocks, components, and full pages in **shadcn/ui and Base UI**, powered by **Framer Motion**. Includes a Landing Builder, Background Builder, and Grid Generator. ~803 GitHub stars. GitHub: [moumen-soliman/uitripled](https://github.com/moumen-soliman/uitripled)

- **Solves:** The gap between "shadcn gives me primitives" and "I need a full animated landing page without custom-wiring everything"
- **For:** developers who want a higher level of abstraction above shadcn/ui without leaving the ecosystem
- **Why care:** It's not just a component library — the **Landing Builder**, **Background Builder** (shader-powered Aurora effects), and **Grid Generator** are interactive visual tools that produce code. That's a different product category.
- **Why now:** Motion hit 33.8M weekly downloads — animation is standard UX now, and teams need tooling at that level of abstraction
- **Controversial question:** With v0, Bolt, and Lovable all generating landing pages from shadcn, does a human-curated block library have staying power — or is UI TripleD building for a moment that AI code generators are about to absorb?

The shadcn/ui ecosystem keeps spawning satellites. This is one of many. The interesting part is Framer Motion as a first-class citizen — animation built in, not bolted on. Most component libraries treat motion as a bonus. This one makes it the pitch. Built on Next.js 16, React 19, and a Turborepo monorepo — the infrastructure is serious even if the project is young.

---

### [hot-updater](https://hot-updater.dev/) — Kang Sungyu

An open source **Over-The-Air update** solution for React Native, built as a modern alternative to **CodePush**. Designed to avoid vendor lock-in and work across infrastructure providers. ~1,400 GitHub stars, 96 releases. GitHub: [gronxb/hot-updater](https://github.com/gronxb/hot-updater)

- **Solves:** The CodePush-shaped hole — CodePush was officially shut down March 31, 2025
- **For:** any React Native team that previously relied on CodePush for instant JS bundle updates
- **Why care:** Every RN app with CodePush integration needed a migration path by April 2025. This is the only self-hostable, infrastructure-agnostic answer that also supports RN's new architecture.
- **Why now:** There was no viable self-hostable open alternative until this
- **Controversial question:** Is self-hosted OTA actually safer than a vendor-managed solution — or does it just move the operational risk from Microsoft to your own team, who may not be equipped to maintain update infrastructure?

CodePush has been a mess — Microsoft deprecated it, Expo absorbed parts of it, the ecosystem fragmented. An infrastructure-agnostic open source alternative is genuinely needed. The "avoid vendor lock-in" framing is doing real work here.

**The context that makes this necessary:** CodePush was officially retired on **March 31, 2025** — not deprecated, shut down. hot-updater fills that void with a plugin system for storage backends: AWS S3, Cloudflare R2, or Supabase. A web console handles update management. First-class support for React Native's new architecture (Fabric, TurboModules, RN 0.76+), which CodePush never properly supported. The TypeScript/Kotlin/Swift split (79%/9%/7%) reflects a genuine cross-platform implementation. Vercel is a first-class deployment target.

---

### [Screenshot Studio](https://www.screenshot-studio.com/) — Kartik Labhshetwar

An open source, **fully in-browser canvas editor** for creating high-quality screenshots and visual designs. No installs, no signups, no watermarks. GitHub: [KartikLabhshetwar/screenshot-studio](https://github.com/KartikLabhshetwar/screenshot-studio)

- **Solves:** Paying for Screely or Screen Studio to add a browser frame and gradient background to a screenshot
- **For:** developers making product screenshots, App Store / Play Store assets, marketing content
- **Why practical:** The no-backend constraint is the feature — your unreleased product UI never leaves your machine

This is a direct open source alternative to tools like Screely or Screen Studio. The "fully in-browser" constraint means no data leaving your machine — a real differentiator for anyone creating marketing screenshots that might contain unreleased product details. The App Store / Google Play template angle gives it a focused use case beyond "make it look nice."

---

### [takumi](https://takumi.kane.tw/) — Kane Wang

A **`next/og` alternative** with more advanced features. Growing adoption across companies and open source projects. ~1,500 GitHub stars. GitHub: [kane50613/takumi](https://github.com/kane50613/takumi)

- **Solves:** Satori's font limitations, SVG pipeline overhead, lack of multi-format output
- **For:** anyone generating OG images, social cards, certificates, or thumbnails at scale — especially outside Next.js
- **Why care:** Satori is Vercel-maintained and will always be optimized for Vercel's use case. takumi is built for the broader problem — any JSX-to-image pipeline, any runtime, any font. It's the tool Vercel's own engineers would build if they weren't Vercel.
- **Our take:** Building an image renderer in Rust is a serious architectural bet. The skip-the-SVG-step design isn't just faster — it eliminates an entire class of SVG-to-raster edge cases that plague satori users. This is what a real alternative looks like.
- **Controversial question:** If Vercel ships an updated satori with WOFF2 and WASM support, does takumi have any reason to exist — or is Vercel's track record on maintaining non-core OSS reason enough to prefer the independent alternative?

`next/og` is great until you hit its limits — and you hit them faster than you'd expect. Image generation from JSX has more use cases than Vercel originally anticipated: OG images, social cards, receipts, certificates, dynamic thumbnails. takumi leans into those use cases.

**Why it's technically distinct:** Most JSX-to-image pipelines go JSX → SVG (via Satori) → PNG (via resvg). takumi skips the SVG intermediate entirely, rendering directly to raster through a **Rust engine** (83.7% of the codebase is Rust). The font situation alone justifies the rewrite — Satori doesn't support WOFF2 or variable fonts. takumi supports WOFF2, variable fonts, COLR fonts, and RTL text. Output formats: WebP, PNG, JPEG, GIF, and raw frames for FFmpeg pipelines. The same pipeline runs on Node.js (native Rust), browsers, and edge workers (WASM) with no runtime-specific config.

---

### [APIs.guru](https://apis.guru/) — Ivan Goncharov

A **directory and tooling hub for OpenAPI definitions** of public APIs. ~4,400 GitHub stars, 663 forks. GitHub: [APIs-guru/openapi-directory](https://github.com/APIs-guru/openapi-directory)

- **Solves:** The fragmentation problem for machine-readable API specs — a canonical source across thousands of public APIs
- **For:** SDK generators, documentation platforms, and increasingly AI agents that need to call external APIs
- **Why care:** Every agentic framework that does tool-use needs to know how to call external APIs. This is the largest curated, validated, auto-updated collection of exactly that. It's boring infrastructure that becomes critical the moment agents need to do anything real-world.
- **Our take:** The OpenAPI Directory is one of the few projects in this cohort that was already valuable before the AI wave and becomes dramatically more valuable because of it. That's the rarest kind of positioning — not retrofitted, genuinely load-bearing.
- **Why now:** The OpenAPI Initiative's Moonwalk SIG explicitly named LLM clients as a new class of API consumer in February 2026
- **Controversial question:** Will LLMs deprecate hand-curated API directories by auto-generating specs from documentation — making APIs.guru irrelevant exactly when it becomes most needed?

This is the one that surprised me most. An OpenAPI directory sounds unglamorous — until you realize that LLM agents need structured, machine-readable API definitions to operate. The project started as a developer reference tool and is quietly becoming **infrastructure for agentic systems**.

**The agentic angle has formal backing.** The OpenAPI Initiative's Moonwalk SIG published in its [February 2026 newsletter](https://www.openapis.org/blog/2026/02/10/openapi-initiative-newsletter-february-2026) that LLM clients are now an explicitly recognized new class of API consumer. Microsoft's Agent Framework is "OpenAPI-first": import any REST API as an agent-callable tool instantly, no custom wrapper. APIs.guru auto-updates weekly from original sources, validates every spec, converts non-OpenAPI formats to 3.x. Integrations: Microsoft Kiota (client gen), Speakeasy (SDK gen), ReDoc, HTTP Toolkit, Pipedream. The developer tooling story is established. The agentic layer is being built on top of it.

---

### [YourDigitalRights.org](https://yourdigitalrights.org/) — Yoav Aviram

A free, open source platform that **automates data deletion requests** to organizations. Built by [Conscious Digital](https://www.consciousdigital.org/), a nonprofit. ~121 stars. GitHub: [your-digital-rights/yourdigitalrights.org](https://github.com/your-digital-rights/yourdigitalrights.org)

- **Solves:** GDPR/CCPA rights being practically unusable — the manual process of emailing 50+ companies is a design failure
- **For:** anyone with an online presence who wants to exercise their legal right to erasure
- **Why care:** 400,000 requests submitted with 121 GitHub stars. The users aren't developers — they're civilians. That's exactly what public-interest tech should look like.
- **Our take:** This is the most underrated project in the cohort. The gap between star count (121) and real-world impact (400k requests, cited in regulatory coverage) is a signal that the project is doing something genuinely useful outside the developer bubble.
- **Why practical:** 400,000 requests submitted. 25+ data protection laws covered. DataBrokersWatch.org tracks 1,075 brokers. Free vs. DeleteMe's $129/year.
- **Controversial question:** Does automating deletion requests actually work — or do data brokers treat automated emails as checkbox compliance while changing nothing about how they collect and resell your data?

GDPR gave people rights they didn't know how to exercise. This is the tooling that makes those rights actually usable.

**The star count (121) dramatically undersells the impact.** Over **400,000 deletion requests submitted** to date. Coverage across 25+ data protection laws spanning 4+ billion people. No personal data collected, no ads. Sends legally formatted erasure request emails directly to organizations, tracks follow-up, escalates to regulators. **The regulatory tailwinds are active:** California's DELETE Act platform (DROP) went live January 1, 2026 and processed 242,000 deletion requests in its first two months. This gets more relevant quarterly, not less.

---

### [KDE Connect](https://kdeconnect.kde.org/) — contributor: Shakil Ahmed Faisal

Connects Android devices with desktops for **file sharing, notification syncing, and remote control**. One of the most downloaded KDE applications. GitHub: [KDE/kdeconnect-kde](https://github.com/KDE/kdeconnect-kde)

- **Solves:** Android-desktop integration gap — Apple has Handoff, Windows has Phone Link, Linux has had KDE Connect since 2013
- **For:** Linux desktop users primarily; Windows and macOS ports exist
- **Why care:** It's the only fully open, cross-platform Android bridge that has serious long-term maintenance behind it. Every other alternative is either vendor-controlled or a one-person project.
- **Our take:** The most establishment-validated project in the cohort. KDE Connect has more production usage than everything else here combined. Its inclusion is the program saying: "we're not just for early-stage projects." That changes who should apply.
- **Controversial question:** Does including a 13-year-old project with millions of users dilute the signal for genuinely early-stage projects in the cohort — or does it legitimize the program?

This problem shouldn't exist in 2026 but absolutely does. Apple has Handoff. The open source Android-desktop space is fragmented. KDE Connect is the most mature open solution.

KDE Connect is the most established project in this cohort by a significant margin — it's been around since 2013, has been downloaded millions of times, and is pre-installed in KDE Plasma. Its presence here isn't about needing the $3,600 in credits. It signals the program is also about **community recognition and visibility**, not just early-stage financial support. Worth noting if you're applying to the program — established projects are welcome.

---

### [heroicons-animated](https://www.heroicons-animated.com/) — Aniket Pawar

**Hundreds of animated Heroicons** for React, Vue, and Svelte. Free, open source, drop-in. GitHub: [heroicons-animated/heroicons-animated](https://github.com/heroicons-animated/heroicons-animated)

- **Solves:** Static icons feeling dated in a UI where everything else has motion
- **For:** any project already using Heroicons (Tailwind ecosystem) that wants animation without a rebuild
- **Why practical:** Zero new API to learn — same icon names, same import patterns, just with motion added

Heroicons is already widely used across the Tailwind ecosystem. Animated variants are a clear value-add for anyone who already has Heroicons in their design system. Low friction to adopt. The multi-framework support (React, Vue, Svelte) is the right call.

---

### [Neobrutal UI](https://www.neobrutalui.live/) — Bridget Amana

A **neobrutalist UI component library** — bold, expressive design as an alternative to the minimalism-heavy landscape. GitHub: [Bridgetamana/neobrutal-ui](https://github.com/Bridgetamana/neobrutal-ui)

- **Solves:** Component library monoculture — everything looks like a shadcn clone with gray borders
- **For:** products that want a strong visual identity, not a generic SaaS aesthetic
- **Honest take:** Neobrutalism is a strong aesthetic swing. It will be right for some products and wrong for most. The bet is that the market for "not another minimal UI" is real.

The pendulum swings. The ecosystem went flat, minimal, and gray. Neobrutalism is the counter-reaction — strong borders, bold colors, raw contrast. Whether it's a lasting design direction or a trend that burns out, there's clearly appetite for components that don't look like every other shadcn clone.

---

### [Cossistant](https://cossistant.com) — Anthony Riera

An open source, **fully customizable support system** — the "shadcn of support." Open components, open source, designed to look and feel like your product. GitHub: [cossistantcom/cossistant](https://github.com/cossistantcom/cossistant)

- **Solves:** Support tooling lock-in — Intercom, Zendesk, and Freshdesk all charge enterprise prices for what is fundamentally a widget
- **For:** product teams who want support that looks native to their product, not a third-party overlay
- **Why practical:** The shadcn model works — copy-paste components you own, styled to match your design system

The shadcn model applied to a new domain: instead of a managed service, you own the components. Support tooling is one of those spaces that everyone needs but nobody wants to pay SaaS prices for if they can avoid it.

The framing predicts the architecture: Next.js, TypeScript, composable components you copy into your codebase and style to match your design system. The question isn't whether the model works — it does. It's whether execution matches the pitch.

---

### [Wigggle UI](https://wigggle-ui.vercel.app/) — Henil Shah

A library of simple, well-designed **OS-style widgets for web apps** — built on modern standards and shadcn/ui foundations. GitHub: [wigggle-ui/ui](https://github.com/wigggle-ui/ui)

- **Solves:** Web apps that feel like generic SaaS dashboards — Wigggle brings the ambient, native-feeling widget pattern to the browser
- **For:** dashboard builders, productivity apps, anything that wants to feel more like an OS than a website

Bringing the widget pattern (think iOS home screen, macOS dashboard) into web applications. Taps into a real aesthetic trend — dashboards that feel more native, more ambient, less "corporate SaaS." A smaller project, but the direction is right.

---

### [VengenceUI](https://www.vengenceui.com/) — Ashutosh Singh

A UI system focused on **composable components, performance-first patterns, and real-world workflows**. GitHub: [Ashutoshx7/VengeanceUI](https://github.com/Ashutoshx7/VengeanceUI)

- **Solves:** Component libraries that are beautiful but slow — VengenceUI leads with performance
- **For:** production apps where bundle size and render time matter
- **Honest take:** "Performance-first composable components" is the right positioning in a crowded market, but it's a claim that needs benchmarks to be believed

Performance-first is the right bet. The component library space is crowded with beautiful-but-heavy libraries. A composable, lean alternative has clear positioning — but it needs to prove the performance story with numbers, not just words.

---

### [GoDoxy](https://docs.godoxy.dev/) — Yu Sing Wong

A **high-performance reverse proxy and container orchestrator for self-hosters**. GitHub: [yusing/godoxy](https://github.com/yusing/godoxy)

- **Solves:** The complexity of running multiple services behind a reverse proxy — routing, HTTPS, container management
- **For:** self-hosters, homelab operators, teams migrating off managed hosting
- **Why care:** The math changes fast. At ~$50/month in cloud hosting, self-hosting pays off within a year for many teams. GoDoxy removes the sysadmin barrier that kept most teams from making that switch.
- **Our take:** I initially pegged Dokploy (31.8k stars) as the reverse proxy cohort member. The actual project is GoDoxy — a smaller, earlier project where the OSS support genuinely matters. That's a better program decision. Dokploy doesn't need the visibility.
- **Why now:** Self-hosting is growing rapidly as cloud costs compound and tooling matures
- **Controversial question:** Is self-hosting genuinely simpler to maintain than paying for managed hosting, or does GoDoxy solve the setup problem while leaving the ongoing ops burden (updates, backups, incidents) entirely on you?

Self-hosting is having a genuine moment. The combination of privacy concerns, cloud cost sensitivity, and better tooling is bringing a wave of developers back to running their own infrastructure. GoDoxy makes that accessible without sysadmin depth.

**On the self-hosting tailwind:** 37signals (Basecamp, HEY) exited AWS and documented savings [well over $10 million over five years](https://world.hey.com/dhh/our-cloud-exit-savings-will-now-top-ten-million-over-five-years-c7d9b5bd) — their 2022 AWS bill was $3.2M/year, dropped to $1.3M after moving compute on-prem with ~$700,000 in Dell servers. GoDoxy is the tooling that makes this calculation accessible to teams without 37signals' engineering depth.

*Note: I initially identified this as Dokploy (31.8k stars), but Dokploy is too established to need the program. GoDoxy is the actual cohort member — a smaller, newer project where the OSS support has real impact.*

---

### [Moving Icons](https://movingicons.dev) — Jakob Isermann

An animated icon library built **natively for Svelte 5** using runes. GitHub: [jis3r/icons](https://github.com/jis3r/icons)

- **Solves:** The lack of motion-native icon libraries for the Svelte 5 ecosystem
- **For:** Svelte 5 developers who want animation without porting React-first libraries
- **Why practical:** Svelte 5 shipped runes — a fundamentally different reactivity model. Native means correct, not hacked-to-fit.

Svelte 5 landed with a fundamentally different reactivity model. The ecosystem is still catching up. An animated icon library built for Svelte 5 specifically — not a port, native — is exactly the foundational tooling a maturing ecosystem needs to pull developers in.

---

### [Ersilia](https://www.ersilia.io/) — Miquel Duran-Frigola

A large repository of **AI/ML models for antibiotic drug discovery**, run by a nonprofit focused on biomedical research in the Global South. ~291 GitHub stars, 2,939 commits. GitHub: [ersilia-os/ersilia](https://github.com/ersilia-os/ersilia)

- **Solves:** The equity gap in pharmaceutical R&D — the Global South bears the highest infectious disease burden but has almost no access to AI-driven drug discovery tooling
- **For:** researchers in resource-limited settings who lack data science expertise or expensive compute
- **Why care:** Big Pharma's AI drug discovery tools cost millions in compute and expertise. Ersilia gives a researcher in Lagos or Nairobi the same antibiotic screening models that a well-funded lab in Boston uses. That gap is real and Ersilia is actually closing it.
- **Our take:** The most important problem in the entire cohort. Star count (291) is the least relevant metric here — the measure is publications in Nature, partnerships with African research institutions, and drugs that get discovered. A Vercel subdomain that makes research artifacts accessible is exactly the kind of boring infrastructure that enables this work.
- **Why practical:** Published in Nature Communications, Science, ACS journals. First partner: H3D at University of Cape Town — Africa's leading drug discovery center. Mozilla, Schmidt Sciences AI2050, Fast Forward funded.
- **Controversial question:** Is "open science for the Global South" sustainable as an NGO model, or does Ersilia need to be absorbed by a WHO or Gates Foundation program to have lasting institutional backing beyond grant cycles?

The wildcard. Every other project in this cohort is developer tooling. This one is biomedical research.

**The star count is not the metric.** 291 stars, but peer-reviewed findings in Nature/Science/ACS. The hub covers antibiotic activity prediction, ADMET, molecular representation, and generative chemistry — all the major steps in early-stage drug discovery. Mission: "open science, decolonized research, egalitarian access to knowledge." This directly addresses a real gap: the Global South bears the highest burden of infectious disease and has historically had almost no access to AI-driven drug discovery.

I respect the inclusion. The open source program shouldn't be exclusively UI libraries and dev tools. This one earns its place.

---

### The AI-Native Cluster

Several projects in this cohort aren't just tools that *use* AI — they're built AI-first:

**[InsForge](https://insforge.dev/) — Tony Chang** ([InsForge/insforge](https://github.com/InsForge/insforge))
AI-agent-first backend platform — production-ready backends in minutes, designed for agent workflows via MCP. The bet: if agents are going to build and manage backend infrastructure, the tooling should be designed around that workflow from the start, not retrofitted. MCP-native from day one.
- **Our take:** The most architecturally forward project in this cluster. "Agent-first" isn't a feature — it means the entire API surface is designed to be called by agents, not humans. If that's where software development goes, InsForge is three years early and in the right position.
- **Controversial question:** Is "agent-first backend" premature tooling for a workflow that hasn't standardized yet — or is building for that world now the only way to not be caught flat-footed when it does?

**[browser-ai](https://browser-ai.dev) — Jakob Mørk** ([jakobhoeg/browser-ai](https://github.com/jakobhoeg/browser-ai))
TypeScript SDK for in-browser AI model providers — simplifies client-side AI integration across vendors. In-browser AI inference is just becoming feasible (WebGPU, WASM-compiled models). A vendor-agnostic SDK is the right abstraction bet.
- **Our take:** WebGPU is shipping across browsers. Phi-3, Gemma, and Qwen run in-browser today. This is early-stage infrastructure for a world that's arriving fast. The vendor-agnostic angle is the right call — whoever locks in on a single in-browser inference provider will regret it.
- **Controversial question:** Will cloud inference always win on model quality, making in-browser AI permanently a second-class citizen — or does privacy + latency make client-side inference the dominant architecture for a specific class of applications?

**[Assertify](https://assertify.io/) — Shirley Ugwa** ([ShirleyRex/assertify.io](https://github.com/ShirleyRex/assertify.io))
AI-powered test generation — produces framework-specific, production-ready tests. The "production-ready" framing is the real claim. Most AI test generators produce syntactically valid but semantically useless tests.
- **Our take:** Test generation is the AI coding task most likely to have real ROI. Writing tests is mechanical, tedious, and universally skipped. If Assertify actually generates tests that catch real bugs (not just pass), it's one of the most practically valuable projects here.
- **Controversial question:** Does AI-generated test suites create a false sense of coverage — passing tests that don't actually test the right behavior, making the codebase harder to trust, not easier?

**[GitFriend](https://gitfriend.xyz) — Krishna Kant Maharshi** ([krishn404/Git-Friend](https://github.com/krishn404/Git-Friend))
AI developer assistant for repository chat and automated README generation.
- **Our take:** Useful as a daily driver, but the commoditization risk is real — GitHub Copilot, Cursor, and Claude all do parts of this. The README generation angle is the most defensible piece.
- **Controversial question:** With every major IDE shipping repository-aware AI, does a standalone repo chat tool have a viable market or is it already absorbed?

**[Pett.ai](https://app.pett.ai/) — Joaquim Cavalheiro** ([PettBro GitHub](https://github.com/PettBro))
AI companion app — care for and build relationships with virtual pets. Evolved from a simple bot to an engaged global community.
- **Our take:** I don't have a clean analytical frame for this. But AI companion apps are one of the fastest-growing product categories in consumer AI, and an open source alternative to closed commercial companions (Character.ai, etc.) matters for the same reason open source LLMs matter.
- **Controversial question:** Is emotional AI companionship (even in the form of virtual pets) a legitimate product category that addresses real human needs — or a dependency trap dressed up as entertainment?

---

### The Infrastructure Escape Cluster

Three projects solving the "stop paying for managed tools" problem:

**[OutRay](https://outray.dev) — Akinkunmi Oyewole** ([outray-tunnel/outray](https://github.com/outray-tunnel/outray))
Cost-effective Ngrok alternative with transparent ownership. Ngrok is useful but expensive at scale. An open, self-hostable tunnel tool is the infrastructure-escape play for anyone running webhooks, local dev sharing, or self-hosted services.
- **Our take:** The tunnel space has been underserved since Ngrok became expensive. Cloudflare Tunnels are free but require a Cloudflare account. OutRay bets on ownership and cost transparency. The risk: tunnel infrastructure requires uptime — this is one of the few categories where "self-hosted" means "you're on-call for your own tunnel going down."
- **Controversial question:** Can a community-maintained tunnel service match Ngrok's reliability when uptime is the entire product? The OSS tunnel graveyard is real — how many abandoned alternatives exist?

**[GoDoxy](https://docs.godoxy.dev/)** — covered above in depth.

**[hot-updater](https://hot-updater.dev/)** — covered above. CodePush is dead; this fills the void.

---

### The Developer Tooling Cluster

**[data-peek](https://datapeek.dev/) — Rohith Gilla** ([Rohithgilla12/data-peek](https://github.com/Rohithgilla12/data-peek))
Lightweight database exploration and SQL without traditional client overhead. Popular in education. TablePlus and Postico are polished but paid; data-peek is the open, lightweight alternative. Database clients are an underrated category — developers touch them daily.

**[mapcn](https://mapcn.dev/) — Anmoldeep Singh** ([AnmolSaini16/mapcn](https://github.com/AnmolSaini16/mapcn))
Copy-paste-friendly map components for modern web apps — clean, composable, shadcn-style. Map integration is a recurring pain point. Google Maps is expensive. Leaflet is dated. A shadcn-style copy-paste approach to map components is exactly right for the current ecosystem.

**[Domainstack](https://domainstack.io) — Jake Jarvis** ([jakejarvis/domainstack.io](https://github.com/jakejarvis/domainstack.io))
Domain monitoring and reporting — replaces spreadsheets for portfolio tracking. Small, focused, genuinely useful for anyone managing more than 5 domains. The "spreadsheet replacement" niche is reliable — it's a real pain that doesn't need a big team to solve.

---

### The Unexpected Projects

**[KanaDojo](https://kanadojo.com) — Aldi Dauletuly** ([lingdojo/kana-dojo](https://github.com/lingdojo/kana-dojo))
Free, community-built Japanese learning platform inspired by open source typing tools. A language learning app in a developer OSS program. Like Ersilia, its presence signals the program's scope is broader than dev tools. Free, open, community-built language learning is a real need — Duolingo is gamified to the point of being ineffective for serious learners.
- **Our take:** Duolingo optimizes for retention and DAUs, not language acquisition. The open source alternative serves a different learner entirely — the one who wants to actually read manga, not just maintain a streak. That's a real audience.
- **Controversial question:** Can a community-built learning platform compete with Duolingo's $50M/year engineering budget on learning outcomes — or does "open source" only win on philosophy while losing on polish and personalization?

**[PixiJS](https://pixijs.com/) — Sean Burns** ([pixijs/pixijs](https://github.com/pixijs/pixijs))
2D rendering engine for the web — powers fast, interactive graphics in games, visualizations, and creative tools. PixiJS has 45,000+ GitHub stars. It is one of the most widely used 2D rendering libraries in existence, used by major game studios and visualization teams worldwide. Its presence here is the same signal as KDE Connect: **the program is also about recognition, not just early-stage support.** Including an established giant validates the program's credibility. It also tells you that even well-resourced projects value the Vercel credits for their documentation and demo infrastructure.
- **Our take:** PixiJS is the most credibility-adding inclusion in the cohort. When a project with 45k stars and production usage at major game studios participates in your OSS program, it signals the program has real value beyond the $3,600. That changes the calculus for whether serious projects should apply.
- **Controversial question:** With WebGPU enabling Three.js and Babylon.js to do performant 2D work, does a 2D-only renderer have a long-term future — or will general-purpose engines absorb all the 2D use cases as WebGPU becomes universal?

**[itshover](https://itshover.com) — Abhijit Jha** ([itshover/itshover](https://github.com/itshover/itshover))
Achieved rapid adoption — major star milestones within the first week of launch. Fewer details publicly indexed on this one, but the trajectory signal is interesting. A project that explodes on launch and gets picked up for the OSS program immediately is worth watching.

---

### The Animation Cluster

Nine projects in this cohort build primarily on animation and UI motion. I'll be direct: **the market is saturated at this level**. Not all of these will have meaningful user bases in two years. That said, a few have sharp differentiation:

| Project | Creator | Stars | GitHub | What makes it distinct |
|---|---|---|---|---|
| [SmoothUI](https://www.smoothui.dev/) | Eduardo Calvo López | — | [educlopez/smoothui](https://github.com/educlopez/smoothui) | Performance-focused — a specific measurable claim in a sea of generic |
| [Eldora UI](https://www.eldoraui.site/) | Karthik Mudunuri | — | [karthikmudunuri/eldoraui](https://github.com/karthikmudunuri/eldoraui) | TypeScript + Tailwind + MDX + Framer Motion — full-stack component story |
| [ui-layouts](https://www.ui-layouts.com/) | Naymur Rahman | — | [ui-layouts/uilayouts](https://github.com/ui-layouts/uilayouts) | 100+ components — breadth as differentiator |
| [useLayouts](https://uselayouts.com) | Urvish Mali | 340 | [iurvish/uselayouts](https://github.com/iurvish/uselayouts) | "People don't fall in love with components. They fall in love with how something feels." — micro-interactions, not hero animations |
| [VengenceUI](https://www.vengenceui.com/) | Ashutosh Singh | 628 | [Ashutoshx7/VengeanceUI](https://github.com/Ashutoshx7/VengeanceUI) | Copy-paste animated components, performance-first framing |
| [Moving Icons](https://movingicons.dev) | Jakob Isermann | 376 | [jis3r/icons](https://github.com/jis3r/icons) | 500+ hand-crafted Lucide icons, zero deps, tree-shakeable, native Svelte 5 runes |
| [heroicons-animated](https://www.heroicons-animated.com/) | Aniket Pawar | 84 | [heroicons-animated/heroicons-animated](https://github.com/heroicons-animated/heroicons-animated) | Drop-in for existing Heroicons users; separate per-framework packages (React, Vue, Svelte, Angular, Flutter) |
| [Wigggle UI](https://wigggle-ui.vercel.app/) | Henil Shah | 803 | [wigggle-ui/ui](https://github.com/wigggle-ui/ui) | OS-style widgets — different category, not generic components |
| [UI TripleD](https://ui.tripled.work/) | Moumen Soliman | 803 | [moumen-soliman/uitripled](https://github.com/moumen-soliman/uitripled) | Visual builders (Landing, Background, Grid) — goes beyond component library |

**Standouts:** Moving Icons' quote — "People don't fall in love with components. They fall in love with how something feels" — is the clearest articulation of why this category exists. useLayouts is building for that principle. heroicons-animated (84 stars, launched January 2026) is the youngest project here; the multi-framework org structure is smart but the traction question is open. Wigggle UI (803 stars) and UI TripleD (803 stars) have meaningful early traction.

**My take:** SmoothUI's performance-first framing and useLayouts' micro-interaction focus are the most defensible positions. "Beautiful animations" is not a moat. Performance benchmarks and feel-at-interaction-level are.

**Controversial question for the whole cluster:** With AI code generators (v0, Bolt) able to produce animated landing pages in seconds using shadcn, does a human-curated animation library have a future — or is this category about to be automated away entirely?

---

## What I Notice

**Animation is the new dark mode — with data to back it.** Nine animation/UI projects in a single cohort. [Motion](https://motion.dev/) (formerly Framer Motion) went from ~4.5M to **33.8 million weekly npm downloads** in 15 months — roughly 7x growth since its November 2024 rebrand as an independent, framework-agnostic library. 7,548 packages list it as a dependency. Animation is no longer a "nice to have" — it's expected UX, and the ecosystem is responding with a surge of libraries for every framework and use case. The flip side: nine projects fighting for the same market means most won't survive. The ones that will are those with a specific defensible claim — native Svelte 5 support, performance benchmarks, a specific design aesthetic.

**Infrastructure alternatives to vendor-locked tools.** CodePush → hot-updater (OTA). `next/og` → takumi (JSX→image). Ngrok → OutRay. Managed hosting → GoDoxy. The pattern: take something that works but has a lock-in, deprecation, or pricing problem, rebuild it open and infrastructure-agnostic. These projects are less about novelty and more about **ownership**. CodePush's shutdown gave hot-updater its market. Satori's font limitations gave takumi its differentiation. Cloud cost fatigue is giving GoDoxy and OutRay their moment.

**A new AI-native product category is forming.** InsForge (MCP-first backend), browser-ai (in-browser AI SDK), Assertify (AI test gen), GitFriend (repo AI), Pett.ai (AI companion) — these aren't traditional dev tools with AI bolted on. They're built around AI as the primary runtime. InsForge is the most interesting: if agents are going to build and manage infrastructure, the infrastructure tooling should be designed for agents from the start. That's a real bet on where the industry is going.

**LLMs are creating second lives for old project types.** APIs.guru started as a developer reference tool. It's becoming agentic infrastructure — the OpenAPI Initiative's Moonwalk SIG now explicitly recognizes LLM clients as a new class of API consumer (February 2026). Answer Overflow started as a Discord SEO play. It now has `packages/ai/` and `packages/agent/` dirs and is positioning for MCP. The core use case didn't change — the world changed around it.

**Self-hosting is a serious market again.** The global self-hosting market was valued at **$15.6 billion in 2024**, projected to reach $85.2 billion by 2034 (18.5% CAGR). 51% of businesses overspent on cloud in 2024. SaaS price inflation is running at **12.2%** — nearly 5x the G7 average — with cost per employee hitting $9,100/year, up 15% in two years. GoDoxy, OutRay, Cossistant, YourDigitalRights all ride this wave. Better tooling (Docker Compose, Traefik) is making the self-hosting alternative accessible to teams that aren't infrastructure specialists.

**The shadcn pattern is spreading.** shadcn/ui at **109,000 GitHub stars** and ~250,000 weekly npm downloads is the [default UI library of LLM-powered code generators](https://redmonk.com/kholterhoff/2025/04/22/ui-component-libraries-shadcn-ui-and-the-revenge-of-copypasta/) — v0, Bolt, and Lovable all build on it. The "copy, don't install" model is getting applied to new domains: Cossistant ("shadcn of support"), mapcn (shadcn for maps), Wigggle UI (shadcn for widgets). The model works because it produces AI-modifiable code you own.

**Established giants validate program credibility.** PixiJS (45k+ stars) and KDE Connect (years of production use, millions of downloads) don't need $3,600 in Vercel credits. Their inclusion signals two things: the program is about community recognition as much as financial support, and projects at any stage can apply. If you're maintaining a serious open source project, the program is worth it for the visibility alone.

---

## What I'd Explore Further

- **Answer Overflow + MCP** — specifically whether the MCP integration is live and queryable today. If a coding agent can pull Cloudflare Developers Discord Q&A into context, that's a genuinely different product.

- **InsForge** — the "MCP-first backend" claim needs investigation. An AI-agent-first backend platform is either the right bet on the next two years of software development, or it's premature infrastructure for a workflow that hasn't standardized yet.

- **browser-ai** — in-browser AI inference is early but real. WebGPU is shipping. Phi-3, Gemma, and Qwen run in browsers today. A vendor-agnostic TypeScript SDK for this is the right abstraction if the space matures. I'd track the GitHub stars and commit velocity closely.

- **takumi** — technically the most impressive project in the cohort. Rust renderer, skips the SVG step, better font support than satori. The question is maintenance — Rust + WASM + cross-runtime support is a lot of surface area for a small project.

- **OutRay vs. Ngrok** — Ngrok's pricing changes have been aggressive. An open tunnel alternative that you control has a real market. Curious how OutRay handles the hard parts: reliability, latency, persistent URLs.

- **Sefirah (not in this cohort)** — worth tracking independently. Intel Unison was killed in 2025, and while KDE Connect is the cohort representative for Android-desktop bridging, Sefirah is building the local-first Windows alternative with an active community.

---

## The Distillation

Vercel's cohort is a decent signal for where the ecosystem's energy is. It's not a perfect signal — it selects for projects that deploy on Vercel, so Next.js-adjacent tooling is overrepresented. But within that lens, the patterns are real.

32 projects tells me more than 15. The cohort width is the signal: animation libraries are in a crowded burst cycle, AI-native products are forming a real category, the infrastructure-escape narrative is financially motivated and growing, and the OpenAPI/MCP axis is where agentic tooling is consolidating.

The "composable, own it yourself" model is winning in tooling the same way it won in component libraries.

That tracks with what I'm building.

---

*Next issue: TBD. I'll pick a source when something interesting crosses my radar.*

---

## Sources & Glossary

| Project / Claim | Source | Date |
|---|---|---|
| Full cohort — all projects, creators, GitHub links | [Vercel OSS Blog, Alli Pope](https://vercel.com/blog/vercel-open-source-program-winter-2026-cohort) | Mar 2026 |
| Vercel OSS Program — $3,600 in platform credits | [Vercel Open Source Program](https://vercel.com/open-source-program) | Mar 2026 |
| Answer Overflow — GitHub | [AnswerOverflow/AnswerOverflow](https://github.com/AnswerOverflow/AnswerOverflow) | Mar 2026 |
| hot-updater — GitHub | [gronxb/hot-updater](https://github.com/gronxb/hot-updater) | Mar 2026 |
| CodePush shutdown March 31, 2025 | [hot-updater docs](https://hot-updater.dev/) | Mar 2025 |
| takumi — GitHub | [kane50613/takumi](https://github.com/kane50613/takumi) | Mar 2026 |
| Screenshot Studio — GitHub | [KartikLabhshetwar/screenshot-studio](https://github.com/KartikLabhshetwar/screenshot-studio) | Mar 2026 |
| APIs.guru — GitHub | [APIs-guru/openapi-directory](https://github.com/APIs-guru/openapi-directory) | Mar 2026 |
| OpenAPI Initiative Moonwalk SIG — LLMs as new API consumers | [OpenAPI Initiative Newsletter Feb 2026](https://www.openapis.org/blog/2026/02/10/openapi-initiative-newsletter-february-2026) | Feb 2026 |
| YourDigitalRights — GitHub | [your-digital-rights/yourdigitalrights.org](https://github.com/your-digital-rights/yourdigitalrights.org) | Mar 2026 |
| YourDigitalRights — 400k+ requests, 25+ laws | [yourdigitalrights.org](https://yourdigitalrights.org/) | Mar 2026 |
| California DELETE Act (DROP) — 242k requests in first 2 months | [California Privacy Protection Agency](https://cppa.ca.gov/) | Jan 2026 |
| KDE Connect — GitHub | [KDE/kdeconnect-kde](https://github.com/KDE/kdeconnect-kde) | Mar 2026 |
| heroicons-animated — GitHub | [heroicons-animated/heroicons-animated](https://github.com/heroicons-animated/heroicons-animated) | Mar 2026 |
| Cossistant — GitHub | [cossistantcom/cossistant](https://github.com/cossistantcom/cossistant) | Mar 2026 |
| GoDoxy — GitHub | [yusing/godoxy](https://github.com/yusing/godoxy) | Mar 2026 |
| Moving Icons — GitHub | [jis3r/icons](https://github.com/jis3r/icons) | Mar 2026 |
| Ersilia — GitHub | [ersilia-os/ersilia](https://github.com/ersilia-os/ersilia) | Mar 2026 |
| InsForge — GitHub | [InsForge/insforge](https://github.com/InsForge/insforge) | Mar 2026 |
| browser-ai — GitHub | [jakobhoeg/browser-ai](https://github.com/jakobhoeg/browser-ai) | Mar 2026 |
| PixiJS — GitHub | [pixijs/pixijs](https://github.com/pixijs/pixijs) | Mar 2026 |
| OutRay — GitHub | [outray-tunnel/outray](https://github.com/outray-tunnel/outray) | Mar 2026 |
| Motion — 33.8M weekly downloads | [npm trends — motion](https://npmtrends.com/framer-motion) | Feb 2026 |
| Motion — independent open source rebrand | [motion.dev announcement](https://motion.dev/magazine/framer-motion-is-now-independent-introducing-motion) | Nov 2024 |
| shadcn/ui — 109k GitHub stars | [shadcn-ui/ui](https://github.com/shadcn-ui/ui) | Mar 2026 |
| shadcn/ui — "Revenge of Copypasta" analysis | [RedMonk — Kate Holterhoff](https://redmonk.com/kholterhoff/2025/04/22/ui-component-libraries-shadcn-ui-and-the-revenge-of-copypasta/) | Apr 2025 |
| Self-hosting market — $15.6B → $85.2B | [market.us Self-Hosting Market report](https://market.us/report/self-hosting-market/) | 2024 |
| 51% of businesses overspent on cloud | [Flexera State of the Cloud 2024](https://www.flexera.com/blog/cloud/cloud-computing-trends-2024-state-of-the-cloud-report/) | 2024 |
| SaaS inflation 12.2%, $9,100/employee/year | [Elest.io — The Great SaaS Exodus](https://blog.elest.io/the-great-saas-exodus-why-companies-are-moving-entire-stacks-to-self-hosted-in-2026/) | 2026 |
| 37signals AWS exit — $10M+ savings | [DHH — hey.com](https://world.hey.com/dhh/our-cloud-exit-savings-will-now-top-ten-million-over-five-years-c7d9b5bd) | 2024 |
