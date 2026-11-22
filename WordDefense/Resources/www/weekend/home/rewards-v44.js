(()=>{'use strict';
window.weekendUiReady=false;
let info={plays:0,entriesLeft:3,open:true,claimed:[],rewards:[]},selectedButton,buttonBox,readyPlate,lockedPlate;
const fallback=[['gold',5000,'coin'],['gem',100,'gem'],['gold',5000,'coin'],['gem',300,'gem'],['key',1,'key'],['stone',1,'stone']];
function refresh(value){info=value||info;rewards.splice(0,rewards.length,...fallback.map(([type,amount,icon],i)=>{const def=info.rewards?.find(r=>r.stage===i+1);return{plays:i+1,type:def?.type||type,amount:(def?.amount??amount).toLocaleString(),image:({'coin':'wd-coin','gem':'wd-gem','key':'wd-key','stone':'wd-stone'})[def?.icon||icon],received:info.claimed?.includes(i+1),available:(info.plays||0)>=i+1&&!info.claimed?.includes(i+1)}}));layout.checkpoints.completed=Math.min(6,info.plays||0);uiDirty=true;if(assetsReady)draw();}
window.setWeekendSnapshot=refresh;
const originalHud=hud;
hud=function(){if(!info.profile){originalHud();return}const p=info.profile;
 box(124,43,325,82,15,'#293248','#101322',4);image('profile-knight',22,37,96,89);text(p.nick||'모험가',142,84,34);
 box(462,47,206,76,13,'#111b2d',null);if(images['wd-coin'])ctx.drawImage(images['wd-coin'],469,63,45,45);text(Number(p.gold||0).toLocaleString(),523,85,32);
 box(680,47,188,76,13,'#111b2d',null);if(images['wd-gem'])ctx.drawImage(images['wd-gem'],685,63,45,45);text(Number(p.gems||0).toLocaleString(),737,85,32);
 box(880,47,180,76,13,'#111b2d',null);bolt(908,85,25);text(`${Math.max(0,info.entriesLeft)}/3`,936,85,33);
 box(33,163,84,77,13,'#837367','#171923',5);ctx.strokeStyle='#fff';ctx.lineWidth=11;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(81,184);ctx.lineTo(61,201);ctx.lineTo(81,218);ctx.moveTo(63,201);ctx.lineTo(94,201);ctx.stroke();text('이벤트',146,202,51);
};
function tickMark(x,y,size=18){ctx.save();ctx.strokeStyle='#ffffff';ctx.lineWidth=4;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(x-size*.45,y);ctx.lineTo(x-size*.12,y+size*.32);ctx.lineTo(x+size*.5,y-size*.4);ctx.stroke();ctx.restore();}
function plate(img,x,y,w,h){if(!img)return;const l=101,r=77,scale=h/img.height,cl=l*scale,cr=r*scale;ctx.drawImage(img,0,0,l,img.height,x,y,cl,h);ctx.drawImage(img,l+1,0,img.width-l-r-2,img.height,x+cl,y,w-cl-cr,h);ctx.drawImage(img,img.width-r,0,r,img.height,x+w-cr,y,cr,h);}
rewardCard=function(reward,index){const{x,y,cardWidth,gap,h}=layout.carousel,left=x+index*(cardWidth+gap)-state.rewardOffset;
 image(reward.available?'reward-card-selected':'reward-card',left,y,cardWidth,h);
 box(left+24,y+20,222,46,16,'#192a43',null);text(`${reward.plays}회 플레이`,left+135,y+44,28,'#ffffff','center',false);
 const icon=images[reward.image];if(icon){const sc=Math.min(153/icon.width,116/icon.height);ctx.drawImage(icon,left+135-icon.width*sc/2,y+85,icon.width*sc,icon.height*sc);}
 text(reward.amount,left+135,y+226,38,'#ffffff','center');
 plate(reward.received||reward.available?readyPlate:lockedPlate,left+22,y+260,226,60);
 if(reward.received){tickMark(left+55,y+289,18);text('수령 완료',left+149,y+289,27,'#ffffff','center');}
 else if(reward.available)text('받기',left+135,y+289,32,'#ffffff','center');
 else{lock(left+83,y+283,22);text('잠금',left+151,y+289,28,'#ffffff','center');}
};
progress=function(){const total=6,complete=Math.min(total,info.plays||0),x=73,y=1965,width=934,gap=15,w=(width-gap*5)/6,h=64;
 text('누적 플레이',x,y-42,28,'#afc8db','left',false);text(`${complete} / 6`,x+width,y-42,30,'#ffffff','right',false);
 for(let i=0;i<total;i++){const left=x+i*(w+gap),done=i<complete,next=i===complete&&complete<6;
 if(i<total-1){ctx.fillStyle=i<complete-1?'#41cfd9':'#46586c';ctx.fillRect(left+w,y+30,gap,3);}
 ctx.save();if(done){ctx.shadowColor='#36d8dc';ctx.shadowBlur=10;}const fill=ctx.createLinearGradient(0,y,0,y+h);fill.addColorStop(0,done?'#238f9f':next?'#173b52':'#1a293e');fill.addColorStop(1,done?'#12637b':next?'#10283d':'#142033');box(left,y,w,h,18,fill,done?'#5ae6e5':next?'#49b9d0':'#3f526b',done||next?2.5:1.5);ctx.restore();
 if(done)tickMark(left+28,y+h/2,16);text(`${i+1}회`,left+w/2+(done?12:0),y+h/2,30,done||next?'#ffffff':'#b8c9d9','center',false);}
};
drawUi=function(){const previous=ctx;ctx=uiCanvas.getContext('2d');ctx.clearRect(0,0,1080,2340);layer(layout.title);layer(layout.schedule);hud();
 layer(layout.heading);text('주말 보상',321,1465,49,'#ffffff','center');text(`플레이 ${Math.min(6,info.plays||0)}회`,742,1465,43,'#ffffff','center');layer(layout.rewardPanel);
 const c=layout.carousel;ctx.save();ctx.beginPath();ctx.rect(c.x,c.y-8,c.w,c.h+18);ctx.clip();rewards.forEach(rewardCard);ctx.restore();progress();
 const b=layout.button;ctx.save();ctx.globalAlpha=info.open&&info.entriesLeft>0?1:.55;
 if(selectedButton&&buttonBox){const [sx,sy,sw,sh]=buttonBox;ctx.drawImage(selectedButton,sx,sy,sw,sh,b.x,b.y+(state.press?5:0),b.w,b.h);text('댄스 시작',b.x+b.w*.625,b.y+b.h*.47+(state.press?5:0),87,'#ffffff','center');}
 else image('dance-start-'+state.variant,b.x,b.y+(state.press?5:0),b.w,b.h);ctx.restore();
 text(`오늘 남은 입장 ${Math.max(0,info.entriesLeft??3)} / 3`,540,2079,29,'#ffffff','center',false);ctx=previous;uiDirty=false;
};
window.setRewardOffset=value=>{const c=layout.carousel,max=Math.max(0,rewards.length*(c.cardWidth+c.gap)-c.gap-c.w);state.rewardOffset=Math.max(0,Math.min(max,Number(value)||0));draw();};
let touch;
canvas.addEventListener('pointerdown',e=>{const p=canvasPoint(e);touch={...p};if(p.y>150&&p.y<245&&p.x<130)window.parent.WeekendClient?.host?.close?.();},{capture:true});
canvas.addEventListener('pointerup',e=>{const p=canvasPoint(e),c=layout.carousel;if(touch&&Math.hypot(touch.x-p.x,touch.y-p.y)<15&&p.y>=c.y+258&&p.y<=c.y+325){const i=Math.floor((p.x-c.x+state.rewardOffset)/(c.cardWidth+c.gap));if(rewards[i]?.available){window.parent.WeekendClient?.claim?.(i+1);refresh(window.parent.WeekendClient?.snapshot?.());}}touch=null;},{capture:true});
function load(name,src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src;});}
Promise.all([load('button','assets/dance-start-selected-clean-v44.webp'),load('ready','assets/wd-button-lime.webp'),load('locked','assets/wd-button-gray.webp'),...['coin','gem','key','stone'].map(n=>load(n,'assets/wd-'+n+'.webp'))]).then(([button,ready,locked,...icons])=>{
 selectedButton=button;readyPlate=ready;lockedPlate=locked;icons.forEach((im,i)=>images['wd-'+['coin','gem','key','stone'][i]]=im);
 const cv=document.createElement('canvas');cv.width=button.width;cv.height=button.height;const gc=cv.getContext('2d');gc.drawImage(button,0,0);const pixels=gc.getImageData(0,0,cv.width,cv.height).data;let left=cv.width,top=cv.height,right=0,bottom=0;
 for(let y=0;y<cv.height;y++)for(let x=0;x<cv.width;x++)if(pixels[(y*cv.width+x)*4+3]>16){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}
 window.weekendUiReady=true;buttonBox=[Math.max(0,left-5),Math.max(0,top-5),Math.min(cv.width-left,right-left+11),Math.min(cv.height-top,bottom-top+11)];refresh(window.parent.WeekendClient?.snapshot?.()||info);
}).catch(e=>console.error('Shared game UI failed',e));refresh(window.parent.WeekendClient?.snapshot?.()||info);
})();
