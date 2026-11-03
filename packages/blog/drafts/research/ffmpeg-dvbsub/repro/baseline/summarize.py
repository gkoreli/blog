from pathlib import Path
import hashlib,json,subprocess,tarfile
root=Path(__file__).resolve().parent
repo=root/'ffmpeg'
real=json.loads((root/'whole-decode.json').read_text())
corpus=json.loads((root/'corpus-bench.json').read_text())
palette=(root/'verify.txt').read_text().strip()
rle=(root/'rle-verification.txt').read_text().strip()
assert palette==(root/'verify-san.txt').read_text().strip()
assert rle==(root/'rle-verification-san.txt').read_text().strip()
assert (root/'sanitizer-run.txt').read_text().startswith('PASS fully instrumented decoder')
subprocess.run(['python3',str(root/'prepare_delivery.py')],check=True)
manifest={
 'date_local':'2026-11-03 America/Los_Angeles',
 'scope':'Candidate local refactor of DVB palette reconstruction, RLE run filling, and palette output copy',
 'reference_commit':'a1a7737c4bcace8615f70b8f2cc7fc515ca26522',
 'surrounding_checkout_commit':'aab6cec3e8415154b3f0570f8d131db07a9901de',
 'platform':'arm64 macOS 27.0.1, Apple Clang 21.0.0',
 'final_source_sha256':hashlib.sha256((root/'final.c').read_bytes()).hexdigest(),
 'patch_sha256':hashlib.sha256((root/'candidate.patch').read_bytes()).hexdigest(),
 'palette_checks':palette,'rle_checks':rle,
 'decoder_verification':json.loads((root/'decoder-verification.json').read_text()),
 'generated_packet_verification':json.loads((root/'corpus-verification.json').read_text()),
 'full_sanitizer_checks':json.loads((root/'sanitizer-decoder-results.json').read_text()),
 'fate':'normal and fully sanitized fate-sub-dvb passed',
 'x86':'cross-compiled palette harness; execution unavailable (bad CPU type). No x86 runtime claim.',
 'measurements':{'real_sample':real,'generated_corpus':corpus},
 'rejected_experiments':[
  'Initial per-neighbour conditional histogram updates regressed on noise and were replaced.',
  'Unbounded native block probes were replaced with a bounded per-row probe and scalar fallback.',
  'Lazy scratch allocation was excluded: existing subtitle-output callers can swallow allocation errors. A separate error-propagation fix and failure tests would be required.'
 ],
 'limits':[
  'Conditional mathematical equivalence argument; no machine-checked implementation proof or absolute regression guarantee.',
  'Runtime tests and benchmarks cover ARM64/Clang on one machine, one real sample, and a constructed packet corpus.',
  'The 176 generated packets cover 2/4/8-bit coding, four patterns, provided/missing CLUTs, and non-modifying flags. They are not representative traffic.',
  'Decoder benchmarks rotate variant order and use process CPU time: 7 rounds for real, 5 for generated.',
  'Default-option real-sample and disabled-reconstruction timings have no established speedup.',
  'No standalone speedup claim for the RLE helper; it primarily removes ten repeated loops.',
  'Private scratch representation changes; public decoding results, score rounding, ties, unused palette entries, allocation count/order, and existing error paths are preserved.',
  'No upstream submission, review, release, or production acceptance. Blog Git checkout unchanged.'
 ]
}
(root/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
r=real['1']['medians'];c=corpus['1']['medians'];a=corpus['-1']['medians']
text=f'''DVB subtitle decoder: broader local refactor and optimization
Checked 2026-11-03 (America/Los_Angeles)

Retained changes
----------------
Palette reconstruction is expressed as three stages: count boundary statistics,
order the present colours, and write the ranked palette. The collector initializes
only rows it uses, and the scorer scans only present colours in ascending index
order. FFmpeg's AV_RN64 helper skips eight proven-interior pixels at once, with
scalar fallback after two failed block probes per row. The matrix is named for
its meaning (clut_adjacency), and the old global V/L macros are gone.

Ten repeated RLE fill loops share a clipped native memset helper. Mapping,
non-modifying colour decisions, clipping, input consumption, and return values
are preserved. This cleanup has no independently established speedup.

The output path avoids the initial palette copy when a computed palette will
overwrite it. Allocation count/order and existing failure behaviour are retained.
Scratch remains inline, one row smaller (1,024 bytes), with no new allocation path.

Whole-decoder results
--------------------
CPU seconds; medians from rotating execution order. Same compiler and surrounding
libraries for all variants. Timings are NOT the tweet's peak function benchmark.

Real FATE sample, compute_clut=1, 100 complete passes, 7 rounds:
Merged upstream: {r['upstream']:.6f} s
Our first patch: {r['prior']:.6f} s
Final refactor:  {r['final']:.6f} s
Final vs merged upstream: {r['upstream']/r['final']:.3f}x
Final vs our first patch: {r['prior']/r['final']:.3f}x

Generated 176-packet corpus, compute_clut=1, 10 passes, 5 rounds:
Merged upstream: {c['upstream']:.6f} s
Our first patch: {c['prior']:.6f} s
Final refactor:  {c['final']:.6f} s
Final vs merged upstream: {c['upstream']/c['final']:.3f}x
Final vs our first patch: {c['prior']/c['final']:.3f}x

Generated corpus, default compute_clut=-1, 10 passes, 5 rounds:
Merged upstream: {a['upstream']:.6f} s
Our first patch: {a['prior']:.6f} s
Final refactor:  {a['final']:.6f} s
Final vs merged upstream: {a['upstream']/a['final']:.3f}x
Final vs our first patch: {a['prior']/a['final']:.3f}x

The real sample supplies a palette, so its default-option run does not reconstruct
one and has no established benefit. Corpus compute_clut=0 also shows no established
speedup. Do not generalize forced-path or constructed-corpus results to all users.

Validation
----------
{palette}
{rle}
Both differential harnesses also pass AddressSanitizer and UndefinedBehaviorSanitizer.
The palette tests include exact-size buffers, widths 1-40, padded and negative strides,
tiny exhaustive cases, random relabelled indices, and flat/textlike/checker/block inputs.
The full decoder AND libraries were rebuilt with both sanitizers and pass real and
generated packet checks in all four compute_clut modes, matching normal output bytes.
Normal and sanitized make fate-sub-dvb pass. The three incremental patches apply
cleanly and reproduce final.c exactly; git diff --check passes.

Guarantee boundary
------------------
proof.txt gives a conditional mathematical equivalence argument for the statistics,
score recurrence, tie breaking, palette writes, block reads, RLE fills, and output copy.
It is not a machine-checked proof of the implementation or every compiler/platform.
No finite test suite establishes an absolute 100% regression guarantee.
An x86 palette harness cross-compiles, but this host cannot execute it; runtime
evidence remains ARM64-only. Independent review and more real samples remain useful.

Rejected memory experiment
--------------------------
A lazy workspace prototype removed the large inline scratch array, but inspection
found that existing subtitle-output callers can swallow errors. We excluded the
prototype rather than introduce a new allocation failure into those paths. It is
not part of candidate.patch or the incremental patch series.

Files and reproduction
----------------------
candidate.patch: complete final change against the merged source.
01-palette-boundaries.patch, 02-native-rle-fill.patch, 03-palette-output-copy.patch:
sequential reviewable changes. final.c is the exact refactored source.
proof.txt: equivalence argument and assumptions. sources.txt: authoritative references.
manifest.json: hashes, raw timing samples, output checks, conditions, and limits.

The archive is self-contained except for the compiler, FFmpeg checkout, and public
FATE sample. In a fresh extracted folder run python3 bootstrap.py to download the
sample, prepare the pinned FFmpeg checkout, and build the comparison programs.
Run python3 bootstrap.py --sanitized for the separate sanitizer checkout. The
existing local ffmpeg path is a symlink to the earlier isolated experiment checkout.
build_variants.py, build_rle.py, build_decoders.py and build_final.py
preserve the separate experimental stages; rebuilds remove both the codec object
and archive so older make versions cannot reuse stale code across rapid rewrites.
make_harness.py + harness.c reproduce isolated algorithm checks. rle-test.c covers
RLE equivalence. compare_decoders.py and compare_packets.py reproduce measurements.
run_san.py validates a separately configured sanitizer build under ffmpeg-san.

No upstream submission or publication. No blog Git changes. FFmpeg source retains
its upstream LGPL notices. The evidence archive excludes large raw bitmap dumps,
executables, and the rejected lazy-allocation prototype.
'''
(root/'results.txt').write_text(text)
files=['results.txt','manifest.json','candidate.patch','01-palette-boundaries.patch','02-native-rle-fill.patch','03-palette-output-copy.patch','final.c','upstream.c','prior-candidate.c','original.c','harness-header.h','decode.c','bootstrap.py','proof.txt','sources.txt','palette.c','rle.c','build_variants.py','build_rle.py','build_decoders.py','build_final.py','make_harness.py','harness.c','harness-v1.c','packet-test.c','rle-test.c','compare_decoders.py','compare_packets.py','run_san.py','prepare_delivery.py','summarize.py','whole-decode.json','corpus-bench.json','decoder-verification.json','corpus-verification.json','sanitizer-decoder-results.json','verify.txt','verify-san.txt','rle-verification.txt','rle-verification-san.txt','fate-final.log','fate-san.log','bench-declarative.csv']
with tarfile.open(root/'audit-evidence.tar.gz','w:gz') as archive:
    for name in files:archive.add(root/name,arcname=name)
print(text)
