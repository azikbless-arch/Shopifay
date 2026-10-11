/* BLESSHOP Premium v2.1 — accessible glass mobile navigation.
   Keeps Shopify menu URLs and the existing cart, search, and category handlers. */
(() => {
  const media=window.matchMedia('(max-width: 900px)');
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let teardown=null;

  const init=()=>{
    const toggle=document.querySelector('.bs-header [data-mobile-menu-toggle]');
    const panel=document.querySelector('.bs-header [data-mobile-menu]');
    const backdrop=document.querySelector('.bs-header [data-bs-mobile-menu-overlay]');
    if(!toggle||!panel||!backdrop||toggle.dataset.bsMobileV21Ready==='1')return;
    if(teardown)teardown();
    toggle.dataset.bsMobileV21Ready='1';

    // Place drawer directly under body, outside any blurred/fixed header.
    document.body.appendChild(backdrop);
    document.body.appendChild(panel);

    let opened=false;
    let hideTimer=0;
    let lastFocus=null;
    const close=(instant=false,returnFocus=true)=>{
      clearTimeout(hideTimer);
      if(!opened && panel.hidden)return;
      opened=false;
      panel.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      document.body.classList.remove('bs-mobile-nav-open');
      toggle.setAttribute('aria-expanded','false');
      toggle.setAttribute('aria-label','Open menu');
      panel.setAttribute('aria-hidden','true');
      const finish=()=>{if(!opened){panel.hidden=true;backdrop.hidden=true;}};
      if(instant||reduced.matches)finish();
      else hideTimer=setTimeout(finish,490);
      if(returnFocus&&lastFocus&&lastFocus.isConnected){
        lastFocus.focus({preventScroll:true});
      }
      lastFocus=null;
    };

    const open=()=>{
      if(!media.matches||opened)return;
      document.dispatchEvent(new CustomEvent('bls:overlay:opening',{detail:{name:'mobile'}}));
      clearTimeout(hideTimer);
      opened=true;
      lastFocus=document.activeElement instanceof HTMLElement ? document.activeElement:toggle;
      panel.hidden=false;
      backdrop.hidden=false;
      panel.setAttribute('aria-hidden','false');
      toggle.setAttribute('aria-expanded','true');
      toggle.setAttribute('aria-label','Close menu');
      document.body.classList.add('bs-mobile-nav-open');
      requestAnimationFrame(()=>{
        if(!opened)return;
        panel.classList.add('is-open');
        backdrop.classList.add('is-open');
      });
      panel.querySelector('[data-bs-mobile-menu-close]')?.focus({preventScroll:true});
    };

    const onToggle=event=>{
      event.preventDefault();
      if(opened)close();
      else open();
    };
    const onBackdrop=()=>close();
    const onPanelClick=event=>{
      const expander=event.target.closest('[data-bs-mobile-submenu-toggle]');
      if(expander){
        const id=expander.getAttribute('aria-controls');
        const submenu=id?document.getElementById(id):null;
        if(!submenu||!panel.contains(submenu))return;
        const expanded=expander.getAttribute('aria-expanded')==='true';
        expander.setAttribute('aria-expanded',String(!expanded));
        expander.setAttribute('aria-label',(expanded?'Expand ':'Collapse ')+(expander.closest('.bs-mobile-menu__entry')?.querySelector('a')?.textContent?.trim()||'submenu'));
        submenu.hidden=expanded;
        return;
      }
      if(event.target.closest('a[href]')||event.target.closest('[data-bs-mobile-menu-close]')){
        close(!!event.target.closest('a[href]'),!event.target.closest('a[href]'));
      }
    };
    const onKeyboard=event=>{
      if(!opened)return;
      if(event.key==='Escape'){
        event.preventDefault();close();return;
      }
      if(event.key!=='Tab')return;
      const focusable=Array.from(panel.querySelectorAll('a[href],button:not([disabled]),input:not([disabled])'))
        .filter(el=>el.getClientRects().length>0);
      if(!focusable.length){event.preventDefault();panel.focus();return}
      const first=focusable[0],last=focusable[focusable.length-1];
      if(event.shiftKey&&(document.activeElement===first||!panel.contains(document.activeElement))){
        event.preventDefault();last.focus();
      }else if(!event.shiftKey&&(document.activeElement===last||!panel.contains(document.activeElement))){
        event.preventDefault();first.focus();
      }
    };
    const onResize=()=>{if(!media.matches)close(true,false)};
    const onOverlay=e=>{if(e.detail?.name!=='mobile'&&opened)close(true,false)};

    toggle.addEventListener('click',onToggle);
    backdrop.addEventListener('click',onBackdrop);
    panel.addEventListener('click',onPanelClick);
    document.addEventListener('keydown',onKeyboard);
    media.addEventListener('change',onResize);
    document.addEventListener('bls:overlay:opening',onOverlay);

    teardown=()=>{
      close(true,false);
      clearTimeout(hideTimer);
      toggle.removeEventListener('click',onToggle);
      backdrop.removeEventListener('click',onBackdrop);
      panel.removeEventListener('click',onPanelClick);
      document.removeEventListener('keydown',onKeyboard);
      media.removeEventListener('change',onResize);
      document.removeEventListener('bls:overlay:opening',onOverlay);
      backdrop.remove();panel.remove();
      delete toggle.dataset.bsMobileV21Ready;
      teardown=null;
    };
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
  document.addEventListener('shopify:section:load',init);
  document.addEventListener('shopify:section:unload',event=>{
    if(event.target?.querySelector?.('[data-mobile-menu-toggle]'))teardown?.();
  });
})();
