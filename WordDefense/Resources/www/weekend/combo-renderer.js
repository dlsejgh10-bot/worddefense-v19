(()=>{'use strict';
let normalAtlas,feverAtlas,cache=new Map();
function prepare(normal,fever){normalAtlas=normal;feverAtlas=fever;cache.clear();}
function layout(value,fever){const key=(fever?'f':'n')+value;if(cache.has(key))return cache.get(key);const meta=fever?window.COMBO_FEVER_ATLAS:window.COMBO_ATLAS;let at=0;const height=88,gap=-5,parts=String(value).split('').map(n=>{const m=meta.glyphs[n],w=m.w*height/m.h,p={m,x:at,w};at+=w+gap;return p});const result={parts,width:at-gap,height,word:meta.word};if(cache.size>240)cache.clear();cache.set(key,result);return result;}
function draw(g,s,t){if(!normalAtlas||s.combo<2){window.comboRenderInfo={visible:false,value:s.combo};return;}const fever=!!s.feverActive,atlas=fever?feverAtlas:normalAtlas,item=layout(s.combo,fever),age=Math.max(0,s.time-s.comboTime),hit=Math.exp(-age*20),spring=Math.sin(age*30)*Math.exp(-age*13),scale=Math.min(1,290/item.width)*(1+.10*hit+.025*spring),half=item.width/2,color=fever?'#ffbd19':'#ff149e';
 g.save();g.translate(426,730-3*hit);g.scale(scale,scale);g.shadowColor=color;g.shadowBlur=8+hit*12;
 for(const p of item.parts){const m=p.m;g.drawImage(atlas,m.x,m.y,m.w,m.h,p.x-half,-48,p.w,item.height);}
 const m=item.word,w=143,h=w*m.h/m.w;g.shadowBlur=3+hit*5;g.drawImage(atlas,m.x,m.y,m.w,m.h,-w/2,44,w,h);
 g.shadowBlur=8+hit*10;g.fillStyle=color;g.beginPath();[[-half-28,89],[half+83+10*hit,61],[half+49,77],[half+69,80]].forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();g.restore();
 window.comboRenderInfo={visible:true,style:fever?'gold-fever':'pink',value:s.combo,digits:String(s.combo).split(''),atlas:true,feverAtlas:fever,center:[426,730],scale,pulse:hit,spring,animationAge:age,caption:true,underline:true,extraDecorations:false,afterimages:false,bounds:{x:426-(half+32)*scale,y:730-60*scale,w:(item.width+132)*scale,h:154*scale}};
}
window.ComboRenderer={prepare,draw};
})();
