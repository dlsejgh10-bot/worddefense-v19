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
 fs.writeFileSync('ui-checks/report.json',JSON.stringify({passed:true,taps,pause,home,audio,errors},null,2));console.log('PASS actual pause/resume/lobby, four empty-pad sounds, no score or HP change, key1 +5dB total, no clipping');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
