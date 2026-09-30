/* PRISM research page. Static and accessible. HLS playback uses the bundled HLS.js library.
 * All samples are prerecorded. No remote inference, analytics, or tracking.
 */
(() => {
  'use strict';
  const assets = window.PRISM_ASSETS || {};
  const content = window.PRISM_CONTENT || {choices: [], groups: []};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let dialogOpen = false;
  const groups = new Map();
  const streamingPlayers = new WeakMap();

  function setMedia(video, id, label = '') {
    const asset = assets[id];
    video.pause();
    streamingPlayers.get(video)?.destroy();
    streamingPlayers.delete(video);
    video.removeAttribute('src');
    video.dataset.asset = id;
    delete video.dataset.loadedAsset;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.preload = 'none';
    video.loop = true;
    if (label) video.setAttribute('aria-label', label);
    if (asset) video.poster = asset.poster;
    if (video.parentElement) $$('.media-error', video.parentElement).forEach(e => e.remove());
  }

  function loadMedia(video) {
    const id = video.dataset.asset;
    const asset = assets[id];
    if (!asset || video.dataset.loadedAsset === id) return;
    video.dataset.loadedAsset = id;
    video.preload = 'auto';
    video.muted = true;
    const showMediaError = () => {
      const frame = video.closest('.video-frame, .hero-film, .method-visual');
      if (!frame || $('.media-error', frame)) return;
      const note = document.createElement('span');
      note.className = 'media-error';
      note.textContent = 'This clip could not load. Please reload the page and try again.';
      frame.append(note);
    };
    if (asset.format === 'hls' && !video.canPlayType('application/vnd.apple.mpegurl')) {
      if (!window.Hls?.isSupported()) {
        showMediaError();
        return;
      }
      const stream = new window.Hls({maxBufferLength: 8, backBufferLength: 30});
      streamingPlayers.set(video, stream);
      stream.on(window.Hls.Events.MANIFEST_PARSED, () => {
        const group = groups.get(video.closest('[data-group]')?.dataset.group);
        if (group?.playing && group.visible && !document.hidden && !dialogOpen) {
          video.playbackRate = group.rate;
          video.play().then(() => refreshButton(group)).catch(() => {});
        }
      });
      let recovered = false;
      stream.on(window.Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;
        if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR && !recovered) {
          recovered = true;
          stream.recoverMediaError();
        } else {
          stream.destroy();
          streamingPlayers.delete(video);
          showMediaError();
        }
      });
      stream.loadSource(asset.src);
      stream.attachMedia(video);
    } else {
      video.src = asset.src;
      video.load();
    }
    if (!video.dataset.errorBound) {
      video.dataset.errorBound = '1';
      video.addEventListener('error', showMediaError);
    }
  }

  const labels = {hero: ['Play', 'Pause']};
  function refreshButton(group) {
    const isPlaying = $$('video', group.element).some(v => !v.paused && !v.ended);
    $$(`[data-toggle-group="${group.name}"]`).forEach(button => {
      button.textContent = (labels[group.name] || ['Play', 'Pause'])[isPlaying ? 1 : 0];
      button.setAttribute('aria-label', button.textContent);
      button.setAttribute('aria-pressed', String(isPlaying));
    });
  }
  function updateGroup(group) {
    if (!group) return;
    const epoch = ++group.epoch;
    const videos = $$('video', group.element);
    const shouldPlay = group.playing && group.visible && !document.hidden && !dialogOpen;
    if (!shouldPlay) {
      videos.forEach(v => v.pause());
      refreshButton(group);
      return;
    }
    videos.forEach(v => { loadMedia(v); v.playbackRate = group.rate; });
    const attempts = videos.map(v => v.play().catch(() => {}));
    Promise.allSettled(attempts).then(() => {
      if (group.epoch === epoch) refreshButton(group);
    });
  }
  $$('[data-group]').forEach(element => {
    const name = element.dataset.group;
    groups.set(name, {name, element, playing: !reducedMotion.matches, visible: false, rate: 1, epoch: 0});
  });
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const group = groups.get(entry.target.dataset.group);
      if (!group) return;
      group.visible = entry.isIntersecting;
      // Posters remain useful when autoplay is off or reduced motion is requested.
      if (group.visible) $$('video', group.element).forEach(loadMedia);
      updateGroup(group);
    });
  }, {threshold: 0.06});
  groups.forEach(group => { if (group.name !== 'multiply') observer.observe(group.element); });

  $$('[data-toggle-group]').forEach(button => button.addEventListener('click', () => {
    const group = groups.get(button.dataset.toggleGroup);
    const currentlyPlaying = $$('video', group.element).some(v => !v.paused && !v.ended);
    group.playing = !currentlyPlaying;
    updateGroup(group);
  }));
  function restart(name) {
    const group = groups.get(name);
    if (!group) return;
    $$('video', group.element).forEach(v => {
      loadMedia(v);
      if (v.readyState > 0) v.currentTime = 0;
      else v.addEventListener('loadedmetadata', () => {v.currentTime = 0;}, {once: true});
    });
    group.playing = true;
    updateGroup(group);
  }
  $$('[data-restart-group]').forEach(button => button.addEventListener('click', () => restart(button.dataset.restartGroup)));
  $$('[data-rate-group]').forEach(select => select.addEventListener('change', () => {
    const group = groups.get(select.dataset.rateGroup);
    group.rate = Number(select.value) || 1;
    $$('video', group.element).forEach(v => {v.playbackRate = group.rate;});
  }));
  document.addEventListener('visibilitychange', () => groups.forEach(updateGroup));
  reducedMotion.addEventListener('change', event => {
    if (event.matches) groups.forEach(group => {group.playing = false; updateGroup(group);});
  });
  // Keep like-duration comparisons and V2V clips time-aligned.
  // Real-world experiments have different durations and loop independently.
  window.setInterval(() => {
    ['counterfactuals', 'multiply', 'pipeline', 'agents-motion'].forEach(name => {
      const group = groups.get(name);
      if (!group || !group.visible || !group.playing || document.hidden || dialogOpen) return;
      const videos = $$('video', group.element).filter(v => !v.paused && v.readyState >= 2 && !v.seeking);
      if (videos.length < 2) return;
      const referenceTime = videos[0].currentTime;
      videos.slice(1).forEach(v => {
        if (Number.isFinite(v.duration) && Math.abs(v.currentTime - referenceTime) > 0.18) {
          v.currentTime = Math.min(referenceTime, Math.max(0, v.duration - 0.04));
        }
      });
    });
  }, 400);

  // ----- Four independent videos per generalization view. -----
  // Multi-page categories become one tab per page, e.g. "In-domain (1/2)".
  const views = [];
  content.groups.forEach(category => category.pages.forEach((clips, page) => views.push({
    id: `${category.id}-${page + 1}`, category, page, clips,
    count: category.pages.length > 1 ? `${page + 1}/${category.pages.length}` : ''
  })));
  let viewIndex = 0;
  views.forEach((view, index) => {
    const button = document.createElement('button');
    button.type = 'button'; button.id = `result-tab-${view.id}`;
    button.setAttribute('role', 'tab'); button.setAttribute('aria-controls', 'generalization-panel');
    button.append(view.category.name);
    if (view.count) {
      const count = document.createElement('span'); count.className = 'tab-count'; count.textContent = `(${view.count})`;
      button.append(' ', count);
    }
    button.addEventListener('click', () => {viewIndex = index; renderResults();});
    $('#result-tabs').append(button);
  });
  function renderResults() {
    const view = views[viewIndex];
    const category = view.category;
    const clips = view.clips;
    const pageIndex = view.page;
    $$('#result-tabs [role="tab"]').forEach((button, i) => {
      button.setAttribute('aria-selected', String(i === viewIndex)); button.tabIndex = i === viewIndex ? 0 : -1;
    });
    $('#generalization-panel').setAttribute('aria-labelledby', `result-tab-${view.id}`);
    $('#gallery-title').textContent = category.title;
    const grid = $('#result-grid');
    grid.dataset.category = category.id;
    $$('video', grid).forEach(v => v.pause()); grid.replaceChildren();
    // Pages may hold any number of clips, so number them from the clips on earlier pages.
    const offset = category.pages.slice(0, pageIndex).reduce((n, page) => n + page.length, 0);
    clips.forEach((clip, index) => {
      const card = document.createElement('figure'); card.className = 'result-card';
      const frame = document.createElement('div'); frame.className = 'video-frame';
      const video = document.createElement('video'); setMedia(video, clip.id, `Real robot demonstration: ${clip.title}`);
      const expand = document.createElement('button'); expand.type = 'button'; expand.className = 'expand-video';
      expand.setAttribute('aria-label', `Enlarge ${clip.title} video`);
      expand.addEventListener('click', () => openVideo(clip));
      frame.append(video, expand);
      const caption = document.createElement('figcaption'); const text = document.createElement('div');
      const title = document.createElement('h4'); title.textContent = clip.title;
      const note = document.createElement('p'); note.textContent = clip.note;
      const count = document.createElement('span'); count.className = 'clip-index'; count.textContent = String(offset + index + 1).padStart(2,'0');
      text.append(title,note); caption.append(text,count); card.append(frame,caption); grid.append(card);
    });
    updateGroup(groups.get('results'));
  }
  renderResults();

  // ----- One real video → four examples → a scrolling 3×3 selection. -----
  (() => {
    const grid = $('#multiply-grid'); const stage = $('#multiply-stage');
    if (!grid || !stage) return;
    const generated = content.choices.filter(choice => !choice.real).map(choice => choice.id);
    const seed = content.choices.find(choice => choice.real);
    const live = [seed.id, generated[0], generated[2], generated[3]];
    const fragment = document.createDocumentFragment();
    live.forEach(id => {
      const tile = document.createElement('div');
      tile.className = 'multiply-tile ' + (id === seed.id ? 'is-seed' : 'is-live');
      const video = document.createElement('video'); setMedia(video, id);
      tile.append(video); fragment.append(tile);
    });
    grid.append(fragment);

    // Zoom out from the source to four examples, then play the latest release sequence.
    const phases = {
      1: {transform: 'scale(2)', count: 1, label: 'Real seed video'},
      4: {transform: 'none', count: 4, label: 'Video examples'},
      256: {transform: 'none', count: 256, label: 'Counterfactual videos'},
      objects: {transform: 'none', label: 'Reconstructed 3D objects'},
      motion: {transform: 'none', label: 'Kinematic references'},
      sim2real: {transform: 'none', label: 'Zero-shot Sim2Real'}
    };
    const parsePhase = value => Number.isNaN(Number(value)) ? value : Number(value);
    const sequence = [1, 4, 256, 'objects', 'motion', 'sim2real'];
    const holds = {1: 2600, 4: 4400};
    let phase = 1; let timer = 0; let mediaTimer = 0; let countFrame = 0; let inView = false;
    const counter = $('#multiply-count'); const overlay = counter.parentElement;
    const tiles = groups.get('multiply');
    const film = $('.multiply-layer[data-layer="sequence"]');
    const filmAsset = assets[film.dataset.asset];
    const stageStarts = filmAsset.stageStarts;
    const posters = {256: filmAsset.poster, objects: filmAsset.objectsPoster, motion: filmAsset.motionPoster, sim2real: filmAsset.sim2realPoster};
    const layers = {256: film, objects: film, motion: film, sim2real: film};
    const layerVideos = [...new Set(Object.values(layers))];
    const positions = new WeakMap(); const pendingSeek = new WeakMap();
    const active = () => inView && !document.hidden && !dialogOpen && !reducedMotion.matches;
    // Media pipelines are a scarce resource: past a dozen or so, newly created ones render black
    // and never recover. Keep only the visible stage loaded — four tiles for the grid phases,
    // one full-frame clip otherwise — and release the rest.
    function unload(video) {
      if (layerVideos.includes(video)) positions.set(video, video.currentTime);
      video.pause(); video.removeAttribute('src'); video.load(); delete video.dataset.loadedAsset;
    }
    function unloadTiles() { $$('video', tiles.element).forEach(video => { if (video.dataset.loadedAsset) unload(video); }); }
    function seekWhenReady(video) {
      if (video.readyState > 0 && pendingSeek.has(video)) {
        video.currentTime = pendingSeek.get(video);
        pendingSeek.delete(video);
      }
    }
    function showLayer(video) {
      if (!video.dataset.loadedAsset && !pendingSeek.has(video)) pendingSeek.set(video, positions.get(video) || 0);
      loadMedia(video);
      seekWhenReady(video);
      if (reducedMotion.matches) video.pause();
      else if (video.paused && !video.ended) video.play().catch(() => {});
    }
    function syncMedia() {
      window.clearTimeout(mediaTimer);
      const wanted = inView && !document.hidden && !dialogOpen ? layers[phase] : null;
      layerVideos.forEach(video => { if (video !== wanted && video.dataset.loadedAsset) unload(video); });
      if (wanted) showLayer(wanted);
      tiles.visible = inView;
      tiles.playing = !layers[phase] && !reducedMotion.matches;
      updateGroup(tiles);
      // Release the tiles once the layer has faded in over them.
      if (layers[phase] || !inView) mediaTimer = window.setTimeout(unloadTiles, 1000);
    }
    function setPhase(next, animateCount = true, continuePlayback = false) {
      const from = phase; phase = next;
      const spec = phases[next];
      grid.style.transform = spec.transform;
      // The four video stages share one clip, preserving every cut, pullback and tear reveal.
      // Manual choices seek; automatic stage changes keep the same playback clock.
      if (layers[next] && !continuePlayback) pendingSeek.set(layers[next], stageStarts[next] ?? 0);
      film.poster = posters[next] || filmAsset.poster;
      stage.dataset.phase = String(next);
      syncMedia();
      $$('[data-multiply-phase]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.multiplyPhase === String(next))));
      $('#multiply-label').textContent = spec.label;
      overlay.classList.toggle('no-count', spec.count === undefined);
      window.cancelAnimationFrame(countFrame);
      const fromCount = phases[from].count;
      if (spec.count === undefined) { counter.textContent = ''; return; }
      if (!animateCount || reducedMotion.matches || fromCount === undefined) { counter.textContent = String(spec.count); return; }
      const start = performance.now();
      const tick = now => {
        const t = Math.min(1, (now - start) / 1500); const eased = 1 - Math.pow(1 - t, 3);
        counter.textContent = String(Math.round(fromCount + (spec.count - fromCount) * eased));
        if (t < 1) countFrame = window.requestAnimationFrame(tick);
      };
      countFrame = window.requestAnimationFrame(tick);
    }
    function jumpTo(next) {
      stage.classList.add('instant'); setPhase(next, false);
      void stage.offsetWidth; stage.classList.remove('instant');
    }
    function schedule(extra = 0) {
      window.clearTimeout(timer);
      if (!active()) return;
      // Video stages advance from their media clock, so loading cannot shorten a shot.
      if (holds[phase]) timer = window.setTimeout(advance, holds[phase] + extra);
      else if (layers[phase]?.ended && !pendingSeek.has(layers[phase])) advance();
    }
    function advance() {
      window.clearTimeout(timer);
      if (!active() || stage.classList.contains('is-resetting')) return;
      const next = sequence[(sequence.indexOf(phase) + 1) % sequence.length];
      if (next === 1) {
        // Loop back with a short fade rather than a reverse zoom.
        stage.classList.add('is-resetting');
        timer = window.setTimeout(() => {
          jumpTo(1); stage.classList.remove('is-resetting');
          schedule();
        }, 420);
        return;
      }
      setPhase(next, true, Boolean(layers[phase]) && layers[phase] === layers[next]);
      schedule();
    }
    layerVideos.forEach(video => {
      video.addEventListener('loadedmetadata', () => seekWhenReady(video));
      video.addEventListener('ended', () => {
        if (video === layers[phase] && !pendingSeek.has(video)) advance();
      });
    });
    film.addEventListener('timeupdate', () => {
      if (pendingSeek.has(film) || !layers[phase]) return;
      const boundary = stageStarts[sequence[sequence.indexOf(phase) + 1]];
      if (boundary !== undefined && film.currentTime >= boundary) advance();
    });
    // Manual choices replay the selected stage, including its exact start in the shared clip.
    $$('[data-multiply-phase]').forEach(button => button.addEventListener('click', () => {
      const next = parsePhase(button.dataset.multiplyPhase);
      window.clearTimeout(timer);
      stage.classList.remove('is-resetting');
      setPhase(next);
      schedule(800);
    }));
    // Coming back into view or to the tab resumes from the current stage instead of skipping ahead.
    new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.35 && !inView) {
        inView = true; syncMedia(); schedule();
      } else if ((!entry.isIntersecting || entry.intersectionRatio < 0.35) && inView) {
        inView = false; window.clearTimeout(timer); stage.classList.remove('is-resetting'); syncMedia();
      }
    }), {threshold: 0.35}).observe(stage);
    document.addEventListener('visibilitychange', () => {
      stage.classList.remove('is-resetting'); syncMedia(); schedule();
    });
    if (reducedMotion.matches) jumpTo(256);
    reducedMotion.addEventListener('change', event => {
      stage.classList.remove('is-resetting');
      if (event.matches) { window.clearTimeout(timer); jumpTo(256); }
      else { syncMedia(); schedule(); }
    });
  })();

  // ----- Method pipeline: reveal the three stages left to right once in view. -----
  const pipeline = $('#pipeline');
  if (pipeline) {
    new IntersectionObserver((entries, io) => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      pipeline.classList.add('is-in'); io.disconnect();
    }), {threshold: 0.3}).observe(pipeline);
  }

  // Roving tab focus, including Home/End. Selection follows focus.
  $$('[role="tablist"]').forEach(tablist => tablist.addEventListener('keydown', event => {
    if (!['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) return;
    const buttons = $$('[role="tab"]', tablist);
    const current = buttons.indexOf(document.activeElement);
    if (current < 0) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
      : (current + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next].click(); buttons[next].focus();
  }));

  // ----- Native modal video inspection and citation. -----
  let previousFocus = null;
  function showDialog(dialog) {
    previousFocus = document.activeElement;
    dialogOpen = true; groups.forEach(updateGroup);
    document.body.style.overflow = 'hidden';
    dialog.showModal();
  }
  function openVideo(clip) {
    const asset = assets[clip.id]; if (!asset) return;
    const modalVideo = $('#modal-video'); modalVideo.pause();
    modalVideo.src = asset.src; modalVideo.poster = asset.poster;
    modalVideo.playbackRate = 1; modalVideo.muted = true;
    $('#modal-title').textContent = clip.title;
    $('#modal-description').textContent = `${clip.note || ''}${clip.note ? ' · ' : ''}${clip.speed === '1×' ? 'Real-time playback.' : clip.speed === 'Source clip' ? 'Original clip timing.' : `Playback speed: ${clip.speed}.`}`;
    showDialog($('#video-dialog'));
    modalVideo.play().catch(() => {});
  }
  $$('dialog').forEach(dialog => {
    dialog.addEventListener('close', () => {
      if (dialog.id === 'video-dialog') { $('#modal-video').pause(); $('#modal-video').removeAttribute('src'); $('#modal-video').load(); }
      document.body.style.overflow = ''; dialogOpen = false;
      groups.forEach(updateGroup);
      if (previousFocus && previousFocus.isConnected) previousFocus.focus();
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    });
  });
  $$('[data-close-dialog]').forEach(button => button.addEventListener('click', () => document.getElementById(button.dataset.closeDialog).close()));
  $('#copy-citation').addEventListener('click', async () => {
    const text = $('#citation-text').textContent;
    try {
      if (!navigator.clipboard) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(text); $('#copy-status').textContent = 'Copied.';
    } catch (_) {
      const selection = window.getSelection(); const range = document.createRange();
      range.selectNodeContents($('#citation-text')); selection.removeAllRanges(); selection.addRange(range);
      $('#copy-status').textContent = 'Citation selected. Press Ctrl/Cmd+C to copy.';
    }
  });
})();
