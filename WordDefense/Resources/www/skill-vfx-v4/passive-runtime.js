/* Approved passive renderers, attached to native procs. No rolls, damage or crowd control here. */
(() => {
  'use strict';
  const P=window.P3,api=window.WDSkillVFX,SK=window.__wd.WD_SKILL;
  const mageScenes=new WeakMap();
  const list=()=>G?(G.passiveVfxV4||(G.passiveVfxV4=[])):[];
  const cp=m=>({...m}),near=(x,y,r)=>G.mobs.filter(m=>!m.dead&&Math.hypot(m.x-x,m.y-y)<=r);
  const models={rapid:'ranger',archer:'archer',sniper:'sniper',miner:'miner_passive_death',artillery:'artillery',mage:'mage',merchant:'merchant'};
  function passive(T,key,m,options={}) {
    if(!api.ready||!G||!T||!models[key]||(!m&&!['miner','merchant'].includes(key)))return false;
    const model=P.S[models[key]],s=Object.assign(Object.create(model),{key,source:T,T:cp(T),start:G.t,dur:model.dur,targets:[]});
    const CT=s.T,point=m?cp(m):cp(T),live=near(T.x,T.y,trange(T));
    if(key==='rapid'){
      const M={x:T.x+(point.x<T.x?-27:27),y:T.y-3},dx=point.x-M.x,dy=point.y-18-M.y,d=Math.hypot(dx,dy)||1;
      const targetRefs=options.targets||[m],tg=targetRefs.map(cp);
      Object.assign(s,{M,u:{x:dx/d,y:dy/d},L:d+120,tf:.2,tg,targetRefs,hits:tg.map((_,i)=>.22+i*.02),soundAt:.2,sound:'headshotShot'});
      s.followTargets=function(t){
        this.targetRefs.forEach((live,i)=>{if(live&&this.tg[i]){this.tg[i].x=live.x;this.tg[i].y=live.y;}});
        if(!this.aimLocked&&this.tg[0]){const dx=this.tg[0].x-this.M.x,dy=this.tg[0].y-18-this.M.y,d=Math.hypot(dx,dy)||1;this.u={x:dx/d,y:dy/d};this.L=d+120;if(t>=this.tf)this.aimLocked=true;}
      };
    }
    if(key==='archer')Object.assign(s,{B:{x:T.x-22,y:T.y-10},N:point,V:cp(T._rhythmVictim||m),t1:-.2,t2:0,tc:.08,tr:.18,th:.28,soundAt:.28,sound:'holyHit'});
    if(key==='sniper'){
      const M={x:T.x+(point.x<T.x?-40:40),y:T.y-6},dx=point.x-M.x,dy=point.y-M.y,d=Math.hypot(dx,dy)||1,u={x:dx/d,y:dy/d};
      const pm=live.map(m=>({m:cp(m),al:(m.x-M.x)*u.x+(m.y-M.y)*u.y})).filter(p=>p.al>=0&&p.al<=SK.V.sniper.len&&Math.abs((p.m.x-M.x)*u.y-(p.m.y-M.y)*u.x)<=11+(p.m.r||12));
      Object.assign(s,{M,N:point,u,Lr:SK.V.sniper.len,pm,shots:[-10,-9,-8,0],tc:-.3,dur:.65,soundAt:0,sound:'bang'});
    }
    if(key==='miner')Object.assign(s,{R:trange(T)*(T.areaMult||1),vs:live.map(cp),ti:.14,actorDur:.46,HG:175,fl:point.x<T.x,soundAt:.14,sound:'minerCrush'});
    if(key==='artillery'){
      const flight=options.flight??Math.max(.35,Math.hypot(point.x-T.x,point.y-T.y)/(ROLES[T.role].speed||430));
      Object.assign(s,{Bp:{x:point.x,y:point.y},mz:{x:T.x+(point.x<T.x?-26:26),y:T.y-10},tf:.1,tl:.1+flight,tb:.1+flight+1,vic:near(point.x,point.y,SK.V.artillery.dudR).map(cp),dur:flight+2.1,soundAt:.1+flight+1,sound:'burst2'});
    }
    if(key==='mage')Object.assign(s,{tg:[point],st:[],C:{x:point.x,y:point.y-10},S0:{x:T.x-16,y:T.y-36},tc:0,tl:0,tb:options.flight??Math.max(.12,Math.hypot(point.x-T.x,point.y-T.y)/(ROLES[T.role].speed||430)),dur:1.2});
    if(key==='artillery'){
      const approvedTop=model.top,approvedGround=model.ground;
      s.top=function(t){
        if(t>=this.tb){approvedTop.call(this,t);return;}
        const f=this.T.face||1;
        if(t>=this.tf&&t<this.tf+.07){const q=(t-this.tf)/.07;P.streak(this.mz.x,this.mz.y,this.mz.x+f*16*(1-q),this.mz.y-2,3*(1-q),'#ffcd74',1-q,'#fff4d6');}
        if(t<this.tf)return;
        let x,y,spin=0;
        if(t<this.tl){const q=P.cl((t-this.tf)/(this.tl-this.tf));x=this.mz.x+(this.Bp.x-this.mz.x)*q;y=this.mz.y+(this.Bp.y-5-this.mz.y)*q-46*Math.sin(q*Math.PI);spin=q*4;}
        else {const age=t-this.tl,q=P.cl(age/(this.tb-this.tl));x=this.Bp.x+f*(-5+5*P.E.out3(q));const h=age<.22?9*Math.sin(age/.22*Math.PI):age<.40?4*Math.sin((age-.22)/.18*Math.PI):0;y=this.Bp.y-5-h;spin=age*11*Math.max(0,1-q);}
        // Preserve the approved pointed metal shell; the small bounce is motion only.
        P.S.artillery0.shell(x,y,spin,.85,t>=this.tl&&Math.sin(t*43)>.5?1:0);
        if(t>=this.tl){const pulse=.65+.35*Math.sin(t*43);P.bloom(x-6,y-4,3.5,'#ffd17c',pulse*.65);}

      };
      s.ground=function(t){if(t>=this.tb)approvedGround.call(this,t);};
    }
    if(key==='mage'){
      const originalTop=model.top;s.ground=()=>{};
      s.top=function(t){
        if(!this.impacted)return; // Native orb remains visible throughout its flight.
        const age=t-this.tb,q=P.cl(age/.30);if(age<0||q>=1)return;
        const R=Math.max(16,this.impactR||this.projectile?.splash||ROLES[this.source.role].splash||30);
        const open=P.E.out5(P.cl(age/.10)),fade=(1-q)**1.35,x=this.C.x,y=this.C.y;
        ctx.save();
        P.bloom(x,y,R*.48,'#83ccff',fade*.75);
        P.bloom(x,y,R*.18*(1-q),'#e7f7ff',fade*.9);
        // One bounded explosion ring, never a second range-sized ring or victim flashes.
        ctx.strokeStyle=`rgba(122,202,255,${fade})`;ctx.lineWidth=2.5*(1-q)+.5;
        ctx.beginPath();ctx.ellipse(x,y+6,R*.78*open,R*.78*open*.62,0,0,Math.PI*2);ctx.stroke();
        for(let i=0;i<6;i++){const a=i*Math.PI/3+.23,r=R*.68*open,L=R*.19*(1-q);P.streak(x+Math.cos(a)*(r-L),y+Math.sin(a)*(r-L)*.7,x+Math.cos(a)*r,y+Math.sin(a)*r*.7,1.8,'#a5e5ff',fade,'#e2f9ff');}
        ctx.restore();
      };
    }
    if(key==='sniper'){s.top=()=>{};s.ground=()=>{};}
    if(key==='merchant')Object.assign(s,{O:{x:T.x,y:T.y-30},gy:T.y+16,tn:-10,tp:.12,soundAt:.12,sound:'coinChime'});
    CT.face=point.x<T.x?-1:1;
    list().push(s);return true;
  }
  api.passive=passive;
  api.passiveSnapshot=()=>list().map(s=>({key:s.key,t:G.t-s.start,dur:s.dur}));
  const oldRhythm=api.rhythm;
  api.rhythm=(T,m)=>m?passive(T,'archer',m):oldRhythm(T);
  const oldFire=fireAttack;
  fireAttack=function(T,m){
    if(!T||T._sk||!G)return oldFire(T,m);
    const key=ROLES[T.role]?.key,n=G.projs.length,nf=G.fx.length,ready=key==='rapid'&&T.hsReady,counts=[T.shotN||0,T.crN||0,T.dudN||0,T.mstN||0];
    const result=oldFire(T,m);
    let shown=ready?passive(T,'rapid',m):false;
    if(key==='sniper'&&(T.shotN||0)>counts[0]&&T.shotN%4===0)shown=passive(T,key,m);
    if(key==='miner'&&(T.crN||0)>counts[1])shown=passive(T,key,m);
    if(key==='artillery'&&(T.dudN||0)>counts[2])shown=passive(T,key,m);
    if(key==='mage'&&(T.mstN||0)>counts[3])shown=passive(T,key,m);
    if(key==='archer'&&list().some(s=>s.source===T&&s.key==='archer'&&G.t-s.start<.01))shown=true;
    if(shown){for(const p of G.projs.slice(n))if(p.T===T||p.T?._skillOwner===T){
        if(key==='mage'){
          const s=list().filter(s=>s.source===T&&s.key==='mage'&&!s.projectile&&!s.impacted).at(-1);
          if(s){s.projectile=p;s.dur=Infinity;mageScenes.set(p.T,s);}
        }else p._passiveVfx4=1;
      }
      if(key==='sniper'){for(const f of G.fx.slice(nf))if(f.k==='line'){f.col='#671f35';f.el=0;}}else if(key==='miner')G.fx=G.fx.filter((f,i)=>i<nf||f.k!=='slam');
    }
    return result;
  };
  const oldHit=hit;
  hit=function(T,m,base){
    const count=T?.hsN||0,was=m&&!m.dead,result=oldHit(T,m,base);
    if(!T||T._sk||!m||!G)return result;
    const key=ROLES[T.role]?.key;

    if(key==='archer'&&was&&m.dead)T._rhythmVictim=cp(m);
    if(key==='mage'&&T._mageShot){const owner=T._skillOwner||T,s=mageScenes.get(T)||list().filter(s=>s.source===owner&&s.key==='mage'&&!s.impacted).at(-1);if(s){s.impacted=true;s.tb=G.t-s.start;s.C={x:m.x,y:m.y-10};s.impactR=s.projectile?.splash;s.dur=s.tb+.32;if(!s.sounded){s.sounded=true;SFX.approved('mageCrack',.38);}}}
    return result;
  };
  const oldPay=payInterest;
  payInterest=function(){const before=new Map((G?.towers||[]).map(T=>[T,T.dblN||0]));const r=oldPay();for(const [T,n]of before)if((T.dblN||0)>n)passive(T,'merchant');return r;};
  const oldTower=drawTower;
  drawTower=function(T,x,y,sc,ghost,noTag){
    if(ghost||(G.skillVfxV4||[]).some(s=>!s.shadow&&s.source===T&&G.t-s.start<s.dur))return oldTower(T,x,y,sc,ghost,noTag);
    for(const s of list())if(s.source===T&&T.pend)s.actorDone=true;
    const s=list().filter(s=>s.source===T&&!s.actorDone&&G.t>=s.start&&G.t-s.start<(s.actorDur??s.dur)).at(-1);
    if(!s)return oldTower(T,x,y,sc,ghost,noTag);
    const t=G.t-s.start;Object.assign(s.T,T);P.t=t;s.followTargets?.(t);s.update?.(t);
    if(s.key==='rapid'&&t>=s.tf-.05&&t<s.tf+.25)s.T.__spr={nm:'bar2',flip:s.u.x<0,H:340};
    if(s.key==='archer'&&t>=0&&t<s.th+.2)s.T.__spr={nm:'t5_12',flip:s.N.x<T.x,H:340};
    api.applyOwnPose(s.T,{key:s.key,t,impact:s.ti});
    return oldTower(s.T,x+s.T.x-T.x,y+s.T.y-T.y,sc,ghost,noTag);
  };
  function render(layer){
    if(!G||!api.ready)return;
    for(const s of list()){
      const t=G.t-s.start;if(t<0||t>=s.dur)continue;
      Object.assign(s.T,s.source);P.t=t;s.followTargets?.(t);
      ctx.save();try{s.update?.(t);if(s.sound&&!s.sounded&&t>=s.soundAt){s.sounded=true;SFX.approved(s.sound,.35);}if(['rapid','archer','miner','mage','artillery'].includes(s.key))api.renderElement(s.source.el,()=>s[layer]?.(t),!!s.shadow);else s[layer]?.(t);}catch(e){if(api.errors.length<20)api.errors.push('passive '+s.key+': '+e.message);}finally{ctx.restore();}
    }
  }
  const oldGround=drawGround10;drawGround10=function(){oldGround();render('ground');};
  const oldFx=drawFx;drawFx=function(ui){oldFx(ui);if(!ui)render('top');};
  const oldProj=drawProj6;drawProj6=function(p){if(p._passiveVfx4)return;return oldProj(p);};
  const oldUpdate=update;update=function(dt){oldUpdate(dt);if(G)G.passiveVfxV4=list().filter(s=>G.t-s.start<s.dur&&G.towers.includes(s.source)&&!(s.key==='mage'&&!s.impacted&&s.projectile&&!G.projs.includes(s.projectile)));};
  Object.assign(window.__wd,{fireAttack,hit,payInterest,drawFx,update});
})();
