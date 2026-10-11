/* BLESSHOP home page.
   1. Scroll progress for the stylesheets: --bls-h on the hero runs 0..1 while the first screen scrolls away;
      bls-deep on the page once it is well past the first screen, so the stars stop twinkling behind the glass.
   2. The space scene. Stars are painted on canvases. With the merchant's pictures (sky, planet, ground) the
      scene is made of those; without them the moon and the lunar plain are drawn once by the graphics card,
      in thin slices so the page never freezes, and then kept as plain pictures.
   3. Depth: every layer of the scene shifts a little by its depth as the page scrolls and, with a mouse,
      as the pointer moves. All of it is eased so the scene glides.
   The page works without any of it: no script, no WebGL and "reduce motion" all leave a calm, readable page. */
(function () {
  var root = document.documentElement;
  var still = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  /* test runs on a slow software renderer set window.BLS.patient so the pictures are never abandoned */
  var patient = !!(window.BLS && window.BLS.patient);
  var TINTS = ['255,255,255', '255,255,255', '214,230,255', '255,238,210', '243,214,232'];
  var scene = null;
  var queued = false;
  var skyW = 0;
  var skyH = 0;
  var run = 0;
  var resizeTimer = 0;
  var shootTimer = 0;
  var watcher = null;
  var busy = false;
  var retries = 0;
  var photo = false;
  var hero = null;
  var lastH = '';
  var lastScroll = 0;
  var calmTimer = 0;
  /* depth: the layers that move, where the camera is (x, y from the mouse, s from the scroll) and where it is going */
  var depth = [];
  var cam = { x: 0, y: 0, s: 0, tx: 0, ty: 0, ts: 0 };
  var gliding = false;
  var glideT = 0;
  var fine = !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);

  /* how the moon is turned, and where the sunlight on the plain comes from. The stylesheet says whether
     the moon is lit from below (wide screens) or from above (phones), so the name always sits on its dark side */
  var MOON_A = [1.2, 0.6, 0.97, 1.2];
  var MOON_C = [0, 0, 0, 0.011];
  var SUN = [0.9, 0.33, -0.2, 1.12];
  var FOCAL = 1.1;

  /* pictures for cards that have no photo yet */
  var ART = {
    crescent: { kind: 'moon', a: [0.6, 0.25, 0.8, 1.2], b: [0.72, 0.2, -0.66, 2.2], c: [0.14, -0.04, 0, 0.022] },
    surface: { kind: 'moon', a: [2.1, -0.3, 2.5, 1.2], b: [0.9, 0.38, 0.02, 1.7], c: [0.06, 0.22, 0, 0.011] },
    moon: { kind: 'moon', a: [4, 0.5, 0.86, 1.2], b: [0.5, 0.45, 0.74, 1.6], c: [-0.2, 0.16, 3.7, 0.011] },
    horizon: { kind: 'ground', seed: 7 }
  };

  function update() {
    queued = false;
    var y = Math.max(0, window.pageYOffset || root.scrollTop || 0);
    var first = Math.max(1, window.innerHeight * 0.8);
    var h = Math.min(1, y / first).toFixed(3);
    /* only the hero reads --bls-h, so only the hero is told, and only when it changes */
    if (h !== lastH) {
      lastH = h;
      (hero || root).style.setProperty('--bls-h', h);
    }
    root.classList.toggle('bls-scrolled', y > 24);
    root.classList.toggle('bls-deep', y > window.innerHeight * 0.55);
    cam.ts = Math.min(1, y / first);
    nudge();
  }

  function request() {
    lastScroll = Date.now();
    if (!queued) {
      queued = true;
      window.requestAnimationFrame(update);
    }
  }

  /* repeatable random numbers, so the sky looks the same on every visit */
  function seeded(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* one star layer; the far one also gets a very faint band of dust, unless a photo of the sky is behind it (lite) */
  function paintLayer(canvas, w, h, dpr, seed, far, lite) {
    var c = canvas && canvas.getContext && canvas.getContext('2d');
    if (!c) return;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    var rand = seeded(seed);
    var clouds = ['46,58,128', '78,54,124', '30,84,118', '104,56,96', '52,72,140', '70,48,116', '34,92,112'];
    var i, x, y, r, a, g, t;
    if (far && !lite) {
      c.globalCompositeOperation = 'lighter';
      for (i = 0; i < clouds.length; i++) {
        t = (i + rand()) / clouds.length;
        x = w * (0.02 + t * 0.96);
        y = h * (0.86 - t * 0.7) + (rand() - 0.5) * h * 0.16;
        r = Math.max(w, h * 0.6) * (0.2 + rand() * 0.22);
        g = c.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(' + clouds[i] + ',' + (0.022 + rand() * 0.018).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(' + clouds[i] + ',0)');
        c.fillStyle = g;
        c.fillRect(x - r, y - r, r * 2, r * 2);
      }
      for (i = Math.round(w * h / 5200); i > 0; i--) {
        t = rand();
        x = w * t + (rand() - 0.5) * w * 0.2;
        y = h * (0.86 - t * 0.7) + (rand() + rand() + rand() - 1.5) * h * 0.16;
        c.fillStyle = 'rgba(' + TINTS[(rand() * TINTS.length) | 0] + ',' + (0.12 + rand() * 0.3).toFixed(3) + ')';
        c.fillRect(x, y, 0.8, 0.8);
      }
      c.globalCompositeOperation = 'source-over';
    }
    for (i = Math.round(w * h / (far ? (lite ? 9000 : 3600) : 36000)); i > 0; i--) {
      x = rand() * w;
      y = rand() * h;
      t = TINTS[(rand() * TINTS.length) | 0];
      if (far) {
        r = 0.35 + Math.pow(rand(), 3) * 0.8;
        a = 0.25 + rand() * 0.55;
      } else {
        r = 0.8 + Math.pow(rand(), 2);
        a = 0.75 + rand() * 0.25;
        g = c.createRadialGradient(x, y, 0, x, y, r * 3.5);
        g.addColorStop(0, 'rgba(' + t + ',' + (a * 0.3).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(' + t + ',0)');
        c.fillStyle = g;
        c.fillRect(x - r * 3.5, y - r * 3.5, r * 7, r * 7);
      }
      c.fillStyle = 'rgba(' + t + ',' + a.toFixed(3) + ')';
      c.beginPath();
      c.arc(x, y, r, 0, 6.2832);
      c.fill();
    }
  }

  /* true when the screen changed enough to be worth repainting (phone toolbars resize it a little all the time) */
  function sizeChanged() {
    var w = scene.clientWidth;
    var h = scene.clientHeight;
    if (!w || !h || (w === skyW && Math.abs(h - skyH) < 140)) return false;
    skyW = w;
    skyH = h;
    return true;
  }

  function paintSky() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var lite = !!scene.querySelector('.bls-pl--sky');
    paintLayer(scene.querySelector('.bls-scene__layer--far canvas'), skyW, Math.ceil(skyH * 1.08), dpr, 11, true, lite);
    paintLayer(scene.querySelector('.bls-scene__layer--near canvas'), skyW, Math.ceil(skyH * 1.16), dpr, 29, false, lite);
  }

  /* depth. Layers marked data-depth (0 far away .. 1 near) shift by their depth: down as the first screen scrolls
     away and, with a mouse, a few pixels against the pointer. The camera eases towards where it should be,
     so nothing jumps; the loop stops by itself once everything has settled */
  function collectDepth() {
    var list, i;
    depth = [];
    if (!scene || still || !scene.parentNode.classList.contains('bls-hero--motion')) return;
    list = scene.querySelectorAll('[data-depth]');
    for (i = 0; i < list.length; i++) {
      depth.push({ el: list[i], d: parseFloat(list[i].getAttribute('data-depth')) || 0 });
    }
  }

  function placeDepth() {
    var w, h, reach, drop, i, l, x, y;
    if (!depth.length) return;
    w = scene.clientWidth;
    h = scene.clientHeight;
    reach = Math.min(w, 1800) * 0.012;
    drop = h * 0.09;
    for (i = 0; i < depth.length; i++) {
      l = depth[i];
      x = -cam.x * reach * l.d;
      y = (cam.s * drop - cam.y * reach * 0.5) * l.d;
      l.el.style.translate = x.toFixed(2) + 'px ' + y.toFixed(2) + 'px';
    }
  }

  function glide(now) {
    var dt = Math.min(0.07, Math.max(0.001, (now - glideT) / 1000));
    var kp = 1 - Math.exp(-dt / 0.55);
    var ks = 1 - Math.exp(-dt / 0.2);
    glideT = now;
    cam.x += (cam.tx - cam.x) * kp;
    cam.y += (cam.ty - cam.y) * kp;
    cam.s += (cam.ts - cam.s) * ks;
    if (Math.abs(cam.tx - cam.x) + Math.abs(cam.ty - cam.y) + Math.abs(cam.ts - cam.s) < 0.0004) {
      cam.x = cam.tx;
      cam.y = cam.ty;
      cam.s = cam.ts;
      gliding = false;
    }
    placeDepth();
    if (gliding) window.requestAnimationFrame(glide);
  }

  function nudge() {
    if (gliding || !depth.length) return;
    gliding = true;
    window.requestAnimationFrame(function (now) {
      glideT = now - 16;
      glide(now);
    });
  }

  /* the photo scene fades in once its pictures are ready to be shown, so it never appears half loaded */
  function showPhoto() {
    var box = scene && scene.classList.contains('bls-scene--photo') ? scene : null;
    var imgs, left, i, timer;
    if (!box || box.classList.contains('is-on')) return;
    imgs = box.querySelectorAll('.bls-pl img');
    left = imgs.length + 1;
    function done() {
      left--;
      if (left > 0) return;
      window.clearTimeout(timer);
      window.requestAnimationFrame(function () {
        box.classList.add('is-on');
      });
    }
    timer = window.setTimeout(function () {
      left = 1;
      done();
    }, 6000);
    for (i = 0; i < imgs.length; i++) {
      if (imgs[i].decode) {
        imgs[i].decode().then(done, done);
      } else if (imgs[i].complete) {
        done();
      } else {
        imgs[i].addEventListener('load', done);
        imgs[i].addEventListener('error', done);
      }
    }
    done();
  }

  function addTwinkles() {
    var layer = scene.querySelector('.bls-scene__layer--near');
    if (!layer || still || layer.querySelector('.bls-twinkle')) return;
    var rand = seeded(53);
    var count = Math.max(8, Math.min(22, Math.round(scene.clientWidth / 60)));
    var i, star;
    for (i = 0; i < count; i++) {
      star = document.createElement('span');
      star.className = 'bls-twinkle';
      star.style.left = (rand() * 100).toFixed(2) + '%';
      star.style.top = (rand() * 62).toFixed(2) + '%';
      star.style.animationDuration = (3 + rand() * 5).toFixed(2) + 's';
      star.style.animationDelay = (-rand() * 8).toFixed(2) + 's';
      layer.appendChild(star);
    }
  }

  /* a shooting star every 7 to 16 seconds, never while the tab is hidden */
  function startShooting() {
    window.clearTimeout(shootTimer);
    if (still) return;
    function fire() {
      var el = scene && scene.querySelector('.bls-shoot');
      if (el && !document.hidden && !root.classList.contains('bls-deep')) {
        el.classList.remove('is-on');
        el.style.left = (8 + Math.random() * 70).toFixed(1) + '%';
        el.style.top = (4 + Math.random() * 30).toFixed(1) + '%';
        el.style.setProperty('--bls-shoot-a', (16 + Math.random() * 26).toFixed(1) + 'deg');
        void el.offsetWidth;
        el.classList.add('is-on');
      }
      shootTimer = window.setTimeout(fire, 7000 + Math.random() * 9000);
    }
    shootTimer = window.setTimeout(fire, 3500);
  }

  var COMMON = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'uniform vec2 uRes;uniform vec2 uOff;uniform vec4 uA;uniform vec4 uB;uniform vec4 uC;',
    'float hash12(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}',
    'vec2 hash22(vec2 p){vec3 p3=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973));p3+=dot(p3,p3.yzx+33.33);return fract((p3.xx+p3.yz)*p3.zy);}',
    'float hash13(vec3 p3){p3=fract(p3*.1031);p3+=dot(p3,p3.zyx+31.32);return fract((p3.x+p3.y)*p3.z);}',
    'vec3 hash33(vec3 p3){p3=fract(p3*vec3(.1031,.1030,.0973));p3+=dot(p3,p3.yxz+33.33);return fract((p3.xxy+p3.yxx)*p3.zyx);}',
    'float noise2(vec2 x){vec2 i=floor(x);vec2 f=fract(x);f=f*f*(3.-2.*f);',
    'return mix(mix(hash12(i),hash12(i+vec2(1.,0.)),f.x),mix(hash12(i+vec2(0.,1.)),hash12(i+vec2(1.,1.)),f.x),f.y);}',
    'float noise3(vec3 x){vec3 i=floor(x);vec3 f=fract(x);f=f*f*(3.-2.*f);',
    'return mix(mix(mix(hash13(i),hash13(i+vec3(1.,0.,0.)),f.x),mix(hash13(i+vec3(0.,1.,0.)),hash13(i+vec3(1.,1.,0.)),f.x),f.y),',
    'mix(mix(hash13(i+vec3(0.,0.,1.)),hash13(i+vec3(1.,0.,1.)),f.x),mix(hash13(i+vec3(0.,1.,1.)),hash13(i+vec3(1.,1.,1.)),f.x),f.y),f.z);}',
    'float fbm2(vec2 p){float a=.5;float s=0.;for(int i=0;i<4;i++){s+=a*noise2(p);p=p*2.03+vec2(17.3,9.1);a*=.5;}return s;}',
    'float fbm3(vec3 p){float a=.5;float s=0.;for(int i=0;i<5;i++){s+=a*noise3(p);p=p*2.03+vec3(1.7,9.2,3.1);a*=.5;}return s;}',
    'float fbm3s(vec3 p){float a=.5;float s=0.;for(int i=0;i<3;i++){s+=a*noise3(p);p=p*2.03+vec3(1.7,9.2,3.1);a*=.5;}return s;}'
  ].join('\n');
  var SHADERS = {
    moon: [
    'void craters(vec3 p,float freq,float amp,float seed,float young,inout vec3 g,inout float b){vec3 q=p*freq;vec3 ci=floor(q);',
    'for(int i=-1;i<=1;i++){for(int j=-1;j<=1;j++){for(int k=-1;k<=1;k++){vec3 c=ci+vec3(float(i),float(j),float(k));vec3 rnd=hash33(c+seed);',
    'float rr=hash13(c+seed+7.31);float R=.07+.40*rr*rr*rr*rr;vec3 v=q-(c+rnd);float len=length(v);float d=len/R;if(d<3.2){',
    'float rim=exp(-(d-1.)*(d-1.)/.035);float bowl=d<1.?2.*d:0.;float fresh=.45+1.05*hash13(c+seed+3.7);float dh=(bowl*.62-rim*(d-1.)/.035*.5)*amp*fresh;',
    'dh*=1.-smoothstep(1.6,3.2,d);g+=v/max(len,1e-4)*dh;b+=(rim*.06-(1.-smoothstep(.2,1.,d))*.03)*fresh*amp;}if(young>0.&&rr<.55&&rnd.z>.74){',
    'vec3 dir=v/max(len,1e-4);float streak=noise3(dir*6.+c*3.1)*.55+noise3(dir*15.+c*1.7)*.45;streak=smoothstep(.5,.82,streak)*(.55+.45*noise3(v*5.+c));',
    'float reach=exp(-max(d-1.,0.)*.26)*(1.-smoothstep(5.,10.,d));b+=young*(streak*reach*.2+exp(-d*d*.5)*.12);}}}}}void main(){',
    'vec2 px=gl_FragCoord.xy+uOff;float m=min(uRes.x,uRes.y);vec2 uv=((px*2.-uRes)/m)/uA.z+uC.xy;float r2=dot(uv,uv);float aa=2.*uA.w/(m*uA.z);',
    'float rad=sqrt(r2);if(rad>1.+aa){gl_FragColor=vec4(0.);return;}float z=sqrt(max(1.-r2,0.));vec3 n=vec3(uv,z);',
    'float cy=cos(uA.x),sy=sin(uA.x),cp=cos(uA.y),sp=sin(uA.y);vec3 po=vec3(n.x*cy+n.z*sy,n.y,n.z*cy-n.x*sy);po=vec3(po.x,po.y*cp-po.z*sp,po.z*cp+po.y*sp);',
    'vec3 p=po+uC.z;vec3 L=normalize(uB.xyz);vec3 Lo=vec3(L.x*cy+L.z*sy,L.y,L.z*cy-L.x*sy);Lo=vec3(Lo.x,Lo.y*cp-Lo.z*sp,Lo.z*cp+Lo.y*sp);',
    'float mu0s=dot(po,Lo);vec3 col=vec3(0.);vec3 w=vec3(fbm3s(p*1.3+vec3(3.1,0.,0.)),fbm3s(p*1.3+vec3(0.,7.7,0.)),fbm3s(p*1.3+vec3(0.,0.,5.3)));',
    'float mareN=fbm3(p*.8+w*1.3+vec3(11.,3.,7.))+.05*(fbm3s(p*9.)-.5);float mare=smoothstep(.455,.505,mareN);float deep=smoothstep(.50,.62,mareN);',
    'float patch=fbm3s(p*3.1+w*2.2);float alb=mix(.55+.16*(patch-.5),.20-.05*deep+.07*(patch-.5),mare);if(mu0s>-.16){alb*=.84+.32*fbm3(p*7.+w*2.);',
    'alb*=.92+.16*noise3(p*41.);vec3 g=vec3(0.);float b=0.;float soft=1.-.7*mare;craters(p,2.3,1.05*soft,0.,1.,g,b);craters(p,5.3,1.0*soft,19.,.45,g,b);',
    'craters(p,11.9,1.0*soft,43.,0.,g,b);craters(p,26.,.9*(1.-.5*mare),71.,0.,g,b);craters(p,57.,.7*(1.-.4*mare),97.,0.,g,b);float e=.004;',
    'float f0=fbm3s(p*23.);vec3 fg=vec3(fbm3s(p*23.+vec3(e*23.,0.,0.))-f0,fbm3s(p*23.+vec3(0.,e*23.,0.))-f0,fbm3s(p*23.+vec3(0.,0.,e*23.))-f0)/e;',
    'g+=fg*.014*(1.-.55*mare);vec3 gt=g-dot(g,po)*po;vec3 pn=normalize(po-gt*.42);float mu0=dot(pn,Lo);float mu=max(z,.02);float lit=max(mu0,0.);',
    'float ls=lit/(lit+mu)*1.5;float shade=mix(lit,ls,.55)*smoothstep(-.02,.10,mu0s);alb=clamp(alb+b*(1.+.6*mare),0.,1.);',
    'vec3 tint=mix(vec3(.985,.975,.955),vec3(.86,.91,1.),mare);col=alb*tint*shade*uB.w;}col+=alb*vec3(.55,.68,1.)*uC.w*(.4+.6*z);col=col/(1.+col*.42);',
    'col=pow(col,vec3(.4545));float a=1.-smoothstep(1.-aa,1.+aa,rad);gl_FragColor=vec4(col*a,a);}'
  ].join('\n'),
    ground: [
    'float pit(vec2 P,float C,float seed,float dens){vec2 q=P/C;vec2 ci=floor(q);float h=0.;for(int i=-1;i<=1;i++){for(int j=-1;j<=1;j++){',
    'vec2 c=ci+vec2(float(i),float(j));if(hash12(c+seed+1.9)<dens){float rr=hash12(c+seed+7.31);vec2 rnd=hash22(c+seed);float R=.09+.34*rr*rr*rr;',
    'float d=length(q-(c+rnd))/R;if(d<2.6){float fresh=.35+.9*hash12(c+seed+3.7);float bowl=d<1.?(d*d-1.)*.5:0.;float rim=exp(-(d-1.)*(d-1.)/.07)*.17;',
    'h+=(bowl+rim)*R*fresh;}}}}return h*C;}float rocks(vec2 P,float C,float seed,float dens){vec2 q=P/C;vec2 ci=floor(q);float h=0.;',
    'for(int i=-1;i<=1;i++){for(int j=-1;j<=1;j++){vec2 c=ci+vec2(float(i),float(j));if(hash12(c+seed+4.1)<dens){vec2 rnd=hash22(c+seed);',
    'float R=.04+.12*hash12(c+seed+8.8);vec2 dv=(q-(c+rnd))/R;dv.x*=.7+.6*hash12(c+seed+2.2);float d=length(dv);h+=max(1.-d*d,0.)*R*1.2;}}}return h*C;}',
    'float land(vec2 P,vec4 w){float h=(fbm2(P/41.+uB.z)-.5)*3.4+(fbm2(P/8.7+uB.z+5.)-.5)*.55;if(w.x>0.)h+=pit(P,58.,uB.z+11.,.4)*w.x*.3;',
    'if(w.y>0.)h+=pit(P,17.,uB.z+29.,.4)*w.y*.4;if(w.z>0.)h+=(pit(P,4.9,uB.z+53.,.4)*.5+(fbm2(P/2.9)-.5)*.16)*w.z;',
    'if(w.w>0.)h+=(pit(P,1.3,uB.z+71.,.45)*.55+rocks(P,.6,uB.z+3.,.07)+rocks(P,.17,uB.z+17.,.09)+(fbm2(P*2.3)-.5)*.07+(fbm2(P*9.1)-.5)*.034+(fbm2(P*33.)-.5)*.011)*w.w;',
    'return h;}float hill(float x,float seed){float s=0.;float a=.5;for(int i=0;i<4;i++){s+=a*noise2(vec2(x,seed));x=x*2.13+5.7;a*=.5;}return s;}',
    'void main(){vec2 px=gl_FragCoord.xy+uOff;float f=uA.y;float u=(px.x-.5*uRes.x)/f;float v=(uA.x-px.y)/f;vec3 Lw=normalize(uC.xyz);',
    'vec2 Lh=normalize(Lw.xz);float tanE=Lw.y/length(Lw.xz);vec3 col=vec3(0.);float alpha=0.;vec3 haze=vec3(.50,.54,.66)*.30*uC.w;if(v>0.){float z=1./v;',
    'vec2 P=vec2(u*z,z);float fz=z*z/f;',
    'vec4 w=vec4(1.-smoothstep(.04,.26,fz/58.),1.-smoothstep(.04,.26,fz/17.),1.-smoothstep(.04,.26,fz/4.9),1.-smoothstep(.03,.2,fz/1.3));',
    'vec4 wf=vec4(w.xyz,0.);float e=max(.006,fz*.7);float h0=land(P,w);float hx=land(P+vec2(e,0.),w);float hz=land(P+vec2(0.,e),w);',
    'vec3 n=normalize(vec3(-(hx-h0)/e,1.,-(hz-h0)/e));float diff=pow(max(dot(n,Lw),0.)/Lw.y,.8);float sh=1.;float sd=.07;float dist=0.;',
    'for(int i=0;i<6;i++){dist+=sd;float hh=land(P+Lh*dist,i<3?w:wf);sh=min(sh,smoothstep(-.008-.05*dist,.008+.07*dist,h0+tanE*dist-hh));sd*=2.5;}',
    'if(uB.y>.5){vec2 rel=P-vec2(uA.z,uA.w);float along=dot(rel,-Lh);float across=abs(rel.x*Lh.y-rel.y*Lh.x);float len=uB.x/tanE;',
    'float body=max(.15*uB.x*(1.-.3*along/len),1.4*fz);',
    'float fs=smoothstep(-.03,.06,along)*(1.-smoothstep(len*.8,len*1.05,along))*(1.-smoothstep(body*.7,body*1.2+.03*along,across));sh=min(sh,1.-.94*fs);}',
    'float alb=.37+.10*(fbm2(P/11.3+3.)-.5)+.06*(fbm2(P*.9)-.5)*w.z+.05*(fbm2(P*4.3)-.5)*w.w+.05*(noise2(P*27.)-.5)*w.w;',
    'float light=diff*sh*.94+.03+.025*n.y;col=vec3(alb)*vec3(.97,.985,1.03)*light*uC.w;float fog=1.-exp(-z/150.);col=mix(col,haze,fog*.92);alpha=1.;}',
    'float e2=-v;if(e2>=-2./f){for(int k=0;k<3;k++){float fk=float(k)/2.;float sc=mix(.05,.085,fk)*uB.w;float fr=mix(2.3,3.6,fk);float sx=uB.z+3.3+fk*11.7;',
    'float top=(hill(u*fr+sx,sx)-mix(.47,.52,fk))*sc*2.;float edge=1.2/f;float cover=(1.-smoothstep(top-edge,top+edge,e2))*smoothstep(-2./f,0.,e2);',
    'if(cover>0.){float du=.004;float slope=(hill((u+du)*fr+sx,sx)-hill((u-du)*fr+sx,sx))*sc*2./(2.*du);float below=(top-e2)/sc;',
    'float m1=fbm2(vec2((u+.003)*fr*7.,below*1.9+sx));float m0=fbm2(vec2((u-.003)*fr*7.,below*1.9+sx));float face=clamp(.6-slope*1.0-(m1-m0)*5.,0.,1.);',
    'float lit=face*(1.-.25*clamp(below,0.,1.))+.05;vec3 rc=mix(vec3(.40,.41,.45)*lit*uC.w,haze,mix(.72,.38,fk));col=mix(col,rc,cover);',
    'alpha=max(alpha,cover);}}}col=col/(1.+col*.5);col=pow(max(col,0.),vec3(.4545));col=mix(col,col*col*(3.-2.*col),.55);',
    'gl_FragColor=vec4(col*alpha,alpha);}'
  ].join('\n')
  };

  /* draws one picture after another on a hidden WebGL canvas and copies each finished slice to an ordinary canvas.
     Nothing here blocks the page: shaders compile in the background where the browser allows it, and a slice
     is only copied once the graphics card says it is done */
  function createPainter() {
    var canvas = document.createElement('canvas');
    var options = { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: true };
    var gl = null;
    var modern = false;
    var programs = {};
    var pixel = new Uint8Array(4);
    var lost = false;
    try {
      gl = canvas.getContext('webgl2', options);
      modern = !!gl;
      if (!gl) gl = canvas.getContext('webgl', options) || canvas.getContext('experimental-webgl', options);
    } catch (e) {
      gl = null;
    }
    if (!gl) return null;
    var precision = gl.getShaderPrecisionFormat ? gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT) : null;
    if (!precision || precision.precision < 23) return null;
    var parallel = gl.getExtension('KHR_parallel_shader_compile');
    canvas.addEventListener('webglcontextlost', function (event) {
      event.preventDefault();
      lost = true;
    });
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    /* ready(entry) gets the compiled program, or null when the graphics card refuses it */
    function build(kind, ready) {
      if (kind in programs) {
        ready(programs[kind]);
        return;
      }
      var vertex = gl.createShader(gl.VERTEX_SHADER);
      var fragment = gl.createShader(gl.FRAGMENT_SHADER);
      var prog = gl.createProgram();
      gl.shaderSource(vertex, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}');
      gl.compileShader(vertex);
      gl.shaderSource(fragment, COMMON + '\n' + SHADERS[kind]);
      gl.compileShader(fragment);
      gl.attachShader(prog, vertex);
      gl.attachShader(prog, fragment);
      gl.bindAttribLocation(prog, 0, 'p');
      gl.linkProgram(prog);

      function finish() {
        var entry = null;
        if (!lost && gl.getProgramParameter(prog, gl.LINK_STATUS)) {
          entry = {
            prog: prog,
            uRes: gl.getUniformLocation(prog, 'uRes'),
            uOff: gl.getUniformLocation(prog, 'uOff'),
            uA: gl.getUniformLocation(prog, 'uA'),
            uB: gl.getUniformLocation(prog, 'uB'),
            uC: gl.getUniformLocation(prog, 'uC')
          };
        }
        programs[kind] = entry;
        ready(entry);
      }

      function wait() {
        if (lost || gl.getProgramParameter(prog, parallel.COMPLETION_STATUS_KHR)) finish();
        else window.requestAnimationFrame(wait);
      }

      if (parallel) wait();
      else finish();
    }

    return {
      /* job: {kind, canvas, w, h, a, b, c}. alive() turns false when a newer run has started. done(true) when the picture is complete */
      paint: function (job, alive, done) {
        var ctx = job.canvas.getContext && job.canvas.getContext('2d');
        var w = job.w;
        var h = job.h;
        if (lost || !ctx || !w || !h) {
          done(false);
          return;
        }
        build(job.kind, function (p) {
          var most = Math.max(2, Math.min(h, Math.ceil(360000 / w)));
          var rows = patient ? most : Math.max(2, Math.min(most, Math.ceil(40000 / w)));
          var last = Date.now();
          var spent = 0;
          var y = 0;
          var n = 0;
          var sent = 0;
          var waited = 0;
          var fence = null;
          if (!p || lost || !alive()) {
            done(false);
            return;
          }
          job.canvas.width = w;
          job.canvas.height = h;
          canvas.width = w;
          canvas.height = most;
          gl.useProgram(p.prog);
          gl.uniform2f(p.uRes, w, h);
          gl.uniform4f(p.uA, job.a[0], job.a[1], job.a[2], job.a[3]);
          gl.uniform4f(p.uB, job.b[0], job.b[1], job.b[2], job.b[3]);
          gl.uniform4f(p.uC, job.c[0], job.c[1], job.c[2], job.c[3]);

          function end(ok) {
            if (fence) gl.deleteSync(fence);
            fence = null;
            done(ok);
          }

          /* hands the next slice to the graphics card */
          function send() {
            n = Math.min(rows, h - y);
            gl.viewport(0, 0, w, n);
            gl.uniform2f(p.uOff, 0, h - y - n);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
            sent = Date.now();
            if (modern) {
              fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
              gl.flush();
            } else {
              /* older browsers: reading one pixel waits for the graphics card */
              gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
              waited = Date.now() - sent;
            }
          }

          /* once a frame: is the slice done? then copy it and send the next one.
             Only time spent drawing counts towards the limit; a tab waiting in the background does not */
          function step() {
            var now = Date.now();
            var state;
            spent += Math.min(120, now - last);
            last = now;
            if (lost || !alive()) {
              end(false);
              return;
            }
            if (modern) {
              state = gl.clientWaitSync(fence, 0, 0);
              if (state === gl.TIMEOUT_EXPIRED) {
                if (!patient && spent > 20000) {
                  /* a very slow graphics card: stop and keep the simple backdrop */
                  lost = true;
                  retries = 9;
                  end(false);
                } else {
                  window.requestAnimationFrame(step);
                }
                return;
              }
              gl.deleteSync(fence);
              fence = null;
              if (state === gl.WAIT_FAILED) {
                end(false);
                return;
              }
              waited = Date.now() - sent;
            }
            ctx.drawImage(canvas, 0, most - n, w, n, 0, y, w, n);
            y += n;
            if (!patient) {
              if (waited > (modern ? 50 : 20)) rows = Math.max(2, rows >> 1);
              else if (waited < (modern ? 26 : 9)) rows = Math.min(most, Math.ceil(rows * 1.7));
            }
            if (y >= h) {
              end(true);
            } else if (!patient && spent > 20000) {
              lost = true;
              retries = 9;
              end(false);
            } else {
              send();
              window.requestAnimationFrame(step);
            }
          }

          send();
          window.requestAnimationFrame(step);
        });
      },
      release: function () {
        var ext = gl.getExtension('WEBGL_lose_context');
        if (ext && !lost) ext.loseContext();
        lost = true;
      }
    };
  }

  /* picture size in device pixels, kept under a pixel budget */
  function fit(el, dpr, budget) {
    var w = el.clientWidth;
    var h = el.clientHeight;
    var scale = dpr;
    if (!w || !h) return null;
    if (w * h * scale * scale > budget) scale = Math.sqrt(budget / (w * h));
    return { w: Math.max(2, Math.round(w * scale)), h: Math.max(2, Math.round(h * scale)), scale: scale };
  }

  /* the jobs below only list pictures that are still missing */
  function sceneJobs() {
    var jobs = [];
    if (!scene || scene.classList.contains('is-ready')) return jobs;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var moon = scene.querySelector('.bls-scene__moon canvas');
    var ground = scene.querySelector('.bls-scene__ground');
    var style = window.getComputedStyle(scene);
    var size, sunY, hor, rise, horizon, focal, walker, box, land, below, depth;
    if (moon) {
      size = fit(moon, dpr, 2250000);
      sunY = parseFloat(style.getPropertyValue('--bls-sun-y'));
      if (isNaN(sunY)) sunY = 0.38;
      if (size) jobs.push({ kind: 'moon', canvas: moon, w: size.w, h: size.w, a: MOON_A, b: [0.9, sunY, 0.05, 1.7], c: MOON_C, mark: null, scene: true });
    }
    if (ground) {
      size = fit(ground, dpr, 1600000);
      hor = parseFloat(style.getPropertyValue('--bls-hor')) || 34;
      rise = parseFloat(style.getPropertyValue('--bls-rise')) || 7;
      if (size) {
        horizon = ground.clientHeight * hor / (hor + rise);
        focal = FOCAL * scene.clientHeight;
        walker = [0, 0, 0, 0];
        box = scene.querySelector('.bls-figure');
        if (box && box.getClientRects().length) {
          box = box.getBoundingClientRect();
          land = ground.getBoundingClientRect();
          below = box.bottom - (land.bottom - horizon);
          if (below > 2 && box.height > 4) {
            depth = focal / below;
            walker = [((box.left + box.right) / 2 - (land.left + land.right) / 2) * depth / focal, depth, box.height * depth / focal, 1];
          }
        }
        jobs.push({
          kind: 'ground', canvas: ground, w: size.w, h: size.h,
          a: [horizon * size.scale, focal * size.scale, walker[0], walker[1]],
          b: [walker[2], walker[3], 0, 1],
          c: SUN,
          mark: scene,
          scene: true
        });
      }
    }
    return jobs;
  }

  function artJobs() {
    var jobs = [];
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var list = document.querySelectorAll('canvas[data-bls-art]');
    var i, el, art, size;
    for (i = 0; i < list.length; i++) {
      el = list[i];
      art = ART[el.getAttribute('data-bls-art')];
      size = art && !el.parentNode.classList.contains('is-ready') ? fit(el, dpr, 700000) : null;
      if (!size) continue;
      if (art.kind === 'moon') {
        jobs.push({ kind: 'moon', canvas: el, w: size.w, h: size.h, a: art.a, b: art.b, c: art.c, mark: el.parentNode });
      } else {
        jobs.push({
          kind: 'ground', canvas: el, w: size.w, h: size.h,
          a: [size.h * 0.56, size.h * 1.5, 0, 0],
          b: [0, 0, art.seed, 1.25],
          c: SUN,
          mark: el.parentNode
        });
      }
    }
    return jobs;
  }

  /* paints the big scene first, then the card pictures. The scene shows only when both of its pictures are complete */
  function paintPictures() {
    var jobs = sceneJobs().concat(artJobs());
    var painter = jobs.length ? createPainter() : null;
    var mine = run;
    var index = 0;
    var sceneOk = true;
    if (!painter) return;
    mine = ++run;
    busy = true;
    function alive() {
      return mine === run;
    }
    function next() {
      var job = jobs[index++];
      if (!job || !alive()) {
        painter.release();
        if (alive()) busy = false;
        return;
      }
      painter.paint(job, alive, function (ok) {
        if (job.scene && !ok) sceneOk = false;
        if (ok && alive() && job.mark && (sceneOk || !job.scene)) job.mark.classList.add('is-ready');
        next();
      });
    }
    next();
  }

  /* the card pictures are drawn by the graphics card, and getting it ready can hold the page for a moment on
     some phones. So they wait until the page has loaded and nobody has scrolled for a little while.
     The drawn scene (used when the hero has no photos) is part of the first screen and starts at once */
  function paintWhenCalm() {
    window.clearTimeout(calmTimer);
    if (scene && scene.querySelector('.bls-scene__ground')) {
      paintPictures();
      return;
    }
    var tries = 0;
    function go() {
      if (Date.now() - lastScroll < 500 && tries++ < 24) {
        calmTimer = window.setTimeout(go, 300);
        return;
      }
      if (window.requestIdleCallback) window.requestIdleCallback(paintPictures, { timeout: 1200 });
      else paintPictures();
    }
    calmTimer = window.setTimeout(go, 600);
  }

  /* true when some picture is still missing: the graphics card was taken away while the tab was in the background */
  function unfinished() {
    return !!document.querySelector('.bls-scene__ground') && !document.querySelector('.bls-scene.is-ready') ||
      !!document.querySelector('.bls-artbox:not(.is-ready)');
  }

  function clearPictures() {
    var marks = document.querySelectorAll('.bls-scene.is-ready,.bls-artbox.is-ready');
    var i;
    for (i = 0; i < marks.length; i++) marks[i].classList.remove('is-ready');
  }

  /* panels rise into view the first time they are scrolled to */
  function watchReveals() {
    var list = document.querySelectorAll('.bls-reveal:not(.is-in)');
    var i;
    if (!('IntersectionObserver' in window)) {
      for (i = 0; i < list.length; i++) list[i].classList.add('is-in');
      return;
    }
    if (!watcher) {
      watcher = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            watcher.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });
    }
    for (i = 0; i < list.length; i++) watcher.observe(list[i]);
  }

  function start() {
    scene = document.querySelector('.bls-scene');
    hero = scene ? scene.parentNode : null;
    lastH = '';
    skyW = 0;
    skyH = 0;
    photo = !!(scene && scene.querySelector('.bls-scene__photo'));
    if (scene) sizeChanged();
    /* behind the merchant's own picture there is no sky to paint */
    if (scene && !photo) {
      paintSky();
      addTwinkles();
      startShooting();
    }
    collectDepth();
    cam.s = cam.ts;
    placeDepth();
    showPhoto();
    watchReveals();
    /* the pictures wait until the page itself has loaded */
    if (document.readyState === 'complete') paintWhenCalm();
  }

  window.addEventListener('scroll', request, { passive: true });
  /* with a mouse the scene leans a little away from the pointer, and back to the middle when it leaves the window */
  if (fine && !still) {
    window.addEventListener('pointermove', function (event) {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      cam.tx = Math.max(-1, Math.min(1, event.clientX / window.innerWidth * 2 - 1));
      cam.ty = Math.max(-1, Math.min(1, event.clientY / window.innerHeight * 2 - 1));
      nudge();
    }, { passive: true });
    document.addEventListener('mouseout', function (event) {
      if (event.relatedTarget) return;
      cam.tx = 0;
      cam.ty = 0;
      nudge();
    });
  }
  window.addEventListener('resize', function () {
    request();
    placeDepth();
    if (!scene || !sizeChanged()) return;
    if (!photo) paintSky();
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () {
      clearPictures();
      paintWhenCalm();
    }, 260);
  });
  window.addEventListener('load', function () {
    request();
    paintWhenCalm();
  });
  /* back from the background with a picture missing: try again, twice at most */
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && !busy && retries < 2 && document.readyState === 'complete' && unfinished()) {
      retries++;
      paintPictures();
    }
  });
  /* the theme editor swaps sections in and out while the merchant edits */
  document.addEventListener('shopify:section:load', function (event) {
    var el = event.target;
    var has = function (selector) {
      return !!(el && el.querySelector && el.querySelector(selector));
    };
    if (has('.bls-scene')) {
      start();
    } else {
      watchReveals();
      if (has('canvas[data-bls-art]')) paintPictures();
    }
  });
  /* tapping outside the phone menu, or pressing Escape, closes it */
  document.addEventListener('click', function (event) {
    var menu = document.querySelector('.bls-menu[open]');
    if (menu && !menu.contains(event.target)) menu.removeAttribute('open');
  });
  document.addEventListener('keydown', function (event) {
    var menu = event.key === 'Escape' ? document.querySelector('.bls-menu[open]') : null;
    if (menu) {
      menu.removeAttribute('open');
      menu.querySelector('summary').focus();
    }
  });
  root.classList.add('bls-js');
  update();
  start();
})();
