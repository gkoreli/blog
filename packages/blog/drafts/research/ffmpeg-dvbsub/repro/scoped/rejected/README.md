# Rejected row-layout candidate

This is the independently checked 33-addition/12-deletion prototype, retained for research reproduction. It is not the preferred PR. Its random-image function slowdown reached about 29%, prompting the final original-layout design.

`generate.py`, `native.py`, `checks.py` and `ScratchRows.tla` preserve its generator, differential harness and bounded proof/model checks. Pass disposable `--out` directories and the same pinned tools/checkout described in the parent README. Relative baseline lookup is adjusted only for this archival folder. The final generated source hash is `2b314b26b0fcf08f2e2b6fdc18a73cce90b910c4353fe327258bb48083661b2c`.

The whole-decoder measurement used its source with an ordinary comment marker; a later Doxygen-only correction produces identical preprocessed translation units. The separate preprocessing receipt records both hashes. Do not attribute this candidate's results or scratch-row proof to the final 17-line patch.
