(() => {
  "use strict";
  const vertex="#version 300 es\nprecision highp float;\nlayout(location=0) in vec3 aPosition;\nuniform mat4 uProjection;\nuniform float uYaw;\nuniform float uPitch;\nuniform float uTime;\nuniform float uEnergy;\nuniform float uPulse;\nout vec3 vP;\nout vec3 vNormal;\nout vec3 vEye;\nvoid main(){\n  vec3 p=aPosition;\n  float surface=sin(p.x*13.0+uTime*1.25+sin(p.y*6.0))*sin(p.y*11.0-uTime*.95+p.z*3.0);\n  surface+=.52*sin(p.y*21.0+uTime*1.6+p.x*9.0);\n  float amplitude=.009+uEnergy*.014+uPulse*.014;\n  p*=1.0+surface*amplitude;\n  float cy=cos(uYaw),sy=sin(uYaw),cx=cos(uPitch),sx=sin(uPitch);\n  vec3 ry=vec3(cy*p.x+sy*p.z,p.y,-sy*p.x+cy*p.z);\n  vec3 r=vec3(ry.x,cx*ry.y-sx*ry.z,sx*ry.y+cx*ry.z);\n  vec3 n=vec3(cy*aPosition.x+sy*aPosition.z,aPosition.y,-sy*aPosition.x+cy*aPosition.z);\n  n=normalize(vec3(n.x,cx*n.y-sx*n.z,sx*n.y+cx*n.z));\n  vNormal=n;\n  vP=p;\n  vEye=vec3(0.0,0.0,2.96)-r;\n  gl_Position=uProjection*vec4(r.xy,r.z-2.96,1.0);\n}";
  const fragment="#version 300 es\nprecision highp float;\nin vec3 vP;\nin vec3 vNormal;\nin vec3 vEye;\nuniform float uTime;\nuniform float uEnergy;\nuniform float uPulse;\nout vec4 outColor;\nfloat sat(float x){return clamp(x,0.,1.);}\nfloat gauss(float x,float s){return exp(-x*x/max(s*s,.0001));}\nfloat waves(vec3 p,float t){\n  return .16*sin(p.x*5.4+t*.92+sin(p.z*3.5+t*.46))\n      +.09*sin(p.x*10.2-p.z*4.9-t*1.35)\n      +.055*sin(p.x*16.0+p.z*8.0+t*2.10);\n}\nvoid main(){\n  vec3 P=vP;\n  float t=uTime;\n  vec3 V=normalize(vEye);\n  float turmoil=sin(P.x*12.0+P.y*9.0+t*1.4)*sin(P.y*15.0-P.z*8.0-t);\n  vec3 N=normalize(vNormal+vec3(turmoil*.058,-turmoil*.053,.0));\n  float facing=sat(dot(N,V));\n  float fres=pow(1.0-facing,3.25);\n  float edge=pow(1.0-facing,9.0);\n  vec3 L=normalize(vec3(-.65,.85,1.3));\n  vec3 L2=normalize(vec3(.83,.21,1.2));\n  vec3 R=reflect(-V,N);\n  float box1=gauss(R.x+.30,.25)*gauss(R.y-.73,.51);\n  float box2=gauss(R.x-.81,.12)*gauss(R.y-.18,.85);\n  float spec1=pow(sat(dot(reflect(-L,N),V)),125.0);\n  float spec2=pow(sat(dot(reflect(-L2,N),V)),195.0);\n  vec3 color=vec3(.72,.91,.99)*.095;\n  float alpha=.065+.42*fres+.27*edge;\n  color+=vec3(.64,.96,1.0)*(.13+.61*fres);\n  color+=vec3(.95,1.,1.)*(box1*.41+box2*.37+spec1*.72+spec2*.45);\n  alpha+=box1*.15+box2*.12+spec1*.40+spec2*.34;\n  float waveY=waves(P,t)+.035*sin(P.z*10.-t*.6);\n  float width=.073+.027*sin(P.x*6.4+t*.85)+.028*sin(P.z*5.0-t*.7);\n  float surface=gauss(P.y-waveY,width);\n  float ribbon=gauss(P.y-waveY-.078,.042);\n  float undertow=gauss(P.y+waveY*.83+.19,.19)*.32;\n  float detail=sin(P.x*37.+P.z*15.+t*2.3+sin(P.y*12.))*sin(P.z*36.-P.y*21.-t*2.0);\n  float filaments=pow(sat(.5+.5*detail),7.);\n  float channels=pow(sat(.5+.5*sin(P.x*18.+t*1.1+waves(P,t)*12.)*sin(P.z*20.-t*.8)),4.);\n  float surfLight=sat(dot(N,L))*.35+.65;\n  vec3 water=mix(vec3(.028,.43,.66),vec3(.43,.91,.99),sat(.52+.30*detail+.24*P.y));\n  water=mix(water,vec3(.93,.99,1.),channels*.5+filaments*.24);\n  color+=water*surface*(.87+filaments*.44)*surfLight;\n  color+=vec3(.72,.97,1.)*ribbon*(.25+.36*channels);\n  color+=vec3(.07,.52,.78)*undertow*.75;\n  color+=vec3(.91,1.,1.)*surface*(filaments*.37+channels*.32);\n  alpha+=surface*(.62+.22*filaments)+ribbon*.33+undertow*.13;\n  float caustic=pow(sat(.5+.5*sin(P.x*22.+t*.76+waves(P,t)*12.)*sin(P.y*17.-P.z*14.-t*.72)),6.);\n  color+=vec3(.69,.98,1.)*caustic*.095;\n  alpha+=caustic*.055;\n  for(int i=0;i<10;i++){\n    float k=float(i);\n    float phase=fract(k*.137+t*(.027+mod(k,3.)*.007));\n    vec2 center=vec2(.54*sin(k*2.71+phase*.3),-.85+phase*1.72);\n    center.x+=.06*sin(phase*11.+k);\n    float radius=.020+.013*mod(k,4.);\n    vec2 delta=P.xy-center;\n    float d=length(delta);\n    float circle=1.-smoothstep(radius-.006,radius+.005,d);\n    float hollow=1.-smoothstep(radius*.44,radius*.83,d);\n    float ring=max(0.,circle-hollow);\n    float spark=gauss(length(delta-vec2(-radius*.35,radius*.33)),radius*.21);\n    color+=vec3(.73,.97,1.)*ring*.61+vec3(1.)*spark*.65;\n    alpha+=ring*.32+spark*.30;\n  }\n  color+=vec3(.79,.98,1.)*edge*.32;\n  alpha=clamp(alpha,.025,.94);\n  outColor=vec4(clamp(color,0.,1.),alpha);\n}";
  const selector=".bs-body.template-index .bs-pastel-orb.bs-v24-orb";
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
  const compact=window.matchMedia("(max-width: 900px)");
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function makeRenderer(canvas){
    const gl=canvas.getContext("webgl2",{alpha:true,antialias:true,depth:true,premultipliedAlpha:false,powerPreference:"low-power"});
    if(!gl)return null;
    const compile=(kind,source)=>{
      const shader=gl.createShader(kind);
      gl.shaderSource(shader,source);gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
        const info=gl.getShaderInfoLog(shader);gl.deleteShader(shader);
        throw new Error(info||"WebGL shader error");
      }
      return shader;
    };
    const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);
    const program=gl.createProgram();
    gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
    gl.deleteShader(vs);gl.deleteShader(fs);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program)||"WebGL link error");
    const mobile=compact.matches,lat=mobile?28:54,lon=mobile?40:72;
    const vertices=[],indices=[];
    for(let y=0;y<=lat;y++){
      const theta=Math.PI*y/lat;
      for(let x=0;x<=lon;x++){
        const phi=2*Math.PI*x/lon;
        vertices.push(Math.sin(theta)*Math.cos(phi),Math.cos(theta),Math.sin(theta)*Math.sin(phi));
      }
    }
    for(let y=0;y<lat;y++)for(let x=0;x<lon;x++){
      const a=y*(lon+1)+x,b=a+lon+1;
      indices.push(a,a+1,b,b,a+1,b+1);
    }
    const vao=gl.createVertexArray(),vb=gl.createBuffer(),ib=gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER,vb);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0,3,gl.FLOAT,false,12,0);
    gl.bindVertexArray(null);
    const loc=name=>gl.getUniformLocation(program,name);
    const u={projection:loc("uProjection"),yaw:loc("uYaw"),pitch:loc("uPitch"),time:loc("uTime"),energy:loc("uEnergy"),pulse:loc("uPulse")};
    const projection=new Float32Array(16);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.disable(gl.BLEND);
    gl.clearColor(0,0,0,0);
    function draw(yaw,pitch,time,energy,pulse){
      const box=canvas.getBoundingClientRect();
      if(box.width<2||box.height<2)return;
      const dpr=Math.min(window.devicePixelRatio||1,mobile?1.0:1.4);
      const max=mobile?440:850;
      const w=Math.max(1,Math.min(max,Math.round(box.width*dpr)));
      const h=Math.max(1,Math.min(max,Math.round(box.height*dpr)));
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
      const f=1/Math.tan(42*Math.PI/360),n=.1,far=30;
      projection.fill(0);
      projection[0]=f/(w/h);projection[5]=f;
      projection[10]=(far+n)/(n-far);projection[11]=-1;
      projection[14]=2*far*n/(n-far);
      gl.viewport(0,0,w,h);
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      gl.useProgram(program);gl.bindVertexArray(vao);
      gl.uniformMatrix4fv(u.projection,false,projection);
      gl.uniform1f(u.yaw,yaw);gl.uniform1f(u.pitch,pitch);
      gl.uniform1f(u.time,time);gl.uniform1f(u.energy,energy);
      gl.uniform1f(u.pulse,pulse);
      gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
      gl.bindVertexArray(null);
    }
    return {draw,dispose:()=>{gl.deleteBuffer(vb);gl.deleteBuffer(ib);gl.deleteVertexArray(vao);gl.deleteProgram(program);}};
  }
  function child(parent,cls){
    const el=document.createElement("span");
    el.className=cls;el.setAttribute("aria-hidden","true");
    parent.appendChild(el);
    return el;
  }
  function init(orb){
    if(orb.dataset.bsLiquidReady)return;
    const hero=orb.closest(".bs-pastel-hero");
    const art=orb.closest(".bs-pastel-art");
    const shell=orb.querySelector(".bs-v24-orb-float");
    const core=shell?.querySelector(".bs-v24-orb-core");
    const label=core?.querySelector(".bs-pastel-orb__label");
    if(!hero||!art||!shell||!core||!label)return;
    orb.dataset.bsLiquidReady="1";
    hero.classList.add("bs-liquid-universe");
    const rings=[];
    for(let i=0;i<2;i++){
      const ring=child(orb,"bs-lu-orbit bs-lu-orbit--"+(i===0?"one":"two"));
      child(ring,"bs-lu-drop bs-lu-drop--a");
      child(ring,"bs-lu-drop bs-lu-drop--b");
      rings.push(ring);
    }
    const atmosphere=document.createElement("div");
    atmosphere.className="bs-lu-atmosphere";
    atmosphere.setAttribute("aria-hidden","true");
    child(atmosphere,"bs-lu-light bs-lu-light--one");
    child(atmosphere,"bs-lu-light bs-lu-light--two");
    child(atmosphere,"bs-lu-caustics");
    hero.insertBefore(atmosphere,hero.firstChild);
    const canvas=document.createElement("canvas");
    canvas.setAttribute("aria-hidden","true");
    canvas.className="bs-lu-canvas";
    let renderer=null,hasWebgl=false;
    try{renderer=makeRenderer(canvas);hasWebgl=!!renderer;}
    catch(err){console.warn("BLESSHOP Liquid Universe fallback",err);}
    if(hasWebgl){
      shell.insertBefore(canvas,core);
      shell.appendChild(label);
      core.style.setProperty("display","none","important");
      orb.classList.add("bs-lu-webgl-ready");
    }
    const button=hero.querySelector("[data-pastel-motion]");
    const paused=()=>hero.classList.contains("is-paused")||reduced.matches;
    let time=0,last=0,lastDraw=0,frame=0;
    let targetX=0,targetY=0,px=0,py=0,energy=0,pulse=0;
    let visible=true,active=true;
    let observer=null,resizer=null;
    function schedule(){if(active&&visible&&!document.hidden&&hasWebgl&&!frame)frame=requestAnimationFrame(tick);}
    function tick(ms){
      frame=0;
      if(!active||!visible||document.hidden)return;
      if(!paused()&&lastDraw&&ms-lastDraw<(compact.matches?40:20)){schedule();return;}
      lastDraw=ms;
      const dt=last?Math.min(.05,(ms-last)/1000):0;last=ms;
      if(!paused()){
        time+=dt;
        px+=(targetX-px)*.09;py+=(targetY-py)*.09;
        energy*=Math.exp(-dt*1.7);
        pulse*=Math.exp(-dt*2.5);
      }
      const yaw=.12+Math.sin(time*.28)*.25+time*.055+px*.50;
      const pitch=-.06+Math.sin(time*.37)*.10-py*.34;
      renderer.draw(yaw,pitch,time,energy,pulse);
      if(!paused())schedule();
    }
    function onMove(e){
      if(paused())return;
      if(e.pointerType==="touch")return;
      const b=art.getBoundingClientRect();
      if(b.width<2||b.height<2)return;
      const x=clamp((e.clientX-(b.left+b.width*.5))/(b.width*.50),-1,1);
      const y=clamp((e.clientY-(b.top+b.height*.5))/(b.height*.50),-1,1);
      targetX=x;targetY=y;
      energy=Math.max(energy,.28);
      const rect=hero.getBoundingClientRect();
      hero.style.setProperty("--bs-lu-x",clamp((e.clientX-rect.left)/Math.max(1,rect.width)*100,0,100).toFixed(1)+"%");
      hero.style.setProperty("--bs-lu-y",clamp((e.clientY-rect.top)/Math.max(1,rect.height)*100,0,100).toFixed(1)+"%");
      schedule();
    }
    function onLeave(){targetX=0;targetY=0;schedule();}
    function onPress(e){
      if(paused()||e.target.closest("a,button,input,select,textarea"))return;
      const rect=hero.getBoundingClientRect();
      const x=clamp((e.clientX-rect.left)/Math.max(1,rect.width)*100,0,100);
      const y=clamp((e.clientY-rect.top)/Math.max(1,rect.height)*100,0,100);
      hero.style.setProperty("--bs-lu-x",x.toFixed(1)+"%");
      hero.style.setProperty("--bs-lu-y",y.toFixed(1)+"%");
      pulse=1;energy=1.0;
      const ripple=child(hero,"bs-lu-ripple");
      ripple.style.left=x+"%";ripple.style.top=y+"%";
      const done=()=>ripple.remove();
      ripple.addEventListener("animationend",done,{once:true});
      setTimeout(done,1100);
      schedule();
    }
    function onVisibility(){last=0;schedule();}
    function onPause(){if(frame){cancelAnimationFrame(frame);frame=0;}last=0;requestAnimationFrame(schedule);}
    function onContextLost(e){e.preventDefault();cleanup();}
    hero.addEventListener("pointermove",onMove,{passive:true});
    hero.addEventListener("pointerleave",onLeave,{passive:true});
    hero.addEventListener("pointerdown",onPress,{passive:true});
    button?.addEventListener("click",onPause);
    document.addEventListener("visibilitychange",onVisibility);
    reduced.addEventListener?.("change",onPause);
    canvas.addEventListener("webglcontextlost",onContextLost,false);
    if("IntersectionObserver" in window){
      observer=new IntersectionObserver(entries=>{
        visible=entries.some(item=>item.isIntersecting);
        if(!visible&&frame){cancelAnimationFrame(frame);frame=0;}
        if(visible){last=0;schedule();}
      },{threshold:.01});
      observer.observe(hero);
    }
    if("ResizeObserver" in window){resizer=new ResizeObserver(schedule);resizer.observe(shell);}
    if(!reduced.matches){
      hero.classList.add("bs-lu-arriving");
      setTimeout(()=>hero.classList.remove("bs-lu-arriving"),1500);
    }
    function cleanup(){
      if(!active)return;
      active=false;
      if(frame)cancelAnimationFrame(frame);
      observer?.disconnect();resizer?.disconnect();
      hero.removeEventListener("pointermove",onMove);
      hero.removeEventListener("pointerleave",onLeave);
      hero.removeEventListener("pointerdown",onPress);
      button?.removeEventListener("click",onPause);
      document.removeEventListener("visibilitychange",onVisibility);
      reduced.removeEventListener?.("change",onPause);
      canvas.removeEventListener("webglcontextlost",onContextLost);
      renderer?.dispose();
      if(hasWebgl){core.appendChild(label);core.style.removeProperty("display");canvas.remove();}
      atmosphere.remove();
      rings.forEach(r=>r.remove());
      hero.querySelectorAll(".bs-lu-ripple").forEach(r=>r.remove());
      hero.classList.remove("bs-liquid-universe","bs-lu-arriving");
      hero.style.removeProperty("--bs-lu-x");hero.style.removeProperty("--bs-lu-y");
      orb.classList.remove("bs-lu-webgl-ready");
      delete orb.dataset.bsLiquidReady;
      delete orb.__bsLiquidCleanup;
    }
    orb.__bsLiquidCleanup=cleanup;
    if(hasWebgl)schedule();
  }
  function start(){document.querySelectorAll(selector).forEach(init);}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
  document.addEventListener("shopify:section:load",start);
  document.addEventListener("shopify:section:unload",e=>e.target.querySelectorAll?.(selector).forEach(el=>el.__bsLiquidCleanup?.()));
})();