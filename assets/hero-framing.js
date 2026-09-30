/* Keep the approved close framing and Twitter captions on the original 4K video clock. */
(() => {
  const video = document.querySelector('#hero-video');
  if (!video) return;
  const firstCut = 727 * 1001 / 60000;
  const secondCut = 1176 * 1001 / 60000;
  const caption = document.querySelector('#hero-timed-caption');
  // Twitter's v36 opening and v39 dog wording, aligned to this hero's exact cuts.
  const captions = [
    { start: 0, end: 1.3, text: 'PRISM', wordmark: true, fadeIn: false },
    { start: 1.45, end: 4.85, text: 'Our humanoid picks up, carries, and places objects.' },
    { start: 5, end: 7.4, text: 'All with a single policy.' },
    { start: 7.55, end: 9.65, text: 'Continuous task execution' },
    { start: 9.8, end: firstCut, text: 'Using only onboard depth sensing.' },
    { start: firstCut, end: 15.7, text: 'We train with diverse balls, barrels, boxes and bins', fadeOut: false },
    { start: 15.7, end: secondCut, text: 'This chair was never seen during training.', fadeIn: false },
    { start: secondCut, end: 24, text: 'Neither was this plush doggy.' },
    { start: 24, end: Infinity, text: 'Driven purely by real2sim data from video.' }
  ];
  let previousCaption = -2;

  function ease(value) {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
  }

  function updateCaption(time) {
    if (!caption) return;
    const index = captions.findIndex(cue => time >= cue.start && time < cue.end);
    const cue = captions[index];
    if (index !== previousCaption) {
      caption.textContent = cue?.text || '';
      caption.dataset.wordmark = String(Boolean(cue?.wordmark));
      previousCaption = index;
    }
    const fade = index === 5 || index === 6 ? .12 : .16;
    const enter = cue?.fadeIn === false ? 1 : ease((time - (cue?.start || 0)) / fade);
    const leave = cue?.fadeOut === false ? 1 : ease(((cue?.end || 0) - time) / fade);
    caption.style.opacity = String(cue ? enter * leave : 0);
  }

  function pan(time, points) {
    for (let i = 1; i < points.length; i++) {
      if (time <= points[i][0]) {
        const [start, left] = points[i - 1];
        const [end, right] = points[i];
        return left + (right - left) * Math.max(0, (time - start) / (end - start));
      }
    }
    return points[points.length - 1][1];
  }

  function frame(time) {
    // The HLS video track starts 33 ms into its presentation timeline.
    time = Math.max(0, time - .033);
    updateCaption(time);
    let width = 1, left = 0, top = 0;
    if (time < firstCut) {
      width = .8;
      top = .1;
      left = pan(time, [[0, .2], [3, .2], [6, .08], [9, 0]]);
    } else if (time < secondCut) {
      width = .75;
      top = .25;
      left = pan(time, [[firstCut, .25], [13.5, .25], [16.5, .07], [18, 0]]);
    }
    video.style.setProperty('--hero-zoom', String(1 / width));
    video.style.setProperty('--hero-pan-x', `${-100 * left / width}%`);
    video.style.setProperty('--hero-pan-y', `${-100 * top / width}%`);
  }

  frame(video.currentTime);
  video.addEventListener('loadedmetadata', () => frame(video.currentTime));
  video.addEventListener('seeked', () => frame(video.currentTime));
  if ('requestVideoFrameCallback' in video) {
    const next = (_now, metadata) => {
      frame(metadata.mediaTime);
      video.requestVideoFrameCallback(next);
    };
    video.requestVideoFrameCallback(next);
  } else {
    let animation = 0;
    const next = () => {
      frame(video.currentTime);
      animation = video.paused ? 0 : requestAnimationFrame(next);
    };
    video.addEventListener('play', () => { if (!animation) next(); });
    video.addEventListener('pause', () => { cancelAnimationFrame(animation); animation = 0; });
    video.addEventListener('timeupdate', () => frame(video.currentTime));
  }
})();
