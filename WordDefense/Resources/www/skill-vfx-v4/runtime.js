/* Approved v4 drawing adapted to native combat. This module never applies damage or moves units. */
(() => {
  'use strict';
  const P=window.P3, SK=window.__wd.WD_SKILL, V=SK.V;
  for(const name of ['headshot','laser','fire','ice','dusk','punch','artillery','pistol','baldo','buffer','minerPassive','water'])SFX.preloadSample(name);
  const map={rapid:'ranger_skill',archer:'archer_skill',warrior:'warrior',miner:'miner_skill',artillery:'artillery_skill',mage:'mage_meteor',zone:'zone_energy_orb',buffer:'buffer'};
  const lead={rapid:.2,archer:0,sniper:.3,warrior:0,miner:.5,artillery:.1,mage:.25,zone:.35,buffer:.5,debuffer:0};
  const sprites=window.__spr=Object.create(null), errors=[], missingPoses=new Map();
  // Tint procedural light only. User PNG pixels and unit art are never recoloured.
  let inkElement=0,inkShadow=false;const tintCache=new Map();
  const hues=[0,10,216,184,52,153,29,94,43,267];
  const lightCaps=[1,.55,.54,.76,.57,.53,.43,.53,.87,.45];
  function tint(value,el){
    if(!el||typeof value!=='string')return value;
    const cacheKey=el+'|'+(inkShadow?1:0)+'|'+value;if(tintCache.has(cacheKey))return tintCache.get(cacheKey);
    let rgb,alpha=1;const hex=/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value),rgba=/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i.exec(value);
    if(hex){const h=hex[1].length===3?[...hex[1]].map(c=>c+c).join(''):hex[1];rgb=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16));}else if(rgba){rgb=rgba.slice(1,4).map(Number);alpha=rgba[4]==null?1:+rgba[4];}else return value;
    const r=rgb[0]/255,g=rgb[1]/255,b=rgb[2]/255,hi=Math.max(r,g,b),lo=Math.min(r,g,b),light=(hi+lo)/2,sat=hi===lo?0:(hi-lo)/(1-Math.abs(2*light-1));
    if(light<.055)return value;
    // Include white cores: leaving them neutral made every attribute look white/yellow.
    const L=light>.96?light:Math.min(.91,light),S=light>.96?.10:el===6?.64:.90;
    const result=inkShadow?`hsla(267,44%,${Math.max(5,Math.min(24,light*19+5))}%,${alpha})`:`hsla(${hues[el]??0},${S*100}%,${L*100}%,${alpha})`;if(tintCache.size<5000)tintCache.set(cacheKey,result);return result;
  }
  for(const property of ['fillStyle','strokeStyle','shadowColor']){
    const descriptor=Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype,property);
    Object.defineProperty(ctx,property,{configurable:true,get(){return descriptor.get.call(this);},set(value){descriptor.set.call(this,tint(value,inkElement));}});
  }
  for(const method of ['createLinearGradient','createRadialGradient']){
    const original=ctx[method].bind(ctx);ctx[method]=function(...args){const gradient=original(...args),element=inkElement,add=gradient.addColorStop.bind(gradient);gradient.addColorStop=(offset,color)=>add(offset,tint(color,element));return gradient;};
  }
  function palette(element,draw,shadow=false){const saved=inkElement,prev=inkShadow;inkElement=element||0;inkShadow=shadow;try{return draw();}finally{inkElement=saved;inkShadow=prev;}}
  const composite=Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype,'globalCompositeOperation');
  Object.defineProperty(ctx,'globalCompositeOperation',{configurable:true,get(){return composite.get.call(this);},set(value){composite.set.call(this,inkShadow&&['lighter','screen'].includes(value)?'source-over':value);}});
  const sourceDrawImage=ctx.drawImage;
  ctx.drawImage=function(...args){if(!inkShadow)return sourceDrawImage.apply(this,args);this.save();try{this.filter='brightness(0) opacity(.84)';return sourceDrawImage.apply(this,args);}finally{this.restore();}};
  const root=new URL('.',document.currentScript.src);
  const api=window.WDSkillVFX={ready:false,errors,missingPoses,chargeLead:key=>lead[key]||0,prepare,castEcho,renderElement:palette,ghostAttack,dusk,markBurst,shadowHit,rhythm,snapshot:()=>({ready:api.ready,scenes:list().map(s=>({key:s.key,t:G.t-s.start,dur:s.dur,prepared:s.prepared,shadow:!!s.shadow})),bursts:bursts().length,errors:errors.slice()})};
  api.loaded=fetch(new URL('sheets/meta.json',root)).then(r=>{if(!r.ok)throw Error('VFX meta '+r.status);return r.json();}).then(async meta=>{
    await Promise.all(Object.entries(meta).map(async([name,box])=>{const im=new Image();im.src=new URL('sheets/'+name+'.png',root);await im.decode();sprites[name]={...box,im};}));api.ready=true;
  }).catch(e=>{errors.push(String(e));console.error(e);});
  const list=()=>G?(G.skillVfxV4||(G.skillVfxV4=[])):[];
  const bursts=()=>G?(G.skillBurstsV4||(G.skillBurstsV4=[])):[];
  const copy=m=>({...m,_source:m});
  const nearby=(x,y,r)=>G.mobs.filter(m=>!m.dead&&Math.hypot(m.x-x,m.y-y)<=r);
  function target(T,key){if(key==='buffer')return T;const ms=nearby(T.x,T.y,trange(T));if(key==='archer'||key==='sniper')return ms.reduce((a,b)=>!a||b.hp>a.hp?b:a,null);return findTarget(T,trange(T));}
  function create(key,T,L,start,reference=null){
    const tg=reference?.anchor||target(T,key);if(!tg&&key!=='rapid'&&key!=='warrior')return null;
    if(key==='debuffer')return {key,source:T,T:copy(T),start,dur:.65,R:trange(T),tg:nearby(T.x,T.y,trange(T)).map(copy)};
    const name=key==='sniper'?'sniper_ult_'+(['phys','fire','water','ice','lightning'][T.el]||'phys'):map[key];
    const model=P.S[name];if(!model)return null;
    const s=Object.assign(Object.create(model),{key,source:T,T:copy(T),start,L,anchor:tg,copies:new Map()});
    const cp=m=>{if(!s.copies.has(m))s.copies.set(m,copy(m));return s.copies.get(m);};
    const CT=s.T,vs=G.mobs.filter(m=>!m.dead);s.dur=model.dur;
    if(key==='rapid')Object.assign(s,{R:V.rapid.R,ms:nearby(T.x,T.y,V.rapid.R).map(cp),f0:T.face||1,t0:.2,gap:V.rapid.gap,H:422,face:[],pose:[],shots:[]});
    if(key==='rapid'){for(let i=0;i<V.rapid.n(L);i++){s.face.push([1,-1,-1,1,-1][i%5]);s.pose.push(['bar6','bar2','bar5','bar4','bar6'][i%5]);s.shots.push(s.t0+i*s.gap);}s.dur=s.shots.at(-1)+.8;
      // bar1 is the user's dedicated crossed-pistol preparation, for the whole 0.2s.
      s.cur=function(t){let k=-1;this.shots.forEach((at,i)=>{if(t>=at)k=i;});return k;};
      s.update=function(t){model.update.call(this,t);if(t<this.t0){this.T.__spr={nm:'bar1',flip:false,H:this.H};this.T.face=1;}};
      s.top=function(t){model.top.call(this,t<this.t0?this.t0-.3+t*.3/this.t0:t);};
    }
    if(key==='archer')Object.assign(s,{B:{x:T.x-22,y:T.y-10},tgs:[cp(tg)],ts:Array.from({length:V.archer.n(L)},(_,i)=>i*V.archer.gap),tw:0,fl:tg.x<T.x});
    if(key==='sniper'){
      const M=api.sniperMuzzle(T,tg),dx=tg.x-M.x,dy=tg.y-10-M.y,d=Math.hypot(dx,dy)||1,u={x:dx/d,y:dy/d};
      Object.assign(s,{aimTarget:tg,M,u,L:V.sniper.len,tc:.15,tf:V.sniper.aim+.3,tg:vs.filter(m=>{const x=m.x-T.x,y=m.y-T.y,al=x*u.x+y*u.y;return al>=0&&al<=V.sniper.len&&Math.abs(x*u.y-y*u.x)<=V.sniper.w/2+(m.r||12);}).map(cp)});
    }
    if(key==='sniper'&&reference&&T._skillRay&&T._skillRay.time>=reference.start){const ray=T._skillRay;Object.assign(s,{u:{x:ray.ux,y:ray.uy},M:{x:ray.x,y:ray.y},aimLocked:true});}
    if(key==='warrior'){
      const a=SK.baldoAim(T,L);if(!a)return null;CT.face=a.face;
      Object.assign(s,{O:{...a.O},R:a.R,ky:a.ky,ts:1.08,sw:.084,HS:0,tsp:1.204,A0:(a.face<0?Math.PI:0)-Math.PI,SP:Math.PI*2,tg:a.ms.map(cp),VR:a.R,VA0:-Math.PI,VSP:Math.PI*2});
      s.th=s.tg.map(m=>{const angle=Math.atan2((m.y-s.O.y)/s.ky,(m.x-s.O.x)*(a.face<0?-1:1)),fr=P.cl((angle-s.VA0)/s.VSP);return s.ts+s.sw*(1-Math.sqrt(1-fr));});s.thw=s.th.slice();
    }
    if(key==='miner'){
      Object.assign(s,{m:cp(tg),R:V.miner.R*V.rangeMul(L),vs:nearby(tg.x,tg.y,V.miner.R*V.rangeMul(L)).map(cp),ti:.5,HG:175,F:{x:tg.x,y:tg.y+3},cr:[]});
      for(let i=0;i<8;i++){const a=i*.785+(P.H(i)-.5)*.5,length=(38+20*P.H(i+3))*(.8/.45),pts=[[0,0]];let x=0,y=0;for(let k=1;k<=4;k++){const aa=a+(P.H(i*9+k)-.5)*.7;x+=Math.cos(aa)*length/4;y+=Math.sin(aa)*length/4*.42;pts.push([x,y]);}s.cr.push({pts,w:(2.2+P.H(i+7))*(.8/.45)});}
    }
    if(key==='artillery')Object.assign(s,{Bp:{x:tg.x,y:tg.y},mz:{x:T.x+30,y:T.y-10},tf:.1,tl:.1+V.artillery.fly,tb:.1+V.artillery.fly+V.artillery.delay,tfire:.08,tret:.48,HA:300,R:V.artillery.R*V.rangeMul(L),vic:nearby(tg.x,tg.y,V.artillery.R*V.rangeMul(L)).map(cp)});
    if(key==='mage')Object.assign(s,{C:{x:tg.x,y:tg.y},R:V.mage.R*V.mage.rangeMul(L),t0:.25,fall:V.mage.fall,tb:.25+V.mage.fall,S0:{x:tg.x+150,y:tg.y-420},vic:nearby(tg.x,tg.y,V.mage.R*V.mage.rangeMul(L)).map(cp)});
    if(key==='zone'){const D=V.zone.dur(L);Object.assign(s,{tg:cp(tg),o:{x:tg.x,y:tg.y},R:V.zone.R,t0:.35,D,TK:V.zone.tick,ticks:Array.from({length:Math.ceil(D/V.zone.tick)+1},(_,i)=>.35+i*V.zone.tick),vic:nearby(tg.x,tg.y,V.zone.R).map(cp),dur:.35+D+.4});}
    if(key==='buffer'){
      const al=SK.blessTargets(T).map(cp),dur=V.buffer.blessDur(L)*(1+V.buffer.psDur(SK.psLv(T)));
      Object.assign(s,{al,C:{x:T.x,y:T.y+8},tb:.5,Rm:190,dur:.5+dur});s.ti=al.map(a=>.5+.05+.45*Math.pow(Math.hypot(a.x-T.x,(a.y-T.y)/.62)/190,1.6));
    }
    return s;
  }
  function prepare(T,L){
    if(!api.ready||!G||T._dk2)return;const key=ROLES[T.role].key,pre=lead[key];if(!(pre>0)||T.skCd<=0||T.skCd>pre)return;
    if(!SK.skCanCast(T,L)){T._skillCharging=false;G.skillVfxV4=list().filter(s=>!(s.prepared&&s.source===T));return;}
    if(list().some(s=>s.prepared&&s.source===T))return;const s=create(key,T,L,G.t-(pre-T.skCd));if(s){s.prepared=true;T._skillCharging=true;T.pend=null;list().push(s);}
  }
  for(const key of Object.keys(lead)){
    const original=SK.CAST[key];if(!original)continue;
    SK.CAST[key]=function(T,L){
      if(!api.ready)return original(T,L);
      const previous=list().find(s=>s.prepared&&s.source===T),start=previous?previous.start:G.t-(lead[key]||0),s=create(key,T,L,start);
      if(s){if(previous?.soundFired)s.soundFired=new Set(previous.soundFired);G.skillVfxV4=list().filter(q=>q!==previous);list().push(s);}
      const result=original(T,L);if(result&&s){s.actorDur=Math.max(0,G.t-s.start)+(T.skPause||.3);soundStart(s);if(['miner','artillery','mage'].includes(key))s.quakeAt=key==='miner'?s.ti:s.tb;}else if(s)G.skillVfxV4=list().filter(q=>q!==s&&q.original!==s);return result;
    };
  }
  P.sprPt=(T,px,py)=>{const o=T.__spr,s=sprites[o.nm],height=o.H||(s.b-s.t),cx=o.cx??s.w/2,k=UNIT_H/height*(o.sc||1),f=o.flip?-1:1;return{x:T.x+f*(px-cx)*k,y:T.y+FOOT_DY+(py-s.b)*k,f,k};};
  const motionFiles=['01-physical','02-fire','03-water','06-ice','04-lightning','08-wind','09-earth','05-poison','07-light','10-dark'];
  const motionImages=new Map();let motionMeta={};
  api.motionLoaded=fetch(new URL('motions/meta.json',root)).then(r=>{if(!r.ok)throw Error('Motion metadata '+r.status);return r.json();}).then(m=>motionMeta=m).catch(e=>errors.push(String(e)));
  function motionPath(T,barrage=false){if(T.len!==5&&T.len!==6)return null;const el=motionFiles[T.el];return barrage&&T.len===6?'barrage/barrage-'+el+'.png':'tiers/tier-'+T.len+'/tier-'+T.len+'-'+el+'.png';}
  async function loadMotion(T){await api.motionLoaded;const paths=[motionPath(T),...(T.len===6&&ROLES[T.role]?.key==='rapid'?[motionPath(T,true)]:[])].filter(Boolean);await Promise.all(paths.map(path=>{if(motionImages.has(path))return motionImages.get(path).loading;const im=new Image(),entry={im,ready:false};entry.loading=new Promise((resolve,reject)=>{im.onload=()=>{entry.ready=true;resolve();};im.onerror=()=>{errors.push('Missing motion '+path);reject(Error(path));};});motionImages.set(path,entry);im.src=new URL('motions/'+path,root);return entry.loading;}));}
  api.loadMotion=loadMotion;
  function motionSource(T){
    const pose=T._skillPose;if(!pose)return null;
    const bar=/^bar([1-6])$/.exec(pose.nm),tier=/^t5_(\d+)$/.exec(pose.nm),path=motionPath(T,!!bar);
    const entry=path&&motionImages.get(path),metadata=path&&motionMeta[path];if(!entry?.ready||!metadata)return null;
    if(bar&&T.len!==6)return null;
    const number=bar?+bar[1]:tier?+tier[1]:0;if(!number)return null;
    const f=metadata.frames[number-1];if(!f)return null;
    const crop=f.crop||{x:f.x,y:f.y,w:f.w,h:f.h},bounds=f.crop?[0,0,crop.w,crop.h]:f.bounds;
    const [l,t,r,b]=bounds,reference=sprites[pose.nm],refH=reference?(reference.b-reference.t):b-t;
    const height=UNIT_H*refH/(pose.H||refH)*(pose.sc||1),scale=height/Math.max(1,b-t);
    let im=entry.im,sx=crop.x,sy=crop.y;
    // Atlas bytes stay intact. Four overlapping source rectangles need a display mask.
    if(f.excludeSpans?.length){
      const cache=entry.frameCanvases||(entry.frameCanvases=new Map());
      if(!cache.has(number)){
        const c=document.createElement('canvas');c.width=crop.w;c.height=crop.h;const g=c.getContext('2d');
        g.drawImage(entry.im,crop.x,crop.y,crop.w,crop.h,0,0,crop.w,crop.h);
        for(const span of f.excludeSpans)g.clearRect(...span);
        cache.set(number,c);
      }
      im=cache.get(number);sx=sy=0;
    }
    return {img:im,sx,sy,sw:crop.w,sh:crop.h,dw:crop.w,dh:crop.h,box:null,flip:!!pose.flip,fb:{cx:(l+r)/2,foot:b},v2:{k:scale,mx:1,my:1,rot:0,dx:0,dy:0},ownFrame:pose.nm,ownKey:path+'#'+number};
  }
  const originalSrc=unitSrc;
  // Reference cuts define timing/geometry only. Draw the unit's own i/a/w bytes and anchors.
  unitSrc=function(T){
    const dedicated=motionSource(T);if(dedicated)return dedicated;
    const frame=T?._skillFrame,A=frame&&anim3(T),M=A?.v2&&A.M;
    if(!M)return originalSrc(T);
    const key=M.p[frame]&&A.im[frame]?frame:(M.p.a&&A.im.a?'a':'i'),p=M.p[key],im=A.im[key];
    return {img:im,sx:0,sw:im.width,sh:im.height,dw:p[2],dh:p[3],box:null,flip:T.face<0,fb:{cx:M.ax-p[0],foot:p[3]},v2:{k:UNIT_H/M.p.i[3],mx:1,my:1,rot:0,dx:0,dy:0},ownFrame:key,ownKey:u2Id(T)+'_'+key};
  };
  api.applyOwnPose=function(T,motion){
    const pose=T.__spr,name=pose?.nm;T._skillPose=pose?{...pose}:null;
    T._skillFrame=name?(['r6i','bar1','t5_15'].includes(name)?'i':name==='t5_6'?'w':'a'):null;
    if(motion?.key==='miner'&&name==='t5_14'&&motion.t<motion.impact){T._skillFrame='w';if(T._skillPose)T._skillPose.nm='t5_6';}
    T.__spr=null;
  };
  function pose(s){const t=G.t-s.start;Object.assign(s.T,s.source);for(const [original,c]of s.copies||[])Object.assign(c,original);if(s.key==='sniper'&&!s.aimLocked){s.M=api.sniperMuzzle(s.source,s.aimTarget);const dx=s.aimTarget.x-s.M.x,dy=s.aimTarget.y-10-s.M.y,d=Math.hypot(dx,dy)||1;s.u={x:dx/d,y:dy/d};const ray=s.source._skillRay;if(ray&&ray.time>=s.start){s.u={x:ray.ux,y:ray.uy};s.M={x:ray.x,y:ray.y};s.aimLocked=true;}else if(t>=s.tf)s.aimLocked=true;}P.t=t;s.update?.(t);
    if(s.key==='sniper')s.T.face=s.u.x<0?-1:1;
    api.applyOwnPose(s.T,{key:s.key,t,impact:s.ti});

    soundFrame(s,t);if(s.quakeAt!=null&&!s.quaked&&t>=s.quakeAt){s.quaked=true;G.shake7={t0:nowMs(),a:1.6};}return s.T;}
  const muzzlePoints=new WeakMap();
  api.sniperMuzzle=function(T,target){
    const source=unitSrc({...T,_skillPose:null,_skillFrame:'a'}),im=source?.img;
    const face=target&&target.x<T.x?-1:1;
    if(!im?.width||!source?.v2)return{x:T.x+face*30,y:T.y-40};
    let point=muzzlePoints.get(im);
    if(!point){
      try{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);const a=g.getImageData(0,0,c.width,c.height).data;let right=0,ys=[];
        for(let x=c.width-1;x>c.width*.55;x--){const rows=[];for(let y=Math.floor(c.height*.18);y<c.height*.66;y++)if(a[(y*c.width+x)*4+3]>180)rows.push(y);if(rows.length>=2){right=x;ys=rows;break;}}
        point={x:right||c.width*.97,y:ys.length?ys.reduce((a,b)=>a+b,0)/ys.length:c.height*.42};muzzlePoints.set(im,point);
      }catch(_){point={x:im.width*.97,y:im.height*.42};}
    }
    return{x:T.x+face*(point.x-source.fb.cx)*source.v2.k,y:T.y+FOOT_DY+(point.y-source.fb.foot)*source.v2.k};
  };
  const originalTower=drawTower;
  drawTower=function(T,x,y,sc,ghost,noTag){
    if((T.len===5||T.len===6)&&!motionImages.has(motionPath(T)))loadMotion(T).catch(()=>{});
    if(!api.ready)return originalTower(T,x,y,sc,ghost,noTag);
    if(ghost){if(list().some(s=>s.shadow&&s.source===T&&G.t<(s.actorUntil??s.start+.5)))return;return originalTower(T,x,y,sc,ghost,noTag);}
    for(const s of list())if(s.source===T&&!s.prepared&&T.pend)s.actorDone=true;
    const active=list().filter(s=>!s.shadow&&!s.actorDone&&s.source===T&&s.key!=='debuffer'&&G.t-s.start<(s.actorDur??s.dur)).at(-1);
    const shadow=list().filter(s=>s.shadow&&s.source===T&&G.t>=s.start&&G.t<(s.actorUntil??s.start+.5)&&G.t-s.start<s.dur).at(-1);
    if(shadow){wdSilOn(.45);try{const visual=pose(shadow);originalTower(visual,x+visual.x-T.x+18,y+visual.y-T.y-7,sc,true,true);}finally{wdSilOff();}}

    if(active){const visual=pose(active);return originalTower(visual,x+visual.x-T.x,y+visual.y-T.y,sc,ghost,noTag);}
    const slash=bursts().filter(b=>['dusk','duskSingle','rhythm'].includes(b.key)&&b.T===T&&G.t-b.start>=0&&G.t-b.start<.3).at(-1);
    if(slash){const visual={...T,__spr:null,_skillFrame:'a'};P.atk(visual,G.t-slash.start,0,.42);return originalTower(visual,x,y,sc,ghost,noTag);}
    return originalTower(T,x,y,sc,ghost,noTag);
  };
  function draw(layer){
    if(!api.ready||!G)return;
    for(const s of list()){
      const t=G.t-s.start;if(t<0||t>=s.dur||!G.towers.includes(s.source))continue;
      ctx.save();try{if(s.shadow){ctx.translate(18,-7);ctx.globalAlpha=.45;}const el=['buffer','debuffer','merchant'].includes(s.key)?0:s.source.el;palette(el,()=>{if(s.key==='debuffer'){if(layer==='top')markCast(s,t);}else{pose(s);if(s.key==='buffer')magicShield(s,t,layer);else if(s.key==='mage'&&s.source.el===3&&t>=s.tb&&window.WDElementFX)WDElementFX.drawIceImpact(s.C.x,s.C.y,s.R,t-s.tb,layer);else if(s.key==='artillery'&&t>=s.tb)energyExplosion(s,t,layer);else { if(s.key==='zone')s.vic=nearby(s.o.x,s.o.y,s.R).map(m=>({...m,_source:m})); s[layer]?.(t); }}},!!s.shadow);}catch(e){if(errors.length<20)errors.push(s.key+': '+e.message);console.error(e);}finally{ctx.restore();}
    }
    if(layer==='top'){for(const b of bursts()){ctx.save();try{palette(['dusk','duskSingle'].includes(b.key)?b.el:0,()=>burst(b));}finally{ctx.restore();}}for(const m of G.mobs){if(m.nakinT>0&&!m.dead)brand(m);if(m.fearT>0&&!m.dead)fearMark(m);}}
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  }
  const originalGround=drawGround10;drawGround10=function(){originalGround();draw('ground');};
  const originalFx=drawFx;drawFx=function(ui){originalFx(ui);if(!ui)draw('top');};
  const originalProj=drawProj6;drawProj6=function(p){if(api.ready&&p.T?._sk&&ROLES[p.T.role].key==='archer')return;return originalProj(p);};
  const originalAddFx=addFx;addFx=function(f){if(f?.k==='shadow'&&f.T&&G)G.fx=G.fx.filter(q=>q.k!=='shadow'||q.T!==f.T);return originalAddFx(f);};
  const originalUpdate=update;update=function(dt){originalUpdate(dt);if(!G)return;G.skillVfxV4=list().filter(s=>!G.over&&G.t-s.start<s.dur&&G.towers.includes(s.source));G.skillBurstsV4=bursts().filter(b=>!G.over&&G.t-b.start<b.dur);};
  function ghostAttack(D,el,R){if(!api.ready)return false;bursts().push({key:'ghost',el,x:D.x,y:D.y,R,start:G.t,dur:1,col:el===4?'#8ad9ff':'#a93143'});for(const m of nearby(D.x,D.y,R))m._ghostVisualAt=G.t;return true;}
  const originalGhost=dbBurst10;dbBurst10=function(D,el,R){if(ghostAttack(D,el,R)){SFX.approved('ghostWave',.7);return;}return originalGhost(D,el,R);};
  const originalDbHit=dbHitFx;dbHitFx=function(m,el){if(api.ready&&m._ghostVisualAt===G.t)return;return originalDbHit(m,el);};
  const originalHit=hit;hit=function(T,m,base){const stored=m?.nakinPool||0,result=originalHit(T,m,base);if(api.ready&&m?.nakinT>0&&(m.nakinPool||0)>stored)bursts().push({key:'markhit',el:m._markElement||0,x:m.x,y:m.y-12,start:G.t,dur:.18});return result;};
  function castEcho(T,event){
    if(event.copy&&event.key!=='rapid'&&list().some(s=>!s.shadow&&s.source===T&&s.key===event.key)){event.visual=true;shadowHit(T,event);}
  }
  function shadowHit(T,event){
    if(!api.ready)return;
    const key=event.key==='rapid-shot'?'rapid':event.key,original=list().filter(s=>!s.shadow&&s.source===T&&s.key===key).at(-1);
    if(original){const delay=event.delay??window.WDSkillElements.delay(T);
      if(event.key==='rapid-shot'){const existing=list().find(s=>s.shadow&&s.original===original&&s.key==='rapid');if(existing){existing.shots.push(G.t+delay-existing.start);existing.face.push(original.face[event.L%original.face.length]);existing.pose.push(original.pose[event.L%original.pose.length]);existing.dur=existing.shots.at(-1)+.8;existing.actorUntil=G.t+delay+.3;return;}}
      const s=create(key,T,event.L||original.L,original.start+delay,original);if(s){s.shadow=true;s.original=original;s.actorUntil=G.t+delay+(key==='warrior'?.42:.3);if(event.key==='rapid-shot'){s.start=G.t-.2+delay;s.shots=[.2];s.face=[original.face[event.L%original.face.length]];s.pose=[original.pose[event.L%original.pose.length]];s.dur=1.15;}list().push(s);}return;}
    const last=bursts().filter(b=>b.key==='dusk'&&G.t-b.start<.08).at(-1);
    if(last)bursts().push({...last,start:G.t+.08,col:'#29183e',el:9});
    addFx({k:'shadow',T,ox:18,oy:-7,aD:.3,life:.46});
  }
  function dusk(a,b,col,el=0,T=null){if(!api.ready)return false;SFX.approved('duskSlash',.55);bursts().push({key:'dusk',a,b,col,el,T,start:G.t,dur:.36});return true;}
  api.previewDuskSingle=(T,target)=>{if(!api.ready||!target)return false;SFX.approved('duskSlash',.55);bursts().push({key:'duskSingle',T,target,x:target.x,y:target.y,el:T.el,start:G.t,dur:.34,cutAnchors:[]});return true;};
  function rhythm(T){if(api.ready)bursts().push({key:'rhythm',T,start:G.t,dur:.35});}
  api.buffAura=(B,targets)=>{
    for(const a of targets)bursts().push({key:'buffAura',x:a.x,y:a.y,start:G.t,dur:.42});
    if(B.side==='me')SFX.approved('bufferAura',.18);
  };
  function magicShield(s,t,layer){
    for(let i=0;i<s.al.length;i++){
      const a=s.al[i],age=t-s.tb-.025*i;if(age<0)continue;
      const enter=P.E.out3(P.cl(age/.16)),leave=P.cl((s.dur-t)/.3),hold=(.84+.05*Math.sin(age*2.2))*leave,x=a.x,y=a.y-25,rx=40*enter,ry=40*enter;
      if(rx<1)continue;
      ctx.save();
      if(layer==='ground'){P.bloom(x,a.y+9,9,'#53bfff',.13*hold);ctx.restore();continue;}
      const fill=ctx.createLinearGradient(x-rx,y-ry,x+rx,y+ry);fill.addColorStop(0,`rgba(166,237,255,${.1*hold})`);fill.addColorStop(.45,`rgba(40,148,223,${.025*hold})`);fill.addColorStop(1,`rgba(24,111,213,${.13*hold})`);
      ctx.fillStyle=fill;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();
      const edge=ctx.createLinearGradient(x,y-ry,x,y+ry);edge.addColorStop(0,`rgba(220,252,255,${.9*hold})`);edge.addColorStop(.45,`rgba(103,215,255,${.64*hold})`);edge.addColorStop(1,`rgba(49,143,228,${.23*hold})`);
      ctx.strokeStyle=edge;ctx.lineWidth=2.4;ctx.stroke();ctx.lineWidth=.6;ctx.strokeStyle=`rgba(187,242,255,${.24*hold})`;ctx.beginPath();ctx.ellipse(x,y,Math.max(.1,rx-3),Math.max(.1,ry-3),0,-2.8,-.15);ctx.stroke();
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
    const x=m.x,y=m.y-14,pulse=.65+.2*Math.sin(G.t*5),r=10;
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
    if(b.key==='buffAura'){
      const q=P.cl(t/.42),fade=(1-q)**1.5;
      for(let i=0;i<3;i++){const x=b.x+(i-1)*9,y=b.y-5-q*27-i*3;P.streak(x,y+9,x,y,1.4,'#72d9ff',fade,'#eefcff');}
      P.bloom(b.x,b.y-12-q*13,9,'#9de5ff',fade*.26);return;
    }
    if(b.key==='markhit'){const q=P.cl(t/b.dur);P.bloom(b.x,b.y,15*(1-q),'#e84460',.6*(1-q));for(let i=0;i<4;i++){const a=i*Math.PI/2+.4,r=6+16*(1-P.E.out3(q));P.streak(b.x+Math.cos(a)*r,b.y+Math.sin(a)*r,b.x+Math.cos(a)*(r+7),b.y+Math.sin(a)*(r+7),1.2,'#f48599',1-q,'#ffffff');}return;}
    if(b.key==='ghost'){spectralWave(b,t);return;}
    if(b.key==='mark'){markFinish(b,t);return;}
    if(b.key==='dusk'){
      const dx=b.b.x-b.a.x,dy=b.b.y-b.a.y,L=Math.hypot(dx,dy)||1,angle=Math.atan2(dy,dx)+(Math.abs(dy)>Math.abs(dx)?.12:0);
      const reach=P.E.out3(P.cl(t/.085)),fade=1-P.cl((t-.10)/.22);
      ctx.save();ctx.translate((b.a.x+b.b.x)/2,(b.a.y+b.b.y)/2-12);ctx.rotate(angle);ctx.globalAlpha=fade;
      zipBlade(-L*.5*reach,0,L*.5*reach,0,10,'#85efff','#fcffff');zipBlade(-L*.43*reach,5,L*.43*reach,5,2,'#85efff','#fcffff');ctx.restore();
    }
    if(b.key==='duskSingle'){
      for(let i=0;i<5;i++){const u=t-i*.045;if(u<0||u>.12)continue;const anchor=b.cutAnchors[i]||(b.cutAnchors[i]={x:b.target.x,y:b.target.y});const q=P.E.out3(P.cl(u/.035));ctx.save();ctx.translate(anchor.x,anchor.y-16);ctx.rotate([-.7,.65,-.2,1.1,-.85][i]);ctx.globalAlpha=1-P.cl(u/.12);zipBlade(-23*q,0,23*q,0,4.2,'#85efff','#fcffff');ctx.restore();}
    }
  }

  // Adapted from user ZIP skill-fx.js: fear variant 2, with all crow shapes removed.
  const ghostPalettes=[['#c8c1b6','#fff8ec'],['#f48b4b','#fff0d2'],['#54b4e7','#d9f7ff'],['#94ddf0','#f0fdff'],['#f1ce55','#fff6ba'],['#7bcba5','#e1ffef'],['#c69a62','#fff0cd'],['#ab77d8','#f5dfff'],['#efd691','#fff9df'],['#8f6ac0','#e5d3ff']];
  function zipShape(points,color){ctx.beginPath();ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);ctx.closePath();ctx.fillStyle=color;ctx.fill();}
  // User ZIP slash-01/백섬 silhouette, scaled to native geometry.
  function zipBlade(x0,y0,x1,y1,width,accent,tip){const angle=Math.atan2(y1-y0,x1-x0),len=Math.hypot(x1-x0,y1-y0);if(len<.01)return;ctx.save();ctx.translate(x0,y0);ctx.rotate(angle);zipShape([[0,0],[len*.24,-width*.53],[len*.77,-width*.25],[len,0],[len*.38,width*.68]],accent);zipShape([[len*.06,0],[len*.42,-width*.21],[len*.98,0],[len*.34,width*.23]],tip);ctx.restore();}
  function spectralWave(b,t){
    if(t<0||t>=1)return;const u=t,r=b.R*P.E.out3(P.cl(u/.64)),p=ghostPalettes[b.el]||ghostPalettes[0];
    ctx.save();ctx.translate(b.x,b.y-8);ctx.globalAlpha=1-P.cl((u-.34)/.66);ctx.strokeStyle=p[0];ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(0,0,Math.max(.01,r),Math.max(.01,r*.58),0,u,u+4.3);ctx.stroke();ctx.restore();
  }
  // The ZIP's overhead fear mark follows only enemies with active native Fear.
  function fearMark(m){
    const p=ghostPalettes[m.fearEl]||ghostPalettes[0],age=Math.max(0,G.t-(m.fearBorn||0)),sp=SPR.mobs[m.vis||m.type];
    const scale=.72*P.E.out3(P.cl(age/.1)),fade=Math.min(1,m.fearT/.18);
    ctx.save();ctx.translate(m.x,m.y-(sp?.h||42)-15-Math.sin(age*5)*1.8);ctx.scale(scale,scale);ctx.globalAlpha=fade;
    for(const v of [-1,1])zipShape([[v*3,-5],[v*12,-10],[v*10,-2],[v*4,1]],p[1]);zipShape([[-3,3],[0,7],[3,3]],p[0]);ctx.restore();
  }
  // Mark uses narrow red seals and a local finishing slash, never the ghost wave.
  function markCast(s,t){
    const q=P.cl(t/.22);if(t<0||t>.36)return;
    for(const m of s.tg||[]){const target=m._source||m;if(target.dead)continue;
      const tx=target.x,ty=target.y-14,x=s.T.x+(tx-s.T.x)*q,y=s.T.y-12+(ty-s.T.y+12)*q;
      const fade=t<=.22?1:1-(t-.22)/.14;
      ctx.save();ctx.translate(x,y);ctx.globalAlpha=fade;ctx.strokeStyle='#2c1027';ctx.lineWidth=5;
      ctx.beginPath();ctx.moveTo(-7,-8);ctx.lineTo(2,0);ctx.lineTo(-6,8);ctx.moveTo(7,-8);ctx.lineTo(-2,0);ctx.lineTo(6,8);ctx.stroke();ctx.strokeStyle='#d95778';ctx.lineWidth=1.7;ctx.stroke();ctx.restore();
      if(q<1)P.streak(x-(tx-s.T.x)*.09,y-(ty-s.T.y)*.09,x,y,1.4,'#9e3359',.65,'#f3b7c8');
    }
  }
  function markFinish(b,t){
    const q=P.cl(t/.36);if(t<0||q>=1)return;const fade=(1-q)**1.3,reach=P.E.out5(P.cl(t/.065));
    ctx.save();ctx.translate(b.x,b.y);ctx.rotate(-.7);ctx.scale(reach,1);
    ctx.strokeStyle='#251225';ctx.lineWidth=9*fade+1;ctx.beginPath();ctx.moveTo(-44,10);ctx.quadraticCurveTo(-2,-12,48,-8);ctx.stroke();
    ctx.strokeStyle='#d35179';ctx.lineWidth=4*fade+.4;ctx.stroke();ctx.strokeStyle='#ffe5eb';ctx.lineWidth=1.4*fade;ctx.stroke();ctx.restore();
    for(let i=0;i<4;i++){const a=-.7+(i-1.5)*.45,r=8+24*q;P.streak(b.x+Math.cos(a)*r,b.y+Math.sin(a)*r,b.x+Math.cos(a)*(r+9),b.y+Math.sin(a)*(r+9),1.2,'#e98ca7',fade,'#ffe3ed');}
  }

  // New review effects requested after the archived v4 specification. Native damage/radius is untouched.
  function darkBurst(x,y,t,R,kind){
    const duration=kind==='finish'?.56:.48,q=P.cl(t/duration);if(t<0||q>=1)return;
    const travel=P.E.out5(P.cl(t/.24)),fade=(1-q)**1.65;
    ctx.save();ctx.translate(x,y-7);ctx.scale(1,.62);
    // Dark translucent volume first; a narrow wine-red front reads as pressure, not a painted disc.
    const radius=R*travel,g=ctx.createRadialGradient(0,0,Math.max(.1,radius*.48),0,0,Math.max(1,radius));
    g.addColorStop(0,'rgba(8,3,15,0)');g.addColorStop(.72,`rgba(15,5,24,${.40*fade})`);g.addColorStop(.90,`rgba(38,8,29,${.62*fade})`);g.addColorStop(.98,`rgba(124,22,48,${.5*fade})`);g.addColorStop(1,'rgba(24,3,18,0)');ctx.fillStyle=g;ctx.beginPath();
    for(let i=0;i<=96;i++){const a=i/96*Math.PI*2,rr=radius*(.965+.035*Math.sin(i*1.73));const px=Math.cos(a)*rr,py=Math.sin(a)*rr;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fill();
    for(let i=0;i<28;i++){const a=i/28*Math.PI*2+P.H(i+41)*.17,r=R*(.7+.3*P.H(i+9))*travel,len=(12+R*.16*P.H(i+2))*(1-q);ctx.save();ctx.rotate(a);const f=ctx.createLinearGradient(r-len,0,r+4,0);f.addColorStop(0,'rgba(8,2,14,0)');f.addColorStop(.65,`rgba(59,8,37,${fade*.6})`);f.addColorStop(.96,`rgba(171,44,69,${fade*.5})`);f.addColorStop(1,'rgba(245,166,170,0)');ctx.fillStyle=f;ctx.beginPath();ctx.moveTo(r+4,0);ctx.quadraticCurveTo(r-len*.5,-2.2,r-len,0);ctx.quadraticCurveTo(r-len*.4,3,r+4,0);ctx.fill();ctx.restore();}
    if(kind==='finish'&&t<.12){const f=1-t/.12;P.bloom(0,0,28*f,'#dc5e70',f*.65);P.streak(-R*.3,0,R*.3,0,1.5,'#ffe5df',f,'#ffe5df');}
    ctx.restore();
  }
  function energyExplosion(s,t,layer){
    const u=t-s.tb,D=1.08,q=P.cl(u/D),R=s.R,x=s.Bp.x,y=s.Bp.y;if(u<0||q>=1)return;
    const open=P.E.out5(P.cl(u/.16)),hot=1-P.cl((u-.09)/.46);
    if(layer==='ground'){
      const radius=R*P.E.out5(P.cl(u/.25)),fade=1-P.cl(u/.52);
      P.bloom(x,y,R*.94,'#129eea',.5*hot);
      P.ringGlow(x,y,radius,.62,7*fade+.7,'#51dfff',fade);
      if(u>.055){const f=1-P.cl((u-.055)/.42);P.ringGlow(x,y,R*.84*P.E.out5(P.cl((u-.055)/.28)),.62,3.2*f+.4,'#d8fcff',f*.9);}
      return;
    }
    ctx.save();ctx.globalCompositeOperation='screen';
    // A visible expanding energy mass, followed by an upward detonation plume.
    const cy=y-12-R*.22*P.E.out3(P.cl(u/.35)),radius=R*(.16+.48*open),volume=hot*(.78+.22*Math.sin(P.cl(u/.18)*Math.PI));
    if(volume>0){
      const g=ctx.createRadialGradient(x,cy,0,x,cy,radius);
      g.addColorStop(0,`rgba(255,255,255,${volume})`);g.addColorStop(.22,`rgba(223,253,255,${volume})`);g.addColorStop(.48,`rgba(92,229,255,${.95*volume})`);g.addColorStop(.72,`rgba(11,155,248,${.65*volume})`);g.addColorStop(1,'rgba(0,104,232,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,cy,radius,0,Math.PI*2);ctx.fill();
      for(let i=0;i<7;i++){
        const a=i/7*Math.PI*2+P.H(i+43)*.3,reach=R*(.24+.16*P.H(i+74))*open,bx=x+Math.cos(a)*reach,by=cy+Math.sin(a)*reach*.68-u*R*.18,br=R*(.15+.09*P.H(i+92))*hot;
        if(br<.1)continue;const l=ctx.createRadialGradient(bx,by,0,bx,by,br);l.addColorStop(0,`rgba(234,254,255,${volume*.8})`);l.addColorStop(.4,`rgba(65,214,255,${volume*.72})`);l.addColorStop(1,'rgba(0,99,226,0)');ctx.fillStyle=l;ctx.beginPath();ctx.arc(bx,by,br,0,Math.PI*2);ctx.fill();
      }
    }
    const flash=1-P.cl(u/.14);if(flash>0){P.bloom(x,cy,R*.44,'#ffffff',flash);P.streak(x-R*.7,cy,x+R*.7,cy,3*flash,'#e8fdff',flash,'#ffffff');}
    for(let i=0;i<24;i++){
      const a=i/24*Math.PI*2+P.H(i+22)*.12,rr=R*(.62+.38*P.H(i+7))*P.E.out5(P.cl(u/.27)),len=(R*.13+R*.23*P.H(i+14))*(1-q),fade=(1-q)**2;
      P.streak(x+Math.cos(a)*(rr-len),y-10+Math.sin(a)*(rr-len)*.62,x+Math.cos(a)*rr,y-10+Math.sin(a)*rr*.62,1.2+3.2*hot,'#32d9ff',fade,'#edfdff');
    }
    for(let i=0;i<10;i++){
      const age=u-.025*i;if(age<0||age>.65)continue;const f=1-age/.65,a=P.H(i+111)*Math.PI*2,r=R*(.15+.65*P.H(i+112))*P.E.out3(P.cl(age/.3)),px=x+Math.cos(a)*r,py=y-12+Math.sin(a)*r*.62-age*36;
      P.bloom(px,py,3+5*f,'#8cedff',f*.7);P.streak(px,py+5,px-2,py-7,1,'#d5fcff',f,'#ffffff');
    }
    ctx.restore();
    for(let i=0;i<6;i++){const age=u-.12-i*.025;if(age<0)continue;const f=P.cl(age/.8),a=i/6*Math.PI*2,rr=R*.3*P.E.out3(f);P.smoke(x+Math.cos(a)*rr,y-16-Math.sin(a)*rr*.3-age*49,10+f*23,.20*(1-f),'#315267');}
  }
  function cue(s,id,at,name,gain=1,...args){if(at==null||at<0)return;const t=G.t-s.start;if(t<at)return;const fired=s.soundFired||(s.soundFired=new Set());if(fired.has(id))return;fired.add(id);SFX.approved(name,gain,...args);}
  function soundStart(s){soundFrame(s,G.t-s.start);}
  function soundFrame(s,t){
    if(s.key==='debuffer'&&!s.shadow){cue(s,'wave',0,'ghostWave',.8);return;}if(s.key==='buffer'){cue(s,'shield',s.tb,'bufferShield',.65);return;}
    if(s.shadow){
      if(s.key==='rapid'){const fired=s.soundFired||(s.soundFired=new Set());for(let i=0;i<s.shots.length;i++)if(t>=s.shots[i]&&!fired.has('gun'+i)){fired.add('gun'+i);SFX.skillShot('gunR');}}
      if(s.key==='archer')for(let i=0;i<s.ts.length;i++)cue(s,'hit'+i,s.ts[i],'holyHit',.65);
      if(s.key==='sniper')cue(s,'beam',s.tf,'rail',1,s.source.el);
      if(s.key==='warrior'){cue(s,'slash',s.ts,'shaang');for(let i=0;i<s.th.length;i++)cue(s,'cut'+i,s.th[i],'cutHit2',.7);}
      if(s.key==='miner')cue(s,'slam',s.ti,'eboom');
      if(s.key==='artillery')cue(s,'explosion',s.tb,'artilleryBurst');
      if(s.key==='mage')cue(s,'impact',s.tb,'fireboom');
    }
    if(s.key==='warrior')cue(s,'click',0,'guardClick');
    if(s.key==='rapid')cue(s,'rack',0,'rackClick');
    if(s.key==='artillery'){cue(s,'launch',s.tf,'launch2',.7);cue(s,'fly',s.tf,'whistle2',.7);if(s.shadow)cue(s,'land',s.tl,'embed2');cue(s,'tension',s.tl,'tension',.65,s.tb-s.tl);}
    if(s.key==='mage')cue(s,'fall',s.t0,'roar',.9);
    if(s.key==='zone'){cue(s,'open',s.t0,'orbOpen',.7);for(let i=0;i<s.ticks.length;i++)cue(s,'tick'+i,s.ticks[i],'orbTick',.5);}
  }

  Object.assign(window.__wd,{unitSrc,drawFx,update,hit});
})();
