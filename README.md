# PRISM research website

Public site: https://prism-real2sim2real.github.io/

This repository contains the static PRISM research page, interactive V2V challenge,
method explorer, real-world result galleries, and 48 prerecorded video clips.

## Publish

GitHub Pages serves the root of the `main` branch. The `.nojekyll` file preserves
this dependency-free static site. Push regular commits to `main` to publish updates;
fetch and incorporate remote changes before pushing. Do not force-push.

All website assets use relative paths so the page works under `/prism/`.
Keep `assets/content.js`, video files, and poster images together when updating media.

## Preview locally

Run `python3 -m http.server 8000` from this directory and open
http://localhost:8000/ in a browser. No install or build step is required.
