## What it does

Video Reader lets an agent study a video file. The agent cannot watch pictures move or hear the soundtrack, so the skill runs one script that makes things it can read:

- A contact sheet of the whole video, with a timestamp under every frame.
- Three large key frames, taken from the longest shots.
- Cut times, and audio numbers: loudness per second, onset times, and a BPM only when those onsets are evenly spaced.

It then writes a structured breakdown: what happens, how it moves, the rhythm, the visual style, and what to take if you want to make something in the same spirit.

## When to use it

- You have an mp4, mov, webm or m4v and you want it broken down.
- You want the cuts, the pacing, and the moves, with times attached.
- You want to recreate the feel of a reference without copying its assets, logos or music.
- You are cutting a film for Stylr, Qufy, Claude RTL, or the next tool, and you want the reference read the same way every time.

## Install

**Claude Code**, as a plugin (installs all grw—lab skills, updates with one command):

```text
/plugin marketplace add grw-lab/skills
/plugin install grw-skills@grw-lab
```

**Claude Code**, this skill only:

```bash
git clone https://github.com/grw-lab/skills.git ~/grwlab-skills
mkdir -p ~/.claude/skills && cp -r ~/grwlab-skills/video-reader ~/.claude/skills/
```

For one project only, copy the folder into `.claude/skills/` inside that project instead.

**Claude.ai**: zip the `video-reader` folder and upload it in Settings → Capabilities → Skills.

**Other agents** (Cursor, Codex, Gemini CLI, Windsurf): point the agent at `video-reader/SKILL.md`, or paste it into your rules file. The instructions are plain Markdown.

The script also needs `ffmpeg` on your machine, plus Python packages `numpy` and `Pillow`.

## Usage

- "Look at this video and tell me how it is cut."
- "Break down the pacing. Where are the cuts, and do they land on the sound?"
- "Make a film in this spirit for our tool. Take the timing, not their logo or their music."
- "This is one continuous shot. Describe the move."

You can also run the script on its own:

```bash
python ~/.claude/skills/video-reader/scripts/analyze_video.py video.mp4 --out ./out
```

To pull one more frame:

```bash
python ~/.claude/skills/video-reader/scripts/analyze_video.py video.mp4 --out ./out --frame 2.5
```

## Example

A generated 6 second vertical reel, three flat colors, with a click every half second. The script printed:

```text
reel.mp4 · 6.0s · 720x1280 · vertical · 30.0fps · audio yes
cuts: 2.0, 4.0
contact sheet: 24 tiles at 4 fps
keyframes: 1.00s, 3.00s, 5.00s
tempo: about 120 BPM from regular onsets
```

The same file with the audio removed comes back `audio no` and no BPM. A landscape clip with no color change comes back `cuts: none`.

## What's inside

| File | What it's for |
|---|---|
| `SKILL.md` | The steps the agent follows, and the rules against inventing cuts, tempo or typography. |
| `references/report-template.md` | The breakdown the agent fills in after reading the images and `summary.json`. |
| `scripts/analyze_video.py` | The pipeline. Needs ffmpeg, numpy and Pillow. Writes only inside `--out`. |
| `README.md` | Install and command line usage for a person running the script directly. |

## FAQ

**Can it hear the voiceover?**
No. Loudness, onset times and a BPM (only when the onsets are regular) are the whole audio report. Speech, lyrics, instruments and genre have to come from you.

**Why does a quiet talking video have no BPM?**
The tempo is the gap between sudden volume jumps. Speech is uneven, so the script refuses the BPM instead of printing a wrong one. The median gap is still in `summary.json`.

**What if the video is one take?**
`cuts` is empty. The report should say it is one continuous shot, or that the transitions are too soft to count as cuts.

**Will it copy the reference?**
The report has a "Don't copy" list: assets, logos, another product's interface, and the music. The skill is for reading the timing and the moves.

**What do I need installed?**
ffmpeg (which includes ffprobe), Python 3.9 or newer, numpy and Pillow. No account and no network.
