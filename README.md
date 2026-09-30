# PRISM research website

Public site: https://prism-real2sim2real.github.io/

This repository contains the PRISM research blog: real-world results, the video-data
bottleneck, counterfactual video generation, and the real-to-sim-to-real method. All original PRISM media remain available.

Edit `index.html` for the narrative and `assets/blog.css` for the editorial layout.
`assets/content.js` defines the media and galleries; `assets/app.js` handles video
playback, the generation animation, and expanded views. The narrative links to
VideoMimic as related work; the challenge section uses the latest motivation animation.

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

Prioritize laptop and desktop reading. At widths of 1180px and above, use the fixed left chapter rail and one aligned content grid; show chapter links in the top bar on narrower screens. Keep headings in the same sans-serif family, use equal-width full-frame videos elsewhere, and keep the challenge section in one reading column with compact source rows and a full-width motivation animation. Use a shared 24px column gap for desktop media and text grids. Align chapter labels with headings, captions with their frames, and paired headings and paragraphs with shared grid rows. Keep standalone prose to the same reading width. Avoid centered paragraphs that drift away from the heading or figure alignment, oversized serif headings, and duplicate desktop navigation.

## Hero video

The hero combines the approved v8 first-clip master with the approved chair and plush-dog edits, rebuilt before their previous lossy exports. It preserves 3840 × 2160 resolution and 60000/1001 fps, with 1603 frames (26.743383 seconds). The lossless archival master stays in the local Berkeley teaser folder; `assets/videos/hero-4k-v8/playlist.m3u8` serves a high-quality 4K H.264 rendition in short segments. Safari uses native HLS; other supported browsers use the locally bundled HLS.js 1.7.3. The hero retains the existing pause/play and looping behavior. `assets/hero-framing.js` restores the closer framing of the earlier edit at the original speed: the first segment uses an 80% crop, the chair segment a 75% crop, and the already-cropped plush-dog segment keeps its full frame. Framing follows the action and resets at the source clip boundaries.

The hero follows the latest Twitter opening: the v38 full paper title on two lines
at 0–1.3 seconds, followed by the approved captions and v39 plush-dog wording,
all retained in v54. White Arial Bold text sits at the top center, with a subtle
outline/shadow and an “Autonomous 1X” label at the lower right. Caption changes
follow the video's frame clock, including seeks, pauses, and loop restarts; the
chair and dog transitions use the original clip boundaries. These responsive
HTML overlays preserve the existing 4K HLS footage, framing, and playback speed.
The playback button sits at the lower left to avoid the corner label.

## Method demonstrations

The method uses a three-plus-two layout: generated video, 3D reconstruction,
retargeted motion, then the released student rollout and real-world deployment.
Both deployment videos last eight seconds. The student uses the 28K checkpoint
with command 0.1, stops and receives the drop command at six seconds, and runs
at its original playback speed. Local review artifacts in `qa/` are not published.

## Motivation animation

The challenge opens with human interaction experience and asks how robots can
collect such practice. Two plain paragraphs, numbered (1) and (2), compare collecting data through
motion capture or recording, and curating reconstruction-friendly Internet video.
Keep them in the article flow without separate headings, icons, columns, or borders.
The model/PRISM distinction stays brief: video-to-video generation versus sampling
interactions and running real-to-sim.

The old Internet-video heading and static curation diagram are replaced by the
16.4-second middle of Twitter v52 (28.5–44.9 seconds), in a full-width 16:9 frame.
It shows Internet examples collecting into a circle, the tiny usable subset and
arrow to a large reference video, the larger ladder comparison with a small
video-model icon, then the video wall labeled “256 counterfactual videos / from
4 real videos.” The original file is preserved. Playback follows the existing
muted, inline, in-view autoplay and loop behavior; reduced motion shows a poster.
There is no duplicate heading or additional playback control.

## Generation animation

Keep the six stage buttons, but do not add a small explanatory line below them.
The animation has a stable accessible name and no dynamic footer caption.

The 256-video wall, Reconstructed 3D objects, Kinematic references, and Zero-shot
Sim2Real share one 17.9-second video, extracted from the completed Twitter v52
release at 42.1–60 seconds. The source and four-example stages still use the
existing individual clips. The sequence uses the new bottom-aligned 256 caption
and near-white Zero-shot Sim2Real title card with green type and a soft shadow.
The video wall uses the two-line “256 counterfactual videos / from 4 real videos” caption.
It preserves the object and configuration captions, “With paired robot motion,”
the 3.6-second camera pullback from the foot plant to 49 references, and the center
tear reveal. Robot actions play at their original speed; generated-video timing
matches the v52 release.

Stage boundaries live in the media manifest: videos at 0, objects at 2.8, motion
at 6.4, and Sim2Real at 14.4 seconds. The real-world ending remains 3.5 seconds.
Manual stage selection seeks to the corresponding boundary; automatic changes
follow the shared video clock, including the video-wall-to-objects cut. The
real-world mosaic includes repeated views; its tile count is not a count of
distinct objects. The browser icon comes from `PRISM-arxiv.zip`,
`figs_1st/_1_teaser.pdf`. Extraction and verification records are in `qa/motivation-v52/`.

## Robustness and Generalization

An independent section after Method presents the two figures from the latest
Overleaf manuscript (revision `8b9699a`): initial object-pose coverage and zero-shot
elevated pick-up. Both figures use full-width, lossless WebP previews at 2240px;
clicking them opens the unchanged original PDF. The pose figure compares 137
generated clips with four upright seed videos. The elevated pick-up description
identifies these as simulation tests and preserves the reported successes
(35-degree ramp, 0.43m support) and failures (45 degrees, 0.45m).
It also preserves the paper's grasp-height explanation as a hypothesis: tall
training objects expose the policy to similar grasp heights. Simple V2V prompts
can generate elevated demonstrations; training on them is a proposed way to
extend the range, not an evaluated result.
Source snapshots, hashes, and export records are in `qa/robustness-generalization/`.
The compact chapter navigation links to this section as “Robustness.”

## Robustness results

The results gallery starts with In-domain and ends with Pose, then Robustness.
The redundant Real-world experiment overview tab is removed; its examples remain
in the existing object categories. Robustness contains four 1080p, 60 fps clips:
Repack (wooden rack), Continuous working (large box), Out-of-distribution depth
(basketball), and Failure robustness (small box). Each lasts 15 seconds and plays
at the original speed. Short sources are padded at the beginning with their first
frame, not slowed down. Original 4K recordings remain in the user's demos folder.

## Agents and video

Restored with one synchronized, eight-second SMPL comparison. The labels are
“Text + Agentics” and “Video + Agentics.” Text comes from a caption of the same
generated bin-carrying video; the agent scripts a new SMPL sequence from it.
The video comes from a real box-carrying seed; the agent calls a Real2Sim module
and refines the reconstructed ground alignment and object motion. The floor
uses a darker checkerboard. This section contains no efficiency or cost claims.

The Agents comparison autoplays and loops without visible playback controls.
Its text-only route explicitly withholds video from the agent. The takeaway
emphasizes that video demonstrations still help and the agentic pipeline refines
the Real2Sim reconstruction. The introduction states the pick-up, carry, and set-down task.

## Application examples

The solution statement is followed by a collapsed “See different applications”
disclosure. Human-scene interaction (Vary the stairs) shows the supplied full-frame
1920 × 960, 60 fps, 8×3 video. Human-object interaction (Vary the object) reuses
the original eight-second scrolling 3×3 video in its original colors, looping
independently without transitioning into reconstruction. Each has play/pause
controls. Hidden and offscreen examples pause; reduced motion disables autoplay.
