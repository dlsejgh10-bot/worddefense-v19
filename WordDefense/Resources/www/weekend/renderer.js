(()=>{'use strict';

const L=window.GameLayout={W:852,H:1846,left:36,laneWidth:195,centers:[133.5,328.5,523.5,718.5],colors:['#35edec','#ff67a5','#ffd14b','#579cff'],hitY:1568,spawnY:650,laneTop:620,approach:(window.SONG_CHART.approachSeconds||1.00),touchTop:1508,touchBottom:1815,keyY:1665,keyW:176,keyH:116};

const B=window.SONG_CHART.beat,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));

const musicalBeat=t=>(t-window.SONG_CHART.firstBeat)/B,beatPhase=t=>((musicalBeat(t)%1)+1)%1;

const moves=[{name:'엉덩이춤',frames:[1,2,3,4,5,4,3,2,1],beats:4},{name:'디스코 포인트',frames:[1,0,7,0,1],beats:2},{name:'발차기',frames:[1,6,7,6,1],beats:2},{name:'비보잉',frames:[8,9,10,11,11,12,13,14,15,1],beats:4}];

function onHit(s){const prev=s.pose??1,list=Array.from({length:16},(_,i)=>i).filter(i=>i!==1&&i!==prev);s.pose=list[Math.floor(Math.random()*list.length)];s.mirrored=Math.random()<.5;s.poseTime=s.time;s.danceHistory.push({pose:s.pose,mirrored:s.mirrored,start:s.time});}

function onMiss(s){s.pose=1;s.mirrored=false;s.poseTime=s.time;}

function onCombo(s){}

function box(g,x,y,w,h,r,fill,stroke=null,line=2){g.beginPath();g.roundRect(x,y,w,h,r);g.fillStyle=fill;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=line;g.stroke()}}

function text(g,s,x,y,size=40,color='#ffffff',align='center',outline=5){g.save();g.font=`${size}px Game`;g.textAlign=align;g.textBaseline='middle';g.lineJoin='round';if(outline){g.strokeStyle='#070c18';g.lineWidth=outline;g.strokeText(s,x,y)}g.fillStyle=color;g.fillText(s,x,y);g.restore()}

function contain(g,img,cx,cy,w,h){const scale=Math.min(w/img.width,h/img.height);g.drawImage(img,cx-img.width*scale/2,cy-img.height*scale/2,img.width*scale,img.height*scale)}

function bar(g,x,y,w,h,ratio,color){box(g,x-3,y-3,w+6,h+6,h/2+2,'#050a15','#6785a3',2);g.save();g.beginPath();g.roundRect(x,y,w,h,h/2);g.clip();const grad=g.createLinearGradient(0,y,0,y+h);grad.addColorStop(0,'#fff6b8');grad.addColorStop(.25,color);grad.addColorStop(1,color);box(g,x,y,w*clamp(ratio),h,h/2,grad);g.fillStyle='#ffffff20';g.fillRect(x,y,w,h*.4);g.restore()}

function dancer(g,poses,s,t){const index=s.pose??1,m=window.POSE_METRICS[index],beat=musicalBeat(t),pulse=Math.exp(-beatPhase(t)*7),age=Math.max(0,t-(s.poseTime??-10)),kick=Math.sin(age*31)*Math.exp(-age*14),scale=m.scale*(1+.012*pulse);g.save();g.translate(426+Math.sin(beat*Math.PI)*4,466-Math.sin(beat*Math.PI*2)*2-Math.max(0,kick)*6);g.rotate(kick*.018);g.scale((s.mirrored?-1:1)*scale*(1+kick*.055),scale*(1-kick*.06));g.drawImage(poses[index],-m.cx,-m.bottom);g.restore();window.dancerFrameInfo={pose:index,mirrored:!!s.mirrored,headArea:m.headArea*scale*scale,baseHeadArea:m.headArea*m.scale*m.scale,spring:kick,scale,time:t};}

function combo(g,s,t){window.ComboRenderer.draw(g,s,t);}

const capMeta=[{x:239,y:431,w:773,h:440,clearMargin:247},{x:220,y:448,w:810,h:417,clearMargin:228},{x:206,y:430,w:831,h:508,clearMargin:214},{x:197,y:417,w:857,h:479,clearMargin:205}];

function prepare(im){window.ComboRenderer.prepare(im['combo-atlas'],im['combo-fever-atlas']);for(let i=0;i<4;i++){

 const img=im['cap-'+i],cv=document.createElement('canvas');cv.width=img.width;cv.height=img.height;const ctx=cv.getContext('2d');ctx.drawImage(img,0,0);

 // Native compositing preserves each cap's geometry and works offline without pixel reads.

 ctx.globalCompositeOperation='color';ctx.fillStyle='#ffbe35';ctx.fillRect(0,0,cv.width,cv.height);ctx.globalCompositeOperation='destination-in';ctx.drawImage(img,0,0);ctx.globalCompositeOperation='source-over';im['cap-gold-'+i]=cv;

}}

function cap(g,img,meta,cx,cy,w,h){g.drawImage(img,meta.x,meta.y,meta.w,meta.h,cx-w/2,cy-h/2,w,h)}

function feverFX(g,s,t){if(!s.feverActive)return;const pulse=Math.exp(-beatPhase(t)*6);g.save();g.globalCompositeOperation='lighter';

 for(const x of [28,824]){

  for(let k=0;k<7;k++){const y=L.hitY+2-((t*310+k*160)%1080);g.globalAlpha=.3+.3*pulse;g.fillStyle='#ffdf83';g.beginPath();g.ellipse(x,y,2.3,12+12*pulse,0,0,7);g.fill()}

 }

 for(let j=0;j<3;j++){const phase=(t*.9+j/3)%1;g.globalAlpha=(1-phase)*.4;g.strokeStyle='#ffe29c';g.lineWidth=2+3*(1-phase);g.beginPath();g.ellipse(426,L.hitY-phase*700,65+phase*320,9+phase*42,0,0,Math.PI*2);g.stroke();}g.globalAlpha=.35+.25*pulse;g.strokeStyle='#ffcb5b';g.lineWidth=3;g.shadowBlur=18;g.beginPath();g.ellipse(426,446,147+12*pulse,12+5*pulse,0,0,7);g.stroke();g.restore();

 const age=s.time-s.feverStarted;if(age<.8){g.save();g.translate(426,904-age*95);const z=.9+.15*Math.exp(-age*10);g.scale(z,z);g.globalAlpha=Math.min(1,age*12)*Math.min(1,(.8-age)*4);g.shadowColor='#ffb930';g.shadowBlur=24;text(g,'FEVER!',0,0,104,'#ffe594','center',13);g.strokeStyle='#ffdb86';g.lineWidth=3;for(let k=0;k<8;k++){const a=k*Math.PI/4,rr=100+age*340;g.beginPath();g.moveTo(Math.cos(a)*rr,Math.sin(a)*rr*.5);g.lineTo(Math.cos(a)*(rr+38),Math.sin(a)*(rr+38)*.5);g.stroke()}g.restore()}

}

function holdFinishFX(g,s){for(const h of s.holdBursts??[]){const a=h.age,p=clamp(a/.6),x=L.centers[h.lane],col=h.gold?'#ffd66a':L.colors[h.lane];g.save();g.globalCompositeOperation='lighter';g.shadowColor=col;g.shadowBlur=22;g.strokeStyle=col;

 for(let k=0;k<2;k++){const q=clamp(p-k*.12);g.globalAlpha=(1-q)*(k?.55:.95);g.lineWidth=5*(1-q)+1;g.beginPath();g.ellipse(x,L.hitY,18+q*170,5+q*48,0,0,Math.PI*2);g.stroke()}

 g.globalAlpha=Math.max(0,1-a/.18);const flash=g.createRadialGradient(x,L.hitY,2,x,L.hitY,75);flash.addColorStop(0,'#ffffff');flash.addColorStop(.28,'#fff8db');flash.addColorStop(1,col+'00');g.fillStyle=flash;g.fillRect(x-80,L.hitY-80,160,160);

 if(a<.25){g.globalAlpha=(1-a/.25)*.9;const beam=g.createLinearGradient(0,L.hitY-230,0,L.hitY);beam.addColorStop(0,col+'00');beam.addColorStop(1,'#fff6c1');g.fillStyle=beam;g.fillRect(x-9*(1-p),L.hitY-230,18*(1-p),230)}

 g.globalAlpha=1-p;g.lineWidth=2.5;for(let k=0;k<7;k++){const angle=Math.PI*(1.08+k*.14),r=30+p*180;g.beginPath();g.moveTo(x+Math.cos(angle)*r,L.hitY+Math.sin(angle)*r);g.lineTo(x+Math.cos(angle)*(r+32),L.hitY+Math.sin(angle)*(r+32));g.stroke()}g.restore();}}

let stagePattern;const noteLayer=document.createElement('canvas');noteLayer.width=852;noteLayer.height=1846;const ng=noteLayer.getContext('2d');

function stageLight(g,t,fever){const beatPulse=Math.exp(-beatPhase(t)*6),rotation=Math.sin(t*.55)*.16;g.save();g.beginPath();[[269,170],[586,170],[780,196],[783,339],[731,427],[122,427],[70,339],[75,196]].forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.clip();

 if(!stagePattern){stagePattern=document.createElement('canvas');stagePattern.width=852;stagePattern.height=460;const p=stagePattern.getContext('2d');p.fillStyle='#171c34';p.fillRect(0,0,852,460);for(let yy=163;yy<460;yy+=15)for(let xx=50;xx<810;xx+=15){p.fillStyle=(xx+yy)%30?'#35405c50':'#4a507349';p.beginPath();p.arc(xx+(yy%30?7:0),yy,3.2,0,7);p.fill()}}

 g.drawImage(stagePattern,0,0);const ambient=g.createRadialGradient(426,449,10,426,398,385);ambient.addColorStop(0,fever?'#ffbd48b0':'#f8be6699');ambient.addColorStop(.48,'#a77a3430');ambient.addColorStop(1,'#111a2800');g.fillStyle=ambient;g.fillRect(40,150,770,300);

 g.globalCompositeOperation='lighter';for(let i=0;i<9;i++){const angle=-Math.PI+(i+.5)*Math.PI/9+rotation,width=.055+.018*Math.sin(t*.8+i);const gr=g.createRadialGradient(426,451,0,426,451,510);gr.addColorStop(0,'#fff0b570');gr.addColorStop(.35,'#ffc96740');gr.addColorStop(1,'#ffd67700');g.globalAlpha=(fever?.7:.42)+beatPulse*.18;g.fillStyle=gr;g.beginPath();g.moveTo(426,451);g.lineTo(426+Math.cos(angle-width)*650,451+Math.sin(angle-width)*650);g.lineTo(426+Math.cos(angle+width)*650,451+Math.sin(angle+width)*650);g.closePath();g.fill()}

 const glow=g.createRadialGradient(426,437,1,426,437,110+20*beatPulse);glow.addColorStop(0,'#ffe5a36b');glow.addColorStop(1,'#ffd06c00');g.globalAlpha=.7;g.fillStyle=glow;g.fillRect(280,310,292,145);g.restore();window.stageLightInfo={coded:true,rotation,intensity:beatPulse,time:t};}

function drawBoard(g,img){const sy=img.height/1846,bottom=271,middle=L.H-bottom-600;g.drawImage(img,0,0,img.width,600*sy,0,0,L.W,600);g.drawImage(img,0,600*sy,img.width,975*sy,0,600,L.W,middle);g.drawImage(img,0,1575*sy,img.width,bottom*sy,0,L.H-bottom,L.W,bottom);}

const reducedHUDMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
let hudGlow=0,hudFrameTime;
function drawHUD(g,im,s,clock){
 g.drawImage(im['hud-rail-v54'],0,0);
 const dt=clamp(clock-(hudFrameTime??clock),0,.05);hudFrameTime=clock;
 const impact=s.mode==='playing'?clamp(s.audioReaction?.impact||0):0;
 const reduced=!!reducedHUDMotion?.matches;
 const target=Math.sqrt(clamp((impact-.10)/.90));
 const response=target>hudGlow?(reduced?.09:.018):(reduced?.28:.13);
 hudGlow+=(target-hudGlow)*(1-Math.exp(-dt/response));
 if(hudGlow>.005){g.save();g.globalCompositeOperation='screen';g.globalAlpha=hudGlow*(reduced?.38:.98);g.drawImage(im['hud-glow-v54'],0,0);g.restore();}

 const hpWidth=146*clamp(s.hp/100);
 if(hpWidth>0){
  g.save();g.beginPath();g.rect(86,88,hpWidth,34);g.clip();
  g.beginPath();g.roundRect(86,88,146,34,15);g.clip();
  if(s.hp<=25){const red=g.createLinearGradient(0,88,0,122);red.addColorStop(0,'#ffb0ad');red.addColorStop(.48,'#ff5061');red.addColorStop(1,'#b51938');g.fillStyle=red;g.fillRect(86,88,146,34);}
  else g.drawImage(im['hud-life-v53'],86,88);
  g.restore();
 }
 for(let i=0;i<5;i++){
  const fill=clamp((s.fever-i*20)/20);
  if(fill<=0)continue;
  const x=632+i*38;
  g.save();g.beginPath();g.rect(x,93,31*fill,25);g.clip();g.drawImage(im['hud-fever-v53'],x,93);g.restore();
 }
 g.drawImage(im['hud-pause-v53'],506,49);
 text(g,String(Math.round(s.displayScore)).padStart(6,'0'),389,91,53,'#ffffff','center',5);
}

function draw(g,im,poses,s,pads,clock){const t=s.mode==='ready'?clock*.7:s.time,active=s.feverActive,color=i=>active?'#ffd34d':L.colors[i];g.clearRect(0,0,L.W,L.H);drawBoard(g,im['board-lyrics-v29']);
 stageLight(g,t,active);drawHUD(g,im,s,clock);



 if(active){const beatPulse=Math.exp(-beatPhase(t)*6);g.save();g.globalCompositeOperation='lighter';g.shadowColor='#ffac26';g.shadowBlur=15+12*beatPulse;g.strokeStyle='#ffd970';g.lineWidth=2.5;g.globalAlpha=.55+.25*beatPulse;g.beginPath();g.roundRect(622,86,196,46,22);g.stroke();for(let k=0;k<8;k++){const phase=(t*1.4+k/8)%1,xx=624+phase*190,yy=85-Math.sin(phase*Math.PI)*16;g.fillStyle=k%2?'#fff2ae':'#ffb326';g.beginPath();g.arc(xx,yy,1.2+beatPulse*1.8,0,7);g.fill()}g.restore();}

 dancer(g,poses,s,t);window.GameLyrics?.draw(g,s);

 if(active){const age=s.time-s.feverStarted;if(age<.65){g.save();g.globalAlpha=(1-age/.65)*.55;g.strokeStyle='#ffdc70';g.lineWidth=3;g.beginPath();g.ellipse(426,423,110+age*320,20+age*44,0,0,Math.PI*2);g.stroke();g.restore()}}

 g.fillStyle='#090f20';g.fillRect(55,604,742,18);
 g.save();g.beginPath();g.roundRect(35,L.laneTop,782,L.hitY-L.laneTop+15,8);g.clip();

 for(let i=0;i<4;i++){

  const board=im['board-lyrics-v29'],sx=[56,263,471,683][i]/934*board.width,sw=[189,190,192,192][i]/934*board.width;g.drawImage(board,sx,600/1684*board.height,sw,780/1684*board.height,L.left+i*L.laneWidth,L.laneTop,L.laneWidth,L.hitY-L.laneTop+15);

  const hold=s.notes.some(n=>n.lane===i&&n.status==='holding'),p=Math.max(s.pulses[i],hold?.3+.04*Math.sin(t*32):0);

  if(p>.005){g.save();g.globalAlpha=p;const grad=g.createLinearGradient(0,L.hitY-440,0,L.hitY);grad.addColorStop(0,color(i)+'00');grad.addColorStop(1,color(i)+'80');g.fillStyle=grad;g.fillRect(43+i*195,L.hitY-440,181,450);g.restore()}

 }

 for(let i=1;i<4;i++){g.strokeStyle='#080e1d';g.lineWidth=6;g.beginPath();g.moveTo(36+i*195,L.laneTop);g.lineTo(36+i*195,L.hitY);g.stroke();g.strokeStyle='#58678345';g.lineWidth=1;g.stroke()}

 const renderScale=L.renderScale||1,noteWidth=Math.round(L.W*renderScale),noteHeight=Math.round(L.H*renderScale);
 if(noteLayer.width!==noteWidth)noteLayer.width=noteWidth;if(noteLayer.height!==noteHeight)noteLayer.height=noteHeight;
 ng.setTransform(renderScale,0,0,renderScale,0,0);ng.clearRect(0,0,L.W,L.H);ng.save();

 const speed=(L.hitY-L.spawnY)/L.approach;

 for(const n of s.notes){if(s.mode==='failing'||n.status==='hit'||n.status==='miss'||n.status==='skipped')continue;const raw=L.hitY+(s.time-n.t)*speed,held=n.status==='holding',head=held?L.hitY:raw,tail=L.hitY+(s.time-n.t-n.duration)*speed;if(head<L.spawnY-50||tail>L.hitY+80)continue;

  const x=L.centers[n.lane],col=color(n.lane);

  if(n.duration){const top=Math.max(L.spawnY,tail),h=Math.max(1,head-top),w=104;ng.save();ng.globalAlpha=held?.94:.78;ng.shadowColor=col;ng.shadowBlur=held?20:7;const grad=ng.createLinearGradient(x-w/2,0,x+w/2,0);grad.addColorStop(0,col+'55');grad.addColorStop(.18,col+'c0');grad.addColorStop(.5,col+'80');grad.addColorStop(.82,col+'c0');grad.addColorStop(1,col+'55');box(ng,x-w/2,top,w,h,18,grad,col,2.5);

   ng.beginPath();ng.roundRect(x-w/2+2,top+2,w-4,Math.max(1,h-4),16);ng.clip();ng.fillStyle='#ffffff28';ng.fillRect(x-w/2+9,top+8,3,h);ng.fillStyle='#ffffff12';ng.fillRect(x-10,top,20,h);ng.strokeStyle='#ffffff14';ng.lineWidth=5;for(let yy=top-90;yy<head+90;yy+=100){ng.beginPath();ng.moveTo(x-48,yy+(t*38)%100);ng.lineTo(x+48,yy-48+(t*38)%100);ng.stroke()}ng.restore();

  }

  if(!held&&window.SONG_CHART.noteMotionBlur){ng.save();ng.filter='blur(2px)';for(const [age,alpha] of [[.026,.055],[.013,.11]]){ng.globalAlpha=alpha;contain(ng,im['note-'+(active?2:n.lane)],x,head-speed*age,154,72);}ng.restore();}
  ng.save();ng.shadowColor=col;ng.shadowBlur=held?18:active?10:3;if(!held)contain(ng,im['note-'+(active?2:n.lane)],x,head,154,72);ng.restore();

 }

 ng.restore();ng.save();ng.globalCompositeOperation='destination-in';const spawnMask=ng.createLinearGradient(0,L.spawnY-50,0,L.spawnY+90);spawnMask.addColorStop(0,'#ffffff00');spawnMask.addColorStop(.2,'#ffffff00');spawnMask.addColorStop(1,'#ffffffff');ng.fillStyle=spawnMask;ng.fillRect(0,0,L.W,L.H);ng.restore();g.drawImage(noteLayer,0,0,L.W,L.H);combo(g,s,t);

 g.restore();

 g.save();g.shadowColor=active?'#ffd45a':'#81f7ff';g.shadowBlur=13;box(g,30,L.hitY-4,792,7,3,active?'#fff0bc':'#e4ffff');g.restore();

 for(let i=0;i<4;i++){const p=pads[i],x=L.centers[i];

  // Fixed socket stays attached to the board; only its independent cap compresses.

  box(g,x-91,L.keyY-44,182,112,22,'#050b12','#243b54',3);

  if(active){g.save();g.globalAlpha=.22+.12*Math.sin(t*Math.PI*2/B);g.shadowColor='#ffc94d';g.shadowBlur=23;box(g,x-87,L.keyY-37,174,100,18,'#ffc335');g.restore()}

  const press=clamp(p.y/11),dy=press*13,capH=L.keyH*(1-press*.13);

  g.save();g.translate(x,L.keyY);g.transform(1,0,[-.16,-.055,.055,.16][i],1,0,0);g.shadowColor=color(i);g.shadowBlur=(p.down?5:12)+p.flash*8;g.shadowOffsetY=p.down?2:7;cap(g,im[active?'cap-gold-'+i:'cap-'+i],capMeta[i],0,dy,L.keyW,capH);g.restore();

  if(p.flash>.01){g.save();g.globalCompositeOperation='lighter';g.globalAlpha=p.flash*.65;g.strokeStyle=color(i);g.shadowColor=color(i);g.shadowBlur=24;g.lineWidth=3+3*p.flash;g.beginPath();g.roundRect(x-88,L.keyY-48+dy,176,100,22);g.stroke();g.globalAlpha=p.flash*.16;box(g,x-72,L.keyY-34+dy,144,54,14,'#eaffff');g.restore();}

 }

 feverFX(g,s,t);holdFinishFX(g,s);

 // Short elliptical shockwaves, fine streaks and a compact light cross follow hits.

 g.save();g.globalCompositeOperation='lighter';for(const r of s.rings){const q=r.age/.38;g.globalAlpha=(1-q)*.75;g.strokeStyle=r.color;g.lineWidth=3*(1-q)+1;g.beginPath();g.ellipse(r.x,r.y,17+q*66,5+q*15,0,0,Math.PI*2);g.stroke();if(q<.4){g.globalAlpha=(1-q/.4)*.8;g.fillStyle='#fff9d6';g.fillRect(r.x-48,r.y-2,96,3);g.fillRect(r.x-1,r.y-33,2,66)}}g.restore();

 for(const p of s.particles){g.save();g.globalAlpha=clamp(p.life/p.max);g.fillStyle=p.color;g.shadowColor=p.color;g.shadowBlur=6;g.translate(p.x,p.y);g.rotate(Math.atan2(p.vy,p.vx));g.fillRect(-p.r,-1,p.r*3.5,2);g.restore()}

 const age=s.time-s.judgeTime;if(age>=0&&age<.62){g.save();g.translate(426,1479-Math.min(age,.15)*70);const z=1+Math.exp(-age*21)*.18+Math.max(0,1-(s.time-(s.holdCompleteTime??-10))/.16)*.14;g.scale(z,z);g.globalAlpha=clamp((.62-age)*6);contain(g,im['judge-'+s.judge.toLowerCase()],0,0,400,147);g.restore()}

 window.NeonBorder.draw(g,s);

 const danger=s.hp<=window.RhythmRules.config.lowHealth&&(s.mode==='playing'||s.mode==='paused');if(danger){const alpha=.42+.16*Math.sin(t*6);g.save();g.strokeStyle=`rgba(255,43,71,${alpha})`;g.shadowColor='#ff234c';g.shadowBlur=30;g.lineWidth=12;g.beginPath();g.roundRect(9,9,834,L.H-18,38);g.stroke();g.restore();for(const[x1,x2]of [[0,70],[852,782]]){const gr=g.createLinearGradient(x1,0,x2,0);gr.addColorStop(0,`rgba(228,12,45,${alpha*.35})`);gr.addColorStop(1,'#df123000');g.fillStyle=gr;g.fillRect(Math.min(x1,x2),0,70,L.H)}}

 window.renderInfo={fever:active,noteSkins:Array(4).fill(active?'gold':null).map((x,i)=>x||i),keySkins:Array(4).fill(active?'gold':null).map((x,i)=>x||i),lowHealth:danger,padBounds:L.centers.map(x=>({x:x-101,y:L.keyY-L.keyH/2-12,w:202,h:L.keyH+32})),timerVisible:false,lyricsBounds:{x:62,y:487,w:728,h:80},laneTop:L.laneTop,logicalHeight:L.H,noteStyle:'original-sprite',approach:L.approach,spawnFade:true,holdFinishEffects:(s.holdBursts??[]).length,scoreCenter:[386,81],separateCaps:true,sourceMargins:capMeta.map(m=>m.clearMargin),independentFeverCaps:true,capSkews:[-.16,-.055,.055,.16],feverFX:active,holdHeadHidden:true};

}

window.CabinetRenderer={draw,onCombo,moves,prepare,onHit,onMiss};window.GameViewport.fit();

})();

