(function(){
  function q(s,c){return (c||document).querySelector(s)}
  function qa(s,c){return Array.from((c||document).querySelectorAll(s))}
  function money(c){var code=(window.Shopify&&Shopify.currency&&Shopify.currency.active)||'USD';try{return new Intl.NumberFormat(document.documentElement.lang||'en-US',{style:'currency',currency:code}).format((Number(c)||0)/100)}catch(e){return '$'+((Number(c)||0)/100).toFixed(2)}}
  qa('[data-predictive-search]').forEach(function(form){
    var input=q('[data-predictive-search-input]',form),panel=q('[data-predictive-results]',form),timer;if(!input||!panel)return;
    input.addEventListener('input',function(){clearTimeout(timer);var term=input.value.trim();if(term.length<2){panel.hidden=true;panel.innerHTML='';return}
      timer=setTimeout(function(){fetch('/search/suggest.json?resources[type]=product&resources[limit]=6&q='+encodeURIComponent(term)).then(function(r){if(!r.ok)throw new Error('Search unavailable');return r.json()}).then(function(data){if(input.value.trim()!==term)return;
        var products=data&&data.resources&&data.resources.results&&data.resources.results.products||[];
        panel.innerHTML=products.length?products.map(function(p){var img=p.image&&p.image.url?p.image.url:'';return '<a class="bs-predictive__item" href="'+escapeHtml(p.url)+'">'+(img?'<img loading="lazy" src="'+escapeHtml(img)+'" alt="">':'<span></span>')+'<strong>'+escapeHtml(p.title)+'</strong><span>'+money(p.price)+'</span></a>'}).join(''):'<div class="bs-predictive__empty">No products found</div>';panel.hidden=false;
      }).catch(function(){panel.hidden=true})},220)
    });
    document.addEventListener('click',function(e){if(!form.contains(e.target))panel.hidden=true})
  });

  function escapeHtml(value){return String(value??'').replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]})}
  var quickViewRequest=0;
  var modal=q('[data-quick-view-modal]'),content=q('[data-quick-view-content]');
  document.addEventListener('click',function(e){
    var btn=e.target.closest('[data-quick-view]');if(!btn||!modal||!content)return;e.preventDefault();e.stopPropagation();
    document.dispatchEvent(new CustomEvent('bls:overlay:opening',{detail:{name:'feature'}}));modal.hidden=false;modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';content.innerHTML='<div class="bs-predictive__empty">Loading…</div>';
    var url=btn.getAttribute('data-product-url');
    var requestId=++quickViewRequest;
    fetch(url+'.js').then(function(r){if(!r.ok)throw new Error('Product unavailable');return r.json()}).then(function(p){
      if(requestId!==quickViewRequest)return;
      var img=p.images&&p.images[0]?p.images[0]:'',opts=(p.variants||[]).map(function(v){return '<option value="'+v.id+'" '+(!v.available?'disabled':'')+'>'+escapeHtml(v.title)+(v.available?'':' — Sold out')+'</option>'}).join(''),desc=(p.description||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
      content.innerHTML='<div class="bs-quick-view"><div class="bs-quick-view__media">'+(img?'<img src="'+escapeHtml(img)+'" alt="" loading="lazy">':'')+'</div><div class="bs-quick-view__info"><p class="bs-eyebrow">QUICK VIEW</p><h2>'+escapeHtml(p.title)+'</h2><div class="bs-quick-view__price">'+money(p.price)+'</div><p class="bs-quick-view__desc">'+escapeHtml(desc)+'</p><form class="bs-add-form bs-quick-view__form" action="/cart/add" method="post"><select name="id">'+opts+'</select><input type="hidden" name="quantity" value="1"><button class="bs-btn bs-btn--primary" type="submit">Add to cart</button></form><a class="bs-mini-btn" href="'+escapeHtml(url)+'">View full details →</a></div></div>';
      var variantSelect=q('select[name=id]',content),price=q('.bs-quick-view__price',content);
      function updatePrice(){var variant=(p.variants||[]).find(function(v){return String(v.id)===variantSelect.value});if(variant&&price)price.textContent=money(variant.price)}
      if(variantSelect){variantSelect.addEventListener('change',updatePrice);updatePrice()}
    }).catch(function(){if(requestId!==quickViewRequest)return;content.innerHTML='<div class="bs-predictive__empty">Could not load this product.</div>'})
  });

  var record=q('[data-product-record]');
  if(record){try{var list=JSON.parse(localStorage.getItem('bs-recent')||'[]'),item={handle:record.dataset.handle,title:record.dataset.title,url:record.dataset.url,image:record.dataset.image,price:record.dataset.price};list=list.filter(function(x){return x.handle!==item.handle});list.unshift(item);localStorage.setItem('bs-recent',JSON.stringify(list.slice(0,8)))}catch(e){}}
  qa('[data-recently-viewed-grid]').forEach(function(grid){try{var items=JSON.parse(localStorage.getItem('bs-recent')||'[]').filter(function(x){return x.handle!==grid.dataset.currentHandle}).slice(0,5);grid.innerHTML=items.length?items.map(function(x){return '<a class="bs-recent-card" href="'+escapeHtml(x.url)+'">'+(x.image?'<img loading="lazy" src="'+escapeHtml(x.image)+'" alt="">':'')+'<div><strong>'+escapeHtml(x.title)+'</strong><span>'+escapeHtml(x.price)+'</span></div></a>'}).join(''):'<p class="bs-empty-recent">Your recently viewed products will appear here.</p>'}catch(e){}});

  qa('[data-product-recommendations]').forEach(function(wrap){var url=wrap.dataset.url;if(!url)return;fetch(url).then(function(r){return r.text()}).then(function(html){var d=new DOMParser().parseFromString(html,'text/html'),fresh=d.querySelector('[data-product-recommendations]');if(fresh&&fresh.innerHTML.trim())wrap.innerHTML=fresh.innerHTML}).catch(function(){})});

  qa('[data-infinite-sentinel]').forEach(function(sentinel){if(!('IntersectionObserver'in window))return;var busy=false,io=new IntersectionObserver(function(entries){if(!entries[0].isIntersecting||busy)return;var next=sentinel.dataset.nextUrl;if(!next)return;busy=true;sentinel.classList.add('is-loading');fetch(next).then(function(r){return r.text()}).then(function(html){var d=new DOMParser().parseFromString(html,'text/html'),newGrid=d.querySelector('.bs-product-grid--collection'),grid=q('.bs-product-grid--collection'),newSent=d.querySelector('[data-infinite-sentinel]');if(newGrid&&grid)Array.from(newGrid.children).forEach(function(x){grid.appendChild(x)});if(newSent&&newSent.dataset.nextUrl)sentinel.dataset.nextUrl=newSent.dataset.nextUrl;else{delete sentinel.dataset.nextUrl;io.disconnect();sentinel.textContent='You reached the end'}}).finally(function(){busy=false;sentinel.classList.remove('is-loading')})},{rootMargin:'500px 0px'});io.observe(sentinel)});
})();
