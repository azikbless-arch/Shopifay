(() => {
  'use strict';
  if (window.BlesshopMultiNav30) return;
  window.BlesshopMultiNav30 = true;
  const instances = new Map();
  function init(root) {
    if (instances.has(root)) return;
    const track = root.querySelector('.bls-mn-track');
    const slides = [...root.querySelectorAll('.bls-mn-slide')];
    const pills = [...root.querySelectorAll('[data-mn-select]')];
    const menus = [...root.querySelectorAll('.bls-mn-menu')];
    if (!track || !slides.length) return;
    const abort = new AbortController();
    const signal = abort.signal;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const controls = root.querySelector('.bls-mn-controls');
    const previous = root.querySelector('[data-mn-prev]');
    const next = root.querySelector('[data-mn-next]');
    const status = root.querySelector('[data-mn-status]');
    let active = 0, frame = 0, settle = 0;
    const clamp = n => Math.max(0, Math.min(slides.length - 1, n));
    function paint() {
      frame = 0;
      const view = track.getBoundingClientRect();
      const center = view.left + view.width / 2;
      const metrics = slides.map(slide => slide.getBoundingClientRect());
      let best = Infinity, current = 0;
      metrics.forEach((rect, i) => {
        const distance = Math.abs(rect.left + rect.width / 2 - center);
        if (distance < best) { best = distance; current = i; }
      });
      active = current;
      metrics.forEach((rect, i) => {
        const distance = Math.max(-1, Math.min(1, (rect.left + rect.width / 2 - center) / view.width));
        const surface = slides[i].firstElementChild;
        surface.style.setProperty('--mn-angle', motion.matches ? '0deg' : (-distance * 12).toFixed(2) + 'deg');
        surface.style.setProperty('--mn-scale', motion.matches ? '1' : (1 - Math.abs(distance) * .06).toFixed(3));
        pills[i].setAttribute('aria-current', i === active ? 'true' : 'false');
      });
      previous.disabled = active === 0;
      next.disabled = active === slides.length - 1;
    }
    function announce() {
      status.textContent = (active + 1) + ' / ' + slides.length;
    }
    function request() {
      if (!frame) frame = requestAnimationFrame(paint);
      clearTimeout(settle);
      settle = setTimeout(announce, 180);
    }
    function go(index, openMenu = false) {
      const i = clamp(index);
      if (openMenu) menus.forEach((menu, j) => { menu.open = j === i; });
      const view = track.getBoundingClientRect();
      const target = slides[i].getBoundingClientRect();
      track.scrollTo({
        left: track.scrollLeft + target.left + target.width / 2 - view.left - view.width / 2,
        behavior: motion.matches ? 'auto' : 'smooth'
      });
    }
    pills.forEach((pill, i) => pill.addEventListener('click', event => {
      event.preventDefault();
      go(i, true);
    }, { signal }));
    menus.forEach((menu, i) => menu.addEventListener('toggle', () => {
      pills[i].setAttribute('aria-expanded', String(menu.open));
      if (menu.open) {
        menus.forEach(other => { if (other !== menu) other.open = false; });
        go(i);
      }
    }, { signal }));
    previous.addEventListener('click', () => go(active - 1), { signal });
    next.addEventListener('click', () => go(active + 1), { signal });
    root.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        const menu = event.target.closest('.bls-mn-menu');
        if (menu && menu.open) {
          menu.open = false;
          menu.querySelector('summary').focus();
          event.preventDefault();
        } else {
          menus.forEach(item => { item.open = false; });
        }
        return;
      }
      const pill = event.target.closest('[data-mn-select]');
      if (event.target !== track && !pill) return;
      const index = pill ? Number(pill.dataset.mnSelect) : active;
      let target;
      if (event.key === 'ArrowRight') target = index + 1;
      else if (event.key === 'ArrowLeft') target = index - 1;
      else if (event.key === 'Home') target = 0;
      else if (event.key === 'End') target = slides.length - 1;
      else return;
      event.preventDefault();
      const i = clamp(target);
      go(i);
      if (pill) pills[i].focus({ preventScroll: true });
    }, { signal });
    track.addEventListener('scroll', request, { passive: true, signal });
    motion.addEventListener('change', request, { signal });
    const resize = new ResizeObserver(request);
    resize.observe(track);
    controls.hidden = false;
    pills.forEach(pill => pill.setAttribute('aria-expanded', 'false'));
    paint();
    announce();
    instances.set(root, () => {
      abort.abort();
      resize.disconnect();
      cancelAnimationFrame(frame);
      clearTimeout(settle);
      instances.delete(root);
    });
  }
  function scan(scope = document) {
    if (scope.matches?.('[data-multinav]')) init(scope);
    scope.querySelectorAll('[data-multinav]').forEach(init);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => scan(), { once: true });
  else scan();
  document.addEventListener('shopify:section:load', event => scan(event.target));
  document.addEventListener('shopify:section:unload', event => {
    for (const [root, destroy] of instances) if (event.target.contains(root)) destroy();
  });
})();
