(function(root){'use strict';
function compute(width,height,embedded,headerRatio=1946/488,startRatio=1789/495){
 const crop=embedded?245:0,H=Math.round(height/width*1080)+crop;
 const baseHeight=880/startRatio+32+32+110+18+398+8+650/headerRatio;
 const footerScale=Math.min(1,Math.max(.35,(H-24-1460)/baseHeight)),k=footerScale;
 const button={x:(1080-880*k)/2,w:880*k,h:880*k/startRatio};button.y=H-button.h-24;
 const remainingY=button.y-32*k,progress={x:36,y:remainingY-142*k,w:1008,h:110*k};
 const carousel={x:30,y:progress.y-416*k,w:1020,h:398*k,cardWidth:270*k,gap:20*k};
 const heading={x:(1080-650*k)/2,w:650*k,h:650*k/headerRatio};heading.y=carousel.y-8*k-heading.h;
 return{W:1080,H,crop,scale:width/1080,footerScale,button,remainingY,progress,carousel,heading};
}
const api={compute};root.WeekendLayout=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
