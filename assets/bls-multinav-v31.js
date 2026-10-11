/* BLESSHOP MultiNav v3.1 — one animation writer; native vertical page snap. */
(()=>{
'use strict';
if(window.BlesshopMultiNav31)return;
window.BlesshopMultiNav31=true;
const instances=new Map();
const clamp=(n,max)=>Math.max(0,Math.min(max,n));
function init(root){
 if(instances.has(root))return;
 const track=root.querySelector('.bls-mn-track');
 const slides=[...root.querySelectorAll('.bls-mn-slide')];
 const pills=[...root.querySelectorAll('[data-mn-select]')];
 const menus=[...root.querySelectorAll('.bls-mn-menu')];
 const openers=[...root.querySelectorAll('[data-mn-open]')];
 const prev=root.querySelector('[data-mn-prev]');
 const next=root.querySelector('[data-mn-next]');
 const status=root.querySelector('[data-mn-status]');
 const controls=root.querySelector('.bls-mn-controls');
 if(!track||!slides.length||slides.length!==pills.length||!prev||!next||!status||!controls)return;
 const ctrl=new AbortController(),signal=ctrl.signal;
 const reduce=matchMedia('(prefers-reduced-motion:reduce)');
 let active=-1,frame=0,settle=0,observer=null;
 const max=slides.length-1;
 const closeOther=index=>menus.forEach((m,i)=>{if(i!==index&&m.open)m.open=false});
 function paint(){
  frame=0;
  const tr=track.getBoundingClientRect(),middle=tr.left+tr.width/2;
  let found=0,nearest=Infinity;
  const rects=slides.map(el=>el.getBoundingClientRect());
  rects.forEach((r,i)=>{const delta=Math.abs(r.left+r.width/2-middle);if(delta<nearest){nearest=delta;found=i}});
  if(active!==found){
   active=found;
   pills.forEach((p,i)=>p.setAttribute('aria-current',String(i===active)));
   status.textContent=(active+1)+' / '+slides.length;
   prev.disabled=active===0;next.disabled=active===max;
  }
  rects.forEach((rect,i)=>{
   const surface=slides[i].querySelector('.bls-mn-surface');if(!surface)return;
   const distance=clamp(Math.abs((rect.left+rect.width/2-middle)/Math.max(tr.width,1)),1);
   const sign=Math.sign(rect.left+rect.width/2-middle);
   surface.style.setProperty('--mn-angle',reduce.matches?'0deg':(-sign*distance*12).toFixed(1)+'deg');
   surface.style.setProperty('--mn-scale',reduce.matches?'1':(1-distance*.065).toFixed(3));
  });
 }
 const queue=()=>{if(!frame)frame=requestAnimationFrame(paint)};
 function go(index,openMenu=false){
  const i=clamp(index,max),el=slides[i];
  if(openMenu){
   closeOther(i);if(menus[i])menus[i].open=true;
  }else closeOther(i);
  const trackRect=track.getBoundingClientRect(),targetRect=el.getBoundingClientRect();
  track.scrollTo({left:track.scrollLeft+targetRect.left+targetRect.width/2-trackRect.left-trackRect.width/2,behavior:reduce.matches?'auto':'smooth'});
  queue();
 }
 function closeMenu(i){
  if(menus[i])menus[i].open=false;
 }
 function onMenuToggle(i){
  const open=!!menus[i]?.open;
  if(open)closeOther(i);
  pills[i]?.setAttribute('aria-expanded',String(open));
  openers[i]?.setAttribute('aria-expanded',String(open));
  if(open){
   const target=slides[i].getBoundingClientRect(),view=track.getBoundingClientRect();
   if(Math.abs(target.left+target.width/2-view.left-view.width/2)>12)go(i);
  }
 }
 pills.forEach((pill,i)=>pill.addEventListener('click',e=>{e.preventDefault();go(i,true)}, {signal}));
 openers.forEach((opener,i)=>opener.addEventListener('click',()=>menus[i]?.open?closeMenu(i):go(i,true),{signal}));
 menus.forEach((menu,i)=>menu.addEventListener('toggle',()=>onMenuToggle(i),{signal}));
 prev.addEventListener('click',()=>go(Math.max(0,active-1)),{signal});
 next.addEventListener('click',()=>go(Math.min(max,active+1)),{signal});
 function scrollToScreen(which){
  const dest=which==='up'?document.querySelector('.bls-hero'):document.querySelector('#shop');
  if(dest)dest.scrollIntoView({behavior:reduce.matches?'auto':'smooth',block:'start'});
 }
 root.addEventListener('keydown',event=>{
  if(event.key==='Escape'){
   const menu=event.target.closest('.bls-mn-menu');
   if(menu?.open){menu.open=false;menu.querySelector('summary')?.focus({preventScroll:true});event.preventDefault();}
   else menus.forEach(m=>m.open=false);
   return;
  }
  const pill=event.target.closest('[data-mn-select]');
  const withinTrack=event.target===track;
  if(!pill&&!withinTrack)return;
  const idx=pill?Number(pill.dataset.mnSelect):Math.max(0,active);
  let target=null;
  if(event.key==='ArrowRight')target=idx+1;
  else if(event.key==='ArrowLeft')target=idx-1;
  else if(event.key==='Home')target=0;
  else if(event.key==='End')target=max;
  else if(withinTrack&&(event.key==='ArrowDown'||event.key==='PageDown')){event.preventDefault();scrollToScreen('down');return}
  else if(withinTrack&&(event.key==='ArrowUp'||event.key==='PageUp')){event.preventDefault();scrollToScreen('up');return}
  if(target===null)return;
  event.preventDefault();const to=clamp(target,max);go(to);if(pill)pills[to]?.focus({preventScroll:true});
 },{signal});
 // Horizontal swipes are native scroll-snap; vertical scroll is untouched.
 track.addEventListener('scroll',()=>{
   queue();clearTimeout(settle);
   settle=setTimeout(()=>{paint();status.textContent=(active+1)+' / '+slides.length},170);
 },{passive:true,signal});
 reduce.addEventListener('change',queue,{signal});
 if('ResizeObserver'in window){observer=new ResizeObserver(queue);observer.observe(track)}
 else addEventListener('resize',queue,{passive:true,signal});
 controls.hidden=false;
 pills.forEach(p=>p.setAttribute('aria-expanded','false'));
 openers.forEach(o=>o.setAttribute('aria-expanded','false'));
 paint();
 instances.set(root,()=>{ctrl.abort();observer?.disconnect();cancelAnimationFrame(frame);clearTimeout(settle);instances.delete(root)});
}
function scan(scope=document){
 if(scope.matches?.('[data-multinav]'))init(scope);
 scope.querySelectorAll?.('[data-multinav]').forEach(init);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>scan(),{once:true});else scan();
document.addEventListener('shopify:section:load',e=>scan(e.target));
document.addEventListener('shopify:section:unload',e=>{
 for(const [root,destroy] of instances)if(e.target===root||e.target.contains(root))destroy();
});
})();