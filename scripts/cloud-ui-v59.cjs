const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage({viewport:{width:393,height:852}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));fs.mkdirSync('ui-checks',{recursive:true});
 try{
 await page.goto('http://127.0.0.1:8766/index.html?song=duet');
 await page.waitForFunction(()=>window.gameReady&&document.querySelector('#home-frame').contentWindow.compositionReady);
 const frame=page.frames().find(f=>f.url().includes('/home/index.html'));
 const p=await frame.evaluate(()=>{const r=canvas.getBoundingClientRect();return{x:(layout.button.x+layout.button.w/2)*r.width/1080,y:(layout.button.y+layout.button.h/2)*r.height/canvas.height}});
 await frame.locator('canvas').click({position:p});await page.waitForFunction(()=>rhythmGame.state.mode==='playing');
 for(const key of ['d','f','j','k'])await page.keyboard.press(key);
 const taps=await page.evaluate(()=>({sounds:rhythmGame.state.emptyPadSounds,hp:rhythmGame.state.hp,miss:rhythmGame.state.miss,score:rhythmGame.state.score}));
 assert.equal(taps.sounds,4);assert.equal(taps.hp,100);assert.equal(taps.miss,0);assert.equal(taps.score,0);
 await page.locator('#pause-control').click();await page.waitForFunction(()=>!document.querySelector('#pause-menu').hidden);
 const pause=await page.evaluate(()=>({mode:rhythmGame.state.mode,buttons:[...document.querySelectorAll('#pause-menu button')].map(b=>b.textContent),image:document.querySelector('.pause-title img').naturalWidth,time:rhythmGame.music.currentTime,paused:rhythmGame.music.paused,overlay:document.querySelector('#overlay').classList.contains('hidden')}));
 assert.deepEqual(pause.buttons,['계속하기','로비로']);assert.equal(pause.mode,'paused');assert.ok(pause.image>0&&pause.paused&&pause.overlay);
 await page.waitForTimeout(350);await page.screenshot({path:'ui-checks/pause-applied-v59.png'});
 assert.ok(Math.abs(await page.evaluate(()=>rhythmGame.music.currentTime)-pause.time)<.03);
 await page.locator('#pause-resume').click();await page.waitForFunction(()=>rhythmGame.state.mode==='playing');
 await page.locator('#pause-control').click();await page.locator('#pause-lobby').click();
 const home=await page.evaluate(()=>({home:GameHome.visible,mode:rhythmGame.state.mode,paused:rhythmGame.music.paused,active:WeekendClient.snapshot().active,plays:WeekendClient.snapshot().plays}));
 assert.ok(home.home&&home.paused);assert.equal(home.mode,'ready');assert.equal(home.active,undefined);assert.equal(home.plays,0);
 const audio=await page.evaluate(async()=>{const result=[];for(let lane=0;lane<4;lane++){const c=new OfflineAudioContext(2,48000*.7,48000);await NoteAudio.load(c);const info=NoteAudio.play(c,'tap',lane);const data=(await c.startRendering()).getChannelData(0);const peak=Math.max(...data.map(Math.abs));const level=AudioLevels[info.source].gain;const boost=20*Math.log10(info.hitGain/(.45*level));result.push({lane,peak,boost});}return result});
 assert.ok(Math.abs(audio[0].boost-5)<.02);for(const a of audio.slice(1))assert.ok(Math.abs(a.boost-1)<.02);assert.ok(audio.every(a=>a.peak<.99));assert.deepEqual(errors,[]);
 await frame.locator('canvas').click({position:p});await page.waitForFunction(()=>rhythmGame.state.mode==='playing');
 await page.evaluate(()=>{Object.assign(rhythmGame.state,{score:18650,maxCombo:86,perfect:112,great:18,good:3,miss:1});rhythmGame.finish(false);});
 await page.waitForTimeout(2800);await page.screenshot({path:'ui-checks/result-applied-v59.png'});
 const result=await page.evaluate(()=>{const r=document.querySelector('.result-panel:not(.song-ranking-panel)'),a=r.getBoundingClientRect();return{visible:!r.hidden,buttons:[...r.querySelectorAll('.result-actions button')].map(b=>b.textContent),top:a.top,bottom:a.bottom,viewport:innerHeight,completionLabels:r.querySelectorAll('#clear-success-value').length}});
 assert.ok(result.visible);assert.deepEqual(result.buttons,['순위 보기','로비']);assert.equal(result.completionLabels,1);assert.ok(result.top>=0&&result.bottom<=result.viewport);
 await page.locator('#show-song-ranking').click();await page.waitForFunction(()=>!document.querySelector('#song-ranking-panel').hidden);await page.waitForTimeout(250);await page.screenshot({path:'ui-checks/ranking-applied-v59.png'});
 const ranking=await page.evaluate(()=>({visible:!document.querySelector('#song-ranking-panel').hidden,rows:document.querySelectorAll('.ranking-row').length,status:document.querySelector('#ranking-message').textContent,title:document.querySelector('.ranking-title img').naturalWidth}));
 assert.ok(ranking.visible&&ranking.title>0);assert.equal(ranking.rows,0,'Standalone view must not invent players');
 await page.locator('#ranking-back').click();assert.equal(await page.locator('#result-score').textContent(),'18,650');assert.deepEqual(errors,[]);
 fs.writeFileSync('ui-checks/report.json',JSON.stringify({passed:true,taps,pause,home,audio,result,ranking,errors},null,2));console.log('PASS pause/resume/lobby, four empty pads, +2dB key1, result/ranking navigation, no fake leaderboard rows');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
