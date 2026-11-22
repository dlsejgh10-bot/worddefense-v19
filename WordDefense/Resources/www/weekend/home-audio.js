(()=>{'use strict';const frame=document.querySelector('#home-frame'),button=document.createElement('button');button.id='home-sound';button.type='button';button.textContent='♫ 소리 켜기';button.setAttribute('aria-label','시작화면 배경음악 켜기');let muted=false,pending=null,tracked=null;
muted=false;
const visible=()=>document.body.classList.contains('home-mode')&&!document.hidden&&!['starting','playing','paused','failing','result'].includes(window.rhythmGame?.state.mode);
const music=()=>window.WeekendClient?.host?.homeMusic?.()||frame.contentWindow?.danceMusic;
function update(status){const m=music(),playing=!!m&&!m.paused&&!m.muted&&m.volume>0;button.textContent=playing?'♫ 음악 끄기':'♫ 소리 켜기';button.setAttribute('aria-pressed',String(playing));button.setAttribute('aria-label',playing?'시작화면 배경음악 끄기':'시작화면 배경음악 켜기');window.homeAudioInfo={status:status||(playing?'playing':muted?'muted':'waiting'),source:m?.currentSrc||m?.src||'',playing,currentTime:m?.currentTime||0,volume:m?.volume||0};}
function stop(){const m=music();if(m){m.muted=true;m.pause();}update('paused');}
async function play(){const m=music();if(!m||!visible()||muted){if(m){m.muted=true;m.pause();}update();return false}if(!m.paused){update();return true}if(pending)return pending;
 m.muted=false;window.GameAudio?.media(m,'home');pending=(async()=>{try{await m.play();if(!visible()||muted){m.pause();update('paused');return false}update('playing');return true}catch(e){update(e.name==='NotAllowedError'?'gesture-required':'error');return false}finally{pending=null}})();return pending;}
async function enable(){muted=false;try{localStorage.setItem('grandpa-home-music-muted','0')}catch{}return play()}
function toggle(){const m=music();if(m&&!m.paused&&!m.muted){muted=true;try{localStorage.setItem('grandpa-home-music-muted','1')}catch{}stop()}else enable();}
function ready(){const m=music();if(m&&m!==tracked){tracked=m;for(const event of ['play','pause','timeupdate','error'])m.addEventListener(event,()=>update());}play();}
button.onclick=toggle;frame.addEventListener('load',ready);document.addEventListener('visibilitychange',()=>visible()?play():stop());
new MutationObserver(()=>visible()?play():stop()).observe(document.body,{attributes:true,attributeFilter:['class']});
window.GameHome.enableHomeAudio=enable;window.GameHome.toggleMusic=toggle;window.GameHome.pauseHomeAudio=stop;ready();
})();
