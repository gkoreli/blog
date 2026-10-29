#!/usr/bin/env python3
"""Deterministic charts from accepted observations, not a simulated terminal run."""

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

W = H = 1200
BG, INK, MUTED = "#f7f2e7", "#24241f", "#77746b"
RED, ORANGE, PALE = "#b54129", "#d79c77", "#ded7ca"
REGULAR = "/System/Library/Fonts/Supplemental/Arial.ttf"
BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"


def font(size, bold=False):
    return ImageFont.truetype(BOLD if bold else REGULAR, size)


def text(draw, xy, value, size, bold=False, fill=INK, anchor=None):
    draw.text(xy, value, font=font(size, bold), fill=fill, anchor=anchor)


def ease(value):
    value = max(0, min(1, value))
    return value * value * (3 - 2 * value)


def canvas(label):
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    text(d, (72, 58), "GOGA KORELI  /  OSS RADAR #08", 30)
    d.rounded_rectangle((72, 126, 1128, 194), radius=12, fill=INK)
    text(d, (96, 140), label, 36, True, BG)
    d.line((72, 1030, 1128, 1030), fill="#c6bfb1", width=2)
    text(d, (72, 1051), "Oct 27 preview · Bun 06888611e · macOS arm64", 31, fill=MUTED)
    text(d, (72, 1110), "gkoreli.com/oss-radar-08-bun-aot", 39)
    return im, d


def bar(d, y, label, value, maximum, color, progress=1):
    text(d, (72, y), label, 43)
    text(d, (1128, y), value[1], 48, True, anchor="ra")
    width = 1056 * value[0] / maximum
    d.rounded_rectangle((72, y+67, 72+width, y+128), radius=5, fill=PALE)
    if progress > 0:
        d.rounded_rectangle((72, y+67, 72+max(2, width*progress), y+128), radius=5, fill=color)


def disk(t, data):
    im, d = canvas("TEST 1  /  A TINY SERVER EXECUTABLE")
    text(d, (72, 233), "Same TypeScript.", 76, True)
    text(d, (72, 319), "Smaller executable.", 76, True)
    values = data["binary_bytes"]
    maximum = values["jit"]/1e6
    for i, (key, label, color) in enumerate([
        ("jit", "Regular Bun build", MUTED),
        ("aot", "Bun AOT", ORANGE),
        ("aot-trim", "Bun AOT + --trim", RED),
    ]):
        value = values[key]/1e6
        bar(d, 452+i*169, label, (value, f"{value:.1f} MB"), maximum, color,
            ease((t-(0.15+i*1.2))/0.8))
    text(d, (72, 970), "File size on disk. This is not RAM.", 42, True)
    return im


def memory(t, data):
    im, d = canvas("TEST 2  /  TYPESCRIPT COMPILER CHECKING EFFECT")
    text(d, (72, 233), "Same compiler source.", 72, True)
    text(d, (72, 318), "Less peak RAM.", 76, True)
    maximum = data["compiler"]["jit"]["peak_footprint_bytes"]/1e6
    for i, (key, label, color) in enumerate([
        ("jit", "Regular Bun build", MUTED), ("aot", "Bun AOT", RED),
    ]):
        value = data["compiler"][key]["peak_footprint_bytes"]/1e6
        bar(d, 455+i*185, label, (value, f"{value:,.0f} MB"), maximum, color,
            ease((t-(0.15+i*1.2))/0.8))
    text(d, (72, 825), "64% less peak memory", 76, True, RED)
    text(d, (72, 932), "Peak physical footprint · 5 runs per build", 39)
    text(d, (72, 984), "Different workload from the executable-size test.", 35, fill=MUTED)
    return im


def ending():
    im, d = canvas("TWO TESTS. DIFFERENT WORKLOADS.")
    text(d, (72, 241), "Measure your app.", 83, True)
    d.rounded_rectangle((72, 374, 1128, 559), radius=18, fill="#e9dfcf")
    text(d, (100, 398), "TINY SERVER · EXECUTABLE SIZE", 36, True)
    text(d, (100, 456), "121.5 → 30.3 MB", 73, True, RED)
    d.rounded_rectangle((72, 592, 1128, 777), radius=18, fill="#e9dfcf")
    text(d, (100, 616), "TYPESCRIPT COMPILER · PEAK MEMORY", 36, True)
    text(d, (100, 674), "64% less RAM", 73, True, RED)
    text(d, (72, 838), "The warmed server gained only 6%.", 45)
    text(d, (72, 902), "One Zod test got slower.", 45)
    text(d, (72, 974), "Code, methods and limits in the article.", 38, True)
    return im


def frame(t, data):
    if t < 11.5:
        return disk(t, data)
    if t < 12:
        return Image.blend(disk(11.5, data), memory(0, data), ease((t-11.5)/0.5))
    if t < 23.5:
        return memory(t-12, data)
    if t < 24:
        return Image.blend(memory(11.5, data), ending(), ease((t-23.5)/0.5))
    if t < 29:
        return ending()
    return Image.blend(ending(), disk(0, data), ease((t-29)))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, required=True)
    parser.add_argument("--frames", type=Path, required=True)
    parser.add_argument("--poster", type=Path, required=True)
    args = parser.parse_args()
    data = json.loads(args.data.read_text())
    args.frames.mkdir(parents=True, exist_ok=True)
    args.poster.parent.mkdir(parents=True, exist_ok=True)
    disk(5, data).save(args.poster)
    for index in range(900):
        frame(index/30, data).save(args.frames/f"frame-{index:04d}.png", compress_level=1)
    print("Rendered 900 deterministic frames at 30 fps; duration 30 seconds.")


if __name__ == "__main__":
    main()
