// Real-time Chromium playback with normal DOM key events, full audio/canvas
// recordings, and actual game judging. This is automated play, not a human
// listening assessment or a physical-device latency measurement.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const folder=process.env.WD_GAME_ROOT||path.resolve('WordDefense/Resources/www/weekend');
const out=path.resolve(process.env.WD_QA_OUT||'cloud-playthrough');fs.mkdirSync(out,{recursive:true});
const ids=(process.env.WD_SONGS||'beside,flex,seventy,rain,grandpa,friday,emotional,duet,youth').split(',');
const db=JSON.parse(fs.readFileSync(path.join(folder,'data/song-db.json'),'utf8'));
const report={revision:db.revision,method:'Cloud Chromium, normal DOM keyboard input against live HTMLAudioElement clock. Full realtime media playback and canvas+music+SFX recordings. Not human play or phone hardware.',songs:[],errors:[]};
async function run(){
 const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required','--disable-dev-shm-usage']});
 let activePage,activeId;
 try{for(const id of ids){
  const song=db.songs.find(s=>s.id===id);assert.ok(song);
  const context=await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:1,
   userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',hasTouch:true,isMobile:true});
  const page=await context.newPage();
  activePage=page;activeId=id;
  page.on('console',msg=>{if(msg.type()==='error')console.log('BROWSER',id,msg.text().slice(0,400))});
  page.on('pageerror',e=>report.errors.push({id,error:String(e)}));
  await page.addInitScript(()=>{const A=window.AudioContext;window.AudioContext=class extends A{constructor(...a){super(...a);window.qaAudioContext=this;}}});
  await page.exposeBinding('saveRecording',(_,chunk)=>fs.appendFileSync(path.join(out,id+'.webm'),Buffer.from(chunk,'base64')));
  await page.route('**/status-locked-v46.webp',async route=>{await new Promise(r=>setTimeout(r,600));await route.continue()});
  await page.goto('http://127.0.0.1:8766/index.html?song='+id,{waitUntil:'load'});
  await page.waitForFunction(()=>window.gameReady&&document.querySelector('#home-frame').contentWindow.compositionReady,null,{timeout:90000});
  const frame=page.frames().find(f=>f.url().includes('/home/index.html'));
  const click=await frame.evaluate(()=>{const r=canvas.getBoundingClientRect();return{x:(layout.button.x+layout.button.w/2)*r.width/1080,y:(layout.button.y+layout.button.h/2)*r.height/canvas.height}});
  // Install the scheduler before the actual start click, so no first notes are
  // skipped while the recorder/media decoder is being prepared.
  await page.evaluate(()=>{
   const G=rhythmGame, codes=['KeyD','KeyF','KeyJ','KeyK'],keys=['d','f','j','k'];
   const actions=SONG_CHART.notes.flatMap(n=>[
    {t:n.t,lane:n.lane,down:true,id:n.id},
    {t:n.t+(n.duration||.032)+.005,lane:n.lane,down:false,id:n.id}]);
   actions.sort((a,b)=>a.t-b.t||(a.down?1:-1));
   const qa=window.cloudQA={index:0,dispatched:0,late:[],inputs:[],frames:[],lastFrame:0,recordingReady:false};
   requestAnimationFrame(function frame(t){if(G.state.mode==='playing'&&qa.lastFrame)qa.frames.push(t-qa.lastFrame);qa.lastFrame=t;requestAnimationFrame(frame)});
   qa.timer=setInterval(()=>{
    if(G.state.mode!=='playing')return;
    const time=G.music.currentTime-G.state.offset;
    while(qa.index<actions.length&&actions[qa.index].t<=time){
     const a=actions[qa.index++];
     const lag=time-a.t;if(a.down&&lag>.035)qa.late.push({id:a.id,lagMs:lag*1000});
     window.dispatchEvent(new KeyboardEvent(a.down?'keydown':'keyup',{
      code:codes[a.lane],key:keys[a.lane],bubbles:true,cancelable:true}));qa.dispatched++;
     if(a.down)qa.inputs.push({...G.state.inputEvents.at(-1),scheduled:a.t,dispatchLagMs:lag*1000});
    }
   },4);
  });
  await frame.locator('canvas').click({position:click});
  await page.waitForFunction(()=>rhythmGame.state.mode==='playing',null,{timeout:60000});
  await page.evaluate(async()=>{
   const ctx=qaAudioContext,canvas=document.querySelector('#screen'),preview=document.createElement('canvas');
   preview.width=393;preview.height=Math.round(canvas.height/canvas.width*393);
   const pg=preview.getContext('2d'),qa=cloudQA;
   // Encode at the displayed phone size. Encoding the 852x1846 source in a
   // software-only cloud VM starved the main thread and was not a valid phone
   // playability test. Keep real rendering, real time, and normal judgement.
   qa.captureTimer=setInterval(()=>pg.drawImage(canvas,0,0,preview.width,preview.height),1000/20);
   const stream=preview.captureStream(20),dest=ctx.createMediaStreamDestination();
   rhythmGame.music.weekendGainNode.connect(dest);GameAudio.output(ctx).connect(dest);
   for(const track of dest.stream.getAudioTracks())stream.addTrack(track);
   const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8,opus',videoBitsPerSecond:550000,audioBitsPerSecond:128000});
   qa.uploads=[];qa.recorder=recorder;qa.destination=dest;
   recorder.ondataavailable=event=>{if(!event.data.size)return;qa.uploads.push((async()=>{
    const bytes=new Uint8Array(await event.data.arrayBuffer());let str='';
    for(let i=0;i<bytes.length;i+=8192)str+=String.fromCharCode(...bytes.subarray(i,i+8192));
    await saveRecording(btoa(str));})())};
   recorder.start(3000);qa.recordingReady=true;
  });
  await page.waitForFunction(()=>rhythmGame.state.mode==='result',null,{timeout:(song.audio.durationSeconds+40)*1000,polling:250});
  await page.evaluate(async()=>{clearInterval(cloudQA.timer);clearInterval(cloudQA.captureTimer);await new Promise(r=>{cloudQA.recorder.onstop=r;cloudQA.recorder.stop()});await Promise.all(cloudQA.uploads)});
  await page.waitForTimeout(1200);
  const result=await page.evaluate(()=>{
   const s=rhythmGame.state,frames=cloudQA.frames.sort((a,b)=>a-b),percentile=q=>frames[Math.min(frames.length-1,Math.floor(frames.length*q))];
   return{id:SONG_CHART.id,mode:s.mode,time:s.time,duration:SONG_CHART.duration,heads:SONG_CHART.notes.length,
    perfect:s.perfect,great:s.great,good:s.good,miss:s.miss,holdTicks:s.holdTicks,hp:s.hp,
    invalidPresses:s.invalidPresses,dispatched:cloudQA.dispatched,lateInputs:cloudQA.late,
    visible:!document.querySelector('#results').hidden,runtimeError:window.gameRuntimeError||null,
    frameMs:{p50:percentile(.5),p95:percentile(.95),p99:percentile(.99)},
    inputResults:cloudQA.inputs,homePaused:document.querySelector('#home-frame').contentWindow.danceMusic.paused,
    songPaused:rhythmGame.music.paused,lastInputEvents:s.inputEvents};
  });
  await page.screenshot({path:path.join(out,id+'-result.png')});
  report.songs.push(result);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
  assert.equal(result.mode,'result');assert.equal(result.visible,true);assert.equal(result.runtimeError,null);
  assert.ok(result.time>=result.duration-.20,'Ended too early: '+id);
  assert.equal(result.perfect+result.great+result.good+result.miss,result.heads,'Every head judged: '+id);
  // A shared software cloud runner may deliver an event late. Preserve that
  // evidence instead of weakening the game's judgement or calling it perfect.
  // The deterministic full-clock test separately verifies every chart at 0 miss.
  const conflicts=result.inputResults.filter(e=>e.result==='extra-press-on-hold'&&e.dispatchLagMs<75);
  assert.equal(conflicts.length,0,'No mechanical input conflicts: '+id);
  assert.ok(result.homePaused&&result.songPaused,'No overlapping lobby/result music');
  console.log('FULL PLAY PASS',id,JSON.stringify({heads:result.heads,perfect:result.perfect,great:result.great,miss:result.miss,frames:result.frameMs}));
  await context.close();
 }
 assert.equal(report.errors.length,0,JSON.stringify(report.errors));
 }catch(error){
  if(activePage&&!activePage.isClosed()){
   report.failureState=await activePage.evaluate(()=>({gameReady:window.gameReady,gameError:window.gameError,
    mode:window.rhythmGame?.state.mode,compositionReady:document.querySelector('#home-frame')?.contentWindow?.compositionReady,
    compositionError:document.querySelector('#home-frame')?.contentWindow?.compositionError,
    runtimeError:window.gameRuntimeError,images:[...document.images].filter(i=>!i.complete).map(i=>i.src)})).catch(()=>null);
   await activePage.screenshot({path:path.join(out,activeId+'-failure.png'),timeout:5000}).catch(()=>{});
  }
  throw error;
 }finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close()}
}
run().catch(e=>{report.failure=String(e);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.error(e);process.exitCode=1});
