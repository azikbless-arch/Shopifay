/* BLESSHOP Feature Pack v1.2 */
(function(){
  function q(s,c){return (c||document).querySelector(s)}
  function qa(s,c){return Array.from((c||document).querySelectorAll(s))}
  function open(el){if(!el)return;document.dispatchEvent(new CustomEvent('bls:overlay:opening',{detail:{name:'feature'}}));el.hidden=false;el.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}
  function close(el){if(!el)return;el.hidden=true;el.setAttribute('aria-hidden','true');document.body.style.overflow=document.querySelector('[data-cart-drawer].is-open,[data-zoom-modal]:not([hidden]),.bs-feature-modal:not([hidden])')?'hidden':''}
  document.addEventListener('bls:overlay:opening',function(e){if(e.detail?.name!=='feature')qa('.bs-feature-modal:not([hidden])').forEach(close)});
  document.addEventListener('click',function(e){
    var c=e.target.closest('[data-feature-close]');if(c){close(c.closest('.bs-feature-modal'));return}
    var t=e.target.closest('[data-back-to-top]');if(t){window.scrollTo({top:0,behavior:'smooth'});return}
    var a=e.target.closest('[data-age-accept]');if(a){localStorage.setItem('bs-age-ok','1');close(q('[data-age-gate]'));return}
    var chip=e.target.closest('[data-variant-chip]');if(chip){var select=q('[data-variant-select]',chip.closest('.bs-product-info'));if(select){select.value=chip.dataset.variantId;select.dispatchEvent(new Event('change',{bubbles:true}));qa('[data-variant-chip]',chip.parentElement).forEach(function(x){x.classList.toggle('is-selected',x===chip)})}}
  });
  var back=q('[data-back-to-top]');function scrollState(){if(back)back.classList.toggle('is-visible',window.scrollY>500)}window.addEventListener('scroll',scrollState,{passive:true});scrollState();
  var age=q('[data-age-gate]');if(age&&localStorage.getItem('bs-age-ok')!=='1')open(age);
  var promo=q('[data-promo-popup]');if(promo&&sessionStorage.getItem('bs-promo-seen')!=='1'){setTimeout(function(){sessionStorage.setItem('bs-promo-seen','1');open(promo)},Number(promo.dataset.delay||6000))}
  qa('[data-countdown]').forEach(function(el){var out=q('[data-countdown-output]',el),end=new Date(el.dataset.countdown).getTime();if(!out||!Number.isFinite(end))return;var tick=function(){if(document.hidden)return;var d=Math.max(0,end-Date.now()),days=Math.floor(d/86400000),h=Math.floor(d%86400000/3600000),m=Math.floor(d%3600000/60000),s=Math.floor(d%60000/1000);out.textContent=(days?days+'d ':'')+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');if(d===0)clearInterval(timer)};var timer=setInterval(tick,1000);tick()});
})();