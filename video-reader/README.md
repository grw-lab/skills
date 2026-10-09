# video-reader

Turns a video file into a contact sheet, three key frames, cut times and audio numbers, so an agent can describe the video without claiming to have watched it.

Full docs: [tools.grwlab.net/skills/video-reader](https://tools.grwlab.net/skills/video-reader/).

## Requirements

- `ffmpeg` and `ffprobe` on PATH
- Python 3.9+
- `numpy` and `Pillow`

No OpenCV and no librosa. The script works offline.

```bash
python3 -c "import numpy, PIL"
ffmpeg -version
```

## Usage

```bash
python scripts/analyze_video.py reel.mp4 --out ./out
python scripts/analyze_video.py reel.mp4 --out ./out --frame 2.5
```

Outputs, all inside `--out`:

- `summary.json` with duration, size, cuts, segments and audio numbers
- `contact_sheet.png` with a timestamp under every tile
- `keyframes.png` with three labelled frames
- `audio.wav` and `audio.png` when the file has audio

`--frame` writes only `frame_<seconds>.png` and skips the rest.

A BPM is included only when the audio onsets are evenly spaced. Otherwise the summary gives the median gap and leaves the tempo empty. The script cannot identify speech, lyrics or instruments.

## License

MIT. See [LICENSE](LICENSE).
