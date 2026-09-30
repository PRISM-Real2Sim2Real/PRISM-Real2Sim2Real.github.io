# PRISM research website

Public site: https://prism-real2sim2real.github.io/

This repository contains the PRISM research blog: real-world results, the video-data
bottleneck, counterfactual video generation, and the real-to-sim-to-real method. All original PRISM media remain available.

Edit `index.html` for the narrative and `assets/blog.css` for the editorial layout.
`assets/content.js` defines the media and galleries; `assets/app.js` handles video
playback, the generation animation, and expanded views. The narrative links to
VideoMimic as related work; the challenge section contains no video embed.

## Publish

For requested website changes, complete local verification, then commit and push to `main` without requesting a separate publish confirmation. Verify the GitHub Pages deployment and live files before reporting completion. Keep changes local only when the user explicitly requests a preview or defers publishing.

GitHub Pages serves the root of the `main` branch. The `.nojekyll` file preserves
this static site. Push regular commits to `main` to publish updates;
fetch and incorporate remote changes before pushing. Do not force-push.

All website assets use relative paths so the page works under `/prism/`.
Keep `assets/content.js`, video files, and poster images together when updating media.

## Preview locally

Run `python3 -m http.server 8000` from this directory and open
http://localhost:8000/ in a browser. No install or build step is required.

## Editorial style

Use concise, active sentences and descriptive headings. Avoid slogans and repetitive explanations. Preserve the approved paper header and deployment facts unless the user requests a change. Balance headings and short paragraphs across desktop and mobile widths; prevent very short final lines without shrinking type or creating overflow.

## Desktop layout

Prioritize laptop and desktop reading. At widths of 1180px and above, use the fixed left chapter rail and one aligned content grid; show chapter links in the top bar on narrower screens. Keep headings in the same sans-serif family, use equal-width full-frame videos elsewhere, and keep the challenge section in one reading column with compact source rows and one static curation diagram. Use a shared 24px column gap for desktop media and text grids. Align chapter labels with headings, captions with their frames, and paired headings and paragraphs with shared grid rows. Keep standalone prose to the same reading width. Avoid centered paragraphs that drift away from the heading or figure alignment, oversized serif headings, and duplicate desktop navigation.

## Hero video

The hero combines the approved v8 first-clip master with the approved chair and plush-dog edits, rebuilt before their previous lossy exports. It preserves 3840 × 2160 resolution and 60000/1001 fps, with 1603 frames (26.743383 seconds). The lossless archival master stays in the local Berkeley teaser folder; `assets/videos/hero-4k-v8/playlist.m3u8` serves a high-quality 4K H.264 rendition in short segments. Safari uses native HLS; other supported browsers use the locally bundled HLS.js 1.7.3. The hero retains the existing pause/play and looping behavior. `assets/hero-framing.js` restores the closer framing of the earlier edit at the original speed: the first segment uses an 80% crop, the chair segment a 75% crop, and the already-cropped plush-dog segment keeps its full frame. Framing follows the action and resets at the source clip boundaries.

## Method demonstrations

The method uses a three-plus-two layout: generated video, 3D reconstruction,
retargeted motion, then the released student rollout and real-world deployment.
Both deployment videos last eight seconds. The student uses the 28K checkpoint
with command 0.1, stops and receives the drop command at six seconds, and runs
at its original playback speed. Local review artifacts in `qa/` are not published.

## Generation animation

Reconstructed 3D objects, Kinematic references, and Zero-shot Sim2Real share one
19.5-second video, so both the pullback and the center tear play continuously.
The opening uses the completed v40 video-wall-to-3D bridge with the original
transparent paper logo; the rest comes from the completed Twitter v40 video,
44.1–60.5 seconds. It includes the object/configuration captions, “With paired
robot motion,” 49 kinematic references, and the real-world ending.

Stage boundaries live in the media manifest: objects at 0, motion at 6.7, and
Sim2Real at 16 seconds. The real-world ending remains 3.5 seconds. Manual stage
selection seeks to the corresponding boundary; automatic changes preserve the
same video and playback clock. The real-world mosaic includes repeated views;
its tile count is not a count of distinct objects. The logo and browser icon come
from `PRISM-arxiv.zip`, `figs_1st/_1_teaser.pdf`.

## Robustness results

The results gallery starts with In-domain and ends with Pose, then Robustness.
The redundant Real-world experiment overview tab is removed; its examples remain
in the existing object categories. Robustness contains four 1080p, 60 fps clips:
Repack (wooden rack), Continuous working (large box), Out-of-distribution depth
(basketball), and Failure robustness (small box). Each lasts 15 seconds and plays
at the original speed. Short sources are padded at the beginning with their first
frame, not slowed down. Original 4K recordings remain in the user's demos folder.
