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
 assert.ok(result.visible);assert.deepEqual(result.buttons,['순위 보기','로비']);assert.equal(result.completionLabels,1);assert.equal(await page.locator('#clear-success-context').count(),0);assert.ok(result.top>=0&&result.bottom<=result.viewport);
 await page.locator('#show-song-ranking').click();await page.waitForFunction(()=>!document.querySelector('#song-ranking-panel').hidden);await page.waitForTimeout(250);await page.screenshot({path:'ui-checks/ranking-applied-v59.png'});
 const ranking=await page.evaluate(()=>({visible:!document.querySelector('#song-ranking-panel').hidden,rows:document.querySelectorAll('.ranking-row').length,status:document.querySelector('#ranking-message').textContent,title:document.querySelector('.ranking-title img').naturalWidth}));
 assert.ok(ranking.visible&&ranking.title>0);assert.equal(ranking.rows,0,'Standalone view must not invent players');assert.ok(await page.locator('#ranking-retry').isHidden());
 // Isolated browser fixtures verify the renderer without creating any live data.
 await page.evaluate(()=>{window.savedLeaderboard=RhythmLeaderboard;window.fixtureCalls=0;window.fixtureFail=false;window.fixtureRank=38;
 const self=()=>({uid:'isolated-own',score:1000,rank:fixtureRank,profile:{nick:'검사용 내 기록',avatar:4,frame:0}});
 const entry={uid:'isolated-top',score:5000,rank:1,profile:{nick:'검사용 상위 기록',avatar:4,frame:0}};
 window.RhythmLeaderboard={...savedLeaderboard,page:async()=>{fixtureCalls++;if(fixtureFail)throw Error('Offline fixture');return{entries:[entry],me:self(),cursor:null}},mine:async()=>self(),aroundMe:async()=>({entries:[{...self(),isMe:true}],me:self(),cursor:null}),stats:async()=>({attempts:10,clears:8})};RankUI.open();});
 await page.waitForFunction(()=>document.querySelectorAll('.ranking-row').length===1);
 assert.ok(await page.locator('#ranking-retry').isHidden());assert.equal(await page.locator('#my-ranking-place').textContent(),'38위');
 await page.evaluate(()=>RankUI.refreshVisible());await page.waitForTimeout(120);assert.equal(await page.locator('.ranking-row').count(),1);
 const before=await page.evaluate(()=>fixtureCalls);await page.locator('#ranking-list').evaluate(el=>el.dispatchEvent(new Event('scroll')));await page.waitForTimeout(80);assert.equal(await page.evaluate(()=>fixtureCalls),before,'A short list must not refetch and append itself');
 const pinned=await page.locator('#my-ranking-card').evaluate(el=>({tag:el.tagName,onclick:el.onclick,text:el.textContent}));assert.equal(pinned.tag,'DIV');assert.equal(pinned.onclick,null);assert.ok(!pinned.text.includes('보기'));assert.equal(await page.locator('#my-ranking-action,#my-ranking-change').count(),0);
 await page.evaluate(()=>{fixtureRank=40;return RankUI.refreshVisible()});await page.waitForFunction(()=>document.querySelector('#my-ranking-place').textContent==='40위');
 await page.evaluate(()=>{fixtureFail=true;RankUI.open()});await page.waitForFunction(()=>!document.querySelector('#ranking-retry').hidden);
 await page.evaluate(()=>{fixtureFail=false});await page.locator('#ranking-retry').click();await page.waitForFunction(()=>document.querySelectorAll('.ranking-row').length===1&&document.querySelector('#ranking-retry').hidden);
 for(let i=0;i<3;i++){await page.evaluate(()=>RankUI.open());await page.waitForTimeout(80);assert.equal(await page.locator('.ranking-row').count(),1)}
 await page.evaluate(()=>{window.RhythmLeaderboard=savedLeaderboard;RankUI.open()});await page.waitForTimeout(180);
 assert.equal(await page.locator('#my-ranking-place').textContent(),'—');assert.equal(await page.locator('#my-ranking-card').evaluate(e=>e.tagName),'DIV');
 const buttonArt=await page.evaluate(()=>[...document.querySelectorAll('.game-image-button')].map(b=>({loaded:b.querySelector('img').naturalWidth>0,padding:getComputedStyle(b).padding,ratio:b.querySelector('img').getBoundingClientRect().width/b.querySelector('img').getBoundingClientRect().height})));
 assert.ok(buttonArt.every(b=>b.loaded&&b.padding==='0px'));await page.screenshot({path:'ui-checks/ranking-applied-v61.png'});

 await page.locator('#ranking-back').click();assert.equal(await page.locator('#result-score').textContent(),'18,650');assert.deepEqual(errors,[]);
 await page.goto('http://127.0.0.1:8766/index.html?song=random');await page.waitForFunction(()=>window.gameReady&&document.querySelector('#home-frame').contentWindow.compositionReady);
 const songIds=[];await page.evaluate(()=>window.lobbyIdentity='same-loaded-page');
 for(let i=0;i<9;i++){
  const hf=page.frames().find(f=>f.url().includes('/home/index.html'));
  const target=await hf.evaluate(()=>{const r=canvas.getBoundingClientRect();return{x:(layout.button.x+layout.button.w/2)*r.width/1080,y:(layout.button.y+layout.button.h/2)*r.height/canvas.height}});
  await hf.locator('canvas').click({position:target});await page.waitForFunction(()=>rhythmGame.state.mode==='playing');
  const current=await page.evaluate(()=>({id:SONG_CHART.id,beat:rhythmGame.constants.beat,duration:rhythmGame.constants.endTime,expectedBeat:SONG_CHART.beat,expectedDuration:SONG_CHART.duration,approach:GameLayout.approach,expectedApproach:SONG_CHART.approachSeconds||1}));
  songIds.push(current.id);assert.equal(current.beat,current.expectedBeat);assert.equal(current.duration,current.expectedDuration);assert.equal(current.approach,current.expectedApproach);
  await page.evaluate(()=>{Object.assign(rhythmGame.state,{score:100,perfect:1});rhythmGame.finish(false)});
  await page.locator('#return').click();await page.waitForFunction(()=>GameHome.visible&&rhythmGame.state.mode==='ready');
  assert.equal(await page.evaluate(()=>window.lobbyIdentity),'same-loaded-page','Lobby return must not reload the game');
  assert.ok(await page.locator('#results').isHidden());const t=await hf.evaluate(()=>({n:effects.frames,time:effects.time}));await page.waitForTimeout(130);assert.ok(await hf.evaluate(n=>effects.frames>n,t.n),'Lobby animations keep advancing');
 }
 assert.equal(new Set(songIds).size,9,'Random rotation must not repeat within a cycle');assert.deepEqual(errors,[]);
 await page.screenshot({path:'ui-checks/lobby-after-nine-games-v63.png'});
 fs.writeFileSync('ui-checks/report.json',JSON.stringify({passed:true,lobbyReturnWithoutReload:true,nineRandomGamesReentered:true,noRepeatInCycle:true,songIds,uniqueUidRows:true,shortListDoesNotReload:true,retryResetsRows:true,myRankOutsideFirstPage:true,pinnedRankIsNotAButton:true,imageButtons:true,globalMetricOnly:true,taps,pause,home,audio,result,ranking,errors},null,2));console.log('PASS pause/resume/lobby, four empty pads, +2dB key1, result/ranking navigation, no fake leaderboard rows');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
