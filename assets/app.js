/* PRISM research page. Static, accessible, and dependency-free.
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

  function setMedia(video, id, label = '') {
    const asset = assets[id];
    video.pause();
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
    video.src = asset.src;
    video.preload = 'auto';
    video.muted = true;
    video.load();
    if (!video.dataset.errorBound) {
      video.dataset.errorBound = '1';
      video.addEventListener('error', () => {
        // Visible failure states instead of silently showing a broken video.
        const frame = video.closest('.video-frame, .quiz-tile, .hero-film, .method-visual');
        if (!frame || $('.media-error', frame)) return;
        const note = document.createElement('span');
        note.className = 'media-error';
        note.textContent = 'This clip could not load. Please reload the page or check the local assets folder.';
        frame.append(note);
      });
    }
  }

  const labels = {
    hero: ['Play', 'Pause'], quiz: ['Play all', 'Pause all'],
    samples: ['Play comparison', 'Pause comparison'], method: ['Play stage', 'Pause stage'],
    results: ['Play four videos', 'Pause four videos']
  };
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
  groups.forEach(group => observer.observe(group.element));

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
  // Only like-duration V2V clips are continually time-aligned.
  // Real-world experiments have different durations and loop independently.
  window.setInterval(() => {
    ['quiz', 'samples', 'multiply'].forEach(name => {
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

  // ----- Four clips per round: one real seed and three counterfactuals. -----
  let order = [];
  let selected = null;
  let revealed = false;
  function shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function renderQuiz() {
    const grid = $('#quiz-grid');
    $$('video', grid).forEach(v => v.pause());
    const pool = shuffle(content.choices.filter(choice => !choice.real));
    const picks = pool.slice(0, 3);
    // A new round always changes the comparison, not just its positions.
    if (picks.every(choice => order.some(previous => previous.id === choice.id)) && pool.length > 3) {
      picks[2] = pool.find(choice => !order.some(previous => previous.id === choice.id));
    }
    order = shuffle([content.choices.find(choice => choice.real), ...picks]);
    selected = null; revealed = false;
    $('#quiz-feedback').hidden = true;
    $('#quiz-feedback').replaceChildren();
    $('#quiz-selection').textContent = 'Select the clip you think is real.';
    $('#sample-explorer').hidden = true; // Do not spoil the seed before the reveal.
    grid.replaceChildren();
    order.forEach((choice, index) => {
      const tile = document.createElement('button');
      tile.type = 'button'; tile.className = 'quiz-tile';
      tile.setAttribute('aria-label', `Choose clip ${index + 1} as the real recording`);
      tile.setAttribute('aria-pressed', 'false');
      const video = document.createElement('video');
      setMedia(video, choice.id);
      // A video inside an answer button is decorative; the button owns the accessible name.
      video.setAttribute('aria-hidden', 'true');
      const number = document.createElement('span');
      number.className = 'quiz-number'; number.textContent = String(index + 1).padStart(2, '0');
      const answer = document.createElement('span'); answer.className = 'quiz-answer';
      tile.append(video, number, answer);
      tile.addEventListener('click', () => {
        if (revealed) {
          openVideo({id: choice.id, title: choice.real ? 'Original real recording · cardboard box' : `V2V-generated · ${choice.object}`, note: choice.insight, speed: 'Source clip'});
          return;
        }
        selected = index;
        $$('.quiz-tile', grid).forEach((button, i) => {
          button.classList.toggle('selected', i === index);
          button.setAttribute('aria-pressed', String(i === index));
        });
        reveal();
      });
      tile.addEventListener('keydown', event => {
        const directions = {ArrowRight: 1, ArrowLeft: -1, ArrowDown: 2, ArrowUp: -2};
        if (!(event.key in directions)) return;
        event.preventDefault();
        const next = (index + directions[event.key] + order.length) % order.length;
        $$('.quiz-tile', grid)[next].focus();
      });
      grid.append(tile);
    });
    updateGroup(groups.get('quiz'));
  }
  function reveal() {
    if (revealed) return;
    revealed = true;
    const realIndex = order.findIndex(choice => choice.real);
    $$('.quiz-tile').forEach((tile, index) => {
      const isReal = Boolean(order[index].real);
      tile.classList.add('revealed');
      tile.classList.toggle('is-real', isReal);
      tile.classList.remove('is-wrong');
      $('.quiz-answer', tile).textContent = isReal ? 'REAL · original seed' : 'V2V · generated';
      tile.setAttribute('aria-label', `Inspect clip ${index + 1}: ${isReal ? 'original real recording' : 'V2V-generated'}, ${order[index].object}`);
    });
    const feedback = $('#quiz-feedback');
    const title = document.createElement('strong');
    title.textContent = selected === realIndex
      ? `Correct! Clip ${realIndex + 1} is the real recording.`
      : `Your pick was generated. Clip ${realIndex + 1} is the real recording.`;
    const explanation = document.createElement('p');
    explanation.textContent = 'The cardboard-box interaction is the seed. The other three videos are generated alternatives: not only different objects, but paired changes in the human’s reach, hand placement, and carrying motion.';
    const caution = document.createElement('span');
    caution.textContent = 'Photorealism alone does not establish physical validity. PRISM reconstructs and grounds these interactions before learning in simulation. Click any revealed tile to inspect it.';
    feedback.replaceChildren(title, explanation, caution); feedback.hidden = false;
    $('#quiz-selection').textContent = 'Green marks the real seed. Every other clip is V2V-generated.';
    $('#sample-explorer').hidden = false;
  }
  $('#shuffle-quiz').addEventListener('click', renderQuiz);
  renderQuiz();

  // ----- Explore a pre-generated object-conditioned sample. -----
  content.choices.filter(choice => !choice.real).forEach((choice, index) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'sample-option';
    button.textContent = choice.object;
    button.setAttribute('aria-pressed', String(index === 0));
    button.addEventListener('click', () => {
      $$('.sample-option').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      setMedia($('#sample-video'), choice.id, `V2V-generated interaction with a ${choice.object.toLowerCase()}`);
      $('#sample-caption').textContent = choice.insight;
      const group = groups.get('samples');
      const seed = $('video', group.element);
      if (seed.readyState) seed.currentTime = 0;
      updateGroup(group);
    });
    $('#sample-options').append(button);
  });

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
    $$('video', grid).forEach(v => v.pause()); grid.replaceChildren();
    clips.forEach((clip, index) => {
      const card = document.createElement('figure'); card.className = 'result-card';
      const frame = document.createElement('div'); frame.className = 'video-frame';
      const video = document.createElement('video'); setMedia(video, clip.id, `Real robot demonstration: ${clip.title}`);
      const speed = document.createElement('span'); speed.className = 'speed-badge';
      speed.textContent = clip.speed === 'Mixed' ? 'PRESENTATION · VARIABLE SPEED' : `PRESENTATION · ${clip.speed}`;
      const expand = document.createElement('button'); expand.type = 'button'; expand.className = 'expand-video';
      expand.textContent = 'Expand ↗'; expand.setAttribute('aria-label', `Expand ${clip.title} video`);
      expand.addEventListener('click', () => openVideo(clip));
      frame.append(video, speed, expand);
      const caption = document.createElement('figcaption'); const text = document.createElement('div');
      const title = document.createElement('h4'); title.textContent = clip.title;
      const note = document.createElement('p'); note.textContent = clip.note;
      const count = document.createElement('span'); count.className = 'clip-index'; count.textContent = String(pageIndex * 4 + index + 1).padStart(2,'0');
      text.append(title,note); caption.append(text,count); card.append(frame,caption); grid.append(card);
    });
    updateGroup(groups.get('results'));
  }
  renderResults();

  // ----- One real video → nine samples → 256 counterfactual videos. -----
  (() => {
    const grid = $('#multiply-grid'); const stage = $('#multiply-stage');
    if (!grid || !stage) return;
    const N = 16; const block = [7, 8, 9]; // 3×3 live videos around the seed tile at (8, 8)
    const generated = content.choices.filter(choice => !choice.real).map(choice => choice.id);
    const seed = content.choices.find(choice => choice.real);
    const live = [...generated.slice(0, 4), seed.id, ...generated.slice(4, 8)];
    const fragment = document.createDocumentFragment();
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const tile = document.createElement('div'); tile.className = 'multiply-tile';
      if (block.includes(r) && block.includes(c)) {
        const id = live[(r - block[0]) * 3 + (c - block[0])];
        const video = document.createElement('video'); setMedia(video, id);
        tile.append(video); tile.classList.add(id === seed.id ? 'is-seed' : 'is-live');
      } else {
        const id = generated[(r * 5 + c * 3 + (r * c) % 7) % generated.length];
        const img = document.createElement('img'); img.src = assets[id].poster; img.alt = ''; img.decoding = 'async';
        tile.append(img);
      }
      fragment.append(tile);
    }
    grid.append(fragment);

    // Zoom about the seed/block center (8.5/16 of the grid) so each stage fills the stage exactly.
    const focus = 8.5 / N;
    const zoom = s => s === 1 ? 'none' : `translate(${(0.5 - s * focus) * 100}%, ${(0.5 - s * focus) * 100}%) scale(${s})`;
    // Three zoom levels of the video grid, then two full-frame layers that fade in over it.
    const phases = {
      1: {transform: zoom(N), count: 1, label: 'REAL SEED VIDEO', caption: 'Start from one real recording of a person carrying a box.'},
      9: {transform: zoom(N / 3), count: 9, label: 'COUNTERFACTUAL SAMPLES', caption: 'V2V generation samples new objects together with the human motion that matches them.'},
      256: {transform: zoom(N / 3), count: 256, label: 'COUNTERFACTUAL VIDEOS', caption: 'From four real seeds, PRISM samples 256 counterfactual videos: diverse training data for one policy.'},
      objects: {transform: zoom(1), label: 'DIVERSE 3D OBJECTS', caption: 'Every generated video yields a 3D object. Together they span the scales, shapes, and categories of everyday things.'},
      motion: {transform: zoom(1), label: 'HIGH-QUALITY KINEMATICS', caption: 'Reconstructed interactions are retargeted into humanoid kinematics: physically grounded references for policy training.'},
      sim2real: {transform: zoom(1), label: 'ZERO-SHOT SIM-TO-REAL', caption: 'One unified policy, trained in simulation and deployed on the real robot across dozens of objects.'}
    };
    const parsePhase = value => Number.isNaN(Number(value)) ? value : Number(value);
    const sequence = [[1, 2600], [9, 4400], [256, 5200], ['objects', 2700], ['motion', 8400], ['sim2real', 7400]];
    let phase = 1; let step = 0; let timer = 0; let mediaTimer = 0; let countFrame = 0; let inView = false;
    const counter = $('#multiply-count'); const overlay = counter.parentElement;
    const tiles = groups.get('multiply');
    const layers = {256: $('.multiply-layer[data-layer="256"]'), objects: $('.multiply-layer[data-layer="objects"]'), motion: $('.multiply-layer[data-layer="motion"]'), sim2real: $('.multiply-layer[data-layer="sim2real"]')};
    // Media pipelines are a scarce resource: past a dozen or so, newly created ones render black
    // and never recover. Keep only the visible stage loaded — nine tiles for the grid phases,
    // one full-frame clip otherwise — and release the rest.
    function unload(video) {
      video.pause(); video.removeAttribute('src'); video.load(); delete video.dataset.loadedAsset;
    }
    function unloadTiles() { $$('video', tiles.element).forEach(video => { if (video.dataset.loadedAsset) unload(video); }); }
    function showLayer(video) { loadMedia(video); if (video.paused) video.play().catch(() => {}); }
    function syncMedia() {
      window.clearTimeout(mediaTimer);
      const wanted = inView && !document.hidden ? layers[phase] : null;
      Object.values(layers).forEach(video => { if (video !== wanted && video.dataset.loadedAsset) unload(video); });
      if (wanted) showLayer(wanted);
      tiles.playing = !layers[phase] && !reducedMotion.matches;
      updateGroup(tiles);
      // Release the tiles once the layer has faded in over them.
      if (layers[phase]) mediaTimer = window.setTimeout(unloadTiles, 1000);
    }
    function setPhase(next, animateCount = true) {
      const from = phase; phase = next;
      const spec = phases[next];
      grid.style.transform = spec.transform;
      stage.dataset.phase = String(next);
      syncMedia();
      $$('[data-multiply-phase]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.multiplyPhase === String(next))));
      $('#multiply-label').textContent = spec.label;
      $('#multiply-caption').textContent = spec.caption;
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
    function run() {
      window.clearTimeout(timer);
      if (!inView || document.hidden || dialogOpen || reducedMotion.matches) return;
      const [next, hold] = sequence[step];
      step = (step + 1) % sequence.length;
      if (next === 1 && phase !== 1) {
        // Loop back with a short fade rather than a reverse zoom.
        stage.classList.add('is-resetting');
        timer = window.setTimeout(() => {
          jumpTo(1); stage.classList.remove('is-resetting');
          timer = window.setTimeout(run, hold);
        }, 420);
        return;
      }
      setPhase(next, next !== 1);
      timer = window.setTimeout(run, hold);
    }
    // A manual choice lingers on that stage a little longer, then the sequence continues from it.
    $$('[data-multiply-phase]').forEach(button => button.addEventListener('click', () => {
      const next = parsePhase(button.dataset.multiplyPhase);
      const index = sequence.findIndex(([name]) => name === next);
      window.clearTimeout(timer);
      step = (index + 1) % sequence.length;
      setPhase(next);
      timer = window.setTimeout(run, sequence[index][1] + 800);
    }));
    // Coming back into view or to the tab resumes from the current stage instead of skipping ahead.
    function resume(delay) { window.clearTimeout(timer); timer = window.setTimeout(run, delay); }
    new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting && !inView) {
        inView = true; syncMedia(); resume(step === 0 ? 0 : 1200);
      } else if (!entry.isIntersecting && inView) { inView = false; window.clearTimeout(timer); syncMedia(); }
    }), {threshold: 0.35}).observe(stage);
    document.addEventListener('visibilitychange', () => { syncMedia(); if (document.hidden) window.clearTimeout(timer); else resume(1200); });
    if (reducedMotion.matches) jumpTo(256);
    reducedMotion.addEventListener('change', event => { if (event.matches) { window.clearTimeout(timer); jumpTo(256); } });
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
    $('#modal-description').textContent = `${clip.note || ''}${clip.note ? ' · ' : ''}${clip.speed === 'Mixed' ? 'Variable speed in the original presentation.' : clip.speed === 'Source clip' ? 'Original clip timing.' : `Presentation label: ${clip.speed}.`} Player controls are relative to the supplied clip.`;
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
  // Reading progress is purely local; no scroll data are transmitted.
  let scrollPending = false;
  function updateProgress() {
    const sections = ['generalization','v2v','motivation','method','citation','acknowledgements'];
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    const active = atBottom ? sections[sections.length - 1]
      : sections.filter(id => document.getElementById(id).getBoundingClientRect().top <= 150).pop();
    $$('.site-header nav a, .side-nav a').forEach(link => link.classList.toggle('active', link.hash === `#${active}`));
    scrollPending = false;
  }
  window.addEventListener('scroll', () => { if (!scrollPending) {scrollPending = true; window.requestAnimationFrame(updateProgress);} }, {passive:true});
  window.addEventListener('resize', updateProgress); updateProgress();
})();
