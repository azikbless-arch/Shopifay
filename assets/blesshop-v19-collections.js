/* BLESSHOP Premium v1.9 — category navigation, non-destructive enhancement */
(() => {
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let pending=0;
  let navigating=false;
  const reset=()=>{
    if(pending)clearTimeout(pending);
    pending=0;navigating=false;
    document.body?.classList.remove('bs-v19-category-leaving');
    document.querySelectorAll('.bs-v19-collection-veil').forEach(x=>x.remove());
    document.querySelectorAll('.bs-v19-category-selected').forEach(x=>x.classList.remove('bs-v19-category-selected'));
  };
  addEventListener('pageshow',reset);
  document.addEventListener('click',event=>{
    if(navigating||event.defaultPrevented||reduced.matches||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||window.Shopify?.designMode)return;
    const link=event.target.closest('.bs-categories .bs-category-card[href],.bs-collection-nav a[href]');
    if(!link||link.target&&link.target!=='_self'||link.hasAttribute('download'))return;
    const url=new URL(link.href,location.href);
    if(url.origin!==location.origin||!url.pathname.split('/').includes('collections')||url.pathname===location.pathname&&url.search===location.search)return;
    event.preventDefault();
    navigating=true;
    link.classList.add('bs-v19-category-selected');
    const veil=document.createElement('div');veil.className='bs-v19-collection-veil';veil.setAttribute('aria-hidden','true');document.body.appendChild(veil);
    requestAnimationFrame(()=>document.body.classList.add('bs-v19-category-leaving'));
    pending=setTimeout(()=>location.assign(url.href),285);
  });
})();
