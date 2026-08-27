# X media and motion reference

Audit date: 2026-08-26. Recheck X's official documentation before relying on these limits for a new launch.

## What X accepts

| Surface | Documented input | Important limits | Launch decision |
|---|---|---|---|
| Ordinary web video upload | X recommends MP4 for web; its video help documents the normal upload envelope | 512 MB, 140 seconds for non-Premium accounts, up to 1920×1200 landscape or 1200×1900 portrait, 1:2.39–2.39:1, 40 fps, 25 Mbps | Use H.264 MP4, 1200×1200, 30–40 fps, under 60 seconds |
| Ordinary GIF upload | Animated GIF | 15 MB on web, 5 MB on mobile; one GIF per post; it must loop | Treat 15 MB as the hard web ceiling and 5 MB as the portable target |
| Media Studio | MP4 or MOV video; GIF and images | Recommends H.264 and 5–8 Mbps; documents 60 fps for Media Studio, not ordinary web | Do not apply its 60 fps allowance to an ordinary composer upload |
| X API media configuration | Schema includes MP4, WebM, QuickTime, MPEG-TS, GIF, JPEG, PNG, and WebP media types | This is an API schema, not proof that the ordinary x.com composer accepts every type | Treat WebM as API-specific unless the actual posting path is tested |

X says videos 60 seconds or shorter loop automatically. That makes native video the best high-quality animation format: it preserves gradients and text edges far better than an indexed-color GIF while usually producing a smaller file.

Official sources:

- [How to share and watch videos on X](https://help.x.com/en/using-x/x-videos)
- [How to post pictures and GIFs on X](https://help.x.com/en/using-x/posting-gifs-and-pictures)
- [How to post on X](https://help.x.com/en/using-x/how-to-post)
- [Media Studio FAQs](https://help.x.com/en/using-x/media-studio-faqs)
- [X TypeScript SDK media upload configuration](https://docs.x.com/xdks/typescript/reference/interfaces/Schemas.MediaUploadConfigRequest)
- [Upload a caption file on X](https://help.x.com/en/using-x/upload-caption-srt-file)
- [FFmpeg `palettegen` source and options](https://ffmpeg.org/doxygen/trunk/vf__palettegen_8c_source.html)
- [FFmpeg `paletteuse` filter reference](https://ffmpeg.org/doxygen/5.1/vf__paletteuse_8c.html)

## Delivery defaults

### High-quality master: MP4

- Canvas: 1200×1200 square unless the mechanism genuinely needs another shape.
- Frame rate: capture and encode at the same 30–40 fps. Never turn a 12 fps capture into smooth 40 fps by duplicating frames.
- Duration: 5–10 seconds for a visual loop; never exceed 60 seconds when automatic looping matters.
- Codec: H.264/AVC, `yuv420p`, no audio unless sound carries meaning.
- Quality: CRF 18–20 with a 5–8 Mbps target or ceiling is a practical starting point.
- Packaging: `faststart` so playback can begin before the full file downloads.
- Poster: make frame zero meaningful because autoplay may be off or delayed.

### GIF fallback

- Canvas: 900×900 is a strong default; reduce before destroying color or legibility.
- Frame rate: 12–20 fps depending on motion; use 15 fps first.
- Duration: keep it short and make the loop intentional.
- Palette: generate a palette from the final scaled clip; start at 192 colors, then test 128 or 256.
- Dither: compare Bayer and Sierra dithering. Dither can rescue gradients but can also create noisy compression.
- Motion: keep large areas stable, use differential frame regions, and avoid full-screen grain or subtle gradients.
- Limits: stay under 15 MB for web and preferably under 5 MB if the asset may be posted from mobile.

GIF can look good when the scene is short, the color set is constrained, and the moving region is small. It remains a compromise for tiny type, soft shadows, gradients, and photographic detail.

## Shot-list template

Design two to four named states, not continuous ornamental movement:

| Time | State | Reader learns | Camera/motion | Hold |
|---:|---|---|---|---:|
| 0.0 s | Poster | The subject and tension | Static or one immediate cue | 250 ms |
| 0.25 s | Mechanism | What is changing | Reveal, route, or scroll | 500 ms |
| 2.0 s | Consequence | Why the change matters | Focus or count transition | 600 ms |
| 4.0 s | Resolution | The result or article title | Settle back toward loop seam | 800–1200 ms |

The first meaningful motion should begin within roughly 250 ms. Leave 800–1200 ms at the final readable state. Prefer a designed transition back to the first state over an abrupt reset.

## Deterministic article capture

Use the actual article/preamble implementation whenever possible. Add a social-capture mode rather than rebuilding a lookalike.

1. Accept a capture time through a query parameter, attribute, or harness.
2. Wait for `document.fonts.ready`, images, layout, and component initialization.
3. Pause relevant CSS/Web Animations and set each animation's `currentTime` explicitly.
4. Set scroll or camera position from the same deterministic timeline.
5. Expose a DOM marker such as `data-capture-ready="true"` only after painting the requested state.
6. Capture one exact frame for each timeline step at 30–40 fps.
7. Encode with `scripts/encode_social_clip.py` and inspect the delivery file, not only the source frames.

Real-time screenshot loops are acceptable for a rough proof but often contain timing jitter, duplicated states, loading flashes, and uneven scroll velocity.

## Visual quality gates

- Inspect at actual phone display width and at 100% pixels.
- No clipped words, split identifiers, layout shift, browser chrome, accidental cursor, or scrollbars.
- No one-frame flash at the loop seam.
- Text remains readable after X recompression; avoid body-copy-sized text inside the media.
- Motion explains hierarchy, causality, scale, or change. Remove motion that only makes the frame busy.
- The clip is fully understandable while muted.
- Reduced-motion behavior in the article remains correct even if the social capture uses the full sequence.
- Add concise, descriptive X alt text; do not stuff the article summary into it.

## Encoder

From a numbered frame directory:

```bash
python3 .agents/skills/launch-article-on-x/scripts/encode_social_clip.py \
  --frames-dir /absolute/path/to/frames \
  --pattern 'frame-%04d.png' \
  --output-prefix /absolute/path/to/social/launch \
  --input-fps 40
```

The encoder creates an MP4 and GIF, probes them, and rejects outputs outside this skill's loop limits. Pass `--no-gif` when only the high-quality master is needed.
