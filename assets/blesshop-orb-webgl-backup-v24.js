/* BLEShop: native WebGL2 sphere. The geometry and material are GPU-rendered, not CSS.
   Preserves the hero buttons, existing type, scroll and paused-state controls. */
(() => {
  "use strict";
  const vert="#version 300 es\nprecision highp float;\nlayout(location=0) in vec3 aPosition;\nlayout(location=1) in vec3 aNormal;\nuniform mat4 uProjection;\nuniform float uYaw;\nuniform float uPitch;\nuniform float uPulse;\nout vec3 vNormal;\nout vec3 vPosition;\nout vec3 vToEye;\nvoid main(){\n  float cy=cos(uYaw),sy=sin(uYaw),cx=cos(uPitch),sx=sin(uPitch);\n  vec3 p=aPosition*(1.0+uPulse);\n  vec3 ry=vec3(cy*p.x+sy*p.z,p.y,-sy*p.x+cy*p.z);\n  vec3 r=vec3(ry.x,cx*ry.y-sx*ry.z,sx*ry.y+cx*ry.z);\n  vec3 n=vec3(cy*aNormal.x+sy*aNormal.z,aNormal.y,-sy*aNormal.x+cy*aNormal.z);\n  n=normalize(vec3(n.x,cx*n.y-sx*n.z,sx*n.y+cx*n.z));\n  vNormal=n;vPosition=aPosition;vToEye=vec3(0.0,0.0,2.93)-r;\n  gl_Position=uProjection*vec4(r.xy,r.z-2.93,1.0);\n}";
  const frag="#version 300 es\nprecision highp float;\nin vec3 vNormal;\nin vec3 vPosition;\nin vec3 vToEye;\nuniform float uTime;\nout vec4 outColor;\nfloat sat(float x){return clamp(x,0.0,1.0);}\nvoid main(){\n  vec3 N=normalize(vNormal),V=normalize(vToEye),P=vPosition;\n  float ndv=sat(dot(N,V));\n  float fresnel=pow(1.0-ndv,3.25);\n  float marble=sin(P.x*10.9+P.z*4.8+sin(P.y*8.3+P.x*4.9)*1.25);\n  float cloudy=sin(P.y*16.1+P.x*5.4+sin(P.z*9.4)*1.5)*sin(P.z*12.3-P.x*7.7+sin(P.y*5.1));\n  float porcelain=0.5+0.5*sin(P.x*5.0+P.y*8.3+P.z*4.5+marble*0.65);\n  float nacre=0.5+0.5*sin(16.0*P.y+4.0*sin(P.x*6.0+P.z*3.2)+uTime*0.15);\n  vec3 color=mix(vec3(0.78,0.90,0.97),vec3(0.965,0.976,0.997),porcelain*0.65+0.2);\n  color+=vec3(-0.010,0.014,0.027)*(marble+cloudy*0.6);\n  vec3 opal=mix(vec3(0.77,0.91,0.99),vec3(0.995,0.87,0.965),nacre);\n  color=mix(color,opal,0.18*(0.4+0.6*fresnel)+0.055);\n  vec3 L=normalize(vec3(-0.58,0.72,1.0)),L2=normalize(vec3(0.84,0.24,0.60));\n  float lit=0.40+0.60*sat(dot(N,L));\n  float bounce=0.28*sat(dot(N,vec3(-0.28,-0.85,0.50)));\n  color*=0.83+0.18*lit+bounce*0.12;\n  vec3 R=reflect(-V,N);\n  float softbox=exp(-pow((R.x+0.28)/0.36,2.0)-pow((R.y-0.70)/0.44,2.0));\n  float silver=exp(-pow((R.x-0.85)/0.14,2.0)-pow((R.y-0.20)/0.78,2.0));\n  float strip=exp(-pow((R.x+0.68)/0.09,2.0))*sat(R.y+0.64);\n  float spec1=pow(sat(dot(reflect(-L,N),V)),83.0);\n  float spec2=pow(sat(dot(reflect(-L2,N),V)),148.0);\n  color+=vec3(1.0)*softbox*0.17;\n  color+=vec3(0.81,0.94,1.0)*silver*0.095;\n  color+=vec3(1.0,0.985,1.0)*strip*0.060;\n  color+=vec3(1.0)*spec1*0.29;\n  color+=vec3(0.92,0.97,1.0)*spec2*0.19;\n  vec3 iridescent=vec3(0.72+0.16*nacre,0.83+0.09*(1.0-nacre),0.97);\n  color=mix(color,iridescent,fresnel*0.52);\n  color-=vec3(0.15,0.12,0.09)*pow(fresnel,2.3)*0.58;\n  color+=vec3(0.97,1.0,1.0)*pow(1.0-ndv,12.0)*0.30;\n  float fleck=sin(P.x*71.0)*sin(P.y*77.0)*sin(P.z*89.0);\n  color+=vec3(0.013,0.017,0.021)*fleck;\n  outColor=vec4(clamp(color,0.0,1.0),1.0);\n}";
  const selector=".bs-body.template-index .bs-pastel-orb.bs-v24-orb";
  const clamp=(x,min,max)=>Math.min(max,Math.max(min,x));
  function makeRenderer(canvas){
    const gl=canvas.getContext("webgl2",{alpha:true,antialias:true,depth:true,premultipliedAlpha:false,powerPreference:"default"});
    if(!gl)return null;
    function compile(type,source){
      const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
      if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){
        const msg=gl.getShaderInfoLog(s);gl.deleteShader(s);throw new Error(msg);
      }return s;
    }
    const vertex=compile(gl.VERTEX_SHADER,vert),fragment=compile(gl.FRAGMENT_SHADER,frag);
    const program=gl.createProgram();
    gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
    gl.deleteShader(vertex);gl.deleteShader(fragment);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
    const compact=window.matchMedia("(max-width: 900px)").matches;
    const lat=compact?32:64,lon=compact?48:96,vertices=[],indices=[];
    for(let y=0;y<=lat;y++){
      const th=Math.PI*y/lat;
      for(let x=0;x<=lon;x++){
        const ph=Math.PI*2*x/lon,pX=Math.sin(th)*Math.cos(ph),pY=Math.cos(th),pZ=Math.sin(th)*Math.sin(ph);
        vertices.push(pX,pY,pZ,pX,pY,pZ);
      }
    }
    for(let y=0;y<lat;y++)for(let x=0;x<lon;x++){
      const a=y*(lon+1)+x,b=a+lon+1;indices.push(a,a+1,b,b,a+1,b+1);
    }
    const vao=gl.createVertexArray(),vb=gl.createBuffer(),ib=gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER,vb);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,24,0);
    gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,24,12);
    gl.bindVertexArray(null);
    const uniform=(name)=>gl.getUniformLocation(program,name);
    const U={projection:uniform("uProjection"),yaw:uniform("uYaw"),pitch:uniform("uPitch"),pulse:uniform("uPulse"),time:uniform("uTime")};
    const matrix=new Float32Array(16);
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);
    gl.disable(gl.BLEND);gl.clearColor(0,0,0,0);
    function draw(yaw,pitch,time,pulse){
      const box=canvas.getBoundingClientRect();
      if(box.width<1||box.height<1)return;
      const dpr=Math.min(window.devicePixelRatio||1,window.innerWidth<=900?1.2:1.5);
      const w=Math.max(1,Math.min(1100,Math.round(box.width*dpr)));
      const h=Math.max(1,Math.min(1100,Math.round(box.height*dpr)));
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
      gl.viewport(0,0,w,h);
      const f=1/Math.tan(42*Math.PI/360),n=0.1,far=30;
      matrix.fill(0);matrix[0]=f/(w/h);matrix[5]=f;
      matrix[10]=(far+n)/(n-far);matrix[11]=-1;matrix[14]=2*far*n/(n-far);
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      gl.useProgram(program);gl.bindVertexArray(vao);
      gl.uniformMatrix4fv(U.projection,false,matrix);
      gl.uniform1f(U.yaw,yaw);gl.uniform1f(U.pitch,pitch);
      gl.uniform1f(U.pulse,pulse);gl.uniform1f(U.time,time);
      gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
      gl.bindVertexArray(null);
    }
    return {draw,dispose:()=>{gl.deleteBuffer(vb);gl.deleteBuffer(ib);gl.deleteVertexArray(vao);gl.deleteProgram(program);}};
  }
  function init(orb){
    if(orb.dataset.bsWebglReady)return;
    const shell=orb.querySelector(".bs-v24-orb-float");
    const core=shell?.querySelector(".bs-v24-orb-core");
    const label=core?.querySelector(".bs-pastel-orb__label");
    const hero=orb.closest(".bs-pastel-hero"),art=orb.closest(".bs-pastel-art");
    if(!shell||!core||!label||!hero||!art)return;
    const canvas=document.createElement("canvas");
    canvas.setAttribute("aria-hidden","true");
    canvas.style.cssText="position:absolute;inset:0;width:100%;height:100%;display:block;z-index:3;pointer-events:none;background:transparent";
    let renderer;
    try{renderer=makeRenderer(canvas);}catch(e){console.warn("BLESSHOP 3D orb fallback:",e);return;}
    if(!renderer)return;
    shell.insertBefore(canvas,core);
    shell.appendChild(label);
    core.style.setProperty("display","none","important");
    orb.dataset.bsWebglReady="true";
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
    const button=hero.querySelector("[data-pastel-motion]");
    const compact=window.matchMedia("(max-width: 900px)");
    let lastPaint=0;
    let px=0,py=0,targetX=0,targetY=0,scroll=0,time=0,last=0;
    let active=true,visible=true,raf=0,observer=null,resizeObserver=null;
    const isPaused=()=>hero.classList.contains("is-paused");
    function tick(ms){
      raf=0;if(!active||!visible||document.hidden)return;
      if(lastPaint&&ms-lastPaint<(compact.matches?32:21)){schedule();return;}
      lastPaint=ms;
      const dt=last?Math.min(0.05,(ms-last)/1000):0;last=ms;
      const play=!isPaused()&&!reduced.matches;
      if(play)time+=dt;
      px+=(targetX-px)*(play?0.07:1);
      py+=(targetY-py)*(play?0.07:1);
      const yaw=0.14+Math.sin(time*0.22)*0.25+time*0.028+px*0.45+scroll*0.25;
      const pitch=-0.07+Math.sin(time*0.31)*0.08+py*0.37;
      renderer.draw(yaw,pitch,time,play?0.0035*Math.sin(time*0.9):0);
      if(play)schedule();
    }
    function schedule(){if(active&&visible&&!document.hidden&&!raf)raf=requestAnimationFrame(tick);}
    function onMove(e){
      if(reduced.matches||isPaused())return;
      const rect=art.getBoundingClientRect();
      targetX=clamp((e.clientX-rect.left)/rect.width*2-1,-1,1);
      targetY=clamp((e.clientY-rect.top)/rect.height*2-1,-1,1);schedule();
    }
    function onLeave(){targetX=targetY=0;schedule();}
    function onScroll(){
      const rect=hero.getBoundingClientRect();
      scroll=clamp(-rect.top/Math.max(1,rect.height),-1,1);schedule();
    }
    function onPause(){requestAnimationFrame(schedule);}
    function onVisibility(){last=0;schedule();}
    function onLost(e){e.preventDefault();cleanup();}
    const opts={passive:true};
    art.addEventListener("pointermove",onMove,opts);
    art.addEventListener("pointerleave",onLeave,opts);
    window.addEventListener("scroll",onScroll,opts);
    window.addEventListener("resize",schedule,opts);
    document.addEventListener("visibilitychange",onVisibility);
    button?.addEventListener("click",onPause);
    canvas.addEventListener("webglcontextlost",onLost,false);
    reduced.addEventListener?.("change",schedule);
    if("IntersectionObserver" in window){
      observer=new IntersectionObserver(entries=>{
        visible=entries.some(e=>e.isIntersecting);
        if(visible){last=0;schedule();}
        else if(raf){cancelAnimationFrame(raf);raf=0;}
      },{threshold:0.01});observer.observe(hero);
    }
    if("ResizeObserver" in window){
      resizeObserver=new ResizeObserver(schedule);resizeObserver.observe(shell);
    }
    function cleanup(){
      if(!active)return;active=false;
      if(raf)cancelAnimationFrame(raf);
      observer?.disconnect();resizeObserver?.disconnect();
      art.removeEventListener("pointermove",onMove);art.removeEventListener("pointerleave",onLeave);
      window.removeEventListener("scroll",onScroll);window.removeEventListener("resize",schedule);
      document.removeEventListener("visibilitychange",onVisibility);
      button?.removeEventListener("click",onPause);
      canvas.removeEventListener("webglcontextlost",onLost);
      reduced.removeEventListener?.("change",schedule);
      try{renderer.dispose();}catch(_){}
      core.appendChild(label);core.style.removeProperty("display");
      canvas.remove();delete orb.dataset.bsWebglReady;delete orb.__bsWebglCleanup;
    }
    orb.__bsWebglCleanup=cleanup;
    onScroll();
  }
  function start(){document.querySelectorAll(selector).forEach(init);}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
  document.addEventListener("shopify:section:load",start);
  document.addEventListener("shopify:section:unload",e=>{
    e.target.querySelectorAll?.(selector).forEach(el=>el.__bsWebglCleanup?.());
  });
})();