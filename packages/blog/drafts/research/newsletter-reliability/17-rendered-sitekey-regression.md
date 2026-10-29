# The rendered signup form did not deliver its public key

October 29, 2026 UTC. Discovered while accepting the prompt-provenance update in [analytics Research 97](../analytics-retrospective/97-fresh-automated-fetches-and-measurement-gaps.md). This is a current rendered-form failure, separate from the September verifier-secret incident and its [accepted signup](15-live-signup-acceptance.md).

## Evidence and consequence

One planned prefetch GET captured the production prompt page on source `4470e98` / Worker `c5ddd54a`. Its main newsletter form has `novalidate<="" --bk-0--=""`, no `data-turnstile-sitekey`, and a Turnstile slot/script. The source uses this nested template fragment in an opening tag:

```ts
novalidate${turnstileSiteKey ? html` data-turnstile-sitekey="${turnstileSiteKey}"` : ''}
```

`initSubscribeForm()` reads `form.dataset.turnstileSitekey`. A missing value prevents widget initialization; submitting then follows `subscribe_widget_configuration_missing` before a signup request. The existing client tests construct that dataset manually, so they do not cover whether the real template supplies it.

The installed `@nisli/core` 0.57.0 binder processes attribute values and calls `setAttribute`; a nested TemplateResult is not an attribute-syntax string. Installed `@nisli/ssg` 0.4.0 mounts the template, settles work and serializes `host.innerHTML`. This path reproduces the malformed form. An isolated old-source build with a nonempty synthetic public-key value exactly reproduces all 14,152 bytes of the saved production page, including the missing attribute. Neither a real key nor a private environment file is needed to demonstrate the failure.

Cloudflare's [widget documentation](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/) requires a sitekey for explicit rendering. Its [setup guide](https://developers.cloudflare.com/turnstile/get-started/) distinguishes the public sitekey from the server's secret key. This repair changes public-key delivery; it does not alter server verification, credentials, challenges, admission limits or provider sending.

This weakens subscription counts as evidence of interest. It does not establish the first affected deployment, how many attempts failed, how many addresses were lost, or the cause of every earlier zero-signup interval. The September successful flow remains dated evidence. The most recent template/SSG change in Git is an investigation lead, not proof of incident duration.

## Repair and acceptance

The default form and six equivalent experimental-template locations now bind the scalar attribute value directly:

```ts
novalidate data-turnstile-sitekey=${turnstileSiteKey}
```

An unconfigured build renders an empty attribute and no widget slot, preserving the client's missing-configuration guard. Four [rendering/client regression tests](../../../test/subscribe-rendering.test.ts) cover eleven form renderers with nonempty, empty and special-character values, plus initialization of the actual client from an actual SSG snapshot. The latter calls a stub widget's render method once and never executes a challenge or sends a request. DOM value round-trips check escaping without demanding one particular HTML entity serialization.

The production build now rejects form binding-marker leaks and a configured main subscription form without its public key. An integration check substitutes the already captured broken production page into the isolated output: validation rejects it with both intended messages. Restoring the fixed output passes. This tests the shipped artifact, rather than a hand-built DOM with the expected key already present.

[Local checks](rendered-sitekey-checks.json):128 site tests, workspace types,22 Markdown posts valid and an isolated 33-post build with synthetic public configuration. No email, real challenge, production subscription POST, diagnostic D1 query, migration or configuration change occurs. Source delivery, activation and production DOM acceptance remain separate. An actual end-to-end challenge, confirmation delivery and activation have not been repeated.

Next: publish the checked templates, join source/build/full Worker allocation, verify a saved excluded response and browser DOM show a nonempty key without malformed attributes. Do not infer email delivery from rendered markup. Keep TASK-0125's other observability requirements open.

The private before/after/code archive has 39 files under SHA-256 manifest `5886ab3d069219e0d4afd8e87a1d551231c68d42de2335dc6658cdce402930a3`. Source delivery and later live acceptance are separate. October 31 remains a review date, not automatic deletion.
