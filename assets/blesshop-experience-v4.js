/* BLESSHOP v4.0 — wishlist, story scroll, catalog finder & authentic media comparison.
   All actions are progressively enhanced and use Shopify's existing product/cart flows. */
(() => {
'use strict';
const key='blesshop-wishlist-v4';
const draftStore=[]; // fallback if localStorage is blocked
const storage=()=>{try{return window.localStorage}catch(e){return null}};
let storageUnavailable=false;
const isProductUrl=url=>typeof url==='string'&&/^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?products\/[^/\s]+/i.test(url);
const load=()=>{if(storageUnavailable)return draftStore.slice();try{const v=JSON.parse(storage()?.getItem(key)||'[]');return Array.isArray(v)?v.filter(x=>x&&isProductUrl(x.url)).slice(0,40):[]}catch(e){storageUnavailable=true;return draftStore.slice()}};
const save=items=>{draftStore.splice(0,draftStore.length,...items);try{const s=storage();if(s)s.setItem(key,JSON.stringify(items));else storageUnavailable=true;}catch(e){storageUnavailable=true}};
const drawer=document.querySelector('[data-bs-v4-wishlist-drawer]');
const overlay=document.querySelector('[data-bs-v4-wishlist-overlay]');
let returnFocus=null;
const allowedImage=value=>{try{const u=new URL(value,location.origin);return u.protocol==='https:'&&(u.hostname==='cdn.shopify.com'||u.origin===location.origin)?u.href:''}catch(e){return ''}};
const populate=()=>{
  const list=document.querySelector('[data-bs-v4-wishlist-items]');if(!list)return;
  list.replaceChildren();
  const items=load();
  if(!items.length){const empty=document.createElement('p');empty.className='bs-v4-wishlist-empty';empty.textContent='No saved finds yet. Tap a heart on any product to keep it here.';list.append(empty);return}
  items.forEach(item=>{
    const row=document.createElement('div');row.className='bs-v4-wishlist-row';
    const imgLink=document.createElement('a');imgLink.href=item.url;imgLink.setAttribute('aria-label',item.title||'View saved product');
    const src=allowedImage(item.image||'');if(src){const img=document.createElement('img');img.loading='lazy';img.src=src;img.alt=item.title||'';imgLink.append(img)}
    const info=document.createElement('div');info.className='bs-v4-wishlist-row__info';
    const title=document.createElement('a');title.href=item.url;title.textContent=item.title||'View product';
    const price=document.createElement('span');price.textContent=item.price||'';
    info.append(title,price);
    const remove=document.createElement('button');remove.type='button';remove.className='bs-v4-wishlist-remove';remove.setAttribute('aria-label','Remove '+(item.title||'product')+' from favorites');remove.dataset.bsV4WishlistRemove=item.url;remove.textContent='×';
    row.append(imgLink,info,remove);list.append(row);
  });
};
const refresh=()=>{
  const items=load(),urls=new Set(items.map(x=>x.url));
  document.querySelectorAll('[data-bs-v4-wishlist-toggle]').forEach(b=>{
    const url=b.dataset.bsV4WishlistUrl||'';
    const selected=urls.has(url);
    b.setAttribute('aria-pressed',String(selected));
    b.setAttribute('aria-label',(selected?'Remove from':'Add to')+' favorites: '+(b.dataset.bsV4WishlistTitle||'product'));
    b.textContent=selected?'♥':'♡';
  });
  document.querySelectorAll('[data-bs-v4-wishlist-count]').forEach(el=>el.textContent=String(items.length));
  if(drawer&&!drawer.hidden)populate();
};
const close=()=>{
  if(!drawer||drawer.hidden)return;
  drawer.hidden=true;drawer.setAttribute('aria-hidden','true');if(overlay)overlay.hidden=true;
  document.body.classList.remove('bs-v4-wishlist-open');
  if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});returnFocus=null;
};
const open=source=>{
  if(!drawer||!overlay)return;
  document.dispatchEvent(new CustomEvent('bls:overlay:opening',{detail:{name:'wishlist'}}));
  returnFocus=source||document.activeElement;
  drawer.hidden=false;drawer.setAttribute('aria-hidden','false');overlay.hidden=false;
  document.body.classList.add('bs-v4-wishlist-open');populate();
  drawer.querySelector('[data-bs-v4-wishlist-close]')?.focus({preventScroll:true});
};
const init=()=>{
  if(document.body.dataset.bsV4Ready==='1'){refresh();initFinder();initComparisons();initStory();return}
  document.body.dataset.bsV4Ready='1';
  document.addEventListener('click',e=>{
    const toggle=e.target.closest('[data-bs-v4-wishlist-toggle]');
    if(toggle){
      e.preventDefault();e.stopPropagation();
      const url=toggle.dataset.bsV4WishlistUrl;if(!isProductUrl(url))return;
      const list=load();const match=list.findIndex(x=>x.url===url);
      if(match>=0)list.splice(match,1);
      else list.unshift({url,title:toggle.dataset.bsV4WishlistTitle||'',image:toggle.dataset.bsV4WishlistImage||'',price:toggle.dataset.bsV4WishlistPrice||''});
      save(list.slice(0,40));refresh();return;
    }
    const launcher=e.target.closest('[data-bs-v4-wishlist-open]');
    if(launcher){e.preventDefault();open(launcher);return}
    if(e.target.closest('[data-bs-v4-wishlist-close]')||e.target.closest('[data-bs-v4-wishlist-overlay]')){e.preventDefault();close();return}
    const removal=e.target.closest('[data-bs-v4-wishlist-remove]');
    if(removal){const list=load().filter(x=>x.url!==removal.dataset.bsV4WishlistRemove);save(list);refresh();return}
  });
  document.addEventListener('bls:overlay:opening',e=>{if(e.detail?.name!=='wishlist'&&drawer&&!drawer.hidden)close()});
  document.addEventListener('keydown',e=>{
    if(!drawer||drawer.hidden)return;
    if(e.key==='Escape'){e.preventDefault();close();return}
    if(e.key!=='Tab')return;
    const controls=Array.from(drawer.querySelectorAll('a[href],button:not([disabled])')).filter(el=>el.getClientRects().length>0);
    const first=controls[0],last=controls[controls.length-1];if(!first||!last)return;
    if(e.shiftKey&&(document.activeElement===first||!drawer.contains(document.activeElement))){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&(document.activeElement===last||!drawer.contains(document.activeElement))){e.preventDefault();first.focus()}
  });
  window.addEventListener('storage',e=>{if(e.key===key)refresh()});
  if('MutationObserver' in window){
    const main=document.querySelector('#MainContent');
    if(main)new MutationObserver(mutations=>{
      if(mutations.some(m=>Array.from(m.addedNodes).some(n=>n.nodeType===1&&(n.matches?.('[data-bs-v4-wishlist-toggle]')||n.querySelector?.('[data-bs-v4-wishlist-toggle]')))))refresh();
    }).observe(main,{childList:true,subtree:true});
  }
  refresh();initFinder();initComparisons();initStory();
};
function initFinder(){
 document.querySelectorAll('[data-bs-v4-finder]').forEach(root=>{
  if(root.dataset.bsV4FinderReady==='1')return;root.dataset.bsV4FinderReady='1';
  const tabs=Array.from(root.querySelectorAll('[data-bs-v4-finder-tab]')),panels=Array.from(root.querySelectorAll('[data-bs-v4-finder-panel]'));
  const choose=i=>{tabs.forEach((t,j)=>t.setAttribute('aria-pressed',String(i===j)));panels.forEach((p,j)=>p.hidden=i!==j);refresh()};
  tabs.forEach((tab,i)=>tab.addEventListener('click',()=>choose(i)));
  const firstAvailable=panels.findIndex(p=>p.querySelector('.bs-product-card'));
  choose(firstAvailable>=0?firstAvailable:0);
 });
}
function initComparisons(){
 document.querySelectorAll('[data-bs-v4-compare]').forEach(root=>{
  if(root.dataset.bsV4CompareReady==='1')return;root.dataset.bsV4CompareReady='1';
  const range=root.querySelector('[data-bs-v4-compare-range]');if(!range)return;
  const update=()=>{root.style.setProperty('--bs-v4-reveal',range.value+'%');range.setAttribute('aria-valuetext',range.value+'% before image')};
  range.addEventListener('input',update);update();
 });
}
function initStory(){
 if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 document.querySelectorAll('[data-bs-v4-story]').forEach(root=>{
  if(root.dataset.bsV4StoryReady==='1')return;root.dataset.bsV4StoryReady='1';
  const img=root.querySelector('.bs-v4-story__visual img');if(!img)return;
  let frame=0;
  const paint=()=>{
   frame=0;const r=root.getBoundingClientRect();
   if(r.bottom<0||r.top>innerHeight)return;
   const progress=Math.max(0,Math.min(1,(innerHeight-r.top)/(innerHeight+r.height)));
   img.style.setProperty('--bs-v4-story-y',((progress-.5)*-19).toFixed(1)+'px');
  };
  const req=()=>{if(!frame)frame=requestAnimationFrame(paint)};
  addEventListener('scroll',req,{passive:true});addEventListener('resize',req,{passive:true});paint();
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
document.addEventListener('shopify:section:load',()=>{init();refresh()});
})();
