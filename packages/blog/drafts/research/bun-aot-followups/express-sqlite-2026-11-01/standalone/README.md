# Generate the serializer before compiling

This control uses fast-json-stringify **7.2.0**, matching Fastify's locked dependency in the default experiment. The direct dependency exposes its supported standalone generator; the transitive package/snapshot lock is unchanged. `generate.mjs` emits `serializer.cjs` without hand edits, then the server imports that function and returns it from Fastify's serializer compiler. The emitted source and final lock are saved only after execution and audit.

[Upstream standalone mode](https://github.com/fastify/fast-json-stringify/blob/v7.2.0/README.md#standalone), [source license](fast-json-stringify.LICENSE). Generated serializer code retains the upstream MIT terms. The script and application wrappers follow this repository's code license.

The emitted module includes upstream trailing whitespace. It is preserved byte-for-byte to match the source compiled in the experiment and its recorded SHA-256. Authored-file diff checks exclude only this generated file; syntax, source hashes, contracts and numeric checks still include it.

The four-case contract compares runtime generation and standalone output under both source execution and native AOT. It covers the fixed payload, extra root/nested fields, a numeric string and a missing required property. This is bounded compatibility evidence. More complex schemas, custom formats, conditional validation and cross-version numeric-array cutoffs need their own cases. The fixture uses none of those conditional schema features.

Run the full standalone control behind the host guard using `full-study.py --standalone-only` and a prepared work directory. Keep the generated module, data and installed packages together for reproduction. Bun bundles its reachable code into the executable; the standalone JavaScript module on its own still needs the serializer helpers from the installed package.
