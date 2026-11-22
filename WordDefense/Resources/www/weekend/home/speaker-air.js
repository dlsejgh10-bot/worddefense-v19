(()=>{
 'use strict';
 // A neutral displacement map refracts the existing scene pixels; it draws no rings.
 const ns='http://www.w3.org/2000/svg',w=430,h=510,steps=24;
 const svg=document.createElementNS(ns,'svg');svg.setAttribute('width','0');svg.setAttribute('height','0');svg.style.position='absolute';
 const defs=document.createElementNS(ns,'defs');svg.append(defs);document.body.append(svg);
 const maps=[];
 for(let frame=0;frame<steps;frame++){
  const c=document.createElement('canvas');c.width=96;c.height=112;
  const p=c.getContext('2d'),pixels=p.createImageData(c.width,c.height);
  for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
   const dx=(x/(c.width-1)-.5)*2,dy=(y/(c.height-1)-.5)*2,r=Math.hypot(dx,dy),i=(y*c.width+x)*4;
   const envelope=Math.pow(Math.max(0,1-r*r),2),wave=Math.sin(r*14-frame/steps*Math.PI*2)*envelope;
   pixels.data[i]=128+Math.round(108*wave*dx/Math.max(.08,r));
   pixels.data[i+1]=128+Math.round(108*wave*dy/Math.max(.08,r));pixels.data[i+2]=128;pixels.data[i+3]=255;
  }
  p.putImageData(pixels,0,0);maps.push(c.toDataURL());
 }
 const units=[0,1].map(index=>{
  const filter=document.createElementNS(ns,'filter');filter.id='speaker-air-'+index;
  for(const [key,value] of Object.entries({x:'0',y:'0',width:'1',height:'1','color-interpolation-filters':'sRGB',primitiveUnits:'userSpaceOnUse'}))filter.setAttribute(key,value);
  const map=document.createElementNS(ns,'feImage');map.setAttribute('result','pressure');map.setAttribute('width',w);map.setAttribute('height',h);map.setAttribute('preserveAspectRatio','none');map.setAttribute('href',maps[0]);
  const displacement=document.createElementNS(ns,'feDisplacementMap');
  for(const [key,value] of Object.entries({in:'SourceGraphic',in2:'pressure',scale:'26',xChannelSelector:'R',yChannelSelector:'G'}))displacement.setAttribute(key,value);
  filter.append(map,displacement);defs.append(filter);
  const buffer=document.createElement('canvas');buffer.width=w;buffer.height=h;
  return {map,displacement,buffer,painter:buffer.getContext('2d'),filter:filter.id};
 });
 function draw(context,source,speakers,beat,strength=1){
  const phase=beat-Math.floor(beat),frame=Math.floor(phase*steps)%steps;
  const amplitude=(8+23*Math.exp(-phase*5))*strength;
  const info=[];
  speakers.forEach((speaker,index)=>{
   const unit=units[index],cx=speaker.x+speaker.w*.5,cy=speaker.y+speaker.h*.5;
   const x=cx-w*.5,y=cy-h*.5;
   unit.map.setAttribute('href',maps[frame]);unit.displacement.setAttribute('scale',String(amplitude));
   const p=unit.painter;p.clearRect(0,0,w,h);p.filter='url(#'+unit.filter+')';
   p.drawImage(source,x,y,w,h,0,0,w,h);p.filter='none';
   // Feather the region so the unchanged pixels join without a rectangular edge.
   p.globalCompositeOperation='destination-in';p.save();p.translate(w*.5,h*.5);p.scale(w*.5,h*.5);
   const mask=p.createRadialGradient(0,0,.45,0,0,1);mask.addColorStop(0,'#fff');mask.addColorStop(1,'#fff0');
   p.fillStyle=mask;p.fillRect(-1,-1,2,2);p.restore();p.globalCompositeOperation='source-over';
   context.drawImage(unit.buffer,x,y);info.push({x,y,width:w,height:h,frame,amplitude});
  });
  window.speakerAirFrameInfo=info;
 }
 window.SpeakerAir={draw};
})();
