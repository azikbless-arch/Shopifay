/* BLESSHOP Magic Cart v4.1 — cosmetic flight only on confirmed AJAX success.
   Does not add products or open the cart. Original handlers own these actions. */
(() => {
'use strict';
const intent=new WeakMap();
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let mobileClick=null;
const visible=rect=>rect&&rect.width>0&&rect.height>0&&rect.bottom>0&&rect.top<innerHeight&&rect.right>0&&rect.left<innerWidth;
const center=r=>({x:r.left+r.width/2,y:r.top+r.height/2});
const safeImage=value=>{
  if(!value)return '';
  try{const u=new URL(value,location.href);return u.protocol==='https:'&&(u.hostname==='cdn.shopify.com'||u.origin===location.origin)?u.href:''}catch(e){return ''}
};
const cartTarget=()=>{
  const all=[...document.querySelectorAll('[data-cart-open]')].filter(el=>{
    const style=getComputedStyle(el);return visible(el.getBoundingClientRect())&&style.display!=='none'&&style.visibility!=='hidden';
  });
  return all.find(el=>el.closest('.bs-mobile-bottom'))||all.find(el=>el.closest('.bs-nav-actions'))||all[0]||null;
};
document.addEventListener('click',e=>{
 const mobile=e.target.closest?.('[data-bs-v3-mobile-add]');
 if(mobile)mobileClick={node:mobile,at:performance.now()};
},true);
document.addEventListener('submit',e=>{
 const form=e.target.closest?.('.bs-add-form');if(!form)return;
 const productPage=form.closest('.bs-product-page');
 const wrap=form.closest('.bs-product-card,.bs-v2-spotlight__slide,.bs-quick-view,.bs-v4-finder__panel');
 const photo=productPage?.querySelector('.bs-product-main-image')||
   wrap?.querySelector('.bs-primary-image,.bs-v2-spotlight__visual img,.bs-product-card__media img,.bs-quick-view__media img');
 const btn=e.submitter?.matches?.('button[type="submit"]')?e.submitter:form.querySelector('button[type="submit"]');
 const mobile=mobileClick&&performance.now()-mobileClick.at<1500&&productPage?mobileClick.node:null;
 const source=mobile&&visible(mobile.getBoundingClientRect())?mobile:photo&&visible(photo.getBoundingClientRect())?photo:btn;
 const rect=source?.getBoundingClientRect();
 intent.set(form,{source:visible(rect)?center(rect):null,image:safeImage(photo?.currentSrc||photo?.src)});
 mobileClick=null;
},true);
const ping=target=>{
 if(!target)return;
 target.classList.add('bs-magic-cart--ping');
 setTimeout(()=>target.classList.remove('bs-magic-cart--ping'),680);
};
const check=pos=>{
 if(!pos||reduced.matches)return;
 const el=document.createElement('span');el.className='bs-magic-cart__check';el.setAttribute('aria-hidden','true');
 el.textContent='✓';el.style.left=pos.x+'px';el.style.top=pos.y+'px';document.body.append(el);
 setTimeout(()=>el.remove(),600);
};
const play=({form,button,product})=>{
 const saved=intent.get(form);intent.delete(form);
 const cart=cartTarget(),cartRect=cart?.getBoundingClientRect();
 const rect=button?.getBoundingClientRect();
 const start=saved?.source||(visible(rect)?center(rect):null);
 const end=visible(cartRect)?center(cartRect):null;
 ping(cart);check(start);
 if(reduced.matches||navigator.connection?.saveData||!start||!end||!Element.prototype.animate)return Promise.resolve();
 const image=safeImage(product?.featured_image?.url||product?.featured_image?.src||product?.image)||saved?.image;
 if(!image)return Promise.resolve();
 const node=document.createElement('img');node.src=image;node.alt='';node.setAttribute('aria-hidden','true');
 node.className='bs-magic-cart__flight';node.style.left=(start.x-35)+'px';node.style.top=(start.y-35)+'px';document.body.append(node);
 const dx=end.x-start.x,dy=end.y-start.y;
 let animation;
 try{
   animation=node.animate([
     {transform:'translate3d(0,0,0) scale(.92) rotate(-7deg)',opacity:1,offset:0},
     {transform:'translate3d('+(dx*.55).toFixed(1)+'px,'+(dy*.40-38).toFixed(1)+'px,0) scale(.78) rotate(5deg)',opacity:1,offset:.48},
     {transform:'translate3d('+dx.toFixed(1)+'px,'+dy.toFixed(1)+'px,0) scale(.17) rotate(18deg)',opacity:.1,offset:1}
   ],{duration:620,easing:'cubic-bezier(.19,.8,.22,1)',fill:'forwards'});
 }catch(e){node.remove();return Promise.resolve()}
 return Promise.race([animation.finished.catch(()=>{}),new Promise(resolve=>setTimeout(resolve,710))]).then(()=>{animation.cancel();node.remove()});
};
window.BlesshopMagicCart={play};
})();