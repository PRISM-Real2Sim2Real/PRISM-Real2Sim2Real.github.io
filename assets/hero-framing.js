/* Match the earlier close framing while preserving the original 4K footage and speed. */
(() => {
  const video = document.querySelector('#hero-video');
  if (!video) return;
  const firstCut = 727 * 1001 / 60000;
  const secondCut = 1176 * 1001 / 60000;

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
