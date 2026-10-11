/* BLESSHOP Premium v2.2 — Footer reveal and back-to-top enhancement.
   Native Shopify newsletter form submits without JavaScript. */
(() => {
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const init=()=>{
    document.querySelectorAll('[data-bs-premium-footer]').forEach(footer=>{
      if(footer.dataset.bsFooterV22==='1')return;
      footer.dataset.bsFooterV22='1';
      const top=footer.querySelector('[data-bs-footer-top]');
      top?.addEventListener('click',()=>{
        window.scrollTo({top:0,behavior:reduced.matches?'auto':'smooth'});
      });
      const targets=Array.from(footer.querySelectorAll('[data-bs-footer-reveal]'));
      if(reduced.matches||!('IntersectionObserver' in window))return;
      // Keep everything visible when JS or IntersectionObserver is unavailable.
      // Only opt into hidden pre-reveal state after observer support is confirmed.
      const observer=new IntersectionObserver(entries=>{
        for(const entry of entries){
          if(!entry.isIntersecting)continue;
          entry.target.classList.add('bs-v22-footer-is-visible');
          observer.unobserve(entry.target);
        }
      },{rootMargin:'0px 0px 35px 0px',threshold:.08});
      targets.forEach(el=>observer.observe(el));
      footer.classList.add('bs-v22-footer-anim-ready');
    });
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
  document.addEventListener('shopify:section:load',init);
})();
