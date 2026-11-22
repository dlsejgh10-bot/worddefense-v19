(()=>{'use strict';
// Shared by the host and its game iframe so entering the lobby cannot reset its level.
const homeGain=Math.pow(10,-9/20);
function musicLevel(settings,src,kind,levels){
 const entry=Object.entries(levels||{}).find(([path])=>src.endsWith(path));
 const isHome=kind==='home'||src.endsWith('audio/music.wav');
 const normalized=entry?.[1].gain??(isHome?.508405:1);
 return Math.max(0,Math.min(1,settings.bgm*.55*settings.master*normalized*(isHome?homeGain:1)));
}
window.WeekendAudioMix=Object.freeze({homeGain,homeReductionDb:-9,musicLevel});
})();
