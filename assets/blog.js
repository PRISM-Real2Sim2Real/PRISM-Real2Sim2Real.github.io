/* Small additions to the original PRISM media controller. */
(() => {
  'use strict';
  const links = document.querySelectorAll('.side-nav a');
  const sections = Array.from(links, link => document.querySelector(link.hash));
  const update = () => {
    let active = null;
    sections.forEach(section => { if (section && section.getBoundingClientRect().top <= 180) active = section.id; });
    links.forEach(link => {
      if (link.hash === '#' + active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { update(); ticking = false; });
  }, {passive:true});
  update();
  // A related-work clip should stop when it leaves the reader's viewport.
  const reference = document.querySelector('.related-video video');
  new IntersectionObserver(entries => {
    entries.forEach(entry => { if (!entry.isIntersecting) reference.pause(); });
  }).observe(reference);
})();
