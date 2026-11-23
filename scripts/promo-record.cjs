// Isolated promotional capture. No real account, Firebase reads or writes.
// Input is automated against the unmodified word/tower/battle engine.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const out=path.resolve('promo-capture');fs.mkdirSync(out,{recursive:true});
const report={method:'Offline cloud Chromium; actual game engine with automated card selection, no altered rewards, words, enemies or outcomes',events:[],errors:[]};
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required','--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:720,height:1280},deviceScaleFactor:1,hasTouch:true,isMobile:true,recordVideo:{dir:out,size:{width:720,height:1280}}});
 const page=await context.newPage();
 try{
  page.on('pageerror',e=>{report.errors.push(String(e));console.log('PAGE ERROR',String(e).slice(0,200))});
  await page.route('**/*',route=>/^(http:\/\/127\.0\.0\.1:8766\/|data:|blob:)/.test(route.request().url())?route.continue():route.abort());
  await page.addInitScript(()=>{
   localStorage.setItem('wd_main_v1',JSON.stringify({v:3,nick:'단어 디펜스',uid:'promo-offline-only',avatar:4,gold:0,gems:0,set:{bgm:0,sfx:.7,vib:false,lang:'ko'},en:{v:30,t:Date.now()}}));
   window.promoAudio=[];
   const original=AudioNode.prototype.connect;
   AudioNode.prototype.connect=function(...args){
    const result=original.apply(this,args);
    if(args[0]===this.context.destination){
     let target=this.context.__promoTarget;
     if(!target){target=this.context.__promoTarget=this.context.createMediaStreamDestination();window.promoAudio.push(target);}
     original.call(this,target);
    }return result;
   };
   setInterval(()=>{window.__wdIntro=false;window.__wdOMPause=false;const l=document.getElementById('wdl');if(l)l.hidden=true;for(const id of ['wdl-wipe','wdl-login','wdl-intro']){const e=document.getElementById(id);if(e)e.style.display='none';}},50);
  });
  await page.exposeBinding('savePromo',(_,bytes)=>fs.appendFileSync(path.join(out,'main-game.webm'),Buffer.from(bytes,'base64')));
  await page.goto('http://127.0.0.1:8766/index.html?nolobby=1&wdframe=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__wdLoaded&&window.__wd?.G?.tiles?.length,null,{timeout:120000});
  await page.mouse.click(360,640);
  await page.evaluate(async()=>{
   const c=document.querySelector('#c');const stream=c.captureStream(24);
   const mix=new AudioContext();await mix.resume();const dest=mix.createMediaStreamDestination();
   for(const a of window.promoAudio){await a.context.resume();mix.createMediaStreamSource(a.stream).connect(dest);}
   for(const t of dest.stream.getAudioTracks())stream.addTrack(t);
   const rec=window.promoRecorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8,opus',videoBitsPerSecond:2200000,audioBitsPerSecond:128000});
   window.promoUploads=[];rec.ondataavailable=e=>{if(!e.data.size)return;window.promoUploads.push((async()=>{const b=new Uint8Array(await e.data.arrayBuffer());let s='';for(let i=0;i<b.length;i+=8192)s+=String.fromCharCode(...b.subarray(i,i+8192));await savePromo(btoa(s));})());};rec.start(2000);
  });
  const start=Date.now();let lastMade=-1,nextShot=0;
  while(Date.now()-start<65000){
   const state=await page.evaluate(()=>{const a=window.__wd,g=a.G;return{t:g.t,wave:g.wave,made:g.made,over:g.over,tileT:g.tileT,sel:g.sel,tiles:g.tiles.filter(t=>t.state==='hand').map(t=>({id:t.id,ch:t.ch})),words:Object.keys(a.DICT),towers:g.towers.length,kills:g.kills}});
   if(state.made!==lastMade){console.log('STATE',JSON.stringify({t:state.t,wave:state.wave,made:state.made,kills:state.kills,towers:state.towers}));lastMade=state.made;}
   if(Date.now()-start>=nextShot){await page.screenshot({path:path.join(out,'frame-'+Math.round(nextShot/1000)+'.png')});nextShot+=10000;}
   if(state.over)break;
   if(!state.sel.length&&state.tileT>1){
    let candidates=state.words.filter(w=>{if(w.length<2||w.length>4)return false;const hand=state.tiles.map(t=>t.ch);for(const ch of w){const i=hand.indexOf(ch);if(i<0)return false;hand.splice(i,1);}return true;}).sort((a,b)=>b.length-a.length);
    const word=candidates[0];
    if(word){
     report.events.push({recordingSeconds:(Date.now()-start)/1000,word,wave:state.wave});console.log('WORD',word);
     for(const ch of word){await page.evaluate(ch=>{const a=window.__wd,t=a.G.tiles.find(t=>t.state==='hand'&&t.ch===ch);if(t)a.tapHand(t);},ch);await page.waitForTimeout(135);}
     await page.waitForTimeout(1500);
    }else await page.waitForTimeout(150);
   }else await page.waitForTimeout(150);
  }
  await page.evaluate(async()=>{await new Promise(r=>{promoRecorder.onstop=r;promoRecorder.stop();});await Promise.all(promoUploads);});
  report.final=await page.evaluate(()=>{const g=__wd.G;return{t:g.t,wave:g.wave,made:g.made,kills:g.kills,towers:g.towers.length,over:g.over,canvas:[document.querySelector('#c').width,document.querySelector('#c').height]}});
  report.passed=true;
 }catch(e){report.failure=String(e);console.error(e);await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});process.exitCode=1;}
 finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await context.close();await browser.close();}
})();
