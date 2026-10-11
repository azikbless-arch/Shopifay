(function(){
  function q(s,c){return (c||document).querySelector(s)}
  function qa(s,c){return Array.from((c||document).querySelectorAll(s))}
  document.addEventListener('change',function(e){
    var note=e.target.closest('[data-cart-note]');if(!note)return;
    fetch('/cart/update.js',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({note:note.value})}).catch(function(){});
  });
  var count=q('[data-header-cart-count]');
  function sync(){var v=count?count.textContent:'0';qa('[data-floating-cart-count]').forEach(function(x){x.textContent=v})}
  if(count&&'MutationObserver'in window)new MutationObserver(sync).observe(count,{childList:true,subtree:true,characterData:true});sync();
  qa('[data-quick-order-form]').forEach(function(form){
    form.addEventListener('submit',function(e){e.preventDefault();var items=qa('[data-quick-order-row]',form).map(function(row){var qty=Number(q('[data-quick-order-qty]',row).value||0),id=Number(q('[data-quick-order-id]',row).value);return qty>0?{id:id,quantity:qty}:null}).filter(Boolean);if(!items.length)return;
      if(form.dataset.bsQuickOrderBusy==='1')return;
      form.dataset.bsQuickOrderBusy='1';
      var button=q('button[type="submit"]',form),previousDisabled=button&&button.disabled;
      var feedback=q('[data-quick-order-feedback]',form);
      if(!feedback){feedback=document.createElement('p');feedback.setAttribute('data-quick-order-feedback','');feedback.setAttribute('role','status');form.appendChild(feedback)}
      feedback.textContent='Adding…';if(button)button.disabled=true;
      fetch((window.Shopify?.routes?.root||'/')+'cart/add.js',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({items:items})})
      .then(async function(response){var data=await response.json();if(!response.ok||data.errors||data.status>=400)throw new Error(data.description||data.message||'Unable to add items.');return data})
      .then(function(){var trigger=q('[data-cart-open]');if(trigger)trigger.click();form.reset();feedback.textContent='Items added to your bag.'})
      .catch(function(error){feedback.textContent=error.message||'Unable to add items. Please try again.'})
      .finally(function(){delete form.dataset.bsQuickOrderBusy;if(button)button.disabled=!!previousDisabled});
    });
  });
})();
