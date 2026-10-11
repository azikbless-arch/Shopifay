/* BLESSHOP Premium Experience v2.0 — progressive enhancement.
   Single real-product spotlight, accessible existing Quick View and search nav. */
(() => {
  'use strict';
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const initSpotlight=()=>{
    document.querySelectorAll('[data-bs-v2-spotlight]').forEach(root=>{
      if(root.dataset.bsV2Ready==='1')return;
      root.dataset.bsV2Ready='1';
      const slides=Array.from(root.querySelectorAll('[data-bs-v2-slide]'));
      if(!slides.length)return;
      const dots=Array.from(root.querySelectorAll('[data-bs-v2-dot]'));
      const count=root.querySelector('[data-bs-v2-count]');
      let active=0,visible=false,hover=false,focused=false,timer=0;
      const stop=()=>{if(timer){clearTimeout(timer);timer=0;}};
      const eligible=()=>slides.length>1 && visible && !hover && !focused && !document.hidden && !reduced.matches;
      const schedule=()=>{
        stop();
        if(eligible())timer=setTimeout(()=>{show(active+1);},6800);
      };
      const show=next=>{
        active=((next%slides.length)+slides.length)%slides.length;
        slides.forEach((slide,i)=>{
          slide.hidden=i!==active;
          slide.setAttribute('aria-hidden',String(i!==active));
          if(i!==active && slide.contains(document.activeElement)) root.querySelector('[data-bs-v2-next]')?.focus({preventScroll:true});
        });
        dots.forEach((dot,i)=>dot.setAttribute('aria-pressed',String(i===active)));
        if(count)count.textContent=String(active+1).padStart(2,'0')+' / '+String(slides.length).padStart(2,'0');
        schedule();
      };
      root.querySelector('[data-bs-v2-prev]')?.addEventListener('click',()=>show(active-1));
      root.querySelector('[data-bs-v2-next]')?.addEventListener('click',()=>show(active+1));
      dots.forEach((dot,i)=>dot.addEventListener('click',()=>show(i)));
      root.addEventListener('pointerenter',()=>{hover=true;stop()});
      root.addEventListener('pointerleave',()=>{hover=false;schedule()});
      root.addEventListener('focusin',()=>{focused=true;stop()});
      root.addEventListener('focusout',()=>{focused=root.contains(document.activeElement);schedule()});
      root.addEventListener('keydown',e=>{
        if(e.target.closest('[data-bs-v2-spotlight]')!==root||slides.length<2)return;
        if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
          if(e.target.matches('select,input,textarea'))return;
          e.preventDefault();show(active+(e.key==='ArrowRight'?1:-1));
        }
      });
      document.addEventListener('visibilitychange',schedule);
      reduced.addEventListener('change',schedule);
      if('IntersectionObserver' in window){
        const io=new IntersectionObserver(entries=>{
          visible=entries.some(e=>e.isIntersecting);
          schedule();
        },{threshold:.2});
        io.observe(root);
      }else{visible=true;}
      show(0);
    });
  };

  const initQuickView=()=>{
    const modal=document.querySelector('[data-quick-view-modal]');
    if(!modal||modal.dataset.bsV2A11y==='1')return;
    modal.dataset.bsV2A11y='1';
    const content=modal.querySelector('[data-quick-view-content]');
    const panel=modal.querySelector('[role=dialog]');
    let opener=null,wasOpen=!modal.hidden;
    const focusable=()=>Array.from(modal.querySelectorAll('button:not([disabled]),a[href],select:not([disabled]),input:not([disabled])')).filter(el=>el.getClientRects().length>0);
    document.addEventListener('click',e=>{
      const trigger=e.target.closest('[data-quick-view]');
      if(trigger)opener=trigger;
    },true);
    const onToggle=()=>{
      const open=!modal.hidden;
      if(open===wasOpen)return;
      wasOpen=open;
      if(open){requestAnimationFrame(()=>modal.querySelector('[data-feature-close].bs-feature-modal__close')?.focus({preventScroll:true}));}
      else if(opener?.isConnected){opener.focus({preventScroll:true});opener=null;}
    };
    new MutationObserver(onToggle).observe(modal,{attributes:true,attributeFilter:['hidden']});
    if(content){
      new MutationObserver(()=>{
        const title=content.querySelector('h2');
        if(title&&panel){
          title.id='bs-v2-quickview-title';
          panel.setAttribute('aria-labelledby',title.id);
        }
        const select=content.querySelector('select[name=id]');
        const submit=content.querySelector('.bs-quick-view__form button[type=submit]');
        if(select&&submit){
          const update=()=>{submit.disabled=!select.value||select.selectedOptions[0]?.disabled;};
          if(!select.dataset.bsV2VariantReady){select.dataset.bsV2VariantReady='1';select.addEventListener('change',update);}
          update();
        }
      }).observe(content,{childList:true});
    }
    // Keep Quick View open through the request; close only on a confirmed Shopify cart success.
    document.addEventListener('bs:cart:add:success',e=>{
      if(!modal.hidden && e.detail?.form && modal.contains(e.detail.form)){
        modal.querySelector('[data-feature-close].bs-feature-modal__close')?.click();
      }
    });
    document.addEventListener('keydown',e=>{
      if(modal.hidden)return;
      if(e.key==='Escape'){
        e.preventDefault();
        modal.querySelector('[data-feature-close].bs-feature-modal__close')?.click();
        return;
      }
      if(e.key!=='Tab')return;
      const list=focusable();
      if(!list.length)return;
      const first=list[0],last=list[list.length-1];
      if(e.shiftKey&&(document.activeElement===first||!modal.contains(document.activeElement))){
        e.preventDefault();last.focus();
      }else if(!e.shiftKey&&(document.activeElement===last||!modal.contains(document.activeElement))){
        e.preventDefault();first.focus();
      }
    });
  };

  const init=()=>{
    initSpotlight();
    initQuickView();
    const searchLink=document.querySelector('.bs-mobile-bottom [data-bs-v2-mobile-search]');
    if(searchLink && /\/search\/?$/.test(location.pathname))searchLink.setAttribute('aria-current','page');
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  document.addEventListener('shopify:section:load',init);
})();
