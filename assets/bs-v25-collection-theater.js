/* BLESSHOP Clean Home v2.5 collection preview: real media, lightweight crossfade. */
(()=>{
'use strict';
const init=()=>{
 document.querySelectorAll('[data-bs-v25-theater]').forEach(root=>{
  if(root.dataset.bsV25Ready==='1')return;root.dataset.bsV25Ready='1';
  const choices=Array.from(root.querySelectorAll('[data-bs-v25-choice]'));
  const box=root.querySelector('[data-bs-v25-imagebox]');
  const title=root.querySelector('[data-bs-v25-title]'),price=root.querySelector('[data-bs-v25-price]'),link=root.querySelector('[data-bs-v25-link]'),count=root.querySelector('[data-bs-v25-count]');
  const quick=root.querySelector('.bs-v25-stage__quick');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let selected=0,version=0;
  const choose=index=>{
   if(index===selected && version>0)return;
   selected=index;version++;
   const token=version;
   const choice=choices[index];if(!choice)return;
   choices.forEach((button,i)=>{button.classList.toggle('is-active',i===index);button.setAttribute('aria-pressed',String(i===index))});
   title.textContent=choice.dataset.bsV25Name||'';
   price.textContent=choice.dataset.bsV25Price||'';
   const url=choice.dataset.bsV25Url||'';
   if(url.startsWith('/')){link.href=url;if(quick)quick.dataset.productUrl=url;}
   count.textContent=String(index+1).padStart(2,'0')+' / '+String(choices.length).padStart(2,'0');
   const src=choice.dataset.bsV25Image||'';
   const old=box.querySelector('img.bs-v25-stage__image');
   const placeholder=box.querySelector('.bs-v25-stage__no-image');
   if(!src){
     if(old)old.remove();
     if(!placeholder){const n=document.createElement('span');n.className='bs-v25-stage__no-image';n.textContent='Image coming soon';box.append(n)}
     return;
   }
   if(old?.src===src)return;
   const incoming=new Image();incoming.className='bs-v25-stage__image is-entering';incoming.alt=choice.dataset.bsV25Name||'';incoming.decoding='async';incoming.loading='lazy';
   incoming.onload=()=>{if(token!==version)return;placeholder?.remove();box.append(incoming);requestAnimationFrame(()=>{incoming.classList.remove('is-entering');if(old)old.classList.add('is-leaving')});if(old)setTimeout(()=>old.remove(),reduced.matches?0:420)};
   incoming.onerror=()=>{if(token===version && !old){const n=document.createElement('span');n.className='bs-v25-stage__no-image';n.textContent='Image unavailable';box.append(n)}};
   incoming.src=src;
  };
  choices.forEach((choice,i)=>{choice.addEventListener('click',()=>choose(i));choice.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const next=(i+(e.key==='ArrowDown'?1:-1)+choices.length)%choices.length;choices[next].focus();choose(next)}})});
  choose(0);
 });
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
document.addEventListener('shopify:section:load',init);
})();