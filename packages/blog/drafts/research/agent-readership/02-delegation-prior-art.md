# Agent delegation: what a publication can verify

Checked September 9, 2026 UTC / September 8 PDT. This is a bounded review of primary specifications and their current Datatracker status, not an implementation or interoperability test.

A publication can verify that a trusted authority granted a particular account's agent permission to create a subscription. Established authorization protocols already supply most of the machinery. The unresolved work is choosing the account authority, identifying the agent at the right granularity, defining the subscription permission, and obtaining meaningful approval. This review found no settled cross-vendor standard specifically for human-authorized agent subscriptions to publications.

- A signature identifies a credential holder; an authorization grant explains what that holder may do.
- An issuer's consent record depends on trust in that issuer and its approval process.
- Authorization, a successful subscription, delivery, and human reading are separate observations.

## Authorization evidence has several distinct meanings

The strongest honest claim depends on the ceremony and the parties the publication trusts. The following distinctions are engineering interpretations of the cited mechanisms.

| Evidence | What it supports | What remains unproved |
|---|---|---|
| Valid request signature | The request was signed with the corresponding key, subject to the verifier's coverage and replay checks. | The holder's human principal, permission to subscribe, or identity beyond the key's enrollment. |
| Authenticated account session | The account's authentication requirements were satisfied. OpenID Connect can convey issuer-attested subject and authentication information. | A particular subscription was approved, or the account represents a unique human. [OIDC Core 1.0, errata set 2, December 15, 2023, §2](https://openid.net/specs/openid-connect-core-1_0.html#IDToken). |
| Approval bound to an authenticated session and exact request | The application recorded approval of a stated agent, action, publication, and duration. | Independent proof that the person understood the action. The application still controls the presented terms and binding. |
| WebAuthn assertion | A registered credential answered an origin-bound challenge, with the required user-presence/user-verification checks. | Automatic display or approval of subscription terms. The application must bind the challenge to those terms. [WebAuthn Level 2, April 8, 2021, §7.2](https://www.w3.org/TR/2021/REC-webauthn-2-20210408/#sctn-verifying-assertion). |
| Trusted authorization token | The issuer granted the identified subject/client the encoded or referenced access rights. | Actual human reading, even after an authorized fetch. |

An agent using its own mailbox or creating its own account can satisfy some account checks. Calling the resulting record an **account-authorized agent subscription** preserves that limit. Calling it a verified human reader would exceed the evidence.

## OAuth already supports account-to-client authorization

For implementers, the core choice is a trusted authorization service with narrow, enforced grants. A new agent protocol is not necessary merely to let software subscribe for an account.

OAuth 2.0's authorization-code flow lets an authorization server authenticate the resource owner and obtain authorization before issuing access to a client. Its client-credentials flow instead relies on the client's own authority or previously arranged authorization; it does not demonstrate a fresh user approval. Apply current security guidance, including PKCE and strict redirect handling, rather than treating the original 2012 examples as deployment defaults. [RFC 6749, October 2012, §§4.1 and 4.4](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1); [RFC 9700 / BCP 240, January 2025, §2.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1).

**Delegation can preserve both identities.** RFC 8693 distinguishes impersonation, where the actor appears as the subject within the authorized context, from delegation, where the actor retains a separate identity. Token exchange accepts a `subject_token` and optionally an `actor_token`; a JWT can identify the account in top-level `sub` and the current agent in `act`. Nested actors record history. Prior actors are informational and must not determine access-control decisions under this RFC. `may_act` identifies a party eligible to become an actor; it is not evidence of an executed subscription. The authorization server still decides whether to issue a delegated token. [RFC 8693, January 2020, §§1.1, 4.1 and 4.4](https://www.rfc-editor.org/rfc/rfc8693.html#section-1.1).

| Building block | Contribution to a publication grant | Limit |
|---|---|---|
| [Resource Indicators, RFC 8707, February 2020](https://www.rfc-editor.org/rfc/rfc8707.html#section-2) | Restrict the intended resource, such as the publication's subscription API. | Audience restriction does not describe the permitted action. |
| [Rich Authorization Requests, RFC 9396, May 2023](https://www.rfc-editor.org/rfc/rfc9396.html#section-2) | Structured `authorization_details` can express actions, locations, and application-specific constraints. | The publication must define its permission type and enforce the granted details. The RFC does not define a publication-follow type. |
| [DPoP, RFC 9449, September 2023](https://www.rfc-editor.org/rfc/rfc9449.html#section-6) | Bind an access token to a key and require proof of that key at use time. | Key possession supplies neither account identity nor consent. DPoP does not protect the request body or general headers (§11.7). |
| [Token Revocation, RFC 7009, August 2013](https://www.rfc-editor.org/rfc/rfc7009.html#section-2), and [Introspection, RFC 7662, October 2015](https://www.rfc-editor.org/rfc/rfc7662.html#section-2) | Revoke credentials and let a resource check whether a token remains active. | Offline JWT checks and cached status can delay enforcement. Define the maximum delay and how descendants are invalidated. |

A client registration might identify an entire agent service. A per-instance key only becomes evidence of a particular agent through enrollment and lifecycle rules. Record that granularity explicitly.

There is also an established alternative: [GNAP, RFC 9635, October 2024](https://www.rfc-editor.org/rfc/rfc9635.html), specifies software delegation, client-instance key proofs, user interaction, resource rights, and grant/token management. It is broader authorization infrastructure, not a publication subscription vocabulary. Adoption by prospective subscribers would need testing before choosing it for this blog.

## Current agent drafts refine different parts of the problem

All six proposals below were active **individual Internet-Drafts**, with “I-D Exists” status, when checked. Their intended Standards Track or Informational labels are aspirations, not completed standardization. Links pin the reviewed revisions; the names should not be used as evidence of deployment.

| Proposal and document date | Relevant contribution | Practical boundary |
|---|---|---|
| [OAuth Profile for Delegated AI Agent Authorization, `draft-mishra-oauth-agent-grants-02`, August 30, 2026](https://datatracker.ietf.org/doc/draft-mishra-oauth-agent-grants/02/) | Profiles existing OAuth mechanisms for independently authenticated principal consent, agent-instance identity, audience/key binding, and attenuated token exchange. | Particularly useful design reference. Its Grantex implementation is explicitly nonconformant: §13 lists missing PAR, resource-side DPoP validation, and independent identity-provider anchoring for passkey enrollment. |
| [OAuth Actor Profile for Delegation, `draft-mcguinness-oauth-actor-profile-00`, April 30, 2026](https://datatracker.ietf.org/doc/draft-mcguinness-oauth-actor-profile/00/) | Consistent `act` representation across token families, actor-type classification, and capability discovery. | Explicitly leaves decisions about who may act for whom to deployment policy. Identity representation is only one part of consent. |
| [Authorization Evidence and Audit Trail, `draft-liu-oauth-authorization-evidence-01`, June 23, 2026](https://datatracker.ietf.org/doc/draft-liu-oauth-authorization-evidence/01/) | A RAR type carrying issuer-signed confirmation records and audit information. | §8.2 explicitly limits the proof to the issuer having recorded confirmation: a malicious issuer can fabricate evidence. Datatracker records upload/update on June 22; June 23 is the document's date. |
| [OAuth 2.0 Delegated Authorization, `draft-li-oauth-delegated-authorization-03`, July 24, 2026](https://datatracker.ietf.org/doc/draft-li-oauth-delegated-authorization/03/) | Key-bound root authorization followed by constrained client-signed delegation, without contacting the authorization server for every hop; leaf DPoP verification. | Useful for several agents passing authority. It does not establish the initial human approval merely by validating the chain. |
| [Verifiable Attenuated Delegation for AI Agent Chains, `draft-asor-wimse-agent-delegation-chain-01`, September 3, 2026](https://datatracker.ietf.org/doc/draft-asor-wimse-agent-delegation-chain/01/) | Parent commitments, constrained authority, depth/expiry checks, and offline chain verification using JWT/RAR machinery. | §9.5 acknowledges the delay between revocation and a verifier fetching updated status. A new chain format adds little to a single-agent subscription. |
| [AAuth Protocol, `draft-hardt-oauth-aauth-protocol-10`, August 6, 2026](https://datatracker.ietf.org/doc/draft-hardt-oauth-aauth-protocol/10/) | A broader agent-to-resource authorization and identity protocol built on HTTP Signature Keys, supporting several trust arrangements. | A separate protocol proposal. Existing Web Bot Auth signature verification does not implement its authorization exchanges. |

Two related **OAuth working-group drafts** have a different maturity status: [Identity Assertion JWT Authorization Grant `-04`, May 21, 2026](https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/04/), coordinates access through an identity provider already trusted for SSO; [OAuth SPIFFE Client Authentication `-02`, June 15, 2026](https://datatracker.ietf.org/doc/draft-ietf-oauth-spiffe-client-auth/02/), authenticates workloads using SPIFFE credentials. They were WG Documents, not RFCs. Neither defines a subscription permission or establishes a fresh human decision to follow a publication.

These specifications are useful prior art. Agreement among an agent provider, an account authority, and the publication still determines whether a particular grant is meaningful.

## AP2 and Visa provide commerce precedents

**Google's AP2 provides the closest documented parallel to advance permission for a future follow or delivery action.** Its [v0.2 specification](https://github.com/google-agentic-commerce/AP2/blob/e1ea56db72a6385bce3e5c1112b3a56ce60acb43/docs/ap2/specification.md) uses open and closed Checkout and Payment Mandates. In the autonomous flow, the user first approves constraints; the agent later authorizes a specific transaction within them. These are payment permissions, with no publication-follow vocabulary.

The [Agent Authorization Framework](https://github.com/google-agentic-commerce/AP2/blob/e1ea56db72a6385bce3e5c1112b3a56ce60acb43/docs/ap2/agent_authorization.md) separates initial mandate delegation from later action authorization. An open mandate binds constraints to an agent key. The agent subsequently supplies transaction binding and proof of possession; the verifier checks the mandate and returns a signed receipt. Approval occurs through a Trusted Surface. The framework supports both an external User Credential issuer and a directly trusted Agent Provider, whose signing key must remain inaccessible to the agent. Consequently, a mandate is not necessarily a personal signature by the human: the provider model still relies on provider-attested consent. These links pin the inspected project specification at commit `e1ea56d`, retrieved September 9, 2026.

[Visa's Trusted Agent Protocol merchant specification](https://developer.visa.com/capabilities/trusted-agent-protocol/trusted-agent-protocol-specifications/), an undated product specification retrieved September 9, describes agent-recognition signatures plus linked consumer-recognition and payment objects. In the Visa implementation, the recognition key establishes participation in Visa Intelligent Commerce. The consumer object uses the agent's signing key and the request's nonce; it can carry a Visa ID token. These checks associate an approved agent, request, and consumer information. The public material inspected does not define a general user-signed standing mandate for arbitrary future actions.

AP2 therefore contributes a concrete approval-and-execution design; Visa contributes a commerce trust and request-recognition design. Applying either to subscriptions would require a new permission definition and an agreed trust model. This review establishes documented designs, without testing interoperability or adoption.

## A bounded experiment for this blog

The smallest useful experiment would test explicit account approval and subsequent authorized subscription creation. This is a proposed application design, not an implemented endpoint or a standardized profile. Public articles remain available independently of this grant.

1. Enroll one agent key with proof of possession. Give the user a clear agent/provider name and explain whether the key identifies a service, installation, or run.
2. Authenticate the account independently of the requesting agent. Present the exact publication, subscription action, delivery destination, duration, and any permission to delegate. Bind approval to that pending request.
3. Store a revocable grant associating a site-scoped account identifier, enrolled key, permitted actions, publication, destination, expiration, and approval record. Simple scopes may suffice; use RAR when structured constraints improve interoperability with the chosen client.
4. Validate the grant and sender proof when creating or changing the subscription. Start with no further delegation. Revocation should stop future authorized actions and delivery according to a documented policy.
5. Measure approved accounts, active grants, successful subscription creation, and delivery separately. A subscription grant cannot establish human reading.

The existing [Web Bot Auth verifier](../../../../analytics/src/webbotauth.ts) returns signature-verification evidence and the signature agent. It does not supply this enrollment and account-approval flow. An integration would need to connect a trusted grant to an enrolled credential; an `act` claim copied from an untrusted token would add no authority.

The remaining acceptance questions are concrete: which prospective agent supports the chosen flow; who authenticates the account; what the approval view actually says; how key recovery and revocation work; and whether two implementations agree on the subscription permission. This review did not test those behaviors, audit reference repositories, or measure protocol adoption.
