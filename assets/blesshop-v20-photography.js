/* BLESSHOP Premium v2.0 | photo-gallery enhancement.
   Prepared for future catalog; product cards and cart intentionally untouched. */
(() => {
  const initialize=()=>{
    if(!document.body.classList.contains('template-product'))return;
    document.querySelectorAll('.bs-product-gallery[data-gallery]').forEach(gallery=>{
      if(gallery.dataset.bsPhotoV20==='1')return;
      gallery.dataset.bsPhotoV20='1';
      const main=gallery.querySelector('.bs-product-main-image');
      const thumbnails=Array.from(gallery.querySelectorAll('[data-gallery-thumb]'));
      const counter=gallery.querySelector('[data-bs-photo-counter]');
      const current=counter?.querySelector('[data-bs-photo-current]');

      const sync=()=>{
        const active=thumbnails.findIndex(t=>t.classList.contains('is-active'));
        const index=active<0?0:active;
        thumbnails.forEach((thumb,i)=>thumb.setAttribute('aria-pressed',String(i===index)));
        if(current)current.textContent=String(index+1);
        if(counter)counter.setAttribute('aria-label','Photo '+(index+1)+' of '+thumbnails.length);
      };
      sync();
      gallery.addEventListener('click',event=>{
        const thumb=event.target.closest('[data-gallery-thumb]');
        if(!thumb||!gallery.contains(thumb))return;
        // The legacy gallery changes main.src only, but image_tag adds srcset:
        // browsers may still render the original responsive source. Remove the
        // original responsive candidate set only after an actual thumb click.
        if(main&&thumb.dataset.image){
          main.removeAttribute('srcset');
          main.removeAttribute('sizes');
          if(main.getAttribute('src')!==thumb.dataset.image)main.src=thumb.dataset.image;
        }
        sync();
      });
    });
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});
  else initialize();
  document.addEventListener('shopify:section:load',initialize);
})();
