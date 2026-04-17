# jokio/rpc vision research

Checked: 2026-04-12

Scope:

1. Existing contract-first / TypeScript RPC tools
2. Zod to JSON Schema / OpenAPI limits
4. Streaming semantics and transport choices

Related backlog artifact: `ARTF-0004`

## Sources

- tRPC docs: https://trpc.io/docs/concepts
- ts-rest docs: https://ts-rest.com/
- Hono RPC docs: https://hono.dev/docs/guides/rpc
- Zodios docs: https://www.zodios.org/docs/intro
- TypeSpec docs: https://typespec.io/docs/
- TypeSpec OpenAPI: https://typespec.io/openapi
- ConnectRPC docs: https://connectrpc.com/docs/introduction/
- gRPC core concepts: https://grpc.io/docs/what-is-grpc/core-concepts/
- oRPC docs: https://orpc.dev/docs/getting-started
- oRPC OpenAPI: https://orpc.dev/docs/openapi/openapi-specification
- oRPC RPC handler: https://orpc.dev/docs/rpc-handler
- Elysia Eden docs: https://elysiajs.com/eden/overview
- Effect RPC docs: https://effect-ts.github.io/effect/docs/rpc
- Zod JSON Schema: https://zod.dev/json-schema
- Zod metadata: https://zod.dev/metadata
- OpenAPI latest: https://spec.openapis.org/oas/latest.html
- MDN Server-Sent Events: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
- MDN EventSource: https://developer.mozilla.org/docs/Web/API/EventSource
- MDN WebSocket: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
- NATS docs: https://docs.nats.io/
- NATS JetStream: https://docs.nats.io/using-nats/developer/develop_jetstream
- AsyncAPI docs: https://www.asyncapi.com/docs/concepts/asyncapi-document

## Existing Tools

The ecosystem breaks into five useful categories.

### Procedure-First TypeScript RPC

Examples: tRPC, oRPC, Effect RPC.

Core idea: define callable procedures, infer types into clients, and make transport feel secondary.

What to learn:

- Operation/procedure names give better multi-consumer ergonomics than raw route strings.
- Middleware, context, error modeling, metadata, and client ergonomics are first-class concerns.
- oRPC is the most important project to study because it already combines RPC, OpenAPI, adapters, and Event Iterator/SSE-style streaming.

Implication for `jokio/rpc`:

- Do not compete as "smaller tRPC."
- Compete as operation contracts projected into UI, HTTP, MCP, CLI, OpenAPI, agents, and streams.

### REST/HTTP Contract-First TypeScript

Examples: ts-rest, Zodios, current `jokio/rpc`.

Core idea: define method/path/body/query/response contracts and share them between server and client.

What to learn:

- This maps naturally to OpenAPI.
- Status-code-specific responses and typed errors matter.
- Zod-first contracts are a proven pattern.

Implication:

- Current `jokio/rpc` is in this category.
- If it stays route-first, MCP/CLI/agent support will feel bolted on.
- Long-term architecture should be operation-first, with HTTP route metadata as one projection.

### Framework-Local Inferred Clients

Examples: Hono RPC, Elysia Eden.

Core idea: write framework routes and infer a typed client from the app/router type.

What to learn:

- Extremely good ergonomics inside a framework.
- Weak as a universal service contract because the source of truth is framework-local route behavior.

Implication:

- `jokio/rpc` should not become "Hono RPC for Express."
- Its value should be framework portability and multi-surface projection.

### Spec-First / Design-First Contract Compilers

Examples: TypeSpec, OpenAPI-first toolchains.

Core idea: author in a dedicated API/schema language, emit OpenAPI and other artifacts.

What to learn:

- The compiler mental model is correct.
- Emitters/adapters should be separate from the core contract model.
- Auth, versioning, examples, docs, errors, and governance become core product concerns.

Implication:

- TypeSpec validates the big idea.
- `jokio/rpc` can be the TypeScript/Zod-native, implementation-adjacent version of that idea.

### Protocol/Schema-First RPC

Examples: gRPC/protobuf, ConnectRPC.

Core idea: define services/messages in protobuf and generate clients/servers across languages.

What to learn:

- The streaming taxonomy is mature: unary, server streaming, client streaming, bidirectional streaming.
- Deadlines, cancellation, metadata, status codes, and lifecycle semantics are important.

Implication:

- Borrow the operation/streaming vocabulary.
- Do not try to out-gRPC gRPC unless protobuf/polyglot RPC becomes the real goal.

## Zod to JSON Schema / OpenAPI

Zod 4 is viable as the authoring center because it has native `z.toJSONSchema()` and metadata support.

Good chain:

```txt
Zod schema
  -> TypeScript inference
  -> runtime validation
  -> JSON Schema
  -> OpenAPI / MCP / CLI / agent manifests
```

But not every Zod schema is a public contract schema.

Zod docs list these as unrepresentable in JSON Schema by default:

- `z.bigint()`
- `z.int64()`
- `z.symbol()`
- `z.undefined()`
- `z.void()`
- `z.date()`
- `z.map()`
- `z.set()`
- `z.transform()`
- `z.nan()`
- `z.custom()`

Recommended stance:

- Fail builds for unrepresentable exported schemas.
- Do not silently emit `{}` for contract schemas.
- Allow explicit overrides only when the user supplies an honest JSON Schema representation.

Contract-safe defaults:

- strings, numbers, booleans, nulls
- objects, arrays, records
- enums/literals
- unions/discriminated unions
- optional/nullable fields
- standard string formats such as UUID, email, URL, ISO date/time

Recommended wrappers/conventions:

- `Date` as ISO string at the contract edge
- `bigint` / `int64` as string or safe integer with metadata
- `Map` / `Set` as records or arrays
- transforms outside the public schema
- custom schemas only with explicit JSON Schema metadata

OpenAPI strategy:

- Generate OpenAPI 3.1 as the default serious target because it aligns better with JSON Schema Draft 2020-12.
- Optionally generate OpenAPI 3.0 for ecosystem compatibility.
- Treat OpenAPI 3.2 as later until tooling catches up.
- Keep raw JSON Schema export separate from OpenAPI.

Important design insight:

- Contract schemas should describe wire shapes.
- Handler code can transform after validation.
- Generated OpenAPI/MCP/CLI artifacts must use wire schemas, not internal types.

## Streaming Semantics

Do not choose NATS/SSE/WebSocket first. Choose stream semantics first.

Initial stream modes:

- `unary`: one request, one response
- `serverEvents`: one request, many server events
- `jobEvents`: start work, then stream progress/log/result events
- `subscription`: long-lived stream keyed by resource/filter/topic

Defer until later:

- client streaming
- bidirectional streaming
- generic WebSocket multiplexing

Transport mapping:

- Browser/UI receive-only: SSE/EventSource
- Browser/UI bidirectional: WebSocket
- CLI: NDJSON first, SSE where useful
- Internal service pub/sub: Core NATS
- Durable/replayable backend streams and work queues: NATS JetStream
- Event API documentation: AsyncAPI
- HTTP API documentation: OpenAPI
- MCP/agents: project stream/progress semantics into MCP-native concepts when possible

Reliability model every stream should declare:

- ephemeral: events may be missed
- resumable: client can reconnect with cursor/last event id
- durable: events are persisted and replayable
- work-queue: each item should be processed by one consumer group/member

Key performance note:

- SSE is usually the simplest browser default for server-to-client streams.
- WebSocket is necessary for true bidirectional interaction but should not be the default.
- MDN notes the classic WebSocket API has no built-in backpressure.
- NATS is not a browser transport; it is backend messaging infrastructure.

Suggested model:

```ts
operation.stream({
  mode: "serverEvents",
  input: z.object({ buildId: z.string() }),
  event: z.discriminatedUnion("type", [
    z.object({ type: z.literal("log"), line: z.string() }),
    z.object({ type: z.literal("progress"), pct: z.number() }),
    z.object({ type: z.literal("done"), ok: z.boolean() }),
  ]),
  transports: {
    http: { default: "sse" },
    cli: { default: "ndjson" },
    nats: { subject: "builds.*.events", durable: false },
  },
  handler: async function* (input, ctx) {
    yield* ctx.builds.watch(input.buildId)
  },
})
```

## Overall Conclusion

The vision is valid, but it should not be described as "Zod RPC."

Best architecture:

```txt
operation contract registry
  -> typed execution
  -> JSON Schema export
  -> OpenAPI for HTTP
  -> AsyncAPI for events
  -> MCP tools for agents
  -> CLI commands
  -> UI/client SDK
  -> streaming adapters
```

Design rules:

- Operation-first, not route-first.
- Zod-authored, but JSON Schema/OpenAPI-safe.
- OpenAPI and AsyncAPI are emitted artifacts.
- Transport behavior belongs in adapters.
- Streaming semantics come before streaming transport.
- Typed errors and metadata must be first-class.

Biggest warning:

> Study oRPC before implementing. It already overlaps strongly with RPC + OpenAPI + adapters + streaming. `jokio/rpc`'s differentiation should be MCP/CLI/agent-native multi-surface projection, not just RPC + OpenAPI.

## Second-Pass Findings

This pass focused on the gaps from the first note:

- deeper oRPC teardown
- practical feature matrix
- Zod/OpenAPI generator reality
- MCP details
- typed errors/auth
- stream cancellation/resume/task semantics

### oRPC Is the Closest Overlap

oRPC describes itself as "OpenAPI Remote Procedure Call." It combines RPC-style procedure definition with OpenAPI compliance.

Important oRPC capabilities:

- end-to-end type-safe inputs, outputs, and errors
- first-class OpenAPI support
- optional contract-first development
- Standard Schema support, including Zod, Valibot, ArkType, and Effect Schema
- multiple runtime/framework adapters
- RPC protocol over HTTP
- OpenAPI-compatible handler/link
- native JavaScript type serialization for the RPC protocol
- OpenAPI serialization rules for REST/OpenAPI mode
- OpenTelemetry support
- plugins, middleware, interceptors
- event iterator support for SSE/streaming
- client retry plugin integration

This matters because several ideas for `jokio/rpc` already exist in oRPC:

- RPC plus OpenAPI
- contract-first option
- multiple adapters
- typed errors
- SSE/event iterator streaming
- Standard Schema rather than Zod-only
- native type transport for RPC mode

So the differentiation cannot be "typed RPC with OpenAPI." oRPC already owns much of that shape.

Better differentiation:

> MCP/CLI/agent-native operation contracts with generated surfaces and safety metadata.

In other words, the unique wedge should be multi-consumer backend capability exposure, especially for agents and tools, not generic RPC.

### oRPC Design Lessons

oRPC separates at least two protocol surfaces:

- `RPCHandler`: proprietary RPC protocol over HTTP, efficient and native-type-friendly, but not human-readable or OpenAPI-compatible.
- `OpenAPIHandler`: REST/OpenAPI-compatible surface, with stricter serialization/deserialization rules.

This is a useful pattern for `jokio/rpc`:

```txt
same operation contract
  -> optimized first-party RPC surface
  -> standards-compatible OpenAPI/HTTP surface
```

Do not force one wire shape to satisfy every consumer.

The contract should be shared, but adapters can have different serialization policies.

### Feature Matrix

| Tool | Source of truth | Runtime validation | OpenAPI | Streaming | MCP/CLI/agent-native | Main lesson |
|---|---|---:|---:|---:|---:|---|
| tRPC | procedure router | yes | not core | subscriptions | no | Excellent TS app boundary, weaker standard contract story |
| ts-rest | HTTP contract | yes | yes | limited/not core | no | Strong REST/OpenAPI contract model |
| Zodios | Zod HTTP API definition | yes | yes | not core | no | Zod-first REST toolbox already exists |
| Hono RPC | framework route type | via validators | not core | framework helpers | no | Framework-local inference can be extremely ergonomic |
| Elysia Eden | framework route type | framework validators | framework ecosystem | framework support | no | Same lesson as Hono: hard to beat inside one framework |
| TypeSpec | dedicated IDL | generated/adapter | yes | designable | no | Best proof of contract compiler model |
| gRPC/ConnectRPC | protobuf service | generated | not OpenAPI-first | yes | no | Mature operation/streaming/deadline model |
| Effect RPC | Effect Schema/service | yes | ecosystem-dependent | yes | no | Strong typed errors/effects model |
| oRPC | procedure/contract | yes | yes | SSE/event iterator | no | Closest competitive overlap |
| jokio/rpc today | HTTP route map | optional Zod | no/possible | no | no | Basic ts-rest/Zodios-like starting point |
| jokio/rpc vision | operation contract | yes | generated | adapter-based | yes | Differentiation must be multi-surface operation projection |

### Zod/OpenAPI Generator Reality

Zod 4 native JSON Schema export reduces dependency risk, but OpenAPI generation is still a separate product problem.

Key facts:

- Zod can target JSON Schema Draft 2020-12, older JSON Schema drafts, and OpenAPI 3.0 schema objects.
- Zod metadata/registries can carry ids, titles, descriptions, examples, and custom metadata.
- OpenAPI 3.1 aligns more naturally with JSON Schema 2020-12 than 3.0.
- `@asteasolutions/zod-to-openapi` supports OpenAPI 3.0 and 3.1 generation and has real adoption.
- ts-rest supports bring-your-own schema transformer for OpenAPI generation.
- oRPC uses schema converters and supports OpenAPI 3.1.1.

Implication:

`jokio/rpc` should not hard-code one schema conversion strategy too early.

Better design:

```ts
type SchemaAdapter = {
  validate(input: unknown): unknown
  toJsonSchema(schema: unknown, target: "json-schema" | "openapi-3.0" | "openapi-3.1"): JsonSchema
}
```

Start with Zod, but keep the core model compatible with Standard Schema or an internal schema adapter interface.

This does not mean building broad schema-library support immediately. It means avoiding a core architecture that makes Zod impossible to swap or adapt later.

### Contract-Safe Zod Policy

The first-pass conclusion still stands, but it needs to be stricter:

> A schema used in an exported operation must be representable in the target artifact.

That means a schema may be valid for internal handler parsing but invalid for:

- OpenAPI
- MCP tool schemas
- CLI generated docs
- agent manifests
- SDK generation

Recommended model:

```ts
operation({
  input: wireSchema,
  output: wireSchema,
  parseInput?: internalParser,
  serializeOutput?: serializer,
})
```

The public contract is wire-first. Internal transformation is allowed, but explicit.

Avoid:

```ts
z.string().transform(...)
```

as a public operation schema unless the exported wire schema is explicit.

### MCP Details That Matter

MCP tools are a strong fit for operation projection, but the adapter needs to respect MCP semantics instead of tunneling HTTP.

Important MCP facts:

- tools are model-controlled operations
- tools have `inputSchema`
- tools may have `outputSchema`
- tool output can include `structuredContent`
- when `outputSchema` is present, structured results must conform to it
- clients should validate structured results
- tools have annotations: `readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`
- tool annotations are hints, not security controls
- tool names should be stable, unique, and limited to safe ASCII-ish characters
- MCP distinguishes protocol errors from tool execution errors
- recoverable business/validation errors should usually be tool execution errors with `isError: true`
- HTTP-based MCP authorization uses OAuth 2.1-style bearer tokens and resource metadata
- STDIO MCP should get credentials from environment/config, not OAuth flow
- progress notifications use `progressToken`
- newer MCP task support exists for long-running operations, but is experimental
- cancellation uses `notifications/cancelled`

Implication:

Operation metadata should include fields specifically shaped for MCP:

```ts
mcp: {
  name: "posts.create",
  title: "Create Post",
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: false,
  taskSupport: "optional",
}
```

But this metadata should be derived from general operation annotations where possible:

```ts
annotations: {
  readOnly: false,
  destructive: false,
  idempotent: false,
  openWorld: false,
  longRunning: true,
}
```

Then MCP becomes one projection.

### Typed Error Model

Typed errors are more important than the first pass emphasized.

Relevant standards/models:

- HTTP: RFC 9457 Problem Details gives a standard JSON shape for machine-readable errors.
- JSON-RPC: protocol errors have numeric codes, message, and optional data.
- MCP: protocol errors are for malformed/unknown requests; tool execution errors should be returned as tool results with `isError: true`.
- oRPC: has named error codes and maps default codes to HTTP statuses.
- ts-rest: status-code-specific responses and common responses are part of the contract.
- gRPC/ConnectRPC: status codes and metadata are part of the call model.

Recommended operation error shape:

```ts
errors: {
  Unauthorized: {
    status: 401,
    code: "UNAUTHORIZED",
    schema: z.object({ message: z.string() }),
  },
  DuplicateSlug: {
    status: 409,
    code: "DUPLICATE_SLUG",
    schema: z.object({ slug: z.string() }),
  },
}
```

Projection rules:

- HTTP/OpenAPI: status code plus `application/problem+json` or a project-specific typed error envelope.
- MCP: expected domain errors become tool results with `isError: true`; protocol errors remain JSON-RPC errors.
- CLI: typed exit code plus JSON error in `--json` mode and concise human text in default mode.
- NATS: typed error reply/event envelope.
- OpenAPI: every declared error should become a response.
- Agent manifest: every declared error should include recovery guidance.

Core principle:

> Expected failures are part of the contract. Unexpected failures are infrastructure errors.

### Auth and Permissions

Auth cannot be only adapter middleware. It must exist as operation metadata.

Operation-level metadata should capture:

- auth required or optional
- accepted auth schemes
- required scopes/permissions
- resource ownership checks
- user-confirmation requirement
- audit requirement
- whether operation can run as user, service, or either

Example:

```ts
auth: {
  required: true,
  schemes: ["bearer"],
  scopes: ["posts:write"],
  actor: "user",
  audit: true,
}
```

Projection:

- OpenAPI: security schemes and per-operation security requirements.
- MCP HTTP: OAuth/resource-server expectations and scope metadata.
- MCP STDIO: environment/config credential requirements.
- CLI: login/session/token handling.
- Internal services: service token or workload identity.
- Agent manifest: required permission and confirmation hints.

Security rule:

> MCP annotations and agent hints are UX/model guidance, not authorization. Real auth must happen in the handler/adaptor execution path.

### Streaming, Cancellation, and Resume

The first-pass stream taxonomy is right, but the implementation model needs more lifecycle fields.

Operation stream metadata should include:

- mode: unary, serverEvents, jobEvents, subscription, bidirectional later
- event schema
- completion schema if the stream returns a final value
- cancellation support
- resume support
- cursor/last-event-id behavior
- heartbeat/keepalive policy
- backpressure policy
- durability policy
- timeout/deadline policy
- max duration
- auth revalidation policy for long streams

Suggested shape:

```ts
stream: {
  mode: "serverEvents",
  event: EventSchema,
  reliability: "resumable",
  cursor: {
    input: "lastEventId",
    output: "event.id",
  },
  cancellation: "abort-signal",
  heartbeatMs: 15000,
  maxDurationMs: 300000,
}
```

Transport-specific notes:

- SSE supports event ids and browser reconnection behavior through EventSource.
- oRPC exposes `lastEventId` to server handlers for resume.
- NDJSON is the most CLI-friendly stream format because each line is one JSON value.
- Fetch `ReadableStream` is broadly available and can support custom streaming protocols.
- WebSocket is bidirectional but the classic browser API has no built-in backpressure.
- WebTransport is interesting for future high-performance bidirectional/unreliable streams, but MDN marks it limited availability, so it should not be a default.
- Core NATS is good for fast ephemeral pub/sub.
- JetStream is the right default when replay, durability, consumers, or work queues matter.
- AsyncAPI should be the emitted artifact for event channels/messages/operations.

Important distinction:

```txt
streaming response != event bus != durable job
```

They can share schemas, but they have different lifecycle and reliability guarantees.

### Recommended Next Implementation Spike

Do not start with full adapters. Start with one vertical slice.

Spike:

```ts
const service = defineService({
  name: "posts",
  operations: {
    create: operation({
      input,
      output,
      errors,
      annotations,
      auth,
      http: { method: "POST", path: "/posts" },
      mcp: { name: "posts.create" },
      cli: { command: "posts create" },
      handler,
    }),
  },
})
```

Generate:

- Express route
- typed HTTP client
- OpenAPI 3.1 fragment/document
- MCP tool definition
- CLI command metadata, even if not full CLI execution yet

Test:

- valid input
- invalid input
- success output validation
- declared domain error
- undeclared internal error
- OpenAPI schema generation
- MCP `inputSchema` and `outputSchema`
- CLI argument metadata

This spike will reveal whether operation-first ergonomics are real or too heavy.

### Revised Differentiation

The project should not be sold internally as:

> A better tRPC.

Or:

> A simpler oRPC.

The stronger framing:

> A TypeScript/Zod-native operation contract layer for services that need to expose the same capability to apps, agents, CLIs, APIs, and streams.

The moat is not type inference alone. The moat is consistent multi-surface projection with strong runtime validation, schema artifacts, safety metadata, and agent-ready semantics.

### Updated Research Priority

Next research should be narrower and more practical:

1. Deeply implement the vertical slice above in a scratch repo or branch.
2. Compare its ergonomics against oRPC, ts-rest, and Zodios for the same example.
3. Run real Zod schemas through:
   - `z.toJSONSchema()`
   - `@asteasolutions/zod-to-openapi`
   - oRPC's Zod converter
4. Generate MCP tools from the same schemas and validate that `outputSchema` root constraints are satisfied.
5. Add one streaming operation and compare SSE, NDJSON, and oRPC Event Iterator behavior.

Research is now past the point of docs-only reading. The next useful work is a spike.

## oRPC Deep Teardown

Checked: 2026-04-12

Primary sources:

- oRPC README: https://github.com/middleapi/orpc/blob/main/README.md
- oRPC procedure docs: https://orpc.dev/docs/procedure
- oRPC contract-first define docs: https://orpc.dev/docs/contract-first/define-contract
- oRPC contract-first implement docs: https://orpc.dev/docs/contract-first/implement-contract
- oRPC error handling docs: https://orpc.dev/docs/error-handling
- oRPC OpenAPI handler docs: https://orpc.dev/docs/openapi/openapi-handler
- oRPC OpenAPI routing docs: https://orpc.dev/docs/openapi/routing
- oRPC OpenAPI input/output structure docs: https://orpc.dev/docs/openapi/input-output-structure
- oRPC OpenAPI specification docs: https://orpc.dev/docs/openapi/openapi-specification
- oRPC OpenAPI error handling docs: https://orpc.dev/docs/openapi/error-handling
- oRPC event iterator docs: https://orpc.dev/docs/event-iterator
- oRPC client event iterator docs: https://orpc.dev/docs/client/event-iterator
- oRPC publisher docs: https://orpc.dev/docs/helpers/publisher
- oRPC durable iterator docs: https://orpc.dev/docs/integrations/durable-iterator
- oRPC HTTP adapter docs: https://orpc.dev/docs/adapters/http
- oRPC metadata docs: https://orpc.dev/docs/metadata
- oRPC server package: https://github.com/middleapi/orpc/blob/main/packages/server/package.json
- oRPC client package: https://github.com/middleapi/orpc/blob/main/packages/client/package.json
- oRPC contract package: https://github.com/middleapi/orpc/blob/main/packages/contract/package.json
- oRPC OpenAPI package: https://github.com/middleapi/orpc/blob/main/packages/openapi/package.json
- MCP tools spec: https://modelcontextprotocol.io/specification/2025-11-25/server/tools
- MCP schema reference: https://modelcontextprotocol.io/specification/2025-11-25/schema
- MCP progress: https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/progress
- MCP cancellation: https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/cancellation
- MCP tasks: https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/tasks

### Executive Finding

oRPC is the strongest direct reference and the strongest competitive warning.

It already covers much of the broad shape:

- procedure-first TypeScript API definition
- optional contract-first API definition
- typed inputs, outputs, and errors
- Standard Schema support, not just Zod
- OpenAPI 3.1.1 generation
- OpenAPI-compatible handler and client link
- proprietary RPC handler for first-party clients
- many HTTP/runtime adapters
- WebSocket/message-port adapters
- Event Iterator/SSE streaming
- publisher helpers with resume support
- durable iterator integration
- metadata
- OpenTelemetry and framework/client integrations

Decision:

`jokio/rpc` should not try to become "oRPC, but smaller." That is not a durable differentiation.

Constraint:

If `jokio/rpc` evolves, its wedge must be stronger around MCP/CLI/agent-native multi-surface projection and operation safety semantics.

Implication for `jokio/rpc`:

Keep the name for now, but architect around operation contracts that can project into agent/MCP/CLI surfaces as first-class outputs, not as OpenAPI-adjacent afterthoughts.

Open question:

Can this be done without turning the library into a heavier oRPC clone?

### 1. Contracts vs Procedures

Evidence:

- oRPC procedure docs define a procedure as a function-like unit with input/output validation, middleware, dependency injection, and extensibility.
- Procedure definition is builder-style: `.use()`, `.input()`, `.output()`, `.handler()`, `.callable()`, `.actionable()`.
- Contract-first docs say a contract specifies procedure rules and expectations: input, output, errors, types, constraints, and validations.
- oRPC contract-first mode uses `@orpc/contract` and `oc` to define contracts without handlers.
- Contract routers organize contracts in nested object hierarchies.
- oRPC also has implementation docs that bind a router implementation to a previously defined contract.

Distillation:

oRPC has two related source-of-truth modes:

```txt
implementation-first:
  os.input(...).output(...).handler(...)

contract-first:
  oc.input(...).output(...).errors(...)
  then implement against that contract
```

The current `jokio/rpc` route map is closer to HTTP contract-first. oRPC is more operation/procedure-native.

Decision:

`jokio/rpc` should move operation-first before adding many adapters.

Constraint:

If the root abstraction remains `GET /path` and `POST /path`, MCP and CLI projection will be second-class.

Implication for `jokio/rpc`:

The next API should probably look closer to:

```ts
operation({
  name: "posts.create",
  input,
  output,
  errors,
  http: { method: "POST", path: "/posts" },
  mcp: { name: "posts.create" },
  cli: { command: "posts create" },
  handler,
})
```

Open question:

Can the library keep route-first ergonomics as sugar over operation-first internals?

### 2. Typed Errors and HTTP Projection

Evidence:

- oRPC error docs support a normal approach using `ORPCError`.
- oRPC also supports a type-safe approach via `.errors(...)`; clients infer declared error structures.
- `ORPCError.data` is sent to the client, and the docs explicitly warn not to include sensitive information.
- oRPC combines both approaches: a thrown `ORPCError` can match predefined errors when `code`, `status`, and `data` align.
- oRPC OpenAPI error docs map standard error codes to HTTP statuses: `BAD_REQUEST` -> 400, `UNAUTHORIZED` -> 401, `NOT_FOUND` -> 404, `CONFLICT` -> 409, `INTERNAL_SERVER_ERROR` -> 500, and others.
- Custom errors can override default HTTP status and message.

Distillation:

oRPC treats errors as typed first-class contract elements, not just thrown exceptions. It also has an HTTP projection model for those errors.

Decision:

Typed errors must be part of `jokio/rpc` core from the beginning.

Constraint:

Validation errors, auth errors, business errors, and internal errors need different projections for HTTP, MCP, CLI, and internal transports.

Implication for `jokio/rpc`:

A minimal useful error shape:

```ts
errors: {
  DuplicateSlug: {
    code: "DUPLICATE_SLUG",
    status: 409,
    schema: z.object({ slug: z.string() }),
    message: "A post with this slug already exists",
    recovery: "Choose a different slug",
  },
}
```

Open question:

Should `jokio/rpc` use RFC 9457 Problem Details as the HTTP error envelope, or a custom typed envelope optimized for TypeScript clients and MCP conversion?

### 3. OpenAPI Generation

Evidence:

- oRPC OpenAPI docs say it supports OpenAPI 3.1.1.
- It can generate specifications from either a router or a contract.
- Schema conversion is pluggable through schema converters; examples include Zod v3, Zod v4, Valibot, and ArkType.
- oRPC recommends built-in converters because they handle edge cases and oRPC-supported types.
- OpenAPI metadata can be added via `.route()` or `.tag()`.
- `.route()` metadata includes `operationId`, `summary`, `description`, `deprecated`, `tags`, `successDescription`, and full `spec` override.
- `route.spec` can be a callback that extends the generated operation object.
- Errors and middleware can contribute OpenAPI spec metadata via `oo.spec`.
- `filter` can exclude procedures from the OpenAPI spec, e.g. procedures tagged `internal`.
- OpenAPI routing defaults are POST plus path from router keys, but `.route()` customizes method, path, and success status.
- Input structure can be compact or detailed. Detailed mode separates `params`, `query`, `headers`, and `body`.
- Output structure can be compact or detailed. Detailed output supports status, headers, and body, including multiple success statuses through output unions.

Distillation:

oRPC already does the serious OpenAPI work: operation metadata, security overrides, filtering, route mapping, status modeling, schema conversion, input/output structure, and handler/client compatibility.

Decision:

`jokio/rpc` should not treat OpenAPI as a simple post-processing step over route definitions.

Constraint:

OpenAPI generation becomes real product surface once you need auth, errors, status codes, headers, tags, examples, multipart, files, and differing input/output schemas.

Implication for `jokio/rpc`:

Either:

- delegate OpenAPI generation to an existing library for a while, or
- build a very narrow OpenAPI generator and explicitly document what it does not support.

Open question:

Should `jokio/rpc` generate OpenAPI 3.1 first, or should it target 3.0 initially because more SDK/doc tools still support 3.0 better?

### 4. RPC Handler vs OpenAPI Handler

Evidence:

- oRPC `RPCHandler` uses a proprietary RPC protocol over HTTP.
- Its docs state the RPC protocol is efficient for native types but is neither human-readable nor OpenAPI-compatible.
- `RPCHandler` is designed for `RPCLink`, not manual requests.
- `OpenAPIHandler` exposes RESTful APIs aligned with OpenAPI and is compatible with `OpenAPILink` and generated specs.
- `RPCHandler` supports richer native serialization: `undefined`, `Date`, `BigInt`, `RegExp`, `URL`, `Set`, `Map`, `Blob`, `File`, and root-level async iterators.
- `OpenAPIHandler` serializes those types into JSON/OpenAPI-compatible forms, e.g. `BigInt` to string, `Set`/`Map` to arrays, invalid dates to null, and file/blob constraints around multipart.

Distillation:

oRPC has a useful two-surface model:

```txt
same procedure contract
  -> optimized first-party RPC protocol
  -> standards-compatible OpenAPI/REST protocol
```

This is important. One wire format should not be forced to satisfy every consumer.

Decision:

`jokio/rpc` can keep a first-party typed RPC surface while still producing standards-compatible OpenAPI.

Constraint:

The contract must distinguish internal/native runtime types from public wire-compatible schemas.

Implication for `jokio/rpc`:

Support two target modes:

- first-party TypeScript clients can use richer serialization if the project wants that
- OpenAPI/MCP/CLI/agent artifacts must use strict JSON-compatible schemas

Open question:

Is richer native serialization worth the complexity for `jokio/rpc`, or should the project stay JSON-only to remain simpler and more interoperable?

### 5. Event Iterator, SSE, Resume, and Durable Streams

Evidence:

- oRPC has built-in Event Iterator support for streaming responses, real-time updates, and SSE.
- Server handlers can be async generator functions.
- `eventIterator(schema)` validates streamed events with any Standard Schema library.
- `withEventMeta` attaches event metadata such as event ID and retry interval.
- With Client Retry Plugin or browser `EventSource`, clients reconnect with last event ID, and oRPC passes `lastEventId` into the handler.
- oRPC can clean up side effects with generator `finally` blocks when clients close connections or errors occur.
- Client event iterators behave like async generators.
- Clients can stop streams with `AbortController` or `iterator.return()`.
- oRPC client Event Iterator does not automatically retry on error unless using the Client Retry Plugin.
- Publisher helper enables publish/subscribe plus event iterators; resume uses `lastEventId`.
- Publisher adapters include memory, ioredis, Upstash Redis, and Cloudflare Durable Objects.
- Durable Iterator integration offloads streams to a durable service, currently Cloudflare Durable Objects, with automatic reconnection and event recovery.
- Durable Iterator uses WebSocket to the Durable Object and has token refresh options.
- HTTP adapters include initial SSE comments and keep-alive comments for stream reliability.

Distillation:

oRPC already has a sophisticated streaming model for web apps:

```txt
AsyncGenerator handler
  -> Event Iterator
  -> SSE/HTTP stream
  -> lastEventId resume
  -> publisher helper
  -> durable iterator for recovery/reconnect
```

Decision:

`jokio/rpc` should not implement generic streaming naively.

Constraint:

A serious streaming design needs event schema, cancellation, resume, heartbeat, cleanup, and durability strategy.

Implication for `jokio/rpc`:

Start with one semantic stream mode:

```ts
operation.stream({
  mode: "serverEvents",
  event,
  reliability: "ephemeral" | "resumable" | "durable",
  handler: async function* (...) {},
})
```

Then map to:

- SSE for web server-to-client
- NDJSON for CLI
- NATS/JetStream for backend distribution/durability
- MCP progress/tasks for agent-facing long-running operations

Open question:

Should `jokio/rpc` integrate with NATS directly, or define a generic publisher interface first and let NATS be one adapter?

### 6. Adapter Structure

Evidence:

- oRPC docs list HTTP server adapters for fetch, Node http/http2, Fastify, and AWS Lambda.
- HTTP client adapter uses fetch.
- The handler can be `RPCHandler`, `OpenAPIHandler`, or a custom handler.
- oRPC docs separately list adapter pages for HTTP, WebSocket, and Message Port.
- oRPC `@orpc/server` package exports adapters for standard, standard-peer, fetch, node, fastify, aws-lambda, websocket, crossws, ws, bun-ws, and message-port.
- oRPC `@orpc/client` package exports standard, fetch, websocket, and message-port adapters.
- oRPC `@orpc/openapi` package exports standard, fetch, node, fastify, and aws-lambda adapters.
- Repository packages split core concerns: `@orpc/contract`, `@orpc/server`, `@orpc/client`, `@orpc/openapi`, schema packages, OpenTelemetry, framework integrations, and experimental packages.

Distillation:

oRPC uses package and adapter boundaries to keep protocol/transport concerns separate.

Decision:

`jokio/rpc` should define an adapter interface before adding a second or third adapter.

Constraint:

Without a stable adapter contract, Express, MCP, CLI, OpenAPI, and streaming code will couple to internal implementation details.

Implication for `jokio/rpc`:

Possible long-term package split:

```txt
@jokio/rpc          // current package, maybe core + HTTP first
@jokio/rpc-openapi  // OpenAPI generator/handler
@jokio/rpc-mcp      // MCP adapter
@jokio/rpc-cli      // CLI adapter
@jokio/rpc-nats     // NATS adapter
```

Open question:

Should package split happen early, or stay as one package until the core operation registry stabilizes?

### 7. Metadata and Safety Annotations

Evidence:

- oRPC procedures support `.meta()` with arbitrary typed key-value metadata.
- Metadata can be inspected inside middleware through `procedure['~orpc'].meta`.
- `.meta()` calls are spread-merged.
- oRPC OpenAPI metadata is separate and lives mostly in `.route()`, `.tag()`, and `route.spec`.
- MCP tools require tool-level fields and semantics that are different from OpenAPI metadata: `inputSchema`, optional `outputSchema`, `annotations`, `execution.taskSupport`, structured content, and tool-specific error semantics.
- MCP ToolAnnotations include `readOnlyHint`, `destructiveHint`, `idempotentHint`, and `openWorldHint`.
- MCP says these annotations are hints and clients should not make decisions from untrusted servers based on them.
- MCP tools also have `execution.taskSupport` with `forbidden`, `optional`, or `required`.

Distillation:

oRPC has metadata powerful enough to store safety information, but it does not appear to have a first-class MCP/agent safety model.

Decision:

This is a real differentiation path for `jokio/rpc`.

Constraint:

Agent-facing safety metadata cannot be generic `.meta()` only. It needs named fields and clear projection rules.

Implication for `jokio/rpc`:

Define operation annotations in core:

```ts
annotations: {
  readOnly: true,
  destructive: false,
  idempotent: true,
  openWorld: false,
  requiresConfirmation: false,
  longRunning: false,
}
```

Then project to MCP:

```txt
readOnly -> readOnlyHint
destructive -> destructiveHint
idempotent -> idempotentHint
openWorld -> openWorldHint
longRunning -> execution.taskSupport
```

Open question:

What operation annotations are genuinely cross-surface, and which should stay adapter-specific?

### 8. Where oRPC Is Awkward for MCP/CLI/Agents

Evidence:

- oRPC docs and packages show first-class RPC, OpenAPI, adapters, client integrations, streaming, metadata, and OpenTelemetry.
- The docs navigation and package list do not show first-class MCP or CLI packages.
- MCP tools require root object `inputSchema`; optional root object `outputSchema`; `structuredContent`; `isError`; tool annotations; task support; progress; cancellation; and protocol-vs-tool error separation.
- MCP progress is based on request `_meta.progressToken` and `notifications/progress`.
- MCP cancellation uses `notifications/cancelled`, while task-augmented requests use `tasks/cancel`.
- MCP tasks are experimental but define long-running task semantics, polling, task status notifications, task results, cancellation, TTL, and task-level capability negotiation.

Distillation:

oRPC can probably be adapted to MCP, but its center of gravity is still API/RPC/OpenAPI, not agent tool semantics.

Likely friction points:

- MCP output schema is currently root-object restricted, while oRPC outputs can be any serializable type unless constrained.
- MCP tool execution errors should be returned as tool results with `isError: true`, not thrown as protocol-level JSON-RPC errors.
- MCP progress and cancellation are protocol notifications, not SSE/event iterator semantics.
- MCP tasks are durable request wrappers, not the same thing as oRPC durable iterators.
- Agent-useful descriptions and recovery guidance are not the same as OpenAPI summaries.
- CLI projection needs command/flag/output UX metadata that OpenAPI metadata does not model.

Decision:

`jokio/rpc` should make MCP and CLI projection explicit design targets if this is the intended differentiation.

Constraint:

OpenAPI metadata cannot be the universal metadata model. MCP/CLI/agent metadata needs its own semantic layer, ideally derived from core operation annotations.

Implication for `jokio/rpc`:

The core operation model should contain:

- title
- description
- examples
- input/output schemas constrained to JSON object when projecting to MCP
- typed errors plus recovery guidance
- read-only/destructive/idempotent/open-world hints
- long-running/task support
- confirmation requirement
- auth/scopes
- progress model
- cancellation model

Open question:

Should `jokio/rpc` generate MCP directly, or generate an intermediate "agent operation manifest" that an MCP adapter consumes?

### 9. Cross-Reference: oRPC vs jokio/rpc Vision

| Capability | oRPC evidence | `jokio/rpc` implication |
|---|---|---|
| Procedure-first | `os.input().output().handler()` | Move beyond method/path as root |
| Contract-first | `@orpc/contract`, `oc`, contract routers | Keep contract separate from handler possible |
| Typed errors | `.errors`, `ORPCError`, typed client errors | Add typed error model early |
| HTTP error projection | OpenAPI default error mappings | Define HTTP + MCP + CLI projection rules |
| OpenAPI generation | OpenAPI 3.1.1, schema converters, operation metadata | Do not hand-wave OpenAPI |
| RPC/OpenAPI split | `RPCHandler` vs `OpenAPIHandler` | Consider separate optimized and standard surfaces |
| Native types | RPC supports Date/BigInt/Map/Set/etc. | Decide JSON-only vs native serialization |
| SSE streaming | Event Iterator async generators | Use AsyncIterable as semantic stream core |
| Resume | `lastEventId`, publisher resume, durable iterator | Model resume/durability explicitly |
| Adapters | fetch/node/fastify/aws-lambda/websocket/message-port | Define adapter interface before adapter sprawl |
| Metadata | typed `.meta()` plus OpenAPI `.route()` | Add core safety annotations, not just arbitrary metadata |
| MCP | no first-class docs/package found | Potential differentiation |
| CLI | no first-class docs/package found | Potential differentiation |
| Agent manifest | no first-class docs/package found | Potential differentiation |

### Final Distillation

oRPC validates the architecture direction but also narrows the opportunity.

It proves this is a real shape:

```txt
operation/procedure contract
  -> typed server implementation
  -> typed client
  -> OpenAPI
  -> adapters
  -> streaming
```

But it also means `jokio/rpc` needs a sharper reason to exist.

The strongest reason:

```txt
operation contract
  -> app API
  -> MCP tools
  -> CLI commands
  -> agent/codemode manifest
  -> OpenAPI
  -> stream transports
```

Decision:

Do not clone oRPC. Use oRPC as the benchmark.

Constraint:

Every proposed `jokio/rpc` feature should be checked against: "Does oRPC already solve this well?"

Implication for `jokio/rpc`:

The first spike should include MCP and CLI metadata from day one. Otherwise the design will collapse back into the same RPC/OpenAPI space where oRPC is already strong.

Open question:

Can a simpler library win by being narrower and more agent-native, or is contributing to oRPC the better path if the desired scope keeps expanding?
