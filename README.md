# PRISM research website

Public site: https://prism-real2sim2real.github.io/

This repository contains the PRISM research blog: real-world results, the video-data
bottleneck, counterfactual video generation, an interactive V2V challenge, and the
real-to-sim-to-real method. All original PRISM media remain available.

Edit `index.html` for the narrative and `assets/blog.css` for the editorial layout.
`assets/content.js` defines the media and galleries; `assets/app.js` handles video
playback, comparisons, the quiz, and expanded views. The related-work VideoMimic
clip is attributed and streamed from its original project site.

## Publish

GitHub Pages serves the root of the `main` branch. The `.nojekyll` file preserves
this dependency-free static site. Push regular commits to `main` to publish updates;
fetch and incorporate remote changes before pushing. Do not force-push.

All website assets use relative paths so the page works under `/prism/`.
Keep `assets/content.js`, video files, and poster images together when updating media.

## Preview locally

Run `python3 -m http.server 8000` from this directory and open
http://localhost:8000/ in a browser. No install or build step is required.
