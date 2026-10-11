/* BLESSHOP Premium v1.5.1 | accessible product-card navigation animation */
(() => {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let navigating = false;
  let pending = null;

  const reset = () => {
    if (pending) { window.clearTimeout(pending); pending = null; }
    navigating = false;
    document.body?.classList.remove('bs-v15-product-leaving');
    document.querySelectorAll('.bs-product-card.bs-v15-selected').forEach(el => el.classList.remove('bs-v15-selected'));
    document.querySelectorAll('.bs-v15-transition-layer').forEach(el => el.remove());
  };
  window.addEventListener('pageshow', reset);

  document.addEventListener('click', event => {
    if (navigating || event.defaultPrevented || motion.matches ||
        event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    if (window.Shopify?.designMode) return;

    const anchor = event.target.closest('.bs-product-card__media > a[href], .bs-product-card__title[href], .bs-recent-card[href], .bs-predictive__item[href]');
    if (!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return;
    if (!document.body.classList.contains('bs-body')) return;
    if (!['http:', 'https:'].includes(anchor.protocol) || anchor.origin !== window.location.origin) return;

    // Only normal same-origin product links; other actions and routes stay untouched.
    const segments = anchor.pathname.split('/').filter(Boolean);
    if (!segments.includes('products') || !segments[segments.indexOf('products') + 1]) return;

    event.preventDefault();
    navigating = true;
    anchor.closest('.bs-product-card')?.classList.add('bs-v15-selected');
    const layer = document.createElement('div');
    layer.className = 'bs-v15-transition-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);

    // Ensure the first frame is painted before fading to the pearl background.
    window.requestAnimationFrame(() => {
      if (navigating) document.body.classList.add('bs-v15-product-leaving');
    });
    const destination = anchor.href;
    pending = window.setTimeout(() => {
      window.location.assign(destination);
    }, 240);
  });
})();
