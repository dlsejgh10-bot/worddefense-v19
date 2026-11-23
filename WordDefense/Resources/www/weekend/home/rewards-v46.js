(()=>{'use strict';
window.weekendUiReady=false;
let info={plays:0,entriesLeft:2,entryLimit:2,open:true,claimed:[],rewards:[]},art={},geometry;
let queuedReward=0,rewardSlide=0;
let embedded=false;try{embedded=!!(window.parent.WeekendClient?.embedded||window.parent.parent?.WDWeekendHost)}catch{}
const sceneBase=layout.scene.map(item=>({...item})),originalHud=hud;
hud=function(){if(!embedded)originalHud();};
const fallback=[['gold',5000,'coin'],['gem',100,'gem'],['gold',5000,'coin'],['gem',300,'gem'],['key',1,'key'],['stone',1,'stone']];
function refresh(value){
 const previouslyAvailable=new Set(rewards.filter(card=>card.available).map(card=>card.plays));
 info=value||info;rewards.splice(0,rewards.length,...fallback.map(([type,amount,icon],i)=>{const def=info.rewards?.find(r=>r.stage===i+1);return{plays:i+1,type:def?.type||type,amount:(def?.amount??amount).toLocaleString(),image:'wd-'+(def?.icon||icon),received:info.claimed?.includes(i+1),available:(info.plays||0)>=i+1&&!info.claimed?.includes(i+1)}}));
 for(const card of rewards)if(card.available&&!previouslyAvailable.has(card.plays))queuedReward=card.plays;
 uiDirty=true;
 if(assetsReady)draw();
 focusClaimableReward();
}
window.setWeekendSnapshot=refresh;
function setRewardOffset(value){const c=layout.carousel,max=Math.max(0,rewards.length*(c.cardWidth+c.gap)-c.gap-c.w);state.rewardOffset=Math.max(0,Math.min(max,Number(value)||0));uiDirty=true;draw();}
function cancelRewardSlide(){cancelAnimationFrame(rewardSlide);rewardSlide=0;}
function focusClaimableReward(){
 if(!queuedReward||!window.weekendUiReady||window.parent.GameHome?.visible===false)return;
 const index=queuedReward-1;queuedReward=0;
 if(!rewards[index]?.available)return;
 cancelRewardSlide();
 const c=layout.carousel,left=index*(c.cardWidth+c.gap),right=left+c.cardWidth;
 const from=state.rewardOffset;
 const to=right>from+c.w?right-c.w+12:left<from?Math.max(0,left-12):from;
 if(to===from)return;
 if(reducedMotion){setRewardOffset(to);return;}
 const started=performance.now();
 function slide(now){const p=Math.max(0,Math.min(1,(now-started)/470));setRewardOffset(from+(to-from)*(1-(1-p)**3));rewardSlide=p<1?requestAnimationFrame(slide):0;}
 rewardSlide=requestAnimationFrame(slide);
}
window.focusClaimableReward=focusClaimableReward;
function fit(){const width=typeof innerWidth==='number'?innerWidth:1080,height=typeof innerHeight==='number'?innerHeight:2340;
 geometry=window.WeekendLayout.compute(width,height,embedded,art.header?art.header.width/art.header.height:undefined,art.start?art.start.width/art.start.height:undefined);
 window.setHomeRenderHeight(geometry.H);Object.assign(layout.carousel,geometry.carousel);Object.assign(layout.button,geometry.button);
 sceneBase.forEach((item,i)=>Object.assign(layout.scene[i],item));
 document.documentElement.style.overflow='hidden';document.body.style.overflow='hidden';
 Object.assign(layout.title,{x:115,y:310,w:850,h:850*187/868});Object.assign(layout.schedule,{x:375,y:482,w:330,h:330*83/402});
 Object.assign(canvas.style,{position:'absolute',maxWidth:'none',maxHeight:'none',width:width+'px',height:geometry.H*geometry.scale+'px',left:'0px',top:-geometry.crop*geometry.scale+'px',aspectRatio:'auto'});
 window.weekendLayoutInfo={...geometry,headerRatio:geometry.heading.w/geometry.heading.h,startRatio:geometry.button.w/geometry.button.h};uiDirty=true;if(assetsReady)draw();
}
addEventListener('resize',fit);
function aura(x,y,r,color,time,index){ctx.save();ctx.globalCompositeOperation='screen';ctx.translate(x,y);ctx.rotate(reducedMotion?0:time*.11+index*.8);const g=ctx.createRadialGradient(0,0,0,0,0,r);g.addColorStop(0,`rgba(${color},.44)`);g.addColorStop(.42,`rgba(${color},.21)`);g.addColorStop(1,`rgba(${color},0)`);ctx.fillStyle=g;ctx.fillRect(-r,-r,r*2,r*2);for(let i=0;i<5;i++){ctx.rotate(Math.PI*2/5);const beam=ctx.createLinearGradient(0,0,r,0);beam.addColorStop(0,`rgba(${color},.08)`);beam.addColorStop(1,`rgba(${color},0)`);ctx.fillStyle=beam;ctx.beginPath();ctx.moveTo(0,-8);ctx.quadraticCurveTo(r*.5,-r*.23,r,0);ctx.quadraticCurveTo(r*.5,r*.23,0,8);ctx.fill();}ctx.restore();}
function shimmer(x,y,w,h,time,index){if(reducedMotion)return;const p=((time+index*.47)%4.8)/1.15;if(p>1)return;ctx.save();ctx.beginPath();ctx.moveTo(x+22,y+8);ctx.lineTo(x+w-22,y+8);ctx.lineTo(x+w-8,y+26);ctx.lineTo(x+w-8,y+h-26);ctx.lineTo(x+w-26,y+h-8);ctx.lineTo(x+26,y+h-8);ctx.lineTo(x+8,y+h-26);ctx.lineTo(x+8,y+26);ctx.closePath();ctx.clip();ctx.globalCompositeOperation='screen';const center=x-w*.6+p*w*2.4,g=ctx.createLinearGradient(center-75,0,center+75,0);g.addColorStop(0,'#b2faff00');g.addColorStop(.5,'#d8ffff29');g.addColorStop(1,'#b2faff00');ctx.transform(1,0,-.24,1,y*.24,0);ctx.fillStyle=g;ctx.fillRect(center-75,y,150,h);ctx.restore();}
rewardCard=function(reward,index){const{x,y:actualY,cardWidth:actualWidth,gap}=layout.carousel,actualLeft=x+index*(actualWidth+gap)-state.rewardOffset;if(actualLeft+actualWidth<x-18||actualLeft>x+layout.carousel.w+18)return;const q=actualWidth/312;ctx.save();ctx.translate(actualLeft,actualY);ctx.scale(q,q);const left=0,y=0,w=312,h=460;
 ctx.save();if(reward.available){ctx.shadowColor='#00eaff';ctx.shadowBlur=12;}ctx.drawImage(art.card,left,y,w,h);ctx.restore();shimmer(left,y,w,h,effects.time,index);
 text(`${reward.plays}회 보상`,left+w*.46,y+58,41,'#fff','center');
 const colors={gold:'255,190,38',gem:'19,221,255',key:'255,212,72',stone:'120,173,255'};
 aura(left+w/2,y+209,142,colors[reward.type]||colors.gem,effects.time,index);
 const icon=images[reward.image];if(icon){const scale=Math.min(165/icon.width,147/icon.height);ctx.drawImage(icon,left+w/2-icon.width*scale/2,y+128,icon.width*scale,icon.height*scale);}
 text(reward.amount,left+w/2,y+317,54,'#fff','center');
 const button=art[reward.received?'done':reward.available?'ready':'locked'];if(!button){ctx.restore();return;}const bw=w-44,bh=115,scale=Math.min(bw/button.width,bh/button.height);ctx.drawImage(button,left+(w-button.width*scale)/2,y+337+(bh-button.height*scale)/2,button.width*scale,button.height*scale);ctx.restore();
};
progress=function(){const {x,y,w,h}=geometry.progress,k=geometry.footerScale;if(!art.progressFrame||!art.progressMint||!art.progressNavy)return;ctx.save();ctx.drawImage(art.progressFrame,x,y,w,h);const pad=13*k,gap=0,cw=(w-2*pad)/6,top=y+12*k,ch=h-24*k,complete=Math.min(6,info.plays||0);for(let i=0;i<6;i++){const left=x+pad+i*cw,done=i<complete;ctx.drawImage(done?art.progressMint:art.progressNavy,left,top,cw,ch);text(`${i+1}회`,left+cw/2,top+ch/2,40*k,done?'#001510':'#fff','center',false);}ctx.restore();};

drawUi=function(){const previous=ctx;ctx=uiCanvas.getContext('2d');ctx.clearRect(0,0,1080,geometry.H);layer(layout.title);layer(layout.schedule);hud();const head=geometry.heading;
 const bg=ctx.createLinearGradient(0,head.y,0,geometry.H);bg.addColorStop(0,'#05143400');bg.addColorStop(.11,'#051331');bg.addColorStop(1,'#04112e');ctx.fillStyle=bg;ctx.fillRect(0,head.y-20,1080,geometry.H-head.y+20);
 if(art.header){ctx.drawImage(art.header,head.x,head.y,head.w,head.h);text('주말 보상',head.x+head.w*.58,head.y+head.h*.52,56*geometry.footerScale,'#fff','center');}
 const c=layout.carousel;ctx.save();ctx.beginPath();ctx.rect(c.x,c.y-18,c.w,c.h+36);ctx.clip();if(art.card&&art.ready)rewards.forEach(rewardCard);ctx.restore();if(art.progress)progress();
 text(`오늘 남은 입장 ${Math.max(0,info.entriesLeft??info.entryLimit??2)} / ${info.entryLimit??2}`,540,geometry.remainingY,35*geometry.footerScale,'#fff','center',false);
 const b=layout.button;ctx.save();const adOffer=!!info.open&&!info.testUnlimited&&info.entriesLeft<=0&&info.adPlaysLeft>0,label=adOffer?'광고보고 한판 더':'댄스 시작';let size=80*geometry.footerScale;if(adOffer){ctx.font=`400 ${size}px Game,sans-serif`;const w=ctx.measureText(label).width;if(w>b.w*.8)size*=b.w*.8/w;}ctx.globalAlpha=info.open&&(info.testUnlimited||info.entriesLeft>0||adOffer)?1:.55;if(art.start){ctx.drawImage(art.start,b.x,b.y+(state.press?5:0),b.w,b.h);text(label,b.x+b.w/2,b.y+b.h*.48+(state.press?5:0),size,'#fff','center');}ctx.restore();ctx=previous;uiDirty=false;
};
window.setRewardOffset=value=>{cancelRewardSlide();setRewardOffset(value);};
let touch;
canvas.addEventListener('pointerdown',e=>{touch=canvasPoint(e);},{capture:true});
canvas.addEventListener('pointerup',e=>{const p=canvasPoint(e),c=layout.carousel;if(touch&&Math.hypot(touch.x-p.x,touch.y-p.y)<15&&p.x>=c.x&&p.x<=c.x+c.w&&p.y>=c.y+337*c.cardWidth/312&&p.y<=c.y+452*c.cardWidth/312){const index=Math.floor((p.x-c.x+state.rewardOffset)/(c.cardWidth+c.gap)),left=c.x+index*(c.cardWidth+c.gap)-state.rewardOffset;if(p.x>=left+22&&p.x<=left+c.cardWidth-22&&rewards[index]?.available){window.parent.WeekendClient?.claim?.(index+1);refresh(window.parent.WeekendClient?.snapshot?.());}}touch=null;},{capture:true});
const sources={progressFrame:'progress-frame-v51.webp',progressMint:'progress-mint-v51.webp',progressNavy:'progress-navy-v51.webp',header:'ticket-header-v45.webp',card:'ticket-card-v45.webp',progress:'ticket-progress-v45.webp',start:'ticket-start-v45.webp',ready:'status-ready-v46.webp',done:'status-done-v46.webp',locked:'status-locked-v46.webp'};for(const n of ['coin','gem','key','stone'])sources['wd-'+n]='wd-'+n+'.webp';
window.weekendUiAssetsReady=Promise.all(Object.entries(sources).map(([key,src])=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{art[key]=im;if(key.startsWith('wd-'))images[key]=im;resolve()};im.onerror=()=>reject(new Error('Missing reward asset: '+src));im.src='assets/'+src}))).then(()=>{window.weekendUiReady=true;fit();refresh(window.parent.WeekendClient?.snapshot?.()||info)});
window.weekendUiAnimated=true;fit();refresh(window.parent.WeekendClient?.snapshot?.()||info);
})();
