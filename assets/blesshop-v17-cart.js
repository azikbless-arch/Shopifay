/* BLESSHOP Premium v1.7 — progressive enhancement for the existing Shopify cart drawer.
   No changes to add-to-cart or cart AJAX requests. */
(() => {
  const init = () => {
    const drawer=document.querySelector('[data-cart-drawer]');
    const items=drawer?.querySelector('[data-cart-items]');
    const checkout=drawer?.querySelector('[data-cart-checkout]');
    if (!drawer||!items||!checkout||drawer.dataset.bsCartV17Ready==='1') return;
    drawer.dataset.bsCartV17Ready='1';

    // Prevent sending an empty basket to checkout. The original refreshCart()
    // replaces the list after every add, which fires this observer.
    const updateCheckout=()=>{
      const hasItems=!!items.querySelector('.bs-cart-line');
      checkout.disabled=!hasItems;
      checkout.setAttribute('aria-disabled',String(!hasItems));
    };
    updateCheckout();
    new MutationObserver(updateCheckout).observe(items,{childList:true});

    // Focus returns to the triggering control when the drawer is closed.
    let lastFocus=null;
    const observeOpen=()=>{
      if(drawer.classList.contains('is-open')){
        if(document.activeElement&&!drawer.contains(document.activeElement)){
          lastFocus=document.activeElement;
        }
        requestAnimationFrame(()=>{
          if(drawer.classList.contains('is-open')) drawer.querySelector('[data-cart-close]')?.focus({preventScroll:true});
        });
      }else if(lastFocus&&document.contains(lastFocus)){
        try{lastFocus.focus({preventScroll:true})}catch(e){}
        lastFocus=null;
      }
    };
    new MutationObserver(observeOpen).observe(drawer,{attributes:true,attributeFilter:['class']});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
  document.addEventListener('shopify:section:load',init);
})();
