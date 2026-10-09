#!/usr/bin/env python3
"""Turn a video into images and numbers an agent can read.

Usage:
  python analyze_video.py VIDEO --out DIR [--fps-sheet N] [--frame SECONDS] [--scene-threshold 0.25]

Needs ffmpeg, ffprobe, numpy and Pillow. Writes only inside --out.
Prints a short summary to stdout. Exits 1 with a plain message if the file cannot be read.
"""

import argparse
import json
import math
import shutil
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont


def fail(message):
    print(message, file=sys.stderr)
    sys.exit(1)


def run(cmd):
    try:
        return subprocess.run(cmd, capture_output=True, text=True)
    except FileNotFoundError:
        fail(f"Missing {cmd[0]}. Install ffmpeg (it includes ffprobe) and make sure it is on PATH.")


def probe(video):
    result = run([
        "ffprobe", "-v", "error",
        "-show_entries", "stream=codec_type,width,height,r_frame_rate:format=duration",
        "-of", "json", str(video),
    ])
    if result.returncode != 0 or not result.stdout.strip():
        detail = (result.stderr or "").strip().splitlines()
        fail(f"Cannot read {video}: {detail[-1] if detail else 'ffprobe failed'}.")
    data = json.loads(result.stdout)
    streams = data.get("streams") or []
    video_stream = next((s for s in streams if s.get("codec_type") == "video" and s.get("width")), None)
    if not video_stream:
        fail(f"Cannot read {video}: no video stream.")
    try:
        duration = float(data.get("format", {}).get("duration") or 0)
    except (TypeError, ValueError):
        duration = 0
    if duration <= 0:
        fail(f"Cannot read {video}: the file has no duration.")
    rate = str(video_stream.get("r_frame_rate") or "0/1")
    num, _, den = rate.partition("/")
    try:
        fps = float(num) / float(den or 1)
    except ValueError:
        fps = 0
    width = int(video_stream["width"])
    height = int(video_stream["height"])
    if height > width:
        orientation = "vertical"
    elif width > height:
        orientation = "landscape"
    else:
        orientation = "square"
    return {
        "duration": round(duration, 2),
        "width": width,
        "height": height,
        "fps": round(fps, 3),
        "orientation": orientation,
        "has_audio": any(s.get("codec_type") == "audio" for s in streams),
    }


def cuts(video, threshold):
    result = run([
        "ffmpeg", "-i", str(video),
        "-vf", f"select='gt(scene,{threshold})',showinfo",
        "-f", "null", "-",
    ])
    times = []
    for line in result.stderr.splitlines():
        mark = "pts_time:"
        if mark not in line:
            continue
        raw = line.split(mark, 1)[1].split()[0].strip(",")
        try:
            times.append(round(float(raw), 2))
        except ValueError:
            continue
    times.sort()
    merged = []
    for t in times:
        if not merged or t - merged[-1] >= 0.1:
            merged.append(t)
    return merged


def segments(cut_times, duration):
    points = [0.0, *cut_times, round(duration, 2)]
    pairs = []
    for start, end in zip(points, points[1:]):
        if end - start > 0.05:
            pairs.append([round(start, 2), round(end, 2)])
    return pairs or [[0.0, round(duration, 2)]]


def sheet_rate(duration, override):
    warnings = []
    if override:
        rate = float(override)
    elif duration <= 12:
        rate = 4
    elif duration <= 30:
        rate = 3
    elif duration <= 60:
        rate = 2
    else:
        rate = 1
    tiles = duration * rate
    if tiles > 120:
        rate = 120 / duration
        warnings.append(f"Contact sheet capped at 120 tiles. Sampling at {rate:.2f} fps.")
    return rate, warnings


def extract_frames(video, out_dir, rate, width, limit):
    frames = out_dir / "_frames"
    if frames.exists():
        shutil.rmtree(frames)
    frames.mkdir(parents=True)
    result = run([
        "ffmpeg", "-y", "-i", str(video),
        "-vf", f"fps={rate},scale={width}:-1",
        "-frames:v", str(limit),
        str(frames / "%04d.png"),
    ])
    paths = sorted(frames.glob("*.png"))
    if result.returncode != 0 or not paths:
        fail("Cannot read the video frames. The file may be damaged or use a codec ffmpeg cannot decode.")
    return paths


def draw_label(draw, xy, text, font):
    draw.text(xy, text, fill=(28, 23, 36), font=font)


def contact_sheet(frame_paths, rate, out_path):
    images = [Image.open(path).convert("RGB") for path in frame_paths]
    font = ImageFont.load_default()
    tile_w, tile_h = images[0].size
    label_h = 16
    columns = 10
    rows = math.ceil(len(images) / columns)
    sheet = Image.new("RGB", (columns * tile_w, rows * (tile_h + label_h)), "white")
    draw = ImageDraw.Draw(sheet)
    for index, image in enumerate(images):
        column = index % columns
        row = index // columns
        x = column * tile_w
        y = row * (tile_h + label_h)
        sheet.paste(image, (x, y))
        draw_label(draw, (x + 3, y + tile_h + 2), f"{index / rate:.2f}s", font)
    sheet.save(out_path)
    for image in images:
        image.close()


def keyframe_times(pairs, duration):
    if len(pairs) == 1 and pairs[0][0] == 0:
        return [round(duration * part, 2) for part in (0.25, 0.5, 0.75)]
    ranked = sorted(pairs, key=lambda pair: pair[1] - pair[0], reverse=True)[:3]
    times = [round((pair[0] + pair[1]) / 2, 2) for pair in ranked]
    times.sort()
    return times


def grab_frame(video, seconds, path):
    result = run([
        "ffmpeg", "-y", "-i", str(video),
        "-ss", f"{seconds:.2f}", "-frames:v", "1", str(path),
    ])
    if result.returncode != 0 or not path.exists():
        fail(f"Cannot extract the frame at {seconds:.2f}s.")


def combine_keyframes(shots, out_path):
    font = ImageFont.load_default()
    gap = 8
    label_h = 18
    max_width = (2000 - gap * (len(shots) - 1)) // len(shots)
    fitted = []
    for image, _ in shots:
        copy = image.convert("RGB")
        copy.thumbnail((max_width, 4000))
        fitted.append(copy)
    height = max(image.height for image in fitted) + label_h
    sheet = Image.new("RGB", (sum(image.width for image in fitted) + gap * (len(fitted) - 1), height), "white")
    draw = ImageDraw.Draw(sheet)
    x = 0
    for image, seconds in zip(fitted, [item[1] for item in shots]):
        sheet.paste(image, (x, 0))
        draw_label(draw, (x + 4, image.height + 2), f"{seconds:.2f}s", font)
        x += image.width + gap
    sheet.save(out_path)


def read_wav(path):
    with wave.open(str(path), "rb") as handle:
        channels = handle.getnchannels()
        sample_width = handle.getsampwidth()
        rate = handle.getframerate()
        frames = handle.readframes(handle.getnframes())
    if sample_width != 2:
        fail("Audio extraction did not produce 16-bit PCM.")
    samples = np.frombuffer(frames, dtype=np.int16).astype(np.float64)
    if channels > 1:
        samples = samples.reshape(-1, channels).mean(axis=1)
    return samples / 32768.0, rate


def audio_report(video, out_dir):
    wav_path = out_dir / "audio.wav"
    result = run([
        "ffmpeg", "-y", "-i", str(video),
        "-ac", "1", "-ar", "22050", "-c:a", "pcm_s16le", str(wav_path),
    ])
    if result.returncode != 0 or not wav_path.exists():
        return None
    samples, rate = read_wav(wav_path)
    window = max(1, int(rate * 0.05))
    usable = len(samples) - (len(samples) % window)
    if usable < window:
        return None
    windows = samples[:usable].reshape(-1, window)
    rms = np.sqrt(np.mean(windows * windows, axis=1))
    db = 20 * np.log10(np.maximum(rms, 1e-9))
    per_window = 0.05
    seconds = int(math.ceil(len(db) * per_window))
    loudness = []
    for second in range(seconds):
        start = int(second / per_window)
        end = int((second + 1) / per_window)
        chunk = db[start:end]
        loudness.append(round(float(chunk.mean()), 1) if len(chunk) else -90.0)
    onsets = []
    for index in range(1, len(db)):
        if db[index] - db[index - 1] > 4 and db[index] > -35:
            onsets.append(round(index * per_window, 2))
    onsets = sorted(set(onsets))
    intervals = np.diff(onsets) if len(onsets) > 1 else np.array([])
    median = float(np.median(intervals)) if len(intervals) else None
    regular = False
    bpm = None
    alternatives = []
    if median and len(intervals) >= 4:
        deviation = float(np.median(np.abs(intervals - median)))
        regular = deviation / median <= 0.2
        if regular and 0.25 <= median <= 1:
            bpm = int(round(60 / median))
            alternatives = sorted({int(round(candidate)) for candidate in (bpm / 2, bpm * 2) if 70 <= candidate <= 180 and int(round(candidate)) != bpm})
    order = np.argsort(loudness)[::-1][:3]
    draw_waveform(samples, rate, onsets, out_dir / "audio.png")
    return {
        "loudness_per_second": loudness,
        "onsets": onsets,
        "median_interval": round(median, 3) if median else None,
        "onset_regular": regular,
        "bpm_estimate": bpm,
        "bpm_alternatives": alternatives,
        "peaks": [int(index) for index in order],
    }


def draw_waveform(samples, rate, onsets, path):
    width, height = 1200, 200
    image = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(image)
    draw.line((0, height // 2, width, height // 2), fill=(228, 227, 223))
    bucket = max(1, len(samples) // width)
    trimmed = samples[:bucket * width].reshape(width, bucket)
    peaks = np.max(np.abs(trimmed), axis=1)
    for x, peak in enumerate(peaks):
        half = max(1, int(peak * (height / 2 - 16)))
        draw.line((x, height // 2 - half, x, height // 2 + half), fill=(28, 23, 36))
    duration = len(samples) / rate
    font = ImageFont.load_default()
    for second in range(int(duration) + 1):
        x = int(second / duration * (width - 1)) if duration else 0
        draw.line((x, height - 14, x, height - 1), fill=(111, 106, 116))
        if second % max(1, int(duration // 8) or 1) == 0:
            draw.text((x + 2, height - 14), f"{second}s", fill=(111, 106, 116), font=font)
    for onset in onsets:
        x = int(onset / duration * (width - 1)) if duration else 0
        draw.line((x, 0, x, 8), fill=(61, 107, 50))
    image.save(path)


def relative(path, out_dir):
    return str(path.relative_to(out_dir))


def main():
    parser = argparse.ArgumentParser(description="Turn a video into a contact sheet, key frames and audio numbers.")
    parser.add_argument("video")
    parser.add_argument("--out", required=True)
    parser.add_argument("--fps-sheet", type=float)
    parser.add_argument("--frame", type=float)
    parser.add_argument("--scene-threshold", type=float, default=0.25)
    args = parser.parse_args()

    video = Path(args.video)
    if not video.is_file():
        fail(f"Cannot read {video}: file not found.")
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    if args.frame is not None:
        label = f"{args.frame:.2f}".rstrip("0").rstrip(".")
        destination = out_dir / f"frame_{label}.png"
        grab_frame(video, args.frame, destination)
        print(f"Frame {args.frame:.2f}s -> {destination}")
        return

    info = probe(video)
    rate, warnings = sheet_rate(info["duration"], args.fps_sheet)
    tile_width = {"vertical": 140, "landscape": 200, "square": 170}[info["orientation"]]
    limit = min(120, max(1, math.ceil(info["duration"] * rate)))
    frame_paths = extract_frames(video, out_dir, rate, tile_width, limit)
    contact_path = out_dir / "contact_sheet.png"
    contact_sheet(frame_paths, rate, contact_path)

    cut_times = [t for t in cuts(video, args.scene_threshold) if 0 < t < info["duration"]]
    pairs = segments(cut_times, info["duration"])
    times = keyframe_times(pairs, info["duration"])
    shots = []
    for index, seconds in enumerate(times):
        path = out_dir / f"_key_{index}.png"
        grab_frame(video, min(seconds, max(0, info["duration"] - 0.05)), path)
        shots.append((Image.open(path), seconds))
    key_path = out_dir / "keyframes.png"
    combine_keyframes(shots, key_path)
    for image, _ in shots:
        image.close()

    audio = audio_report(video, out_dir) if info["has_audio"] else None
    if info["has_audio"] and audio is None:
        warnings.append("The file has an audio stream, but it could not be decoded. Audio numbers were skipped.")
        info["has_audio"] = False

    summary = {
        "file": str(video),
        "duration": info["duration"],
        "width": info["width"],
        "height": info["height"],
        "fps": info["fps"],
        "orientation": info["orientation"],
        "has_audio": info["has_audio"],
        "cuts": cut_times,
        "segments": pairs,
        "contact_sheet": {"path": relative(contact_path, out_dir), "fps": round(rate, 3), "columns": 10, "tiles": len(frame_paths)},
        "keyframes": [{"t": seconds, "path": relative(key_path, out_dir)} for _, seconds in shots],
        "warnings": warnings,
    }
    if audio:
        summary["audio"] = audio
    (out_dir / "summary.json").write_text(json.dumps(summary, indent=2) + "\n")

    shutil.rmtree(out_dir / "_frames", ignore_errors=True)
    for path in out_dir.glob("_key_*.png"):
        path.unlink()

    print(f"{video.name} · {info['duration']}s · {info['width']}x{info['height']} · {info['orientation']} · {info['fps']}fps · audio {'yes' if info['has_audio'] else 'no'}")
    print(f"cuts: {', '.join(str(t) for t in cut_times) if cut_times else 'none'}")
    print(f"contact sheet: {len(frame_paths)} tiles at {round(rate, 3)} fps")
    print(f"keyframes: {', '.join(f'{t:.2f}s' for t in times)}")
    if audio:
        if audio["bpm_estimate"]:
            print(f"tempo: about {audio['bpm_estimate']} BPM from regular onsets")
        else:
            interval = audio["median_interval"]
            print("tempo: onsets are irregular, so there is no BPM" + (f" (median interval {interval}s)" if interval else ""))
    for warning in warnings:
        print(f"warning: {warning}")


if __name__ == "__main__":
    try:
        main()
    except BrokenPipeError:
        sys.exit(0)
    except Exception as error:
        if isinstance(error, SystemExit):
            raise
        fail(f"Cannot read the video: {error}")
