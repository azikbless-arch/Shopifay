document.documentElement.classList.remove('no-js');
const money = cents => new Intl.NumberFormat(document.documentElement.lang || 'en-US',{style:'currency',currency:(window.Shopify&&Shopify.currency&&Shopify.currency.active)||'USD'}).format((cents||0)/100);
const drawer=document.querySelector('[data-cart-drawer]');const overlay=document.querySelector('[data-cart-overlay]');
function openCart(alreadyRefreshed){if(!drawer)return;document.dispatchEvent(new CustomEvent('bls:overlay:opening',{detail:{name:'cart'}}));drawer.classList.add('is-open');drawer.setAttribute('aria-hidden','false');if(overlay)overlay.hidden=false;document.body.style.overflow='hidden';if(alreadyRefreshed!==true)refreshCart();}
function closeCart(){if(!drawer)return;drawer.classList.remove('is-open');drawer.setAttribute('aria-hidden','true');if(overlay)overlay.hidden=true;document.body.style.overflow=document.querySelector('.bs-feature-modal:not([hidden]),[data-zoom-modal]:not([hidden])')?'hidden':'';}
document.querySelectorAll('[data-cart-open]').forEach(b=>b.addEventListener('click',openCart));document.querySelectorAll('[data-cart-close]').forEach(b=>b.addEventListener('click',closeCart));overlay?.addEventListener('click',closeCart);document.addEventListener('keydown',e=>{if(e.key==='Escape')closeCart()});
async function refreshCart(){try{const r=await fetch((window.Shopify?.routes?.root||'/').replace(/\/?$/,'/')+'cart.js',{headers:{Accept:'application/json'},cache:'no-store'});if(!r.ok)throw new Error('Cart unavailable');const cart=await r.json();document.querySelectorAll('[data-header-cart-count]').forEach(el=>el.textContent=cart.item_count);document.querySelectorAll('[data-cart-count]').forEach(el=>el.textContent=`(${cart.item_count})`);document.querySelectorAll('[data-cart-total]').forEach(el=>el.textContent=money(cart.total_price));const target=document.querySelector('[data-cart-items]');if(!target)return cart;if(!cart.items.length){target.innerHTML='<div class="bs-empty-cart"><span>♡</span><p>Your cart is waiting for something lovely.</p></div>';return cart;}const bsEscapeCart=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');target.innerHTML=cart.items.map(item=>{const key=bsEscapeCart(item.key||'');return `<div class="bs-cart-line" data-cart-line-key="${key}">${item.image?`<img src="${bsEscapeCart(item.image)}" alt="">`:''}<div class="bs-cart-line__meta"><strong>${bsEscapeCart(item.product_title)}</strong><small>${bsEscapeCart(item.variant_title||'')}</small><span>${money(item.final_line_price)}</span><div class="bs-cart-qty" role="group" aria-label="Quantity controls"><button type="button" data-cart-qty-minus aria-label="Decrease quantity" title="Decrease quantity (remove at one)">−</button><span data-cart-line-quantity aria-live="polite">${item.quantity}</span><button type="button" data-cart-qty-plus aria-label="Increase quantity" title="Increase quantity">+</button></div></div></div>`;}).join('');return cart;}catch(e){return null;}}
window.BlesshopCart={refresh:refreshCart,open:openCart,close:closeCart};
document.addEventListener('bls:overlay:opening',e=>{if(e.detail?.name!=='cart'&&drawer?.classList.contains('is-open'))closeCart()});
/* Magic Cart v4.1: reuse the single existing add-to-cart handler; success verified by Shopify. */
document.addEventListener('submit',async e=>{
  const form=e.target.closest('.bs-add-form');if(!form)return;
  e.preventDefault();if(form.dataset.bsAdding==='1')return;
  form.dataset.bsAdding='1';
  const btn=e.submitter?.matches?.('button[type="submit"]')?e.submitter:form.querySelector('button[type="submit"]');
  const oldMarkup=btn?.innerHTML,wasDisabled=btn?.disabled;
  const notice=()=>{
    let el=form.querySelector('[data-bs-cart-feedback]');
    if(!el){el=document.createElement('p');el.dataset.bsCartFeedback='';el.setAttribute('role','status');el.setAttribute('aria-live','polite');el.className='bs-magic-cart__feedback';form.append(el)}
    return el;
  };
  if(btn){btn.disabled=true;btn.textContent='Adding…'}
  try{
    const data=new FormData(form);
    const response=await fetch((window.Shopify?.routes?.root||'/').replace(/\/?$/,'/')+'cart/add.js',{
      method:'POST',credentials:'same-origin',headers:{Accept:'application/json'},body:data
    });
    const added=await response.json().catch(()=>null);
    if(!response.ok||!added||!added.id||added.errors||added.status>=400){
      throw new Error(added?.description||added?.message||'Unable to add this item. Please try again.');
    }
    const feedback=form.querySelector('[data-bs-cart-feedback]');if(feedback)feedback.textContent='';
    await refreshCart();
    document.dispatchEvent(new CustomEvent('bs:cart:add:success',{detail:{form,product:added}}));
    if(window.BlesshopMagicCart?.play){
      try{await window.BlesshopMagicCart.play({form,button:btn,product:added})}catch(error){}
    }
    openCart(true);
  }catch(error){
    notice().textContent=error?.message||'Could not add to cart. Please try again.';
    // No false success animation, and no duplicate native form submission on network errors.
  }finally{
    delete form.dataset.bsAdding;
    if(btn){btn.disabled=!!wasDisabled;btn.innerHTML=oldMarkup||'Add to cart'}
  }
});
/* Mobile menu interactions moved to blesshop-v21-mobile.js for drawer focus/animation. */
document.querySelectorAll('[data-gallery-thumb]').forEach(btn=>btn.addEventListener('click',()=>{const main=document.querySelector('.bs-product-main-image');if(main&&btn.dataset.image){main.src=btn.dataset.image;document.querySelectorAll('[data-gallery-thumb]').forEach(x=>x.classList.remove('is-active'));btn.classList.add('is-active');}}));
document.querySelectorAll('[data-qty-minus]').forEach(btn=>btn.addEventListener('click',()=>{const input=btn.parentElement.querySelector('[data-qty-input]');if(input)input.value=Math.max(1,Number(input.value||1)-1);}));document.querySelectorAll('[data-qty-plus]').forEach(btn=>btn.addEventListener('click',()=>{const input=btn.parentElement.querySelector('[data-qty-input]');if(input)input.value=Number(input.value||1)+1;}));
document.querySelectorAll('[data-variant-select]').forEach(select=>select.addEventListener('change',()=>{const opt=select.options[select.selectedIndex];const wrap=select.closest('.bs-product-info');const price=wrap?.querySelector('[data-product-price]');if(price&&opt){price.innerHTML=`<strong>${opt.dataset.price||''}</strong>${opt.dataset.compare?`<s>${opt.dataset.compare}</s>`:''}`;}}));


// BLESSHOP Premium motion v1.1
(() => {
  if (!document.body.classList.contains('bs-motion-enabled')) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealTargets = [
    ...document.querySelectorAll('[data-reveal]'),
    ...document.querySelectorAll('.bs-category-card,.bs-product-card,.bs-promo,.bs-trust-grid>div,.bs-footer__grid>div,.bs-benefit,.bs-review')
  ];
  revealTargets.forEach((el, i) => {
    el.setAttribute('data-reveal','');
    el.style.transitionDelay = `${Math.min((i % 6) * 70, 350)}ms`;
  });
  if (reduced || !('IntersectionObserver' in window)) {
    revealTargets.forEach(el => el.classList.add('is-revealed'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        io.unobserve(entry.target);
      });
    }, { threshold: .12, rootMargin: '0px 0px -5% 0px' });
    revealTargets.forEach(el => io.observe(el));
  }

  const header = document.querySelector('.bs-header');
  const hero = document.querySelector('[data-parallax-hero]');
  const heroImg = hero?.querySelector('img');
  const floaters = [...document.querySelectorAll('[data-float-speed]')];
  let raf = 0;
  const updateMotion = () => {
    const y = window.scrollY || 0;
    if (header) header.classList.toggle('is-scrolled', y > 10);
    if (!reduced && heroImg && y < window.innerHeight * 1.2) {
      hero.style.setProperty('--bs-parallax-y', `${Math.min(y * .055, 30)}px`);
    }
    if (!reduced) {
      floaters.forEach((el, i) => {
        const speed = Number(el.dataset.floatSpeed || 0);
        const rotate = i % 2 ? -7 : 8;
        el.style.transform = `translate3d(0,${y * speed}px,0) rotate(${rotate}deg)`;
      });
    }
    raf = 0;
  };
  window.addEventListener('scroll', () => {
    if (!raf) raf = requestAnimationFrame(updateMotion);
  }, { passive: true });
  updateMotion();
})();
