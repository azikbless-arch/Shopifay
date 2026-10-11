/* BLESSHOP Premium v1.6 | product gallery depth. Uses existing thumbnail and zoom handlers. */
(() => {
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const init = () => {
    if (!document.body.classList.contains('template-product')) return;
    document.querySelectorAll('.bs-product-gallery[data-gallery]').forEach(gallery => {
      if (gallery.dataset.bsGalleryV16 === '1') return;
      gallery.dataset.bsGalleryV16 = '1';
      const surface = gallery.querySelector('.bs-product-main-media');
      if (!surface) return;
      let frame = 0, x = 50, y = 36;
      const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
      const draw = () => {
        frame = 0;
        surface.style.setProperty('--bs-pdp-light-x',x.toFixed(1)+'%');
        surface.style.setProperty('--bs-pdp-light-y',y.toFixed(1)+'%');
      };
      surface.addEventListener('pointermove', event => {
        if (!finePointer.matches || reduced.matches) return;
        if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
        const rect = surface.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        x = clamp((event.clientX-rect.left)/rect.width*100,0,100);
        y = clamp((event.clientY-rect.top)/rect.height*100,0,100);
        if (!frame) frame = requestAnimationFrame(draw);
      },{passive:true});
      surface.addEventListener('pointerleave',() => {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        surface.style.removeProperty('--bs-pdp-light-x');
        surface.style.removeProperty('--bs-pdp-light-y');
      },{passive:true});
      gallery.addEventListener('click', event => {
        const thumb = event.target.closest('[data-gallery-thumb]');
        if (!thumb || !gallery.contains(thumb) || reduced.matches) return;
        const main = surface.querySelector('.bs-product-main-image');
        if (!main) return;
        main.classList.remove('bs-pdp-image-changing');
        void main.offsetWidth;
        main.classList.add('bs-pdp-image-changing');
        main.addEventListener('animationend',() => main.classList.remove('bs-pdp-image-changing'),{once:true});
      });
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
  document.addEventListener('shopify:section:load',init);
})();
