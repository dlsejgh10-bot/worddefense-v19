(()=>{'use strict';
const contexts=new WeakMap(),media=new Map();
function settings(){let s;try{s=parent.WDWeekendHost?.audioSettings?.()}catch{}if(!s){try{const v=JSON.parse(localStorage.getItem('wd_settings')||'{}');s={bgm:v.bgmVol??.5,sfx:v.sfxVol??.75}}catch{s={bgm:.5,sfx:.75}}}return{bgm:Math.max(0,Math.min(1,Number(s.bgm))),sfx:Math.max(0,Math.min(1,Number(s.sfx))),master:s.master??.6};}
function sync(){const s=settings();for(const [el,kind]of media){const src=el.getAttribute?.('src')||el.src||'';el.volume=window.WeekendAudioMix.musicLevel(s,src,kind,window.AudioLevels);}for(const v of buses)v.gain.setTargetAtTime(s.sfx*.6*s.master,v.context.currentTime,.035);window.gameAudioInfo={...s,musicGain:s.bgm*.55*s.master,sfxGain:s.sfx*.6*s.master,homeReductionDb:window.WeekendAudioMix.homeReductionDb,source:'worddefense-settings'};}
const buses=new Set();
function output(ctx){if(!contexts.has(ctx)){const bus=ctx.createGain();bus.gain.value=settings().sfx*.6*settings().master;bus.connect(ctx.destination);contexts.set(ctx,bus);buses.add(bus)}return contexts.get(ctx);}
function register(el,kind){media.set(el,kind);sync();return el;}
window.GameAudio={output,media:register,sync,settings};setInterval(sync,1000);addEventListener('focus',sync);
})();
