/* BLESSHOP Clean Home v2.5 — native scroll snap, iPhone swipe, buttons & a11y. */
(()=>{
  'use strict';
  const init=()=>{
    const root=document.querySelector('#collections .bls-panel');
    if(!root||root.dataset.bsSnap25==='1')return;
    const scroller=root.querySelector('.bls-mosaic');
    const scenes=Array.from(scroller?.querySelectorAll(':scope > .bls-tile')||[]);
    if(!scroller||!scenes.length)return;
    root.dataset.bsSnap25='1';
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const hud=document.createElement('div');
    hud.className='bls-snap-controls';hud.setAttribute('aria-label','Category slideshow');
    const counter=document.createElement('span');counter.className='bls-snap-counter';
    const dots=document.createElement('span');dots.className='bls-snap-dots';
    const previous=document.createElement('button');previous.className='bls-snap-arrow';previous.type='button';previous.textContent='↑';previous.setAttribute('aria-label','Previous category');
    const next=document.createElement('button');next.className='bls-snap-arrow';next.type='button';next.textContent='↓';next.setAttribute('aria-label','Next category');
    const tip=document.createElement('span');tip.className='bls-snap-tip';tip.textContent='Swipe or scroll to explore';tip.setAttribute('aria-hidden','true');
    const dotList=scenes.map((scene,i)=>{const b=document.createElement('button');b.type='button';b.className='bls-snap-dot';b.setAttribute('aria-label','Show '+(scene.querySelector('.bls-tile__name')?.textContent?.trim()||'category '+(i+1)));b.addEventListener('click',()=>go(i));dots.append(b);return b;});
    hud.append(counter,previous,dots,next);scroller.after(hud);scroller.append();scroller.parentNode.append(tip);
    let active=-1,frame=0;
    const go=i=>{const target=Math.min(scenes.length-1,Math.max(0,i));scroller.scrollTo({top:scenes[target].offsetTop-scenes[0].offsetTop,behavior:reduced.matches?'auto':'smooth'});};
    const paint=()=>{
      frame=0;
      const h=scroller.clientHeight||1;
      const pos=scroller.scrollTop;
      const idx=Math.max(0,Math.min(scenes.length-1,Math.round(pos/h)));
      if(idx!==active){
        active=idx;counter.textContent=String(idx+1).padStart(2,'0')+' / '+String(scenes.length).padStart(2,'0');
        scenes.forEach((scene,i)=>scene.classList.toggle('is-snap-active',i===idx));
        dotList.forEach((dot,i)=>{dot.classList.toggle('is-active',i===idx);dot.setAttribute('aria-current',i===idx?'true':'false');});
        previous.disabled=idx===0;next.disabled=idx===scenes.length-1;
      }
      scenes.forEach((scene,i)=>{
        const reveal=reduced.matches?1:Math.max(0.25,1-Math.abs((scenes[i].offsetTop-scenes[0].offsetTop)-pos)/h);
        scene.style.setProperty('--bs-snap-reveal',reveal.toFixed(3));
      });
    };
    const request=()=>{if(!frame)frame=requestAnimationFrame(paint)};
    previous.addEventListener('click',()=>go(active-1));next.addEventListener('click',()=>go(active+1));
    scroller.addEventListener('scroll',request,{passive:true});addEventListener('resize',request,{passive:true});
    scroller.setAttribute('tabindex','0');scroller.setAttribute('aria-label','Swipe up or down to browse categories');
    scroller.addEventListener('keydown',e=>{if(e.target!==scroller)return;if(['ArrowDown','PageDown'].includes(e.key)){e.preventDefault();go(active+1)}else if(['ArrowUp','PageUp'].includes(e.key)){e.preventDefault();go(active-1)}});
    request();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  document.addEventListener('shopify:section:load',init);
})();