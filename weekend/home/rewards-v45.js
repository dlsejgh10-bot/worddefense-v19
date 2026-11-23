(()=>{'use strict';
window.weekendUiReady=false;
let info={plays:0,entriesLeft:2,entryLimit:2,open:true,claimed:[],rewards:[]},art={};
let embedded=false;try{embedded=!!(window.parent.WeekendClient?.embedded||window.parent.parent?.WDWeekendHost)}catch{}
Object.assign(layout.carousel,{x:32,y:1550,w:1016,h:400,cardWidth:292,gap:18});
const fallback=[['gold',5000,'coin'],['gem',100,'gem'],['gold',5000,'coin'],['gem',300,'gem'],['key',1,'key'],['stone',1,'stone']];
function refresh(value){info=value||info;rewards.splice(0,rewards.length,...fallback.map(([type,amount,icon],i)=>{const def=info.rewards?.find(r=>r.stage===i+1);return{plays:i+1,type:def?.type||type,amount:(def?.amount??amount).toLocaleString(),image:'wd-'+(def?.icon||icon),received:info.claimed?.includes(i+1),available:(info.plays||0)>=i+1&&!info.claimed?.includes(i+1)}}));uiDirty=true;if(assetsReady)draw();}
window.setWeekendSnapshot=refresh;
const originalHud=hud;hud=function(){if(!embedded)originalHud();};
function plate(img,x,y,w,h){if(!img)return;const l=114,r=87,scale=h/img.height,cl=l*scale,cr=r*scale;ctx.drawImage(img,0,0,l,img.height,x,y,cl,h);ctx.drawImage(img,l+1,0,img.width-l-r-2,img.height,x+cl,y,w-cl-cr,h);ctx.drawImage(img,img.width-r,0,r,img.height,x+w-cr,y,cr,h);}
rewardCard=function(reward,index){const{x,y,cardWidth:w,gap,h}=layout.carousel,left=x+index*(w+gap)-state.rewardOffset;
 ctx.save();if(reward.available){ctx.shadowColor='#00f8ff';ctx.shadowBlur=18;}ctx.drawImage(art.card,left,y,w,h);ctx.restore();
 text(`${reward.plays}회 보상`,left+w*.45,y+53,36,'#fff','center');
 const icon=images[reward.image];if(icon){const sc=Math.min(146/icon.width,132/icon.height);ctx.drawImage(icon,left+w/2-icon.width*sc/2,y+111,icon.width*sc,icon.height*sc);}
 text(reward.amount,left+w/2,y+269,49,'#fff','center');
 plate(reward.received?art.done:reward.available?art.ready:art.locked,left+27,y+296,w-54,83);
 if(reward.received){ctx.save();ctx.strokeStyle='#fff';ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(left+49,y+335);ctx.lineTo(left+59,y+345);ctx.lineTo(left+78,y+324);ctx.stroke();ctx.restore();text('수령 완료',left+w/2+17,y+336,32,'#fff','center');}
 else if(reward.available)text('받기',left+w/2,y+336,43,'#fff','center');
 else{lock(left+w/2-49,y+326,27);text('잠금',left+w/2+18,y+336,37,'#fff','center');}
};
progress=function(){const x=38,y=1980,w=1004,h=100;ctx.drawImage(art.progress,x,y,w,h);
 const completed=Math.min(6,info.plays||0),first=.023,step=.1598;
 for(let i=0;i<6;i++){const left=x+w*(first+i*step),cw=w*.157;
 if(i<completed){ctx.save();ctx.beginPath();const p=[[left+17,y+14],[left+cw-17,y+14],[left+cw,y+29],[left+cw,y+73],[left+cw-17,y+86],[left+17,y+86],[left,y+73],[left,y+29]];p.forEach(([a,b],j)=>j?ctx.lineTo(a,b):ctx.moveTo(a,b));ctx.closePath();const grad=ctx.createLinearGradient(0,y,0,y+h);grad.addColorStop(0,'#67ffd0');grad.addColorStop(1,'#0beba2');ctx.fillStyle=grad;ctx.fill();ctx.restore();}
 text(`${i+1}회`,left+cw/2,y+50,39,i<completed?'#031b20':'#fff','center',false);}
};
drawUi=function(){const previous=ctx;ctx=uiCanvas.getContext('2d');ctx.clearRect(0,0,1080,2340);layer(layout.title);layer(layout.schedule);hud();
 if(art.header){ctx.drawImage(art.header,110,1375,860,160);text('주말 보상',600,1456,65,'#fff','center');}
 const c=layout.carousel;ctx.save();ctx.beginPath();ctx.rect(c.x,c.y-18,c.w,c.h+36);ctx.clip();if(art.card)rewards.forEach(rewardCard);ctx.restore();if(art.progress)progress();
 text(`오늘 남은 입장 ${Math.max(0,info.entriesLeft??info.entryLimit??2)} / ${info.entryLimit??2}`,540,2116,32,'#fff','center',false);
 const b=layout.button;ctx.save();ctx.globalAlpha=info.open&&info.entriesLeft>0?1:.55;if(art.start){ctx.drawImage(art.start,b.x,b.y+(state.press?5:0),b.w,b.h);text('댄스 시작',b.x+b.w/2,b.y+b.h*.47+(state.press?5:0),87,'#fff','center');}ctx.restore();ctx=previous;uiDirty=false;
};
// The start button and hit target share the same rectangle, including its new offset.
layout.button.y=2155;layout.button.h=165;
window.setRewardOffset=value=>{const c=layout.carousel,max=Math.max(0,rewards.length*(c.cardWidth+c.gap)-c.gap-c.w);state.rewardOffset=Math.max(0,Math.min(max,Number(value)||0));draw();};
let touch;
canvas.addEventListener('pointerdown',e=>{touch=canvasPoint(e);if(!embedded&&touch.y>150&&touch.y<245&&touch.x<130)window.parent.WeekendClient?.host?.close?.();},{capture:true});
canvas.addEventListener('pointerup',e=>{const p=canvasPoint(e),c=layout.carousel;if(touch&&Math.hypot(touch.x-p.x,touch.y-p.y)<15&&p.x>=c.x&&p.x<=c.x+c.w&&p.y>=c.y+296&&p.y<=c.y+379){const index=Math.floor((p.x-c.x+state.rewardOffset)/(c.cardWidth+c.gap)),left=c.x+index*(c.cardWidth+c.gap)-state.rewardOffset;if(p.x>=left+27&&p.x<=left+c.cardWidth-27&&rewards[index]?.available){window.parent.WeekendClient?.claim?.(index+1);refresh(window.parent.WeekendClient?.snapshot?.());}}touch=null;},{capture:true});
function fitEmbedded(){if(!embedded)return;const crop=245,visible=2340-crop,scale=Math.min(innerWidth/1080,innerHeight/visible);Object.assign(canvas.style,{position:'absolute',maxWidth:'none',maxHeight:'none',width:1080*scale+'px',height:2340*scale+'px',left:(innerWidth-1080*scale)/2+'px',top:((innerHeight-visible*scale)/2-crop*scale)+'px'});}
addEventListener('resize',fitEmbedded);fitEmbedded();
const sources={header:'ticket-header-v45.webp',card:'ticket-card-v45.webp',progress:'ticket-progress-v45.webp',start:'ticket-start-v45.webp',ready:'wd-button-short-lime.webp',done:'wd-button-short-mint.webp',locked:'wd-button-short-gray.webp'};
for(const n of ['coin','gem','key','stone'])sources['wd-'+n]='wd-'+n+'.webp';
Promise.all(Object.entries(sources).map(([key,src])=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{art[key]=im;if(key.startsWith('wd-'))images[key]=im;resolve()};im.onerror=reject;im.src='assets/'+src}))).then(()=>{window.weekendUiReady=true;refresh(window.parent.WeekendClient?.snapshot?.()||info)}).catch(e=>console.error('Ticket UI failed',e));
refresh(window.parent.WeekendClient?.snapshot?.()||info);
})();
