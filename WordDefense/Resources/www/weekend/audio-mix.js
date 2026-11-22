(()=>{'use strict';
// Track gains normalize music to -18 LUFS. The user slider is applied once.
const sfxTrim=1;
function musicLevel(settings,src,kind,levels){
 const entry=Object.entries(levels||{}).find(([path])=>src.endsWith(path));
 const normalized=entry?.[1].gain??(kind==='home'?.508405:1);
 return Math.max(0,Math.min(1,settings.bgm*normalized));
}
function applyLevel(media,level){
 const node=media.weekendGainNode;
 if(node){node.gain.setTargetAtTime(level,node.context.currentTime,.012);media.volume=1;}
 else media.volume=level;
}
function connect(media,ctx,input,level){
 if(media.weekendGainNode)return;
 const node=ctx.createGain();node.gain.value=level;
 input.connect(node);node.connect(ctx.destination);media.weekendGainNode=node;media.volume=1;
}
window.WeekendAudioMix=Object.freeze({sfxTrim,musicLevel,applyLevel,connect});
})();
