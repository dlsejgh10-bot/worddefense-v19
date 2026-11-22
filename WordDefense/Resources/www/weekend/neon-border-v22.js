(()=>{'use strict';let glow=.14,lastNow=0,lastSong=-1;const hazeTiles=new Map();
function hazeTile(color){if(!hazeTiles.has(color)){const c=document.createElement('canvas');c.width=c.height=192;const g=c.getContext('2d'),f=g.createRadialGradient(96,96,0,96,96,96);f.addColorStop(0,color+'c0');f.addColorStop(.23,color+'88');f.addColorStop(.55,color+'30');f.addColorStop(1,color+'00');g.fillStyle=f;g.fillRect(0,0,192,192);hazeTiles.set(color,c)}return hazeTiles.get(color)}
function draw(g,s){const a=s.audioReaction||{},playing=s.mode==='playing',raw=playing?Math.min(1,a.impact||0):0,level=playing?(a.level||0):0,now=performance.now()/1000;
 if(!playing){glow=.14;lastNow=now;lastSong=s.time;window.neonBorderInfo={playing:false,opacity:0,softGlow:true,lineStrokes:0,style:'smooth-bloom',musicOnly:true};return;}
 const dt=lastNow?Math.min(.05,Math.max(0,now-lastNow)):1/60;lastNow=now;
 if(lastSong>=0&&Math.abs(s.time-lastSong)>.6)glow=.14;lastSong=s.time;
 // A calm base and asymmetric easing turn drum transients into breathing light.
 const target=level>.005?.14+.36*raw:0,timeConstant=target>glow?.10:.30;
 glow+=(target-glow)*(1-Math.exp(-dt/timeConstant));const opacity=Math.min(.5,Math.max(0,glow)),pulse=Math.max(0,(opacity-.14)/.36);
 window.neonBorderInfo={source:a.source||'inactive',playing:true,pulse,rawPulse:raw,level,opacity,softGlow:true,lineStrokes:0,musicOnly:true,edges:4,impactSource:'measured-kick-snare',style:'smooth-bloom',attackSeconds:.10,releaseSeconds:.30};
 if(opacity<.005)return;const gold=s.feverActive,left=gold?'#ffd064':'#24d9ed',right=gold?'#ffbb3e':'#e95fae',spread=1+pulse*.24;g.save();g.globalCompositeOperation='lighter';
 function haze(x,y,rx,ry,color,v){g.globalAlpha=v;g.drawImage(hazeTile(color),x-rx,y-ry,rx*2,ry*2)}
 haze(5,window.GameLayout.H/2,72*spread,window.GameLayout.H*.69,left,opacity);haze(847,window.GameLayout.H/2,72*spread,window.GameLayout.H*.69,right,opacity);haze(426,5,590,76*spread,left,opacity*.8);haze(426,window.GameLayout.H-5,590,90*spread,right,opacity*.85);g.restore();}
window.NeonBorder={draw};})();
