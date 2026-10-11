/* BLESSHOP v3.0 — accessible PDP detail enhancements.
   Uses original product form, thumbnail click handlers, zoom modal and cart logic. */
(() => {
  'use strict';
  const init = () => {
    if(!document.body.classList.contains('template-product'))return;
    const page=document.querySelector('.bs-product-page');
    if(!page || page.dataset.bsV3ProductReady==='1')return;
    page.dataset.bsV3ProductReady='1';
    const gallery=page.querySelector('.bs-product-gallery[data-gallery]');
    const mainImg=gallery?.querySelector('.bs-product-main-image');
    const mainZoom=gallery?.querySelector('[data-bs-v3-zoom]');
    const info=page.querySelector('.bs-product-info');
    const form=info?.querySelector('.bs-product-form');
    const select=form?.querySelector('[data-variant-select]');
    const addBtn=form?.querySelector('[data-bs-v3-add]');
    const stock=info?.querySelector('[data-bs-v3-stock]');
    const stockMsg=stock?.querySelector('[data-bs-v3-stock-message]');
    const mobile=page.querySelector('[data-bs-v3-mobile-buy]');
    const mobileBtn=mobile?.querySelector('[data-bs-v3-mobile-add]');
    const mobilePrice=mobile?.querySelector('[data-bs-v3-mobile-price]');
    const price=info?.querySelector('[data-product-price]');
    const photos=Array.from(gallery?.querySelectorAll('[data-gallery-thumb]')||[]);
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');

    const syncVariant=()=>{
      if(!select || !addBtn)return;
      const option=select.selectedOptions[0];
      if(!option)return;
      const available=option.dataset.bsV3Available==='true';
      const managed=option.dataset.bsV3StockManaged==='true';
      const count=Number(option.dataset.bsV3StockCount||0);
      const threshold=Number(stock?.dataset.bsV3StockThreshold||8);
      const preOrder=addBtn.dataset.bsV3Preorder==='true';
      addBtn.disabled=!available;
      // The AJAX cart temporarily replaces the submit button innerHTML; re-query each time.
      const label=addBtn.querySelector('[data-bs-v3-add-label]');
      if(label)label.textContent=!available?'Sold Out':preOrder?'Pre-order':'Add to Cart';
      if(stock){
        stock.hidden=!managed;
        stock.classList.toggle('is-low',managed&&available&&count>0&&count<=threshold);
        if(stockMsg)stockMsg.textContent=!available?'Out of stock':count>0?(count<=threshold?'Low stock — ':'')+count+' left':'Available to order';
      }
      const chosenId=option.dataset.bsV3MediaId;
      const chosenSrc=option.dataset.bsV3MediaSrc;
      if(chosenId && gallery && mainImg){
        const thumb=photos.find(node=>node.dataset.bsV3MediaId===chosenId);
        if(thumb && !thumb.classList.contains('is-active')){
          thumb.click(); // reuse original photo/counter/click-to-zoom system
        }else if(!thumb && chosenSrc){
          mainImg.removeAttribute('srcset');
          mainImg.removeAttribute('sizes');
          mainImg.src=chosenSrc;
          photos.forEach(node=>{node.classList.remove('is-active');node.setAttribute('aria-pressed','false')});
        }
      }
      const displayedPrice=price?.querySelector('strong')?.textContent?.trim()||option.dataset.price||'';
      if(mobilePrice)mobilePrice.textContent=displayedPrice;
      if(mobileBtn){mobileBtn.disabled=!available;mobileBtn.textContent=!available?'Sold Out':preOrder?'Pre-order':'Add to Cart';}
      form.querySelectorAll('[data-variant-chip]').forEach(chip=>{
        const chosen=chip.dataset.variantId===option.value;
        chip.classList.toggle('is-selected',chosen);
        chip.setAttribute('aria-pressed',String(chosen));
      });
    };
    if(select){
      select.addEventListener('change',syncVariant);
      syncVariant();
    }

    // Preserve established gallery handler; add a keyboard-operable native zoom button.
    mainZoom?.addEventListener('click',e=>{e.preventDefault();mainImg?.click()});
    if(gallery){
      const syncPhotoButtons=()=>{
        photos.forEach(node=>node.setAttribute('aria-pressed',String(node.classList.contains('is-active'))));
      };
      gallery.addEventListener('click',e=>{if(e.target.closest('[data-gallery-thumb]'))queueMicrotask(syncPhotoButtons)});
    }

    // Upgrade existing zoom dialog with keyboard Escape, focus containment and restore.
    const zoom=document.querySelector('[data-zoom-modal]');
    if(zoom && zoom.dataset.bsV3ZoomReady!=='1'){
      zoom.dataset.bsV3ZoomReady='1';
      const close=zoom.querySelector('[data-feature-close].bs-feature-modal__close');
      let focusReturn=null,wasOpen=!zoom.hidden;
      document.addEventListener('click',e=>{
        if(e.target.closest('[data-bs-v3-zoom]'))focusReturn=e.target.closest('[data-bs-v3-zoom]');
        else if(e.target.closest('.bs-product-main-media img'))focusReturn=mainZoom||document.activeElement;
      },true);
      new MutationObserver(()=>{
        const open=!zoom.hidden;
        if(open===wasOpen)return;
        wasOpen=open;
        if(open){requestAnimationFrame(()=>close?.focus({preventScroll:true}))}
        else if(focusReturn?.isConnected){focusReturn.focus?.({preventScroll:true});focusReturn=null}
      }).observe(zoom,{attributes:true,attributeFilter:['hidden']});
      document.addEventListener('keydown',e=>{
        if(zoom.hidden)return;
        if(e.key==='Escape'){e.preventDefault();close?.click();return}
        if(e.key==='Tab'){
          const controls=Array.from(zoom.querySelectorAll('button:not([disabled]),a[href]')).filter(el=>el.getClientRects().length>0);
          if(!controls.length)return;
          const first=controls[0],last=controls[controls.length-1];
          if(e.shiftKey&&(document.activeElement===first||!zoom.contains(document.activeElement))){e.preventDefault();last.focus()}
          else if(!e.shiftKey&&(document.activeElement===last||!zoom.contains(document.activeElement))){e.preventDefault();first.focus()}
        }
      });
    }

    const share=page.querySelector('[data-bs-v3-share]');
    const status=page.querySelector('[data-bs-v3-share-status]');
    share?.addEventListener('click',async()=>{
      const title=info?.querySelector('h1')?.textContent?.trim()||document.title;
      const url=location.origin+location.pathname;
      try {
        if(navigator.share){
          await navigator.share({title,url});
          if(status)status.textContent='Shared';
        }else if(navigator.clipboard?.writeText){
          await navigator.clipboard.writeText(url);
          if(status)status.textContent='Product link copied';
        }else{if(status)status.textContent='Copy the address from your browser to share';}
      }catch(error){if(error?.name!=='AbortError'&&status)status.textContent='Could not share. Copy the browser address instead.';}
    });

    const qty=form?.querySelector('[data-qty-input]');
    qty?.addEventListener('change',()=>{
      const value=Number.parseInt(qty.value,10);
      if(!Number.isSafeInteger(value)||value<1)qty.value='1';
      else qty.value=String(Math.min(value,999));
    });

    if(mobile&&addBtn&&mobileBtn){
      let frame=0;
      const update=()=>{
        frame=0;
        const active=matchMedia('(max-width:749px)').matches;
        const bounds=addBtn.getBoundingClientRect();
        const passed=bounds.bottom<0;
        const overlay=document.querySelector('[data-zoom-modal]:not([hidden]),[data-quick-view-modal]:not([hidden]),[data-cart-drawer].is-open');
        mobile.hidden=!active||!passed||!!overlay||document.body.classList.contains('bs-mobile-nav-open');
      };
      const request=()=>{if(!frame)frame=requestAnimationFrame(update)};
      window.addEventListener('scroll',request,{passive:true});
      window.addEventListener('resize',request,{passive:true});
      document.addEventListener('shopify:section:load',request);
      const cart=document.querySelector('[data-cart-drawer]');
      if(cart)new MutationObserver(request).observe(cart,{attributes:true,attributeFilter:['class']});
      document.querySelectorAll('[data-zoom-modal],[data-quick-view-modal]').forEach(modal=>{
        new MutationObserver(request).observe(modal,{attributes:true,attributeFilter:['hidden']});
      });
      new MutationObserver(request).observe(document.body,{attributes:true,attributeFilter:['class']});
      mobileBtn.addEventListener('click',()=>{
        if(addBtn.disabled)return;
        if(typeof form.requestSubmit==='function')form.requestSubmit(addBtn);
        else addBtn.click();
      });
      update();
    }
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
  document.addEventListener('shopify:section:load',init);
})();
