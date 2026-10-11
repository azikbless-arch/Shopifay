/* BLESSHOP Premium v2.3 — Lightweight Signature Motion coordinator.
   No duplicated scroll-parallax writers, no new listeners on product cards or cart. */
(() => {
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
 const init=()=>{
   if(!document.body.classList.contains('template-index'))return;
   const hero=document.querySelector('.bs-pastel-hero');
   if(hero && hero.dataset.bsV23Ready!=='1'){
     hero.dataset.bsV23Ready='1';
     const button=hero.querySelector('[data-pastel-motion]');
     // Existing hero handler retains ownership of pause/play; this listener
     // also freezes CSS custom-property-driven cursor/parallax on pause.
     button?.addEventListener('click',()=>{
       if(!hero.classList.contains('is-paused'))return;
       hero.querySelector('.bs-pastel-orb')?.style.removeProperty('transform');
       const orb=hero.querySelector('.bs-pastel-orb');
       orb?.style.removeProperty('--bs-lux-orb-x');
       orb?.style.removeProperty('--bs-lux-orb-y');
     });
   }
   const heads=Array.from(document.querySelectorAll('.bs-main .bs-section-head:not(.bs-section-head--products)'))
     .filter(el=>!el.dataset.bsV23Head);
   if(!heads.length)return;
   heads.forEach(el=>{el.dataset.bsV23Head='1'});
   if(reduce.matches||!('IntersectionObserver' in window))return;
   const observer=new IntersectionObserver((entries,obs)=>{
     entries.forEach(entry=>{
       if(!entry.isIntersecting)return;
       entry.target.classList.remove('bs-v23-head-pending');
       entry.target.classList.add('bs-v23-head-visible');
       obs.unobserve(entry.target);
     });
   },{rootMargin:'0px 0px -25px 0px',threshold:.06});
   heads.forEach(el=>{
     if(el.getBoundingClientRect().top<window.innerHeight*.89){el.classList.add('bs-v23-head-visible');return;}
     el.classList.add('bs-v23-head-pending');
     observer.observe(el);
   });
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 document.addEventListener('shopify:section:load',init);
})();
