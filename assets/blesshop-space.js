(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  function initSoftReveal() {
    const targets = document.querySelectorAll('.bs-main > .shopify-section:not(:first-child), .bs-category-card, .bs-product-card, .bs-trust-grid > *');
    if (!targets.length) return;
    if (reduced.matches || !('IntersectionObserver' in window)) {
      targets.forEach(el => el.classList.add('bs-soft-reveal', 'is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach(el => {
      el.classList.add('bs-soft-reveal');
      observer.observe(el);
    });
  }
  function initHeroParallax() {
    const hero = document.querySelector('.template-index .bs-pastel-hero');
    if (!hero || reduced.matches || window.matchMedia('(max-width: 900px)').matches || hero.dataset.bsParallaxReady) return;
    hero.dataset.bsParallaxReady='1';
    const orb = hero.querySelector('.bs-pastel-orb');
    const blue = hero.querySelector('.bs-pastel-blob--blue');
    const pink = hero.querySelector('.bs-pastel-blob--pink');
    if (!orb) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = hero.getBoundingClientRect();
      const progress = Math.max(-1, Math.min(1, -rect.top / Math.max(1, rect.height)));
      orb.style.transform = `translate3d(0,${progress * -16}px,0) rotate(${progress * 1.2 - 1}deg)`;
      if (blue) blue.style.translate = `${progress * 10}px ${progress * -8}px`;
      if (pink) pink.style.translate = `${progress * -8}px ${progress * 7}px`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    addEventListener('scroll', onScroll, { passive: true });
  }
  function init() {
    initSoftReveal();
    initHeroParallax();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
  document.addEventListener('shopify:section:load', init);
})();