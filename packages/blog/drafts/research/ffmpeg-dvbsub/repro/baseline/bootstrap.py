"""Prepare a fresh isolated checkout for reproducing this evidence package."""
from pathlib import Path
import hashlib, subprocess, sys, urllib.request
root=Path(__file__).resolve().parent
sanitized='--sanitized' in sys.argv
repo=root/('ffmpeg-san' if sanitized else 'ffmpeg')
if repo.exists():
    raise SystemExit(f'{repo} already exists; use the saved instructions or a fresh extracted folder')
subprocess.run(['git','init',str(repo)],check=True)
subprocess.run(['git','remote','add','origin','https://github.com/FFmpeg/FFmpeg.git'],cwd=repo,check=True)
subprocess.run(['git','fetch','--depth=1','origin','aab6cec3e8415154b3f0570f8d131db07a9901de'],cwd=repo,check=True)
subprocess.run(['git','checkout','--detach','FETCH_HEAD'],cwd=repo,check=True)
subprocess.run(['git','apply','--check',str(root/'candidate.patch')],cwd=repo,check=True)
subprocess.run(['git','apply',str(root/'candidate.patch')],cwd=repo,check=True)
sample=root/'dvbsubtest_filter.ts'
if not sample.exists():
    urllib.request.urlretrieve('https://fate-suite.ffmpeg.org/sub/dvbsubtest_filter.ts',sample)
assert hashlib.sha256(sample.read_bytes()).hexdigest()=='93ad6d0be649bb29697275ff522a983d475a1e58ab070271f912b86799e04a86'
samples=root/'samples/sub';samples.mkdir(parents=True,exist_ok=True)
(samples/'dvbsubtest_filter.ts').write_bytes(sample.read_bytes())
args=['./configure','--disable-everything','--disable-autodetect','--disable-doc','--disable-network','--enable-decoder=dvbsub','--enable-encoder=dvbsub,pcm_s16le,rawvideo','--enable-parser=dvbsub','--enable-demuxer=mpegts','--enable-muxer=framecrc','--enable-protocol=file,pipe','--disable-ffplay','--disable-ffprobe',f'--samples={root/"samples"}']
if sanitized:args+=['--extra-cflags=-fsanitize=address,undefined -fno-omit-frame-pointer','--extra-ldflags=-fsanitize=address,undefined']
subprocess.run(args,cwd=repo,check=True)
subprocess.run(['make','-j4','ffmpeg'],cwd=repo,check=True)
if not sanitized:
    for script in ['build_variants.py','build_rle.py','build_decoders.py','make_harness.py']:
        subprocess.run(['python3',str(root/script)],check=True)
    subprocess.run([str(root/'packets-upstream'),'generate',str(root/'corpus.dvbpackets')],check=True)
print('Prepared',repo)
