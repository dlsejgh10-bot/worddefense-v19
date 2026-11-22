(()=>{'use strict';
const c=document.querySelector('canvas'),g=c.getContext('2d'),$=s=>document.querySelector(s);
const L=window.GameLayout,R=window.RhythmRules,beat=window.SONG_CHART.beat,endTime=window.SONG_CHART.duration,keys=['d','f','j','k'];
const state={mode:'loading',time:0,displayScore:0,auto:false,offset:0,notes:[],particles:[],rings:[],pulses:[0,0,0,0],judge:'',judgeTime:-10,ready:false,danceHistory:[]};R.reset(state);
const pads=L.centers.map(()=>({down:false,y:0,v:0,flash:0,pointers:new Set()})),images={},poses=[];
const music=new Audio(window.SONG_CHART.audio);music.preload='auto';music.volume=.5;window.GameAudio?.media(music,'song');
const bestKey='grandpa-rhythm-best:'+window.SONG_CHART.id;
let audio,hitBuffer,last=0,clock=0,best=0;
try{best=Number(localStorage.getItem(bestKey)||(window.SONG_CHART.id==='youth'?localStorage.getItem('grandpa-rhythm-v3-best'):0)||0)}catch{}
$('#best').textContent='최고 기록 '+best.toLocaleString();
function img(path){return new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error('에셋 로드 실패: '+path));i.src=path})}
function chart(){return window.SONG_CHART.notes.map(n=>({...n,status:'pending'}));}
async function loadHitSound(){await window.NoteAudio.load(audio);}
const padPitches=[.8909,1,1.1225,1.3348];
function snapHit(lane,preview=false,delay=0){const info=window.NoteAudio.play(audio,state.feverActive?'fever':'tap',lane,preview,state.feverActive,delay);if(!preview)state.hitSoundCount=(state.hitSoundCount||0)+1;window.audioDiagnostics={...info,bgm:music.volume,count:state.hitSoundCount};return info;}
function emptyPadSound(lane){if(!audio)return;const info=window.NoteAudio.play(audio,state.feverActive?'fever':'tap',lane,false,state.feverActive);state.emptyPadSounds=(state.emptyPadSounds||0)+1;window.audioDiagnostics={...info,origin:'empty-pad',count:state.emptyPadSounds};}
function headSound(n,inputTime){const held=n.kickWithHold&&state.notes.find(h=>h.status==='holding'&&Math.floor(h.lane/2)!==Math.floor(n.lane/2));if(held){window.ChordSound.play(audio,[held.lane,n.lane],state.feverActive);state.hitSoundCount=(state.hitSoundCount||0)+1;state.chordCount=(state.chordCount||0)+1;state.chordTime=state.time;state.lastHeadSound=null;return;}const t=inputTime??music.currentTime-state.offset,p=state.lastHeadSound;if(p&&Math.abs(p.noteTime-n.t)<.004&&Math.abs(p.inputTime-t)<=.05&&Math.floor(p.lane/2)!==Math.floor(n.lane/2)){window.NoteAudio.cancel(p.voiceId);window.ChordSound.play(audio,[p.lane,n.lane],state.feverActive);state.hitSoundCount=(state.hitSoundCount||0)+1;state.chordCount=(state.chordCount||0)+1;state.chordTime=state.time;state.lastHeadSound=null;}else{const paired=state.notes.some(other=>other!==n&&other.status==='pending'&&Math.abs(other.t-n.t)<.004&&Math.floor(other.lane/2)!==Math.floor(n.lane/2));const sound=snapHit(n.lane,false,paired?.008:0);state.lastHeadSound={noteTime:n.t,inputTime:t,lane:n.lane,voiceId:sound?.voiceId};}}

function tone(lane,good=true,tick=false){if(!audio)return;if(good){const info=window.NoteAudio.play(audio,tick?'hold':state.feverActive?'fever':'tap',lane,false,state.feverActive);window.audioDiagnostics={...info,tick,bgm:music.volume};return;}const info=window.NoteAudio.play(audio,'miss',lane,false,false);if(info&&!info.coalesced)state.missSoundCount=(state.missSoundCount||0)+1;window.audioDiagnostics={...info,variant:'miss',bgm:music.volume};}


function feverSound(){if(!audio)return;state.feverAudioEntries=(state.feverAudioEntries||0)+1;const now=audio.currentTime;[523,659,784,1047].forEach((f,i)=>{const o=audio.createOscillator(),v=audio.createGain();o.type='triangle';o.frequency.setValueAtTime(f*.5,now+i*.045);o.frequency.exponentialRampToValueAtTime(f,now+i*.045+.1);v.gain.setValueAtTime(.09,now+i*.045);v.gain.exponentialRampToValueAtTime(.001,now+.48+i*.045);o.connect(v).connect(window.GameAudio?.output(audio)||audio.destination);o.start(now+i*.045);o.stop(now+.5+i*.045)});const buffer=audio.createBuffer(1,Math.floor(audio.sampleRate*.38),audio.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);const noise=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();noise.buffer=buffer;filter.type='bandpass';filter.Q.value=.8;filter.frequency.setValueAtTime(600,now);filter.frequency.exponentialRampToValueAtTime(6000,now+.32);gain.gain.setValueAtTime(.12,now);gain.gain.exponentialRampToValueAtTime(.001,now+.38);noise.connect(filter).connect(gain).connect(window.GameAudio?.output(audio)||audio.destination);noise.start();}
function burst(lane,power=1){state.pulses[lane]=1;pads[lane].flash=1;const color=state.feverActive?'#ffd34d':L.colors[lane];
 state.rings.push({x:L.centers[lane],y:L.hitY,age:0,color});
 for(let i=0;i<(state.feverActive?26:12)*power;i++)state.particles.push({x:L.centers[lane],y:L.hitY,vx:(Math.random()-.5)*(state.feverActive?650:420),vy:-100-Math.random()*(state.feverActive?600:370),life:.3+Math.random()*.2,max:.5,color,r:1.5+Math.random()*3});
}
function award(n,grade,inputTime){const feverWas=state.feverActive;grade=R.award(state,grade);n.status=n.duration?'holding':'hit';n.grade=grade;n.tickIndex=0;if(!feverWas&&state.feverActive)feverSound();window.CabinetRenderer.onHit(state);state.judge=grade;state.judgeTime=state.time;burst(n.lane,grade==='PERFECT'?1.3:1);headSound(n,inputTime);if(n.duration){n.holdStart=music.currentTime-state.offset;n.startTick=true;holdFeedback(n,grade);state.holdStarts=(state.holdStarts||0)+1;}}
function miss(n){if(n.status==='miss'||n.status==='hit')return;
 const speed=(L.hitY-(L.spawnY||650))/L.approach;
 const y=n.status==='holding'?L.hitY:Math.max(L.spawnY||650,Math.min(L.hitY,L.hitY+(state.time-n.t)*speed));
 (state.noteMissBursts??=[]).push({lane:n.lane,y,age:0,gold:state.feverActive});
if(n.status==='holding'&&n.grade)state[n.grade.toLowerCase()]--;n.status='miss';R.miss(state);window.CabinetRenderer.onMiss(state);state.judge='MISS';state.judgeTime=state.time;tone(n.lane,false)}
function eventTime(e){let stamp=Number(e.timeStamp);if(stamp>1e12)stamp-=performance.timeOrigin;const lag=Number.isFinite(stamp)?Math.max(0,Math.min(.1,(performance.now()-stamp)/1000)):0;return music.currentTime-lag*music.playbackRate-state.offset;}
function traceInput(lane,token,result,t,n){const log=state.inputEvents??=[];log.push({lane,token,result,time:t,note:n?.id,errorMs:n?(t-n.t)*1000:null});if(log.length>160)log.shift();}
function rejectPress(lane,token,reason,t,n){state.invalidPresses=(state.invalidPresses||0)+1;traceInput(lane,token,reason,t,n);}
function down(lane,token='keyboard',inputTime){if(state.mode!=='playing')return;const p=pads[lane],t=inputTime??music.currentTime-state.offset;if(p.pointers.has(token))return;p.pointers.add(token);p.down=true;p.v=75;p.flash=1;state.pulses[lane]=Math.max(state.pulses[lane],.68);state.time=Math.max(state.time,music.currentTime-state.offset);
 const hand=Math.floor(lane/2);state.lastPressByLane[lane]=t;state.lastPressByHand[hand]=t;
 const holding=state.notes.find(n=>n.lane===lane&&n.status==='holding');if(holding){if(t>=holding.t+holding.duration)completeHold(holding);else{emptyPadSound(lane);rejectPress(lane,token,'extra-press-on-hold',t,holding);return;}}
 const n=state.notes.filter(n=>n.lane===lane&&n.status==='pending'&&n.t-t<=R.config.earlyMissWindow+.000001).sort((a,b)=>a.t-b.t)[0];
 if(!n){emptyPadSound(lane);rejectPress(lane,token,'empty-timing-or-lane',t);return;}
 const grade=R.judge(n.t-t);
 if(grade){traceInput(lane,token,'hit',t,n);award(n,grade,t);return;}
 state.invalidPresses=(state.invalidPresses||0)+1;if(n.t>t)state.earlyMisses=(state.earlyMisses||0)+1;traceInput(lane,token,n.t>t?'early-miss':'late-miss',t,n);miss(n);if(state.hp<=0)finish(true);
}

function holdFeedback(n,grade='PERFECT'){R.holdTick(state);window.CabinetRenderer.onHit(state);state.judge=grade;state.judgeTime=state.time;state.judgeSerial=(state.judgeSerial||0)+1;state.lastHoldLane=n.lane;burst(n.lane,.45);/* Hold ticks keep visual/combo feedback without per-tick drum retriggers. */}
function holdTickCount(n){return n.lengthBeats?Math.round(n.lengthBeats/R.config.holdTickBeats):Math.floor((n.duration+.0001)/(beat*R.config.holdTickBeats));}
function tickHold(n,until){const max=holdTickCount(n);if(!max)return;const interval=n.duration/max;n.tickIndex??=0;while(n.tickIndex<max&&until>=n.t+(n.tickIndex+1)*interval-.00001){n.tickIndex++;holdFeedback(n);}}
function completeHold(n){if(n.status!=='holding')return;tickHold(n,n.t+n.duration);const total=holdTickCount(n);while(n.tickIndex<total){n.tickIndex++;holdFeedback(n);}if(!n.finalTick){n.finalTick=true;holdFeedback(n);state.holdCompletions=(state.holdCompletions||0)+1;state.holdCompleteTime=state.time;(state.holdBursts??=[]).push({lane:n.lane,age:0,gold:state.feverActive});holdCompleteSound(n.lane);pads[n.lane].flash=1;pads[n.lane].v=-85;}n.status='hit';burst(n.lane,1.6);}
function holdCompleteSound(lane){if(!audio)return;const info=window.NoteAudio.play(audio,'release',lane,false,state.feverActive);window.audioDiagnostics={...info,variant:'hold-complete',fever:state.feverActive};}

function up(lane,token='keyboard',inputTime){const p=pads[lane];if(!p.pointers.has(token))return;p.pointers.delete(token);if(p.pointers.size)return;p.down=false;
 for(const n of state.notes)if(n.lane===lane&&n.status==='holding'&&state.mode==='playing'){tickHold(n,inputTime??music.currentTime-state.offset);if((inputTime??music.currentTime-state.offset)<n.t+n.duration-.08)miss(n);else completeHold(n)}
}
function clearPads(preserveMiss=false){window.NoteAudio?.stopAll?.(preserveMiss);pads.forEach(p=>{p.down=false;p.pointers.clear()});state.lastPressByLane=[-Infinity,-Infinity,-Infinity,-Infinity];state.lastPressByHand=[-Infinity,-Infinity];}
async function start(){if(!state.ready||state.mode==='starting')return;$('#pause-menu').hidden=true;const practice=$('#auto').checked;if(window.WeekendClient&&!practice){const token=window.WeekendClient.begin();if(!token)return;state.weekendRunId=token;}else state.weekendRunId=null;window.GameHome?.hide();window.ResultPresentation.stop();clearPads();R.reset(state);state.notes=chart();Object.assign(state,{displayScore:0,time:0,particles:[],rings:[],pulses:[0,0,0,0],judge:'',judgeTime:-10,dance:null,danceHistory:[],pose:1,mirrored:false,poseTime:-10,feverAudioEntries:0,judgeSerial:0,holdCompletions:0,holdStarts:0,chordCount:0,chordTime:-10,lastHeadSound:null,inputEvents:[],hitSoundCount:0,missSoundCount:0,holdBursts:[],noteMissBursts:[],holdCompleteTime:-10,failStart:0,seekPractice:false,holdGraceUntil:0});state.auto=$('#auto').checked;state.mode='starting';$('#overlay').classList.add('hidden');$('#results').hidden=true;
 try{audio??=new(window.AudioContext||window.webkitAudioContext)();await audio.resume();await loadHitSound();window.AudioReactive.connect(audio,music);window.AudioReactive.reset();music.currentTime=0;await music.play();state.mode='playing';if(!state.auto)window.RhythmLeaderboard?.begin();$('#overlay').classList.add('hidden');$('#results').hidden=true;$('#pause-control').hidden=false}
 catch(e){state.mode='ready';if(state.weekendRunId){window.WeekendClient?.refund(state.weekendRunId);state.weekendRunId=null;}$('#description').textContent='음악을 재생하지 못했어요. 다시 눌러 주세요.';console.error(e)}
}
let seekGeneration=0;
async function seekTo(seconds,play=true){if(!state.ready)return;window.GameHome?.hide();const generation=++seekGeneration,target=Math.max(0,Math.min(endTime-.12,Number(seconds)||0));music.pause();window.ResultPresentation.stop();clearPads();state.mode='seeking';
 audio??=new(window.AudioContext||window.webkitAudioContext)();await audio.resume();await loadHitSound();window.AudioReactive.connect(audio,music);window.AudioReactive.reset();
 if(!Number.isFinite(music.duration))await new Promise((resolve,reject)=>{music.addEventListener('loadedmetadata',resolve,{once:true});music.addEventListener('error',reject,{once:true});music.load()});
 music.currentTime=target;if(music.seeking)await new Promise(resolve=>music.addEventListener('seeked',resolve,{once:true}));if(generation!==seekGeneration)return;
 R.reset(state);const t=music.currentTime-state.offset;Object.assign(state,{time:t,displayScore:0,notes:chart().map(n=>({...n,status:n.t<t?'skipped':'pending'})),particles:[],rings:[],pulses:[0,0,0,0],judge:'',judgeTime:-10,danceHistory:[],pose:1,mirrored:false,poseTime:-10,chordCount:0,chordTime:-10,lastHeadSound:null,holdStarts:0,holdCompletions:0,holdBursts:[],noteMissBursts:[],holdCompleteTime:-10,hitSoundCount:0,inputEvents:[],seekPractice:true,holdGraceUntil:t+.2});
 $('#results').hidden=true;$('#pause-control').hidden=false;
 if(play){await music.play();state.mode='playing';$('#overlay').classList.add('hidden')}else{state.mode='paused';showPause()}
}
function showPause(){const panel=$('#pause-menu');$('#pause-song').textContent=window.SONG_CHART.title;$('#overlay').classList.add('hidden');panel.hidden=false;$('#pause-resume').focus({preventScroll:true});}
function pause(){if(state.mode!=='playing')return;music.pause();state.mode='paused';clearPads();showPause()}
async function resume(){try{await music.play();state.holdGraceUntil=state.time+.22;state.mode='playing';$('#pause-menu').hidden=true;$('#overlay').classList.add('hidden')}catch{window.WeekendClient?.notice('계속하기를 다시 눌러 주세요');}}
function show(title,desc,label,restart=false){$('#title').textContent=title;$('#description').textContent=desc;$('#primary').textContent=label;$('#secondary').hidden=!restart;$('#practice').hidden=state.mode==='paused';$('.keyhelp').hidden=state.mode==='paused';$('details').hidden=state.mode==='paused';$('#overlay').classList.remove('hidden')}
function finish(failed=false){if(state.mode==='result')return;$('#pause-menu').hidden=true;if(failed&&state.mode!=='failing'){music.pause();clearPads(true);state.mode='failing';state.failStart=performance.now();state.pose=1;state.mirrored=false;state.pulses.fill(0);state.particles=[];state.rings=[];state.holdBursts=[];state.judge='';state.judgeTime=-10;state.feverActive=false;state.fever=0;pads.forEach(p=>p.flash=0);return;}music.pause();state.mode='result';document.body?.classList?.remove('home-mode');$('#results').hidden=false;$('#pause-control').hidden=true;$('#overlay').classList.add('hidden');clearPads();const record=!state.auto&&!state.seekPractice&&state.score>best;if(record){best=state.score;try{localStorage.setItem(bestKey,best)}catch{}}
 const m=R.summary(state);$('#best').textContent='최고 기록 '+best.toLocaleString();$('#results').classList.toggle('is-failed',failed);$('#result-failed').hidden=!failed;$('.complete-art').hidden=failed;$('#result-song').textContent=window.SONG_CHART.title;
 $('#result-score').textContent=state.score.toLocaleString();$('#result-combo').textContent=state.maxCombo.toLocaleString();$('#result-accuracy').textContent=m.accuracy.toFixed(1)+'%';
 for(const key of ['perfect','great','good','miss'])$('#result-'+key).textContent=state[key].toLocaleString();
 // Legacy placeholders stay hidden; WeekendClient renders actual account rewards.
 for(const id of ['reward-coins','reward-gem','reward-chest']){const node=$('#'+id);if(node)node.textContent='0';}
 $('#overlay').classList.add('hidden');$('#results').hidden=false;$('#pause-control').hidden=true;$('.result-panel').focus({preventScroll:true});if(state.weekendRunId&&!state.auto&&!state.seekPractice){try{window.WeekendClient?.finish(state.weekendRunId,failed?'F':m.rank);state.weekendRunId=null;}catch(error){window.resultRewardError=String(error);window.GameDiagnostics?.error(error);console.error(error);}}window.ResultPresentation.play({score:state.score,rank:failed?'F':m.rank,audioContext:audio});window.RankUI?.present({score:state.score,accuracy:m.accuracy,maxCombo:state.maxCombo,failed,record:!state.auto&&!state.seekPractice});
}
function menu(){if(state.mode==='paused')window.RhythmLeaderboard?.abandon();if(state.mode==='paused'&&state.weekendRunId){try{window.WeekendClient?.abandon?.(state.weekendRunId);state.weekendRunId=null;}catch(error){window.WeekendClient?.notice('로비로 이동을 다시 눌러 주세요');return;}}$('#pause-menu').hidden=true;if(state.mode==='result'){window.GameHome?.show();try{window.WeekendClient?.collect?.()}catch(error){window.WeekendClient?.notice('보상 지급을 다시 시도해 주세요');console.error(error);return;}}if(state.mode==='result'&&window.SongDB?.randomMode){location.replace(window.SongDB.urlFor('random'));return;}window.ResultPresentation.stop();music.pause();clearPads();state.mode='ready';$('#results').hidden=true;$('#pause-control').hidden=true;show(window.SONG_CHART.title,'4개의 버튼으로 박자를 타세요. 긴 노트는 끝까지 꾹!','댄스 시작');window.GameHome?.show();}
$('#primary').onclick=()=>state.mode==='paused'?resume():start();$('#secondary').onclick=start;$('#return').onclick=menu;$('#pause-control').onclick=pause;$('#pause-resume').onclick=resume;$('#pause-lobby').onclick=menu;
$('#offset').oninput=e=>{state.offset=Number(e.target.value)/1000;$('#offsetText').textContent=e.target.value+'ms'};
const keyCodes=['KeyD','KeyF','KeyJ','KeyK'];
function keyLane(e){const code=keyCodes.indexOf(e.code);return code>=0?code:keys.indexOf((e.key||'').toLowerCase());}
window.addEventListener('keydown',e=>{if(e.repeat)return;const lane=keyLane(e);if(lane>=0){e.preventDefault();down(lane,'key:'+lane,eventTime(e))}if(e.code==='Escape'||e.key==='Escape'){e.preventDefault();state.mode==='playing'?pause():state.mode==='paused'?resume():null}if(e.code==='Space'&&state.mode==='ready'){e.preventDefault();start()}});
window.addEventListener('keyup',e=>{const lane=keyLane(e);if(lane>=0){e.preventDefault();up(lane,'key:'+lane,eventTime(e))}});
function point(e){const r=c.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*L.W,y:(e.clientY-r.top)/r.height*L.H}}
c.onpointerdown=e=>{if(e.pointerType==='mouse'&&e.button!==0)return;const p=point(e);if(p.y>=L.touchTop&&p.y<=L.touchBottom&&state.mode==='playing'){e.preventDefault();down(Math.max(0,Math.min(3,Math.floor((p.x-L.left)/L.laneWidth))),e.pointerId,eventTime(e));try{c.setPointerCapture(e.pointerId)}catch{}}};
function release(e){const t=eventTime(e);for(let i=0;i<4;i++)up(i,e.pointerId,t)}
window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);c.onlostpointercapture=release;
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});window.addEventListener('blur',()=>{clearPads();pause()});
function update(dt){state.audioReaction=window.AudioReactive.sample(dt,state.mode==='playing');if(state.mode==='failing'&&performance.now()-state.failStart>=1000)finish(true);if(state.mode==='playing'){
 const nextTime=music.currentTime-state.offset;R.advance(state,Math.max(0,nextTime-state.time));state.time=nextTime;
 for(const n of state.notes){
  if(state.auto&&n.status==='pending'&&state.time>=n.t){award(n,'PERFECT');pads[n.lane].down=true;pads[n.lane].v=75;n.autoRelease=n.duration?n.t+n.duration:state.time+.07}
  if(n.status==='pending'&&state.time-n.t>R.config.missWindow)miss(n);
  if(n.status==='holding'&&(state.auto||pads[n.lane].down))tickHold(n,Math.min(state.time,n.t+n.duration));
  if(n.status==='holding'&&state.time>=n.t+n.duration)completeHold(n);
  if(n.status==='holding'&&!state.auto&&!pads[n.lane].down&&state.time>state.holdGraceUntil)miss(n);
  if(state.auto&&n.autoRelease&&state.time>=n.autoRelease){pads[n.lane].down=false;n.autoRelease=0}
  if(state.hp<=0){finish(true);break;}
 }
 if(state.mode==='playing'&&(music.currentTime>=endTime-.09||music.ended))finish();
 }
 state.displayScore+=(state.score-state.displayScore)*Math.min(1,dt*17);
 pads.forEach((p,i)=>{const target=p.down?11:0;p.v+=((target-p.y)*560-p.v*25)*dt;p.y+=p.v*dt;p.flash*=Math.exp(-dt*8);state.pulses[i]*=Math.exp(-dt*7)});
 for(const p of state.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=750*dt}state.particles=state.particles.filter(p=>p.life>0);
 for(const fragment of state.noteMissBursts??[])fragment.age+=dt;state.noteMissBursts=(state.noteMissBursts??[]).filter(fragment=>fragment.age<.26);
 for(const h of state.holdBursts??[])h.age+=dt;state.holdBursts=(state.holdBursts??[]).filter(h=>h.age<.6);
 for(const ring of state.rings)ring.age+=dt;state.rings=state.rings.filter(r=>r.age<.38);
}
function draw(t){window.CabinetRenderer.draw(g,images,poses,state,pads,t)}
let lastDraw=-Infinity,lastTimeline=-Infinity,drawnMode=null;
function frame(now){try{const dt=Math.min(.05,(now-last)/1000||.016);last=now;clock=now/1000;
 // The home iframe owns its animation. Never paint the hidden full-screen game behind it.
 const hidden=document.hidden||window.GameHome?.visible===true;
 if(!hidden){const animated=state.mode==='playing'||state.mode==='failing';if(animated)update(dt);
  const drawKey=state.mode+':'+c.width+':'+c.height;
  if(state.ready&&((animated&&now-lastDraw>=1000/60-.5)||drawnMode!==drawKey)){draw(clock);const interval=1000/60;lastDraw=Number.isFinite(lastDraw)&&now-lastDraw<2*interval?Math.min(now,lastDraw+interval):now;drawnMode=drawKey;state.renderedFrames=(state.renderedFrames||0)+1;}
  if(now-lastTimeline>=100){window.GameTimeline.update(state,music);lastTimeline=now;}
 }else{drawnMode=null;state.skippedBackgroundFrames=(state.skippedBackgroundFrames||0)+1;}
 }catch(error){window.gameRuntimeError=String(error);window.GameDiagnostics?.error(error);console.error(error);}finally{requestAnimationFrame(frame)}}requestAnimationFrame(frame);
const assets=['combo-fever-atlas','combo-atlas','board-lyrics-v29','cap-0','cap-1','cap-2','cap-3','hud-rail-v54','hud-glow-v54','hud-life-v53','hud-fever-v53','hud-pause-v53',...keys.map((_,i)=>'note-'+i),...['perfect','great','good','miss'].map(n=>'judge-'+n)];
Promise.all([window.ResultPresentation.ready,document.fonts.load('40px Game'),...assets.map(async name=>{images[name]=await img('assets/'+name+'.png')}),...[0,1].filter(i=>window.GRANDPA.frames[i]).map(async i=>{poses[i]=await img(window.GRANDPA.frames[i])})]).then(()=>{window.CabinetRenderer.prepare(images);
 const remainingPoses=window.GRANDPA.frames.map((path,i)=>({path,i})).filter(p=>p.i>1);
 async function warmPoses(){
  const batch=remainingPoses.splice(0,2);
  await Promise.all(batch.map(async p=>{try{poses[p.i]=await img(p.path)}catch(error){window.poseAssetError=String(error)}}));
  if(remainingPoses.length)setTimeout(warmPoses,30);
 }
 setTimeout(warmPoses,1500);state.ready=true;state.mode='ready';$('#primary').disabled=false;$('#primary').textContent='댄스 시작';window.gameReady=true}).catch(e=>{$('#primary').textContent='다시 불러오기';$('#primary').disabled=false;$('#primary').onclick=()=>location.reload();$('#description').textContent=e.message;window.gameError=String(e)});
window.rhythmGame={state,pads,music,down,up,start,pause,resume,chart,finish,menu,seek:seekTo,constants:{beat,hitY:L.hitY,approach:L.approach,centers:L.centers,comboEvery:10,feverHits:R.config.feverHits,songTitle:window.SONG_CHART.title,endTime},render:()=>draw(clock)};window.GameTimeline.attach(window.rhythmGame);
})();
