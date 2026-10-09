---
name: video-reader
description: Analyze any uploaded video (mp4, mov, webm, m4v) by turning it into a contact sheet, key frames, cut timestamps and audio rhythm data, then writing a structured breakdown of scenes, motion techniques, transitions, pacing, colours and typography. Use this skill whenever the user uploads or links a video and asks to review it, break it down, analyse its style, copy, recreate or adapt its look, describe what happens in it, or use it as a reference — even if they just say "look at this video" or "make something like this".
---

# Video Reader

You cannot watch video or hear audio. This skill converts the video into things you can read: images (a contact sheet and key frames) and numbers (metadata, cuts, loudness, onsets). Never claim to have watched or listened to it.

## When to use

- "Look at this video."
- "Break this down."
- "What is the pacing, and where are the cuts?"
- "Make something like this" or "adapt this style to our brand."

## When not to use

- The input is a still image, a storyboard, or a written shot list. Read those directly.
- The user wants a transcript of speech or lyrics. Say the audio is numbers only, and ask them to paste the words.

## Steps

1. Run: `python scripts/analyze_video.py <video> --out <workdir>`
2. Read `<workdir>/summary.json` first (duration, size, fps, audio, cuts, onsets).
3. View `<workdir>/contact_sheet.png`. This is the whole video at a glance. Each tile has a timestamp.
4. View `<workdir>/keyframes.png`. This is the only place to judge typography, UI, lighting and texture.
5. If something is unclear at a specific moment, extract one more frame:
   `python scripts/analyze_video.py <video> --out <workdir> --frame <seconds>`
6. Write the analysis using `references/report-template.md`.

The script needs `ffmpeg`, `ffprobe`, `numpy` and `Pillow`. It writes only inside `--out`.

## Rules

- Audio is numbers only. You can state loudness shape, onset times, and a BPM only when `audio.onset_regular` is true. You cannot identify instruments, genre, lyrics or speech. Say so if asked, and ask the user to describe it.
- If `onset_regular` is false, report `median_interval` and say the onsets are irregular. Do not turn that interval into a tempo.
- If `cuts` is empty or the video is one short segment, it is one continuous shot or it uses soft transitions. Say that. Do not invent cuts.
- Do not read typography, logos or small UI from the contact sheet. Tiles are small. If it is not legible in `keyframes.png`, write "not visible".
- Treat the reference as style input. When the user wants to recreate it, list what to take and what not to copy (assets, logos, other brands' UI, copyrighted music).
- Timestamps in the report must come from `summary.json` or from frames you actually viewed.
- If `warnings` is not empty, include them in the Limits section.

## Before you finish

- Every timestamp in the report appears in `summary.json`, on the contact sheet, or on a frame you extracted.
- Typography claims cite a key frame, or say "not visible".
- The Limits section says what the frames and numbers could not determine.
