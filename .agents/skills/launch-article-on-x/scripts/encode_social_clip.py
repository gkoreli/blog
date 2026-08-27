#!/usr/bin/env python3
"""Encode deterministic article frames as X-ready MP4 and GIF files."""

from __future__ import annotations

import argparse
import glob
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--frames-dir", required=True, type=Path)
    parser.add_argument("--pattern", default="frame-%04d.png")
    parser.add_argument("--output-prefix", required=True, type=Path)
    parser.add_argument("--input-fps", type=float, default=40.0)
    parser.add_argument("--video-fps", type=float, default=40.0)
    parser.add_argument("--gif-fps", type=float, default=15.0)
    parser.add_argument("--width", type=int, default=1200)
    parser.add_argument("--height", type=int, default=1200)
    parser.add_argument("--gif-width", type=int, default=900)
    parser.add_argument("--gif-height", type=int, default=900)
    parser.add_argument("--colors", type=int, default=192)
    parser.add_argument("--pad-color", default="0xF7F5F1")
    parser.add_argument("--no-gif", action="store_true")
    parser.add_argument("--force", action="store_true")
    return parser.parse_args()


def fail(message: str) -> None:
    raise SystemExit(message)


def require_binary(name: str) -> None:
    if shutil.which(name) is None:
        fail(f"Required executable is unavailable: {name}")


def glob_pattern(pattern: str) -> str:
    replaced = re.sub(r"%0?\d*d", "*", pattern)
    if replaced == pattern:
        fail("Pattern must contain an ffmpeg integer token such as %04d")
    return replaced


def detect_magic(path: Path) -> str:
    with path.open("rb") as handle:
        header = handle.read(12)
    if header.startswith(b"\x89PNG\r\n\x1a\n"):
        return "PNG"
    if header.startswith(b"\xff\xd8\xff"):
        return "JPEG"
    return "unknown"


def first_frame_number(path: Path) -> int:
    match = re.search(r"(\d+)(?!.*\d)", path.stem)
    if match is None:
        fail(f"Cannot determine frame number from {path.name}")
    return int(match.group(1))


def run(command: list[str]) -> None:
    completed = subprocess.run(command, text=True, capture_output=True, check=False)
    if completed.returncode != 0:
        sys.stderr.write(completed.stderr)
        fail(f"Command failed: {' '.join(command)}")


def probe(path: Path) -> dict[str, Any]:
    command = [
        "ffprobe",
        "-v",
        "error",
        "-show_streams",
        "-show_format",
        "-of",
        "json",
        str(path),
    ]
    completed = subprocess.run(command, text=True, capture_output=True, check=False)
    if completed.returncode != 0:
        sys.stderr.write(completed.stderr)
        fail(f"ffprobe failed for {path}")
    value = json.loads(completed.stdout)
    if not isinstance(value, dict):
        fail(f"Unexpected ffprobe response for {path}")
    return value


def video_stream(report: dict[str, Any]) -> dict[str, Any]:
    streams = report.get("streams")
    if not isinstance(streams, list):
        fail("ffprobe response has no streams")
    for stream in streams:
        if isinstance(stream, dict) and stream.get("codec_type") == "video":
            return stream
    fail("Encoded output has no video stream")


def ratio(value: object) -> float:
    if not isinstance(value, str) or "/" not in value:
        return 0.0
    numerator_text, denominator_text = value.split("/", 1)
    denominator = float(denominator_text)
    return 0.0 if denominator == 0 else float(numerator_text) / denominator


def duration_seconds(report: dict[str, Any]) -> float:
    format_report = report.get("format")
    if not isinstance(format_report, dict):
        fail("ffprobe response has no format section")
    value = format_report.get("duration")
    if not isinstance(value, str):
        fail("ffprobe response has no duration")
    return float(value)


def validate_video(path: Path, report: dict[str, Any]) -> list[str]:
    stream = video_stream(report)
    width = int(stream.get("width", 0))
    height = int(stream.get("height", 0))
    fps = ratio(stream.get("avg_frame_rate"))
    duration = duration_seconds(report)
    size = path.stat().st_size
    errors: list[str] = []
    aspect = width / height if height else 0

    if size > 512 * 1024 * 1024:
        errors.append("video exceeds X's 512 MB ordinary-upload limit")
    if duration > 60.0:
        errors.append("video exceeds the 60-second automatic-loop boundary")
    if fps > 40.01:
        errors.append("video exceeds X's 40 fps ordinary-web limit")
    if not (1 / 2.39 <= aspect <= 2.39):
        errors.append("video aspect ratio is outside X's documented range")
    if width >= height and (width > 1920 or height > 1200):
        errors.append("landscape video exceeds 1920x1200")
    if height > width and (width > 1200 or height > 1900):
        errors.append("portrait video exceeds 1200x1900")
    return errors


def validate_gif(path: Path, report: dict[str, Any]) -> tuple[list[str], list[str]]:
    stream = video_stream(report)
    duration = duration_seconds(report)
    size = path.stat().st_size
    errors: list[str] = []
    warnings: list[str] = []
    if size > 15 * 1024 * 1024:
        errors.append("GIF exceeds X's 15 MB web-upload limit")
    if size > 5 * 1024 * 1024:
        warnings.append("GIF exceeds X's 5 MB mobile-upload limit")
    if duration > 60.0:
        errors.append("GIF exceeds this skill's 60-second loop limit")
    if int(stream.get("width", 0)) > 2048 or int(stream.get("height", 0)) > 2048:
        errors.append("GIF exceeds Media Studio's documented 2048x2048 envelope")
    return errors, warnings


def public_report(path: Path, report: dict[str, Any]) -> dict[str, Any]:
    stream = video_stream(report)
    return {
        "path": str(path),
        "bytes": path.stat().st_size,
        "durationSeconds": round(duration_seconds(report), 3),
        "width": int(stream.get("width", 0)),
        "height": int(stream.get("height", 0)),
        "fps": round(ratio(stream.get("avg_frame_rate")), 3),
        "codec": stream.get("codec_name"),
        "pixelFormat": stream.get("pix_fmt"),
    }


def main() -> None:
    args = parse_args()
    require_binary("ffmpeg")
    require_binary("ffprobe")

    if not args.frames_dir.is_dir():
        fail(f"Frame directory does not exist: {args.frames_dir}")
    if not (1 <= args.colors <= 256):
        fail("--colors must be between 1 and 256")
    if args.video_fps > 40:
        fail("--video-fps must not exceed X's ordinary-web 40 fps limit")

    frame_paths = [
        Path(value)
        for value in sorted(glob.glob(str(args.frames_dir / glob_pattern(args.pattern))))
    ]
    if not frame_paths:
        fail(f"No frames matched {args.pattern} in {args.frames_dir}")

    first = frame_paths[0]
    magic = detect_magic(first)
    if magic == "unknown":
        fail(f"First frame is neither PNG nor JPEG: {first}")
    expected = (
        "PNG"
        if first.suffix.lower() == ".png"
        else "JPEG"
        if first.suffix.lower() in {".jpg", ".jpeg"}
        else None
    )
    warnings: list[str] = []
    if expected is not None and expected != magic:
        warnings.append(
            f"{first.name} has a {first.suffix} suffix but contains {magic} bytes; "
            "ffmpeg will decode the bytes"
        )

    args.output_prefix.parent.mkdir(parents=True, exist_ok=True)
    mp4_path = Path(f"{args.output_prefix}.mp4")
    gif_path = Path(f"{args.output_prefix}.gif")
    outputs = [mp4_path] if args.no_gif else [mp4_path, gif_path]
    existing = [path for path in outputs if path.exists()]
    if existing and not args.force:
        fail(f"Refusing to overwrite existing output: {existing[0]} (pass --force)")

    start_number = first_frame_number(first)
    input_path = args.frames_dir / args.pattern
    input_decoder = "png" if magic == "PNG" else "mjpeg"
    input_args = [
        "-framerate",
        str(args.input_fps),
        "-start_number",
        str(start_number),
        "-c:v",
        input_decoder,
        "-i",
        str(input_path),
    ]
    video_filter = (
        f"scale={args.width}:{args.height}:force_original_aspect_ratio=decrease,"
        f"pad={args.width}:{args.height}:(ow-iw)/2:(oh-ih)/2:color={args.pad_color},"
        f"fps={args.video_fps},format=yuv420p"
    )
    run(
        [
            "ffmpeg",
            "-y",
            *input_args,
            "-vf",
            video_filter,
            "-c:v",
            "libx264",
            "-preset",
            "slow",
            "-crf",
            "18",
            "-pix_fmt",
            "yuv420p",
            "-color_range",
            "tv",
            "-maxrate",
            "8M",
            "-bufsize",
            "16M",
            "-movflags",
            "+faststart",
            "-an",
            str(mp4_path),
        ]
    )

    if not args.no_gif:
        gif_filter = (
            f"[0:v]scale={args.gif_width}:{args.gif_height}:force_original_aspect_ratio=decrease,"
            f"pad={args.gif_width}:{args.gif_height}:(ow-iw)/2:(oh-ih)/2:color={args.pad_color},"
            f"fps={args.gif_fps},split[s0][s1];"
            f"[s0]palettegen=stats_mode=diff:max_colors={args.colors}[p];"
            "[s1][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle"
        )
        run(
            [
                "ffmpeg",
                "-y",
                *input_args,
                "-filter_complex",
                gif_filter,
                "-loop",
                "0",
                str(gif_path),
            ]
        )

    mp4_probe = probe(mp4_path)
    errors = validate_video(mp4_path, mp4_probe)
    reports = [public_report(mp4_path, mp4_probe)]

    if not args.no_gif:
        gif_probe = probe(gif_path)
        gif_errors, gif_warnings = validate_gif(gif_path, gif_probe)
        errors.extend(gif_errors)
        warnings.extend(gif_warnings)
        reports.append(public_report(gif_path, gif_probe))

    result = {
        "source": {
            "frames": len(frame_paths),
            "firstFrame": str(first),
            "detectedFormat": magic,
            "inputFps": args.input_fps,
        },
        "outputs": reports,
        "warnings": warnings,
        "errors": errors,
    }
    print(json.dumps(result, indent=2))
    if errors:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
