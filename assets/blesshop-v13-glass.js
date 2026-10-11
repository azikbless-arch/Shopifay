/* BLESSHOP v1.3 compact menu */
(()=>{const init=()=>{if(!document.body.classList.contains('template-index'))return;const header=document.querySelector('.bs-header');if(!header||header.dataset.bsGlassReady)return;header.dataset.bsGlassReady='1';let raf=0;const refresh=()=>{raf=0;header.classList.toggle('bs-glass-compact',window.scrollY>72)};const request=()=>{if(!raf)raf=requestAnimationFrame(refresh)};refresh();window.addEventListener('scroll',request,{passive:true});window.addEventListener('pageshow',request)};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();document.addEventListener('shopify:section:load',init)})();

/* BLESSHOP v1.3.1 category parallax: responds to up/down scrolling */
(() => {
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const update=()=>{
    frame=0;
    if (reduced.matches || window.matchMedia('(max-width: 900px)').matches || !document.body.classList.contains('template-index')) return;
    const height=window.innerHeight || document.documentElement.clientHeight || 700;
    document.querySelectorAll('.bs-categories').forEach(section=>{
      const rect=section.getBoundingClientRect();
      if (rect.bottom < -80 || rect.top > height+80) return;
      const progress=clamp((height-rect.top)/(height+rect.height),0,1);
      section.querySelectorAll('.bs-category-card').forEach((card,i)=>{
        // The cards move by a staggered wave; images move at another depth.
        const wave=Math.sin(progress*Math.PI*2+i*.7)*9;
        const move=(.5-progress)*38+wave;
        const imagePan=(.5-progress)*22+Math.sin(progress*Math.PI*1.8+i*.7)*3;
        card.style.setProperty('--bs-card-index',String(i));
        card.style.setProperty('--bs-card-motion-y',move.toFixed(1)+'px');
        card.style.setProperty('--bs-image-motion-y',imagePan.toFixed(1)+'px');
      });
    });
  };
  const request=()=>{
    if (frame || reduced.matches || window.matchMedia('(max-width: 900px)').matches) return;
    frame=window.requestAnimationFrame(update);
  };
  const init=()=>{
    if (!document.body.classList.contains('template-index')) return;
    if (!document.documentElement.dataset.bsCategoryMotionReady) {
      document.documentElement.dataset.bsCategoryMotionReady='1';
      window.addEventListener('scroll',request,{passive:true});
      window.addEventListener('resize',request,{passive:true});
      window.addEventListener('pageshow',request);
      document.addEventListener('shopify:section:load',()=>window.requestAnimationFrame(update));
      document.addEventListener('shopify:section:reorder',request);
      if (reduced.addEventListener) reduced.addEventListener('change',request);
    }
    request();
  };
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();


/* BLESSHOP v1.3.5 – cursor-following category photo depth */
(() => {
  const init = () => {
    if (!document.body.classList.contains('template-index')) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    document.querySelectorAll('.bs-categories .bs-category-card').forEach(card => {
      if (card.dataset.bsPhotoDepthReady === '1') return;
      card.dataset.bsPhotoDepthReady = '1';
      let frame = 0;
      let lastX = 0;
      let lastY = 0;
      const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
      const render = () => {
        frame = 0;
        const box = card.getBoundingClientRect();
        if (!box.width || !box.height) return;
        const x = clamp((lastX - box.left) / box.width, 0, 1);
        const y = clamp((lastY - box.top) / box.height, 0, 1);
        card.style.setProperty('--bs-hover-motion-x', ((.5 - x) * 12).toFixed(2) + 'px');
        card.style.setProperty('--bs-hover-motion-y', ((.5 - y) * 8).toFixed(2) + 'px');
        card.style.setProperty('--bs-hover-light-x', (x * 100).toFixed(1) + '%');
        card.style.setProperty('--bs-hover-light-y', (y * 100).toFixed(1) + '%');
      };
      const move = e => {
        if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
        lastX = e.clientX;
        lastY = e.clientY;
        if (!frame) frame = requestAnimationFrame(render);
      };
      const reset = () => {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        card.style.removeProperty('--bs-hover-motion-x');
        card.style.removeProperty('--bs-hover-motion-y');
        card.style.removeProperty('--bs-hover-light-x');
        card.style.removeProperty('--bs-hover-light-y');
      };
      card.addEventListener('pointerenter', move, {passive:true});
      card.addEventListener('pointermove', move, {passive:true});
      card.addEventListener('pointerleave', reset, {passive:true});
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
  document.addEventListener('shopify:section:load', init);
})();


/* BLESSHOP v1.4 | gentle orb cursor depth */
(() => {
  const hover = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const init = () => {
    if (!document.body.classList.contains('template-index') || !hover.matches || reduced.matches) return;
    document.querySelectorAll('.bs-pastel-hero .bs-pastel-art').forEach(art => {
      if (art.dataset.bsRealisticOrbReady === '1') return;
      const orb = art.querySelector('.bs-pastel-orb');
      if (!orb) return;
      art.dataset.bsRealisticOrbReady = '1';
      let frame = 0;
      let pointerX = .5;
      let pointerY = .5;
      const clamp = (v,min,max) => Math.min(max,Math.max(min,v));
      const paint = () => {
        frame = 0;
        const x = ((pointerX - .5) * 15).toFixed(2);
        const y = ((pointerY - .5) * 11).toFixed(2);
        orb.style.setProperty('--bs-lux-orb-x', x + 'px');
        orb.style.setProperty('--bs-lux-orb-y', y + 'px');
      };
      const move = e => {
        if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
        if (art.closest('.bs-pastel-hero')?.classList.contains('is-paused')) return;
        const b = art.getBoundingClientRect();
        if (!b.width || !b.height) return;
        pointerX = clamp((e.clientX - b.left) / b.width,0,1);
        pointerY = clamp((e.clientY - b.top) / b.height,0,1);
        if (!frame) frame = window.requestAnimationFrame(paint);
      };
      const reset = () => {
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
        orb.style.removeProperty('--bs-lux-orb-x');
        orb.style.removeProperty('--bs-lux-orb-y');
      };
      art.addEventListener('pointermove',move,{passive:true});
      art.addEventListener('pointerleave',reset,{passive:true});
      reduced.addEventListener?.('change',reset);
      const pauseButton=art.closest('.bs-pastel-hero')?.querySelector('[data-pastel-motion]');
      pauseButton?.addEventListener('click',reset);
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
  document.addEventListener('shopify:section:load',init);
})();

(() => {
  const init = () => {
    const body = document.body;
    const main = document.getElementById('MainContent');
    if (!body.matches('.bs-body.template-index') || !main || body.hasAttribute('data-bs-opal-ready')) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (window.matchMedia('(max-width: 900px)').matches) return;
    const palettes = [
      [201,226,250, 248,219,232, 226,216,249],
      [242,218,239, 254,232,219, 207,232,250],
      [220,215,249, 210,233,252, 243,221,238],
      [211,237,235, 249,234,219, 226,222,250],
      [220,231,248, 246,222,237, 231,219,249]
    ];
    let sections = [];
    let frame = 0;
    let previousTime = 0;
    let current = palettes[0].slice();
    let target = current.slice();
    let needsMeasure = true;
    const clamp = value => Math.max(0, Math.min(1, value));
    const paused = () => !!main.querySelector('.bs-pastel-hero.is-paused');
    const paint = () => {
      ['a','b','c'].forEach((key, index) => {
        body.style.setProperty('--bs-opal-' + key, current.slice(index * 3, index * 3 + 3).map(v => v.toFixed(2)).join(', '));
      });
    };
    const measure = () => {
      const visible = sections.filter(section => section.getClientRects().length && section.getBoundingClientRect().height > 1);
      if (!visible.length) return;
      const focus = window.innerHeight * .45;
      let index = 0;
      while (index < visible.length - 1 && visible[index + 1].getBoundingClientRect().top <= focus) index++;
      const from = palettes[Math.min(index, palettes.length - 1)];
      const next = visible[index + 1];
      if (!next) { target = from.slice(); return; }
      const start = visible[index].getBoundingClientRect().top;
      const end = next.getBoundingClientRect().top;
      const progress = clamp((focus - start) / Math.max(1, end - start));
      const blend = progress * progress * (3 - 2 * progress);
      const to = palettes[Math.min(index + 1, palettes.length - 1)];
      target = from.map((value, channel) => value + (to[channel] - value) * blend);
    };
    const tick = time => {
      frame = 0;
      if (document.hidden || paused()) { previousTime = 0; return; }
      if (reduced.matches) {
        current = palettes[0].slice();
        paint();
        previousTime = 0;
        return;
      }
      if (needsMeasure) { measure(); needsMeasure = false; }
      const delta = previousTime ? Math.min(time - previousTime, 64) : 16;
      previousTime = time;
      const ease = 1 - Math.exp(-delta / 180);
      let moving = false;
      current = current.map((value, channel) => {
        const distance = target[channel] - value;
        if (Math.abs(distance) > .05) { moving = true; return value + distance * ease; }
        return target[channel];
      });
      paint();
      if (moving) frame = requestAnimationFrame(tick);
      else previousTime = 0;
    };
    const request = () => {
      needsMeasure = true;
      if (!frame && !document.hidden) frame = requestAnimationFrame(tick);
    };
    const refresh = () => {
      sections = Array.from(main.children).filter(el => el.matches('.shopify-section'));
      const footer = document.querySelector('.bs-footer');
      if (footer) sections.push(footer);
      request();
    };
    paint();
    body.setAttribute('data-bs-opal-ready', '1');
    window.addEventListener('scroll', request, {passive:true});
    window.addEventListener('resize', request, {passive:true});
    window.addEventListener('pageshow', refresh);
    document.addEventListener('visibilitychange', request);
    document.addEventListener('shopify:section:load', refresh);
    document.addEventListener('shopify:section:unload', refresh);
    document.addEventListener('shopify:section:reorder', refresh);
    document.addEventListener('click', event => {
      if (event.target instanceof Element && event.target.closest('[data-pastel-motion]')) request();
    });
    reduced.addEventListener('change', request);
    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(request);
      observer.observe(main);
    }
    refresh();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
