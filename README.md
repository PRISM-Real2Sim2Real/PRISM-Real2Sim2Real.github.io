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

The hero combines the approved v8 first-clip master with the approved chair and plush-dog edits, rebuilt before their previous lossy exports. It preserves 3840 × 2160 resolution and 60000/1001 fps, with 1603 frames (26.743383 seconds). The lossless archival master stays in the local Berkeley teaser folder; `assets/videos/hero-4k-v8/playlist.m3u8` serves a high-quality 4K H.264 rendition in short segments. Safari uses native HLS; other supported browsers use the locally bundled HLS.js 1.7.3. The hero retains the existing pause/play and looping behavior.

## Method demonstrations

The method uses a three-plus-two layout: generated video, 3D reconstruction,
retargeted motion, then the released student rollout and real-world deployment.
Both deployment videos last eight seconds. The student uses the 28K checkpoint
with command 0.1, stops and receives the drop command at six seconds, and runs
at its original playback speed. Local review artifacts in `qa/` are not published.
