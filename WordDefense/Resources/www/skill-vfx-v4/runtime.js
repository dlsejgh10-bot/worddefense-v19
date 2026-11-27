/* Approved v4 drawing adapted to native combat. This module never applies damage or moves units. */
(() => {
  'use strict';
  const P=window.P3, SK=window.__wd.WD_SKILL, V=SK.V;
  const map={rapid:'ranger_skill',archer:'archer_skill',warrior:'warrior',miner:'miner_skill',artillery:'artillery_skill',mage:'mage_meteor',zone:'zone_energy_orb',buffer:'buffer'};
  const lead={rapid:.5,archer:0,sniper:.3,warrior:0,miner:.5,artillery:.1,mage:.25,zone:.35,buffer:.5,debuffer:0};
  const sprites=window.__spr=Object.create(null), errors=[];
  // Tint procedural light only. User PNG pixels and unit art are never recoloured.
  let inkElement=0;const tintCache=new Map();
  const hues=[0,10,216,184,52,153,29,94,43,267];
  const lightCaps=[1,.55,.54,.76,.57,.53,.43,.53,.87,.45];
  function tint(value,el){
    if(!el||typeof value!=='string')return value;
    const cacheKey=el+'|'+value;if(tintCache.has(cacheKey))return tintCache.get(cacheKey);
    let rgb,alpha=1;const hex=/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value),rgba=/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i.exec(value);
    if(hex){const h=hex[1].length===3?[...hex[1]].map(c=>c+c).join(''):hex[1];rgb=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16));}else if(rgba){rgb=rgba.slice(1,4).map(Number);alpha=rgba[4]==null?1:+rgba[4];}else return value;
    const r=rgb[0]/255,g=rgb[1]/255,b=rgb[2]/255,hi=Math.max(r,g,b),lo=Math.min(r,g,b),light=(hi+lo)/2,sat=hi===lo?0:(hi-lo)/(1-Math.abs(2*light-1));
    if(light<.055)return value;
    // Include white cores: leaving them neutral made every attribute look white/yellow.
    const L=Math.min(lightCaps[el],.14+light*.73),S=el===6?.74:el===8?.94:.98;
    const result=`hsla(${hues[el]??0},${S*100}%,${L*100}%,${alpha})`;if(tintCache.size<5000)tintCache.set(cacheKey,result);return result;
  }
  for(const property of ['fillStyle','strokeStyle','shadowColor']){
    const descriptor=Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype,property);
    Object.defineProperty(ctx,property,{configurable:true,get(){return descriptor.get.call(this);},set(value){descriptor.set.call(this,tint(value,inkElement));}});
  }
  for(const method of ['createLinearGradient','createRadialGradient']){
    const original=ctx[method].bind(ctx);ctx[method]=function(...args){const gradient=original(...args),element=inkElement,add=gradient.addColorStop.bind(gradient);gradient.addColorStop=(offset,color)=>add(offset,tint(color,element));return gradient;};
  }
  function palette(element,draw){const saved=inkElement;inkElement=element||0;try{return draw();}finally{inkElement=saved;}}
  // Attribute beams are luminous layers, not an opaque colour replacement.
  // Keep a very thin hot core; put the identifying hue in the body and soft halo.
  const originalBeam=P.beam;
  P.beam=function(x0,y0,x1,y1,w,col,core,alpha){
    if(!inkElement)return originalBeam(x0,y0,x1,y1,w,col,core,alpha);
    if(!(alpha>.004&&w>.1))return;
    const el=inkElement,h=hues[el],dx=x1-x0,dy=y1-y0,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
    const colour=(l,a)=>`hsla(${h},100%,${l}%,${a})`;
    const cross=(width,stops)=>{const g=ctx.createLinearGradient(x0-nx*width/2,y0-ny*width/2,x0+nx*width/2,y0+ny*width/2);for(const [offset,light,a]of stops)g.addColorStop(offset,colour(light,a));ctx.strokeStyle=g;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();};
    ctx.save();ctx.lineCap='round';ctx.globalCompositeOperation='screen';ctx.globalAlpha=alpha;
    cross(w*5,[[0,52,0],[.2,52,.015],[.38,58,.12],[.5,62,.32],[.62,58,.12],[.8,52,.015],[1,52,0]]);
    cross(w*1.25,[[0,48,0],[.15,52,.24],[.38,65,.76],[.5,82,.95],[.62,65,.76],[.85,52,.24],[1,48,0]]);
    const saved=inkElement;inkElement=0;try{ctx.globalCompositeOperation='source-over';ctx.globalAlpha=alpha*.95;ctx.lineWidth=Math.max(.8,w*.13);ctx.strokeStyle='#f7fdff';ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();}finally{inkElement=saved;ctx.restore();}
  };
  const root=new URL('.',document.currentScript.src);
  const api=window.WDSkillVFX={ready:false,errors,prepare,ghostAttack,dusk,markBurst,shadowHit,rhythm,snapshot:()=>({ready:api.ready,scenes:list().map(s=>({key:s.key,t:G.t-s.start,dur:s.dur,prepared:s.prepared,shadow:!!s.shadow})),bursts:bursts().length,errors:errors.slice()})};
  api.loaded=fetch(new URL('sheets/meta.json',root)).then(r=>{if(!r.ok)throw Error('VFX meta '+r.status);return r.json();}).then(async meta=>{
    await Promise.all(Object.entries(meta).map(async([name,box])=>{const im=new Image();im.src=new URL('sheets/'+name+'.png',root);await im.decode();sprites[name]={...box,im};}));api.ready=true;
  }).catch(e=>{errors.push(String(e));console.error(e);});
  const list=()=>G?(G.skillVfxV4||(G.skillVfxV4=[])):[];
  const bursts=()=>G?(G.skillBurstsV4||(G.skillBurstsV4=[])):[];
  const copy=m=>({...m,_source:m});
  const nearby=(x,y,r)=>G.mobs.filter(m=>!m.dead&&Math.hypot(m.x-x,m.y-y)<=r);
  function target(T,key){if(key==='buffer')return T;const ms=nearby(T.x,T.y,trange(T));if(key==='archer'||key==='sniper')return ms.reduce((a,b)=>!a||b.hp>a.hp?b:a,null);return findTarget(T,trange(T));}
  function create(key,T,L,start){
    const tg=target(T,key);if(!tg&&key!=='rapid'&&key!=='warrior')return null;
    if(key==='debuffer')return {key,source:T,T:copy(T),start,dur:.65,R:trange(T),tg:nearby(T.x,T.y,trange(T)).map(copy)};
    const name=key==='sniper'?'sniper_ult_'+(['phys','fire','water','ice','lightning'][T.el]||'phys'):map[key];
    const model=P.S[name];if(!model)return null;
    const s=Object.assign(Object.create(model),{key,source:T,T:copy(T),start,L,copies:new Map()});
    const cp=m=>{if(!s.copies.has(m))s.copies.set(m,copy(m));return s.copies.get(m);};
    const CT=s.T,vs=G.mobs.filter(m=>!m.dead);s.dur=model.dur;
    if(key==='rapid')Object.assign(s,{R:V.rapid.R,ms:nearby(T.x,T.y,V.rapid.R).map(cp),f0:T.face||1,t0:.5,gap:V.rapid.gap,H:422,face:[],pose:[],shots:[]});
    if(key==='rapid'){for(let i=0;i<V.rapid.n(L);i++){s.face.push([1,-1,-1,1,-1][i%5]);s.pose.push(['bar6','bar2','bar5','bar4','bar6'][i%5]);s.shots.push(s.t0+i*s.gap);}s.dur=s.shots.at(-1)+.8;}
    if(key==='archer')Object.assign(s,{B:{x:T.x-22,y:T.y-10},tgs:[cp(tg)],ts:Array.from({length:V.archer.n(L)},(_,i)=>i*V.archer.gap),tw:0,fl:tg.x<T.x});
    if(key==='sniper'){
      const dx=tg.x-T.x,dy=tg.y-T.y,d=Math.hypot(dx,dy)||1,u={x:dx/d,y:dy/d};
      Object.assign(s,{aimTarget:tg,M:{x:T.x+(dx<0?-40:40),y:T.y-6},u,L:V.sniper.len,tc:.15,tf:V.sniper.aim+.3,tg:vs.filter(m=>{const x=m.x-T.x,y=m.y-T.y,al=x*u.x+y*u.y;return al>=0&&al<=V.sniper.len&&Math.abs(x*u.y-y*u.x)<=V.sniper.w/2+(m.r||12);}).map(cp)});
    }
    if(key==='warrior'){
      const a=SK.baldoAim(T,L);if(!a)return null;CT.face=a.face;
      Object.assign(s,{O:{...a.O},R:a.R,ky:a.ky,ts:1.08,sw:.084,HS:0,tsp:1.204,A0:(a.face<0?Math.PI:0)-Math.PI*.75,SP:Math.PI*1.5,tg:a.ms.map(cp),VR:a.R,VA0:-Math.PI*.75,VSP:Math.PI*1.5});
      s.th=s.tg.map(m=>{const angle=Math.atan2((m.y-s.O.y)/s.ky,(m.x-s.O.x)*(a.face<0?-1:1)),fr=P.cl((angle-s.VA0)/s.VSP);return s.ts+s.sw*(1-Math.sqrt(1-fr));});s.thw=s.th.slice();
    }
    if(key==='miner'){
      Object.assign(s,{m:cp(tg),R:V.miner.R*V.rangeMul(L),vs:nearby(tg.x,tg.y,V.miner.R*V.rangeMul(L)).map(cp),ti:.5,HG:175,F:{x:tg.x,y:tg.y+3},cr:[]});
      for(let i=0;i<8;i++){const a=i*.785+(P.H(i)-.5)*.5,length=(38+20*P.H(i+3))*(.8/.45),pts=[[0,0]];let x=0,y=0;for(let k=1;k<=4;k++){const aa=a+(P.H(i*9+k)-.5)*.7;x+=Math.cos(aa)*length/4;y+=Math.sin(aa)*length/4*.42;pts.push([x,y]);}s.cr.push({pts,w:(2.2+P.H(i+7))*(.8/.45)});}
    }
    if(key==='artillery')Object.assign(s,{Bp:{x:tg.x,y:tg.y},mz:{x:T.x+30,y:T.y-10},tf:.1,tl:.1+V.artillery.fly,tb:.1+V.artillery.fly+V.artillery.delay,tfire:.08,tret:.48,HA:300,R:V.artillery.R*V.rangeMul(L),vic:nearby(tg.x,tg.y,V.artillery.R*V.rangeMul(L)).map(cp)});
    if(key==='mage')Object.assign(s,{C:{x:tg.x,y:tg.y},R:V.mage.R,t0:.25,fall:V.mage.fall,tb:.25+V.mage.fall,S0:{x:tg.x+150,y:tg.y-420},vic:nearby(tg.x,tg.y,V.mage.R).map(cp)});
    if(key==='zone'){const D=V.zone.dur(L);Object.assign(s,{tg:cp(tg),o:{x:tg.x,y:tg.y},R:V.zone.R,t0:.35,D,TK:V.zone.tick,ticks:Array.from({length:Math.ceil(D/V.zone.tick)+1},(_,i)=>.35+i*V.zone.tick),vic:nearby(tg.x,tg.y,V.zone.R).map(cp),dur:.35+D+.4});}
    if(key==='buffer'){
      const al=G.towers.filter(a=>a.side===T.side&&!a.walk).map(cp),dur=V.buffer.blessDur(L)*(1+V.buffer.psDur(SK.psLv(T)));
      Object.assign(s,{al,C:{x:T.x,y:T.y+8},tb:.5,Rm:190,dur:.5+dur});s.ti=al.map(a=>.5+.05+.45*Math.pow(Math.hypot(a.x-T.x,(a.y-T.y)/.62)/190,1.6));
    }
    return s;
  }
  function prepare(T,L){
    if(!api.ready||!G||T._dk2)return;const key=ROLES[T.role].key,pre=lead[key];if(!(pre>0)||T.skCd<=0||T.skCd>pre)return;
    if(!SK.skCanCast(T,L)){G.skillVfxV4=list().filter(s=>!(s.prepared&&s.source===T));return;}
    if(list().some(s=>s.prepared&&s.source===T))return;const s=create(key,T,L,G.t-(pre-T.skCd));if(s){s.prepared=true;list().push(s);}
  }
  for(const key of Object.keys(lead)){
    const original=SK.CAST[key];if(!original)continue;
    SK.CAST[key]=function(T,L){
      if(!api.ready)return original(T,L);
      const previous=list().find(s=>s.prepared&&s.source===T),start=previous?previous.start:G.t-(lead[key]||0),s=create(key,T,L,start);
      const result=original(T,L);if(result&&s){G.skillVfxV4=list().filter(q=>q!==previous);list().push(s);}return result;
    };
  }
  P.sprPt=(T,px,py)=>{const o=T.__spr,s=sprites[o.nm],height=o.H||(s.b-s.t),cx=o.cx??s.w/2,k=UNIT_H/height*(o.sc||1),f=o.flip?-1:1;return{x:T.x+f*(px-cx)*k,y:T.y+FOOT_DY+(py-s.b)*k,f,k};};
  const originalSrc=unitSrc;
  unitSrc=function(T){const o=T?.__spr,s=o&&sprites[o.nm];if(!s||T.el!==0||(T.len===6&&o.nm.startsWith('t5_')))return originalSrc(T);const height=o.H||(s.b-s.t),cx=o.cx??s.w/2;return{img:s.im,sx:0,sw:s.w,sh:s.h,dw:s.w,dh:s.h,box:{t:s.b-height,b:s.b,l:cx,r:cx},flip:o.flip,fb:{cx,foot:s.b},shr:o.sc||1};};
  function pose(s){const t=G.t-s.start;Object.assign(s.T,s.source);for(const [original,c]of s.copies||[])Object.assign(c,original);if(s.key==='sniper'&&!s.aimLocked){const dx=s.aimTarget.x-s.source.x,dy=s.aimTarget.y-s.source.y,d=Math.hypot(dx,dy)||1;s.u={x:dx/d,y:dy/d};s.M={x:s.source.x+(dx<0?-40:40),y:s.source.y-6};if(t>=s.tf)s.aimLocked=true;}P.t=t;s.update?.(t);if(s.key==='warrior'){s.T.__spr=null;P.atk(s.T,t,s.ts,.42);}else if(s.T.__spr&&(s.source.el!==0||(s.source.len===6&&s.T.__spr.nm.startsWith('t5_')))){const k=s.key==='rapid'?Math.max(0,s.cur(t)):0;P.atk(s.T,t,s.key==='rapid'?s.shots[k]:s.ts&&typeof s.ts==='number'?s.ts:s.ti??s.tfire??s.t0??0,.45);}return s.T;}
  const originalTower=drawTower;
  drawTower=function(T,x,y,sc,ghost,noTag){
    if(!api.ready)return originalTower(T,x,y,sc,ghost,noTag);
    const active=list().filter(s=>!s.shadow&&s.source===T&&s.key!=='debuffer'&&G.t-s.start<s.dur).at(-1);
    for(const s of list().filter(s=>s.shadow&&s.source===T&&G.t>=s.start&&G.t-s.start<s.dur)){wdSilOn(.45);try{const visual=pose(s);originalTower(visual,x+visual.x-T.x+18,y+visual.y-T.y-7,sc,true,true);}finally{wdSilOff();}}
    if(active){const visual=pose(active);return originalTower(visual,x+visual.x-T.x,y+visual.y-T.y,sc,ghost,noTag);}
    const slash=bursts().filter(b=>['dusk','rhythm'].includes(b.key)&&b.T===T&&G.t-b.start>=0&&G.t-b.start<.3).at(-1);
    if(slash){const visual={...T,__spr:null};P.atk(visual,G.t-slash.start,0,.42);return originalTower(visual,x,y,sc,ghost,noTag);}
    return originalTower(T,x,y,sc,ghost,noTag);
  };
  function draw(layer){
    if(!api.ready||!G)return;
    for(const s of list()){
      const t=G.t-s.start;if(t<0||t>=s.dur||!G.towers.includes(s.source))continue;
      ctx.save();try{if(s.shadow){ctx.translate(18,-7);ctx.globalAlpha=.45;}const el=['buffer','debuffer','merchant'].includes(s.key)?0:s.source.el;palette(el,()=>{if(s.key==='debuffer'){if(layer==='top')wave(s.T.x,s.T.y,t,s.R,'#dd2441');}else{pose(s);if(s.key==='buffer')magicShield(s,t,layer);else s[layer]?.(t);}});}catch(e){if(errors.length<20)errors.push(s.key+': '+e.message);console.error(e);}finally{ctx.restore();}
    }
    if(layer==='top'){for(const b of bursts()){ctx.save();try{palette(b.key==='dusk'?b.el:0,()=>burst(b));}finally{ctx.restore();}}for(const m of G.mobs)if(m.nakinT>0&&!m.dead)brand(m);}
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  }
  const originalGround=drawGround10;drawGround10=function(){originalGround();draw('ground');};
  const originalFx=drawFx;drawFx=function(ui){originalFx(ui);if(!ui)draw('top');};
  const originalProj=drawProj6;drawProj6=function(p){if(api.ready&&p.T?._sk&&ROLES[p.T.role].key==='archer')return;return originalProj(p);};
  const originalUpdate=update;update=function(dt){originalUpdate(dt);if(!G)return;G.skillVfxV4=list().filter(s=>!G.over&&G.t-s.start<s.dur&&G.towers.includes(s.source));G.skillBurstsV4=bursts().filter(b=>!G.over&&G.t-b.start<b.dur);};
  function ghostAttack(D,el,R){if(!api.ready)return false;bursts().push({key:'ghost',el,x:D.x,y:D.y,R,start:G.t,dur:.42,col:el===4?'#8ad9ff':'#a93143'});for(const m of nearby(D.x,D.y,R))m._ghostVisualAt=G.t;return true;}
  const originalGhost=dbBurst10;dbBurst10=function(D,el,R){if(ghostAttack(D,el,R)){try{dbSfx(el);}catch(e){}return;}return originalGhost(D,el,R);};
  const originalDbHit=dbHitFx;dbHitFx=function(m,el){if(api.ready&&m._ghostVisualAt===G.t)return;return originalDbHit(m,el);};
  const originalHit=hit;hit=function(T,m,base){const stored=m?.nakinPool||0,result=originalHit(T,m,base);if(api.ready&&m?.nakinT>0&&(m.nakinPool||0)>stored)bursts().push({key:'markhit',el:m._markElement||0,x:m.x,y:m.y-12,start:G.t,dur:.18});return result;};
  function shadowHit(T,event){
    if(!api.ready)return;
    const key=event.key==='rapid-shot'?'rapid':event.key,original=list().filter(s=>!s.shadow&&s.source===T&&s.key===key).at(-1);
    if(original){const s=create(key,T,event.L||original.L,original.start+.08);if(s){s.shadow=true;if(event.key==='rapid-shot'){s.start=G.t-.5+.08;s.shots=[.5];s.face=[original.face[event.L%original.face.length]];s.pose=[original.pose[event.L%original.pose.length]];s.dur=1.15;}list().push(s);}return;}
    const last=bursts().filter(b=>b.key==='dusk'&&G.t-b.start<.08).at(-1);
    if(last)bursts().push({...last,start:G.t+.08,col:'#29183e',el:9});
    addFx({k:'shadow',T,ox:18,oy:-7,aD:.3,life:.46});
  }
  function dusk(a,b,col,el=0,T=null){if(!api.ready)return false;bursts().push({key:'dusk',a,b,col,el,T,start:G.t,dur:.36});return true;}
  function rhythm(T){if(api.ready)bursts().push({key:'rhythm',T,start:G.t,dur:.35});}
  function magicShield(s,t,layer){
    for(let i=0;i<s.al.length;i++){
      const a=s.al[i],age=t-s.tb-.025*i;if(age<0)continue;
      const enter=P.E.out3(P.cl(age/.2)),leave=P.cl((s.dur-t)/.3),hold=(.84+.05*Math.sin(age*2.2))*leave,x=a.x,y=a.y-25,rx=37*enter,ry=49*enter;
      if(rx<1)continue;
      ctx.save();
      if(layer==='ground'){P.bloom(x,a.y+14,29,'#53bfff',.2*hold);ctx.restore();continue;}
      const fill=ctx.createLinearGradient(x-rx,y-ry,x+rx,y+ry);fill.addColorStop(0,`rgba(166,237,255,${.1*hold})`);fill.addColorStop(.45,`rgba(40,148,223,${.025*hold})`);fill.addColorStop(1,`rgba(24,111,213,${.13*hold})`);
      ctx.fillStyle=fill;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();
      const edge=ctx.createLinearGradient(x,y-ry,x,y+ry);edge.addColorStop(0,`rgba(220,252,255,${.9*hold})`);edge.addColorStop(.45,`rgba(103,215,255,${.64*hold})`);edge.addColorStop(1,`rgba(49,143,228,${.23*hold})`);
      ctx.strokeStyle=edge;ctx.lineWidth=1.8;ctx.stroke();ctx.lineWidth=.6;ctx.strokeStyle=`rgba(187,242,255,${.24*hold})`;ctx.beginPath();ctx.ellipse(x,y,rx-3,ry-3,0,-2.8,-.15);ctx.stroke();
      // One upward glass-light sweep as the shield lands; the shell then stays still.
      if(age<.32){const q=P.cl(age/.32),yy=y+ry-ry*2*q,flash=(1-q)*leave;ctx.save();ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.clip();const g=ctx.createLinearGradient(0,yy-14,0,yy+14);g.addColorStop(0,'rgba(181,242,255,0)');g.addColorStop(.5,`rgba(216,251,255,${.65*flash})`);g.addColorStop(1,'rgba(181,242,255,0)');ctx.fillStyle=g;ctx.fillRect(x-rx,yy-14,rx*2,28);ctx.restore();}
      ctx.restore();
    }
  }
  function markBurst(m){if(api.ready)bursts().push({key:'mark',el:m._markElement||0,x:m.x,y:m.y-12,R:80,start:G.t,dur:.5,col:'#e32c49'});}
  function wave(x,y,t,R,col){
    const q=P.cl(t/.38),fade=(1-q)**1.7,r=8+R*P.E.out5(q);if(fade<=0)return;
    ctx.save();ctx.globalCompositeOperation='lighter';
    P.bloom(x,y-10,45*(1-q),col,fade*.9);
    for(let j=0;j<3;j++){const u=P.cl((t-j*.025)/(.28+j*.03));if(u<=0||u>=1)continue;const rr=8+R*P.E.out5(u);ctx.globalAlpha=(1-u)**2;ctx.strokeStyle=j===0?'#f3faff':col;ctx.lineWidth=(j===0?5:10)*(1-u)+.6;ctx.beginPath();ctx.ellipse(x,y,rr,rr*.5,0,0,Math.PI*2);ctx.stroke();}
    for(let i=0;i<22;i++){const a=i*Math.PI*2/22+(P.H(i+8)-.5)*.12,off=R*(.6+.4*P.H(i+9))*P.E.out3(q),len=(10+25*P.H(i+10))*(1-q);P.streak(x+Math.cos(a)*off,y+Math.sin(a)*off*.5,x+Math.cos(a)*(off-len),y+Math.sin(a)*(off-len)*.5,1.5, i%3?col:'#ffffff',fade,'#ffffff');}
    ctx.restore();
  }
  function brand(m){
    const x=m.x,y=m.y-42,pulse=.65+.2*Math.sin(G.t*5),r=10;
    ctx.save();ctx.globalCompositeOperation='lighter';P.bloom(x,y,22,'#c72543',.45*pulse);ctx.strokeStyle='#ee8193';ctx.lineWidth=1.5;ctx.globalAlpha=pulse;
    ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r*.7,y);ctx.lineTo(x,y+r);ctx.lineTo(x-r*.7,y);ctx.closePath();ctx.moveTo(x-r*.9,y-r*.6);ctx.lineTo(x+r*.9,y+r*.6);ctx.moveTo(x,y-r*1.4);ctx.lineTo(x,y+r*1.4);ctx.stroke();ctx.restore();
  }
  function ghostImpact(b,t){
    if(t<0||t>=b.dur)return;const q=P.cl(t/b.dur),spread=P.E.out5(P.cl(t/.2)),fade=(1-q)**1.6;
    ctx.save();ctx.translate(b.x,b.y-9);ctx.scale(1,.63);ctx.globalCompositeOperation='lighter';
    P.bloom(0,0,72*(1-q),'#bf213b',fade*.9);P.bloom(0,0,28*(1-P.cl(t/.12)),'#fff2e9',1-P.cl(t/.12));
    // An irregular outward pressure front; no circular rings or rotating glyphs.
    for(let i=0;i<24;i++){
      const a=i*Math.PI*2/24+(P.H(i+71)-.5)*.16,r=b.R*(.48+.52*P.H(i+22))*spread,tail=(20+46*P.H(i+8))*(1-q),width=(3+8*P.H(i+33))*(1-q);
      ctx.save();ctx.rotate(a);const g=ctx.createLinearGradient(Math.max(0,r-tail),0,r+12,0);g.addColorStop(0,'rgba(62,7,18,0)');g.addColorStop(.55,`rgba(159,23,47,${fade*.75})`);g.addColorStop(.9,`rgba(255,188,180,${fade})`);g.addColorStop(1,'rgba(255,238,227,0)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(r+12,0);ctx.quadraticCurveTo(r-tail*.4,-width,r-tail,0);ctx.quadraticCurveTo(r-tail*.5,width*.5,r+12,0);ctx.fill();ctx.restore();
    }
    for(let i=0;i<8;i++){const a=i*Math.PI/4+.13,r=b.R*.9*spread,len=34*(1-q);P.streak(Math.cos(a)*(r-len),Math.sin(a)*(r-len),Math.cos(a)*r,Math.sin(a)*r,1.2,'#ffd3c9',fade,'#fff7ed');}
    ctx.restore();
  }
  function burst(b){
    const t=G.t-b.start;if(t<0)return;
    if(b.key==='markhit'){const q=P.cl(t/b.dur);P.bloom(b.x,b.y,15*(1-q),'#e84460',.6*(1-q));for(let i=0;i<4;i++){const a=i*Math.PI/2+.4,r=6+16*(1-P.E.out3(q));P.streak(b.x+Math.cos(a)*r,b.y+Math.sin(a)*r,b.x+Math.cos(a)*(r+7),b.y+Math.sin(a)*(r+7),1.2,'#f48599',1-q,'#ffffff');}return;}
    if(b.key==='ghost'){ghostImpact(b,t);return;}
    if(b.key==='mark'){wave(b.x,b.y,t,b.R,b.col);P.rays(b.x,b.y,12,15,110*(1-t/b.dur),2.2,'#ffc3cf',1-t/b.dur,t*.2,78);return;}
    if(b.key==='dusk'){
      const q=P.cl(t/b.dur),dx=b.b.x-b.a.x,dy=b.b.y-b.a.y,length=Math.hypot(dx,dy)||1,fade=(1-q)**1.6,draw=P.E.out5(P.cl(t/.09));
      ctx.save();ctx.translate(b.a.x,b.a.y-8);ctx.rotate(Math.atan2(dy,dx));ctx.globalCompositeOperation='lighter';ctx.scale(draw,1);
      const g=ctx.createLinearGradient(0,0,length,0);g.addColorStop(0,'rgba(43,91,145,0)');g.addColorStop(.3,`rgba(63,145,228,${fade*.65})`);g.addColorStop(.75,`rgba(189,229,255,${fade})`);g.addColorStop(1,`rgba(244,253,255,${fade})`);
      ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,21);ctx.bezierCurveTo(length*.24,-36,length*.67,-49,length,-5);ctx.bezierCurveTo(length*.7,-23,length*.32,-12,0,21);ctx.fill();
      ctx.lineWidth=2.5*fade;ctx.strokeStyle=`rgba(245,254,255,${fade})`;ctx.beginPath();ctx.moveTo(0,21);ctx.bezierCurveTo(length*.24,-36,length*.67,-49,length,-5);ctx.stroke();
      ctx.restore();P.sparks(b.b.x,b.b.y-8,9,142,P.cl(t/.24),{a0:Math.atan2(dy,dx),spread:1.5,v:115,len:17,w:1.4,col:'#d7eaff',g:0});
    }
  }
  Object.assign(window.__wd,{unitSrc,drawFx,update,hit});
})();
