/* BLESSHOP Premium v1.8 — AJAX quantity controls for the existing glass cart.
   Uses Shopify /cart/change.js with the unique line key (not variant ID).
   Works for initial Liquid markup and dynamically refreshed AJAX rows. */
(() => {
  const init = () => {
    const drawer = document.querySelector('[data-cart-drawer]');
    const items = drawer?.querySelector('[data-cart-items]');
    const checkout = drawer?.querySelector('[data-cart-checkout]');
    const status = drawer?.querySelector('[data-cart-update-status]');
    if (!drawer || !items || !checkout || !status || drawer.dataset.bsQtyReady === '1') return;
    drawer.dataset.bsQtyReady = '1';
    let updating = false;

    const notify = (message, error = false) => {
      status.textContent = message;
      status.setAttribute('data-cart-update-error', error ? 'true' : 'false');
    };
    const restoreCheckout = () => {
      const hasRows = !!items.querySelector('.bs-cart-line');
      checkout.disabled = !hasRows;
      checkout.setAttribute('aria-disabled', String(!hasRows));
    };
    drawer.addEventListener('submit', event => {
      if (updating && event.target.closest('.bs-cart-checkout-form')) event.preventDefault();
    });

    drawer.addEventListener('click', async event => {
      const button = event.target.closest('[data-cart-qty-plus],[data-cart-qty-minus]');
      if (!button || !drawer.contains(button) || updating) return;
      const row = button.closest('.bs-cart-line[data-cart-line-key]');
      if (!row) return;
      const key = row.getAttribute('data-cart-line-key');
      const quantityElement = row.querySelector('[data-cart-line-quantity]');
      const current = Number.parseInt(quantityElement?.textContent || '',10);
      if (!key || !Number.isInteger(current) || current < 1) return;
      const increase = button.hasAttribute('data-cart-qty-plus');
      const nextQuantity = increase ? current + 1 : Math.max(0,current - 1);
      const restoreButtonSelector = increase ? '[data-cart-qty-plus]' : '[data-cart-qty-minus]';
      const oldScroll = items.scrollTop;

      updating = true;
      drawer.setAttribute('aria-busy','true');
      checkout.disabled = true;
      notify(nextQuantity === 0 ? 'Removing item…' : 'Updating quantity…');
      try {
        const root = window.Shopify?.routes?.root || '/';
        const url = root.replace(/\/?$/, '/') + 'cart/change.js';
        const response = await fetch(url,{
          method:'POST',
          credentials:'same-origin',
          headers:{'Content-Type':'application/json','Accept':'application/json'},
          body:JSON.stringify({id:key,quantity:nextQuantity})
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result || (typeof result.status === 'number' && result.status >= 400)) {
          throw new Error(result?.description || result?.message || 'Unable to update cart');
        }
        const refresh=window.BlesshopCart?.refresh || window.refreshCart;
        if(typeof refresh!=='function')throw new Error('Cart refresh unavailable');
        const updated=await refresh();
        if(!updated||typeof updated.item_count!=='number')throw new Error('Cart refresh failed');
        items.scrollTop = oldScroll;
        notify(nextQuantity === 0 ? 'Item removed from your bag.' : 'Quantity updated.');
        const nextRow = Array.from(items.querySelectorAll('.bs-cart-line[data-cart-line-key]'))
          .find(el => el.getAttribute('data-cart-line-key') === key);
        if (nextRow) {
          nextRow.querySelector(restoreButtonSelector)?.focus({preventScroll:true});
        } else if (!items.querySelector('.bs-cart-line')) {
          drawer.querySelector('[data-cart-close]')?.focus({preventScroll:true});
        }
      } catch (error) {
        notify('Could not update quantity. Please try again.',true);
      } finally {
        updating = false;
        drawer.removeAttribute('aria-busy');
        restoreCheckout();
      }
    });
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded',init,{once:true});
  } else init();
  document.addEventListener('shopify:section:load',init);
})();
