# Article decision — a follow-up is warranted

The research supports a focused engineering field note, with a concrete result beyond another memory percentage. [Prepared draft](09-follow-up-draft.md): **Bun AOT in Express and Fastify: memory, CPU and serializers**. It is not a new site post.

The reader can compare RAM, CPU per completed request, request speed and startup separately, then move a runtime-generated serializer into the native build without silently changing the tested response behavior. The author contributes checked fixtures, a reproduced semantic difference, a successful four-case standalone control, source and numeric artifacts, and the decision to exclude overlapping measurements.

## Supported findings and scope

| Finding | Basis | Limit |
| --- | --- | --- |
| Express saves memory with a small CPU/rate improvement | Six guarded runs per mode, 5,615,327 checked responses | One cached-read SQLite fixture and preview on macOS |
| Fastify saves memory while CPU/request rises | Six guarded runs per mode, 5,672,260 responses | No universal framework ordering or cost claim |
| Standalone source preserves four serializer behaviors and has a smaller AOT/JIT rate gap | Four source/native contract cases; six guarded runs per mode | Separate policy batches; wider schemas and all runtime-generated framework paths unproven |
| Plain JSON changes response behavior | Extra fields and numeric-string cases differ | Matching one payload does not establish a generally equivalent substitution |
| Native reaches readiness sooner; bytecode recovers much of that gain | Thirty-start control per mode/framework, cold traces | Warm file caches, health before business work, local clients |

The full study has 246 timed windows and 27,977,442 checked responses, plus the separate 180-process readiness control. Results differ from Jarred's report because the fixture and conditions differ; the exact upstream chart remains unreplicated. Ordinary/short-lived host activity can evade the bounded guard. Linux, production capacity, energy, cloud cost, durable writes, multi-route serializer mapping and every schema feature remain outside the evidence.

## Positioning and editorial review

- **Form:** engineering field note/decision aid; no new OSS Radar issue number. A bridge between the recognizable Bun AOT decision and the author's inspectable experiments.
- **Reader language:** Bun AOT, Express, Fastify, memory, CPU/request, generated serializer and startup. “Bun AOT Fastify serializer” and “Bun AOT Express memory CPU” are discovery hypotheses, not measured demand or competition.
- **Proposed H1 / SEO title:** Bun AOT in Express and Fastify: memory, CPU and serializers.
- **Proposed slug:** `bun-aot-express-fastify-serializers`; not reserved or published.
- **Proposed description:** Bun AOT cut memory by about half in Express and Fastify SQLite fixtures. CPU outcomes differed; a build-time serializer preserved four checked response behaviors.
- **Tags if published:** `bun`, `performance`, `fastify`, `sqlite`.
- **Relationship:** the original Bun AOT article is the predecessor. The draft has one contextual root-relative backward link. A future publication should add the actual forward link and applicable series metadata then; no speculative live URL or date is inserted now.
- **Authorship:** first-person statements follow recorded work; no supplied feeling, quotation or adoption outcome is invented. The exact [owner prompt](owner-prompt.md) is preserved for a future engineering-post prompt record. No new research-token estimate inherits the original frozen accounting.
- **Evidence review:** each consequential number maps to a checkpoint summary; runtime-generation claims use pinned Bun/Fastify sources. The draft retains separate-policy and host limits, failed measurement setup, bytecode counterevidence and contract differences. It makes no growth or citation promise and prepares no outreach.
- **Prose review:** result-led opening, three reader takeaways, concrete source/build steps, tables for actual comparisons, a bounded ending and checked glossary. No hypothetical deployment or successful user adoption is narrated.

The distinctive payoff is a tested workflow: make generated code visible before compiling, and compare the serializer's behavior as well as its rate. Site publication, broader schema coverage, a different OS and independent replication are optional next work, not unfinished acceptance for this research.

## Concurrent publication context

During delivery, main received the separate [Keryx/Next.js real-project study](../project-trials-2026-11-01/README.md) and its [publication receipt](../project-trials-2026-11-01/publication-acceptance.json). Its updated predecessor article is preserved. Those source/packaging/timer findings strengthen the case for keeping this draft focused on SQLite API measurements and serializer behavior. The studies share authorship and hardware; their counts are separate, and neither independently replicates the other. The project-study README and latest plan were read during integration; its complete numeric corpus was not re-audited here.
