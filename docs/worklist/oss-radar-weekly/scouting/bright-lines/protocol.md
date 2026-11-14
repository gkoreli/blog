# Bright Lines qualification probe

November 14, 2026. This is a candidate investigation for a later OSS Radar, not a selected article or installed protection for this repository. Source is fixed at `84cfe3912b1c15dd1caf8a46bcbaab5d98b5a2a3` in [LeriderTechnologies/bright-lines](https://github.com/LeriderTechnologies/bright-lines/tree/84cfe3912b1c15dd1caf8a46bcbaab5d98b5a2a3).

Question: which failures does a supervised hook reject itself, and where does the host's failure policy take over? A candidate article must distinguish the pattern guard, the shell wrapper, the host and ordinary human permission prompts.

## Declared controls

Run the unchanged upstream unit suite first. Then run the [direct process probe](probe.py), using the exact configured shell wrapper and an isolated counter/stop directory. Proposed Bash commands are JSON data; none are executed.

| Case | Expected observation before running |
| --- | --- |
| Ordinary command payload | Guard exits 0; this is not host permission approval |
| Network command payload | Guard exits 2 with its refusal |
| Invalid JSON | Guard exits 2 |
| Guard script exits 1 | Exact shell wrapper converts failure to exit 2 |
| Same-session counter lock held by the probe | Guard waits beyond its configured 10-second deadline; wrapper has no completed refusal |
| Lock released, same network payload | Guard again exits 2 |

The lock test follows source inspection of blocking `fcntl.flock` before command matching. It is controlled fault injection into an owned scratch counter directory. It does not establish that ordinary parallel calls naturally stall for ten seconds, or that an agent can produce that condition without other access. The probe kills only its own newly created process group on timeout and releases its own lock.

Current [Claude Code hook documentation](https://code.claude.com/docs/en/hooks#block-the-action-when-a-hook-fails) describes `onFailure: "block"` from v2.1.295, including timeout handling. The pinned template omits that field. Host behavior and the proposed field's effect remain **primary documented**, not experimentally reproduced by this direct-process probe. No model session, provider API, actual outward command, guard installation or account/settings change belongs to this qualification.

Run from the blog checkout with Python on a POSIX system:

```sh
python3 docs/worklist/oss-radar-weekly/scouting/bright-lines/probe.py /absolute/pinned-bright-lines /tmp/fresh-bright-lines-receipt.json
```

Use a fresh receipt path. Keep complete upstream test logs outside public Git. Record accepted outcomes, source hashes and platform in the receipt; preserve failures if observed. A full article would still need host-level acceptance and representative allowed-workflow checks before recommending adoption.
