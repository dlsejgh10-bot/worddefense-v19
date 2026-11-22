(()=>{
 'use strict';
 const data=window.DANCE_POSES,textures={};
 const phases={'unit-hip-grandpa':0,'unit-hip-grandma-purple':.125,'unit-hip-grandma-teal':.375,'unit-hip-grandma-coral':.25};
 async function load(){await Promise.all(Object.values(data).flatMap(actor=>actor.frames).map(path=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{textures[path]=img;resolve()};img.onerror=()=>reject(new Error('Missing dance pose '+path));img.src=path})));}
 function draw(ctx,item,seconds,bpm,options={}){
  const actor=data[item.image];if(!actor)return null;
  const beat=Math.max(0,seconds)*bpm/60+(options.phase??phases[item.image]??0);
  const grandpa=item.image==='unit-hip-grandpa';
  const cycle=beat*(grandpa?2:4),index=Math.floor(cycle)%actor.frames.length,subframe=cycle-Math.floor(cycle);
  const floorwork=grandpa&&index>=9&&index<=14;
  const pulse=Math.exp(-(beat%1)*6);
  const sway=Math.sin(beat*Math.PI)*(floorwork?actor.width*.012:grandpa?actor.width*.065:actor.width*.018);
  const squash=1-(grandpa?.07:.028)*pulse+(grandpa?.024:.009)*Math.sin(beat*Math.PI*2);
  const stretch=1+(grandpa?.035:.012)*pulse;
  const tilt=Math.sin(beat*Math.PI)*(floorwork?.035:grandpa?.055:.022);
  const position=cycle%actor.frames.length;
  const approach=Math.max(0,Math.min(1,position-8)),returning=Math.max(0,Math.min(1,15-position));
  const travel=grandpa?-85*approach*returning:0;
  ctx.save();ctx.translate(item.x+item.w*.5+sway*item.w/actor.width+travel,item.y+item.h-(grandpa&&!floorwork?11*Math.max(0,Math.sin(beat*Math.PI*2)):0));
  ctx.rotate(tilt);ctx.scale(item.w/actor.width*stretch,item.h/actor.height*squash);
  ctx.drawImage(textures[actor.frames[index]],-actor.width*.5-actor.padX,-actor.height-actor.padY,actor.frameWidth,actor.frameHeight);ctx.restore();
  return {image:item.image,pose:index,subframe,beat,sway,squash,dance:floorwork?'breakdance':'hip-dance'};
 }
 window.DanceAnimation={load,draw,rigs:data,choreography:Array.from({length:8},(_,index)=>({pose:index}))};
})();
