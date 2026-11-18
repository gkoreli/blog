# NemoClaw install pairing and policy-client trial

On November 18, GitHub resolved [`lkg`](https://github.com/NVIDIA/NemoClaw/tree/lkg) and [`v0.0.144`](https://github.com/NVIDIA/NemoClaw/tree/v0.0.144) to [`82e1ad7474ec7175c5b860b2bfa9d7940bc6e75f`](https://github.com/NVIDIA/NemoClaw/tree/82e1ad7474ec7175c5b860b2bfa9d7940bc6e75f). The [tagged install script](https://github.com/NVIDIA/NemoClaw/blob/82e1ad7474ec7175c5b860b2bfa9d7940bc6e75f/install.sh#L20) chooses `lkg` by default. Both bounds in the [tagged blueprint](https://github.com/NVIDIA/NemoClaw/blob/82e1ad7474ec7175c5b860b2bfa9d7940bc6e75f/nemoclaw-blueprint/blueprint.yaml#L6) are `0.0.116`. That pairing is the basis of this trial.

The real [OpenShell release](https://github.com/NVIDIA/OpenShell/releases/tag/v0.0.116) for Darwin ARM64 passed the SHA-256 checks against the release digest and the [NemoClaw trust record](https://github.com/NVIDIA/NemoClaw/blob/82e1ad7474ec7175c5b860b2bfa9d7940bc6e75f/ci/openshell-upgrade-trust.json). It ran `--version` and `policy get/set --help`. The real tagged blueprint client received script-controlled responses for effective, base, and saved-revision reads. Five further captures checked status-zero, explicit refusal, transport interruption, timeout, and unclassified failure. [Fixture](policy_client_trial.mjs) · [Results and source hashes](results/policy-client-2026-11-18.json).

## Reproduce the client trial

Extract the exact tagged source and verified OpenShell archive in an owned workspace. Install `yaml@2.8.3` in that scratch checkout's dependency tree. Compile the shipped shared TypeScript boundary at the expected import path with Bun 1.4.0, then pass the source and executable to the fixture.

```sh
cd /path/to/pinned-nemoclaw
bun build --target=node --format=cjs --packages=external \
  --outfile nemoclaw/src/shared/openshell-policy-boundary.cjs \
  nemoclaw/src/shared/openshell-policy-boundary.cts
bun /path/to/policy_client_trial.mjs /path/to/pinned-nemoclaw \
  /path/to/verified/openshell /path/to/fresh-result.json
```

The first import reached the expected missing compiled boundary. Compiling it at that path resolved the setup. No NemoClaw installation or gateway was started. The classification result describes the client boundary, and inspection of the host's separate policy action describes what source is intended to do after submission. Enforced policy, credential custody, provider cleanup, and sandbox replacement need their own end-to-end evidence.
