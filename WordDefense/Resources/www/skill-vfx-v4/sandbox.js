/* QA-only native combat viewer. No account writes, inventory changes, or production rewards. */
(() => {
  'use strict';
  if (!window.__wdQA) return;
  const style=document.createElement('style');style.textContent=`
    #wdl .hr-qa-combat{flex:none;margin:0 6% 8px;padding:8px;border:2px solid #10213a;border-radius:8px;background:#244d76;color:white;font:inherit;font-size:13px;cursor:pointer}
    #wd-skill-sandbox{position:fixed;z-index:9000;top:max(env(safe-area-inset-top),6px);left:50%;transform:translateX(-50%);width:min(94vw,560px);box-sizing:border-box;padding:8px 10px;background:#13263bee;border:2px solid #71b7e7;border-radius:10px;color:white;font:13px sans-serif;text-align:center}
    #wd-skill-sandbox strong{display:block;margin-bottom:6px}#wd-skill-sandbox select,#wd-skill-sandbox button{font:inherit;color:#fff;background:#28547d;border:1px solid #8ab8dd;border-radius:5px;padding:5px;margin:2px;max-width:40%}
  `;document.head.append(style);
  document.addEventListener('click',e=>{if(e.target.closest('[data-skill-sandbox]')){const u=new URL(location.href);u.searchParams.set('wdqa','7k2m');u.searchParams.set('wdcombat','1');navigateQA(u);}});
  function navigateQA(u){
    try{if(parent!==window&&parent.location.origin===location.origin){const outer=new URL(u.href);outer.searchParams.delete('wdframe');parent.history.replaceState(null,'',outer.href);}}catch(e){}
    location.replace(u.href);
  }
  document.addEventListener('click',e=>{const b=e.target.closest('[data-resident-test]');if(!b)return;e.preventDefault();window.WDOM?.startEncounter(b.dataset.residentTest==='again');});
  const query=new URLSearchParams(location.search);
  if(query.has('wdresident')){
    const again=query.get('wdresident')==='again',u=new URL(location.href);u.searchParams.delete('wdcombat');u.searchParams.delete('wdresident');history.replaceState(null,'',u.href);
    const wait=setInterval(()=>{if(!window.__wdLoaded||!window.WDOM||!window.WDLobby?.open)return;clearInterval(wait);window.WDOM.startEncounter(again);},100);return;
  }
  if(query.get('wdcombat')!=='1')return;
  const names={archer:'사수',rapid:'레인저',sniper:'저격수',artillery:'포병',warrior:'전사',miner:'마이너',zone:'장판술사',mage:'메이지',buffer:'버퍼',debuffer:'유령',merchant:'상인'};
  let selected='all',paused=false,element=0,elementMax=true,moveMobs=true;
  function start(){
    newGame();const g=G;g.skillSandbox=true;g.qaElementMax=elementMax;g.waveT=9999;g.banner=null;g.spawnQ=[];g.partnerQ=[];g.mobs=[];g.towers=[];
    for(const side of ['me','partner'])g.grid[side].forEach(row=>row.fill(null));
    const slots=[[0,0],[0,1],[0,2],[0,3],[2,0],[2,1],[2,2],[2,3],[1,2],[1,0],[1,4]],words=Object.keys(DICT);
    for(let i=0;i<ROLES.length;i++){
      const w=words.find(w=>w.length===6&&DICT[w][0]===i&&DICT[w][1]===element)||words.find(w=>w.length===6&&DICT[w][0]===i);
      if(!w)throw Error('6글자 유닛 없음: '+ROLES[i].key);
      const [r,c]=slots[i],T=placeTower('me',w,{r,c});T.el=element;T.convEl=0;T.convT=0;T.born=0;T.hideUntil=0;T.desc7=0;T.skCd=2+i*.3;
    }
    for(const y of [ROAD.mid,ROAD.bot])for(const x of [160,260,360,460,560])dummy(x,y);
    dummy(ROAD.left,cellRect('me',1,0).cy);dummy(ROAD.right,cellRect('me',1,4).cy);
    window.__wdIntro=false;window.__wdOMPause=false;document.querySelector('#wdl').hidden=true;
    updateSupport(0);render();
  }
  function dummy(x,y){
    spawnMob({type:'slime',wave:1,boss:false,portal:'bot'});const m=G.mobs.at(-1);m._qaDummy=true;m._qaSpeed=m.speed;m.speed=moveMobs?m._qaSpeed:0;m.ox=m.oy=0;m.spawnT=2;
    const path=m.path;let best=Infinity,distance=path.entryLen,offset=path.entryLen;
    for(const seg of path.segs){const dx=seg.b.x-seg.a.x,dy=seg.b.y-seg.a.y,q=Math.max(0,Math.min(1,((x-seg.a.x)*dx+(y-seg.a.y)*dy)/(seg.l*seg.l||1))),px=seg.a.x+dx*q,py=seg.a.y+dy*q,d=(px-x)**2+(py-y)**2;if(d<best){best=d;distance=offset+seg.l*q;m.x=px;m.y=py;}offset+=seg.l;}
    m.d=distance;
  }
  const nativeKill=killMob;killMob=function(m,...args){if(G?.skillSandbox&&m?._qaDummy&&!m._qaCanDie){m.hp=m.maxHp;return;}return nativeKill(m,...args);};
  const nativeAct=towerAct;towerAct=function(T,dt){if(G?.skillSandbox&&selected!=='all'&&ROLES[T.role].key!==selected)return;return nativeAct(T,dt);};
  const nativeUpdate=update;update=function(dt){if(!G?.skillSandbox)return nativeUpdate(dt);};
  // This viewer opens without the paid-run lobby gate. Own the QA loop so freshly
  // decoded unit images keep rendering, and never advance twice via the normal loop.
  let previousTime=0;
  function frame(ts){requestAnimationFrame(frame);if(!G?.skillSandbox)return;const dt=previousTime?Math.min(.05,(ts-previousTime)/1000):0;previousTime=ts;if(!paused&&!window.__wdOMPause){G.waveT=9999;G.partnerQ=[];G.spawnQ=[];nativeUpdate(dt);for(const m of G.mobs){m.hp=m.maxHp;m.speed=moveMobs?m._qaSpeed:0;}}render();}
  const panel=document.createElement('div');panel.id='wd-skill-sandbox';panel.innerHTML='<strong>오프라인 테스트 · 전 직업 6글자 · 액티브 Lv.15 / 패시브 Lv.10</strong><select aria-label="테스트 직업"><option value="all">전체 직업</option>'+Object.entries(names).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')+'</select><button data-recast>스킬 다시 보기</button><button data-pause>일시정지</button><button data-exit>나가기</button>';
  panel.insertAdjacentHTML('beforeend','<br><select aria-label="테스트 속성">'+['물리','화염','물','얼음','번개','바람','대지','독','빛','어둠'].map((n,i)=>`<option value="${i}">${n}</option>`).join('')+'</select><label><input type="checkbox" data-element-max checked> 속성 만렙</label><button data-passive>패시브 발동</button>');
  panel.querySelector('select').onchange=e=>{selected=e.target.value;recast();};
  panel.querySelector('[aria-label="테스트 속성"]').onchange=e=>{element=+e.target.value;start();recast();};
  panel.insertAdjacentHTML('beforeend','<label><input type="checkbox" data-mob-move checked> 몹 이동</label>');
  panel.querySelector('[data-mob-move]').onchange=e=>{moveMobs=e.target.checked;for(const m of G?.mobs||[])if(m._qaDummy)m.speed=moveMobs?m._qaSpeed:0;};
  panel.querySelector('[data-element-max]').onchange=e=>{elementMax=e.target.checked;G.qaElementMax=elementMax;calcElLv10();updateSupport(0);};
  panel.querySelector('[data-passive]').onclick=()=>{
    if(!G?.skillSandbox)return;
    for(const T of G.towers){if(selected!=='all'&&ROLES[T.role].key!==selected)continue;T.skCd=9999;const key=ROLES[T.role].key,m=findTarget(T,trange(T));
      if(key==='merchant'){G.gold=Math.max(G.gold,1000);T._qaPassive=true;payInterest();continue;}
      if(key==='debuffer'){window.WDShock?.(T,mobsIn(T.x,T.y,trange(T)));dbBurst10(T,T.el,trange(T));continue;}
      if(key==='buffer'||key==='zone'){updateSupport(.3);continue;}
      if(!m)continue;if(key==='sniper')T.shotN=3;if(key==='rapid')T.hsReady=true;
      if(key==='archer'){m._qaCanDie=true;m.hp=1;hit(T,m,1e9);dummy(m.x,m.y);const next=findTarget(T,trange(T));if(next)fireAttack(T,next);}
      else{T._qaPassive=true;fireAttack(T,m);}
    }
  };
  const resident=again=>{if(!G?.skillSandbox)return;for(const T of G.towers)T.skCd=9999;window.WDOM?.qaEncounter(again);};
  function recast(){if(!G?.skillSandbox)return;G.skq=[];G.sko=[];G.skillVfxV4=[];G.skillBurstsV4=[];for(const T of G.towers){const key=ROLES[T.role].key;T._skillCharging=false;T.skPause=0;T.pend=null;T.skCd=selected==='all'||key===selected?Math.max(.001,window.WDSkillVFX.chargeLead(key)):9999;}}
  panel.querySelector('[data-recast]').onclick=recast;
  panel.querySelector('[data-pause]').onclick=e=>{paused=!paused;e.target.textContent=paused?'재생':'일시정지';};
  panel.querySelector('[data-exit]').onclick=()=>{paused=true;if(G)G.skillSandbox=false;panel.remove();const u=new URL(location.href);u.searchParams.delete('wdcombat');u.searchParams.delete('wdresident');navigateQA(u);};
  window.WDSkillSandbox={start,recast,step(dt){if(G?.skillSandbox){nativeUpdate(dt);render();}},get selected(){return selected;},levels:()=>G?.towers.map(T=>({key:ROLES[T.role].key,len:T.len,element:T.el,elementLevel:T.elLv,active:__wd.WD_SKILL.skLv(T),passive:__wd.WD_SKILL.psLv(T),r:T.r,c:T.c,x:T.x,y:T.y}))};
  Promise.all([window.WDSkillVFX.loaded,new Promise(resolve=>{const wait=()=>window.__wdLoaded?resolve():setTimeout(wait,50);wait();})]).then(()=>{start();document.body.append(panel);requestAnimationFrame(frame);if(query.has('wdresident'))setTimeout(()=>resident(query.get('wdresident')==='again'),350);}).catch(console.error);
  Object.assign(window.__wd,{update,towerAct});
})();
