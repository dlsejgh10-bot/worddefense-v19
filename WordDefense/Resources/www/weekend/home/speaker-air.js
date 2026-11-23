(()=>{
 'use strict';
 // b174: same radial "air pressure" refraction as the old SVG feDisplacementMap version,
 // drawn as concentric elliptical rings with plain drawImage scaling (no SVG filter per frame).
 // Old: offset = scale*(108/255)*sin(14r - 2πphase)*(1-r²)² along the radius, feathered with a radial mask.
 const w=430,h=510,rings=10,inner=.5,k=108/255,half=(w+h)/4;   // r<.5 sits fully behind the speaker art drawn on top, so only the visible outer band is refracted
 let mask=null,maskScale=0;
 const units=[0,1].map(()=>{const buffer=document.createElement('canvas');return {buffer,painter:buffer.getContext('2d')};});
 function featherMask(s){
  if(mask&&maskScale===s)return mask;
  mask=document.createElement('canvas');mask.width=Math.round(w*s);mask.height=Math.round(h*s);maskScale=s;
  const p=mask.getContext('2d');p.setTransform(s*w*.5,0,0,s*h*.5,s*w*.5,s*h*.5);
  const g=p.createRadialGradient(0,0,.45,0,0,1);g.addColorStop(0,'#fff');g.addColorStop(1,'#fff0');p.fillStyle=g;p.fillRect(-1,-1,2,2);
  return mask;
 }
 function draw(context,source,speakers,beat,strength=1){
  const phase=beat-Math.floor(beat),frame=Math.floor(phase*24)%24,wavePhase=frame/24*Math.PI*2;
  const amplitude=(8+23*Math.exp(-phase*5))*strength;
  const ss=source.width/1080,s=ss*.55,m=featherMask(s),info=[];   // refraction band is soft (feathered, blurred wall behind) -> half-res buffer
  speakers.forEach((speaker,index)=>{
   const unit=units[index],cx=speaker.x+speaker.w*.5,cy=speaker.y+speaker.h*.5;
   const x=cx-w*.5,y=cy-h*.5,bw=Math.round(w*s),bh=Math.round(h*s);
   if(unit.buffer.width!==bw||unit.buffer.height!==bh){unit.buffer.width=bw;unit.buffer.height=bh;}
   const p=unit.painter;p.setTransform(1,0,0,1,0,0);p.globalCompositeOperation='source-over';p.clearRect(0,0,bw,bh);
   // unchanged base (outer ring area), then each ring sampled from its displaced radius
   p.drawImage(source,x*ss,y*ss,w*ss,h*ss,0,0,bw,bh);
   for(let i=0;i<rings;i++){
    const r0=inner+(1-inner)*i/rings,r1=inner+(1-inner)*(i+1)/rings,r=(r0+r1)*.5;
    const env=Math.pow(Math.max(0,1-r*r),2),wave=Math.sin(r*14-wavePhase)*env;
    const d=amplitude*k*wave*Math.min(1,r/.08);           // px along the radius (center clamp like the old map)
    const zoom=r/(r+d/half);                               // sample at r+d -> draw source scaled by r/(r+d)
    if(Math.abs(zoom-1)<.002)continue;
    p.save();p.setTransform(s,0,0,s,0,0);
    p.beginPath();p.ellipse(w*.5,h*.5,w*.5*r1,h*.5*r1,0,0,Math.PI*2);p.ellipse(w*.5,h*.5,w*.5*r0,h*.5*r0,0,0,Math.PI*2,true);p.clip();
    p.translate(w*.5,h*.5);p.scale(zoom,zoom);p.translate(-w*.5,-h*.5);
    p.drawImage(source,x*ss,y*ss,w*ss,h*ss,0,0,w,h);p.restore();
   }
   p.globalCompositeOperation='destination-in';p.drawImage(m,0,0);p.globalCompositeOperation='source-over';
   context.drawImage(unit.buffer,x,y,w,h);info.push({x,y,width:w,height:h,frame,amplitude});
  });
  window.speakerAirFrameInfo=info;
 }
 window.SpeakerAir={draw};
})();
