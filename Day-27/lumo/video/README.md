# Lumo lesson videos

A lesson **script** (JSON) becomes a finished video: narration, captions and an animated scene with the island's guardian. Everything runs on this machine for free; nothing calls a paid service.

```bash
cd Day-27/lumo/video
npm install
npm run make -- scripts/lessons/for-loops.json                                    # out/for-loops.mp4, .vtt, .txt
npm run make -- scripts/lessons/for-loops.json --attach "For-loops in 90 seconds"  # also link it to that lesson (local stack)
npm run studio                                                                    # Remotion Studio, to tweak the animation
```

## How it works

| Step      | Tool                                                                | Notes                                                                                                                   |
| --------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Script    | `scripts/lessons/*.json`                                            | Scenes (`title`, `code`, `trace`, `recap`), each a list of lines to say plus what the screen shows during that line     |
| Narration | [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M) via `kokoro-js` | Open-source voice model on the CPU; ~90 MB, downloaded once. Lines are cached by text + voice, so re-renders are fast   |
| Timing    | `scripts/make-video.mjs`                                            | Each line's real audio length places it on the timeline, so visuals and captions follow the voice exactly               |
| Animation | [Remotion](https://www.remotion.dev) (`src/Lesson.tsx`)             | React scenes; Byte is imported from the app, so the video and the app share one character                               |
| Output    | H.264 720p MP4 + WebVTT captions + transcript                       | The 53-second for-loops video is about 2 MB; it renders in about 45 s once audio is cached (about 2 min the first time) |
| Attach    | `--attach "<lesson title or id>"`                                   | Uploads to the private `course-media` bucket and sets the lesson's video, captions, transcript and length. Local only   |

In M4 the AI pipeline writes the script JSON (Gemini free tier) and the generation worker runs these same steps.

## The product demo (made by Lumo)

`npm run demo` makes a 3-minute walkthrough of Lumo with this same pipeline: out/lumo-demo.mp4 (1080p) plus captions and a transcript.

```bash
# needs the app (npm run dev on :5180), the local Supabase stack and npm run worker
npm run demo                              # capture fresh screenshots, narrate, render (about 8 min)
npm run demo -- --skip-capture --preview  # reuse the last screenshots, half-size render for a quick look
```

1. **Capture** (`scripts/demo/capture.mjs`): Playwright walks every role through the real local app. A visitor tries an island. A new learner (created for the run and deleted at the end) signs up, takes a lesson, files a report, forgets, reviews, comes back and earns a certificate. An instructor asks Wisp to draft a unit, and an admin opens the report. Each screenshot is saved at 1920×1080, together with the box of the element the narration is about.
2. **Narration** (`scripts/demo/demo.json`): Wisp's lines, spoken by Kokoro and timed by their real audio length.
3. **Video** (`src/Demo.tsx`): the screenshots sit in a browser window that zooms to each focus box, with the real lesson video playing inside the app's player. Title cards cover forgetting (Gloom) and how Lumo works inside, with chapter labels and burned-in captions.

Voice, caching, timing and rendering code is shared with the lesson videos in `scripts/lib.mjs`.

## Notes

- **Licence:** Remotion is free for individuals and companies of up to 3 people, including unlimited local renders. If a larger company owns or runs Lumo, it needs a Remotion company licence. Kokoro is Apache-2.0.
- **Memory:** renders with 2 browser tabs at a time, which fits an 8 GB Mac alongside the local Supabase stack.
- **Node 20:** `npm run make` passes `--experimental-websocket` (needed by supabase-js for `--attach`).
