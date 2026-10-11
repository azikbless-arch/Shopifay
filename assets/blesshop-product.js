(function(){
  function q(s,c){return (c||document).querySelector(s)}
  function qa(s,c){return Array.from((c||document).querySelectorAll(s))}
  var zoom=q('[data-zoom-modal]'),zoomImg=q('[data-zoom-image]');
  document.addEventListener('click',function(e){
    var img=e.target.closest('.bs-product-main-media img');
    if(img&&zoom&&zoomImg){document.dispatchEvent(new CustomEvent('bls:overlay:opening',{detail:{name:'zoom'}}));zoomImg.src=img.currentSrc||img.src;zoomImg.alt=img.alt||'';zoom.hidden=false;zoom.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';return}
    var spot=e.target.closest('[data-hotspot]');
    if(spot){qa('[data-hotspot]',spot.closest('.bs-lookbook')).forEach(function(x){if(x!==spot)x.classList.remove('is-active')});spot.classList.toggle('is-active')}
  });
  document.addEventListener('bls:overlay:opening',function(e){if(e.detail?.name!=='zoom'&&zoom&&!zoom.hidden){zoom.hidden=true;zoom.setAttribute('aria-hidden','true');document.body.style.overflow=document.querySelector('[data-cart-drawer].is-open,.bs-feature-modal:not([hidden])')?'hidden':''}});
  qa('[data-gallery]').forEach(function(gallery){
    var thumbs=qa('[data-gallery-thumb]',gallery),main=q('.bs-product-main-media',gallery);if(!main||thumbs.length<2)return;
    var prev=document.createElement('button'),next=document.createElement('button');prev.type='button';next.type='button';prev.className='bs-gallery-nav bs-gallery-nav--prev';next.className='bs-gallery-nav bs-gallery-nav--next';prev.setAttribute('aria-label','Previous image');next.setAttribute('aria-label','Next image');prev.textContent='‹';next.textContent='›';main.appendChild(prev);main.appendChild(next);
    function move(dir){var idx=thumbs.findIndex(function(x){return x.classList.contains('is-active')});if(idx<0)idx=0;idx=(idx+dir+thumbs.length)%thumbs.length;thumbs[idx].click()}
    prev.addEventListener('click',function(e){e.stopPropagation();move(-1)});next.addEventListener('click',function(e){e.stopPropagation();move(1)});
  });
})();