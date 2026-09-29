/* Chapter navigation. */
(() => {
  'use strict';
  const header = document.querySelector('.blog-header');
  const links = Array.from(document.querySelectorAll('.blog-header nav a, .side-nav a[data-chapter]'));
  const sections = Array.from(new Set(links.map(link => link.hash)))
    .map(hash => document.querySelector(hash)).filter(Boolean);
  let offset = 96;
  function update() {
    let active = '';
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= offset + 100) active = '#' + section.id;
    }
    // A short final section cannot always reach the top of the viewport.
    if (sections.length && scrollY + innerHeight >= document.documentElement.scrollHeight - 2) {
      active = '#' + sections[sections.length - 1].id;
    }
    for (const link of links) {
      if (link.hash === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }
  let pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; update(); });
  }
  new ResizeObserver(() => {
    offset = Math.ceil(header.getBoundingClientRect().height) + 20;
    document.documentElement.style.setProperty('--chapter-offset', offset + 'px');
    schedule();
  }).observe(header);
  addEventListener('scroll', schedule, {passive:true});
  addEventListener('hashchange', schedule);
  update();
})();
