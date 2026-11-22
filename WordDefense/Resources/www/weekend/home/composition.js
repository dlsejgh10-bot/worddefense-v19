'use strict';
// The screen is rendered from individual PNG layers. No generated screenshot is used.
const canvas = document.getElementById('screen');
const screenContext = canvas.getContext('2d', {alpha:false});
let ctx = screenContext;
const query = new URLSearchParams(location.search);
const assetNames = ['background-wall-only-s25','spotlight-new-cyan','spotlight-new-magenta','spotlight-new-blue','spotlight-new-yellow','floor','mirrorball','speaker-left','speaker-right','unit-hip-grandma-purple','unit-hip-grandma-coral','unit-hip-grandma-teal','unit-hip-grandpa','profile-knight','event-title','schedule-badge','reward-heading','reward-panel','reward-card','reward-card-selected','progress-track','progress-fill','checkpoint-complete','checkpoint-locked','reward-coins','reward-gem','reward-chest','dance-start-a','dance-start-b','dance-start-c'];
const images = {};
const layout = {
  resolution:[1080,2340],
  background:{image:'background-wall-only-s25',x:0,y:0,w:1080,h:2340},
  scene:[
    {image:'floor',x:-120,y:1015,w:1320,h:435},
    {image:'mirrorball',x:407,y:493,w:266,h:355},
    {image:'speaker-left',x:16,y:745,w:280,h:392},
    {image:'speaker-right',x:790,y:745,w:280,h:371},
    {image:'unit-hip-grandma-teal',x:385.5,y:924.005,w:205,h:281.995},
    {image:'unit-hip-grandma-coral',x:231.5,y:972.264,w:225,h:293.736},
    {image:'unit-hip-grandma-purple',x:49.5,y:1007.111,w:245,h:328.889},
    {image:'unit-hip-grandpa',x:548,y:880,w:460,h:490},
  ],
  title:{image:'event-title',x:106,y:254,w:868,h:187},
  schedule:{image:'schedule-badge',x:339,y:426,w:402,h:83},
  heading:{image:'reward-heading',x:110,y:1410,w:860,h:108},
  rewardPanel:{image:'reward-panel',x:18,y:1528,w:1044,h:535},
  carousel:{x:42,y:1566,w:996,h:330,cardWidth:270,gap:20},
  checkpoints:{x:98,y:1950,width:884,count:6,completed:2},
  button:{x:35,y:2110,w:1010,h:207}
};
window.layerLayout=layout;
window.compositionState={variant:['a','b','c'].includes(query.get('variant'))?query.get('variant'):'a',rewardOffset:0,press:false};
const state=window.compositionState;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const effects={bpm:124,playing:query.get('capture')!=='1',time:0,glow:0,beamStrength:0,lampMotion:0,floorStrength:.45,speakerStrength:reducedMotion ? .35 : 1,speakerAir:true,frames:0};
window.discoEffects=effects;
let hostMusic=null;try{hostMusic=window.parent.parent.WDWeekendHost?.homeMusic?.()||null}catch{}
const music=hostMusic||new Audio('../audio/music.wav');music.preload='auto';music.loop=true;if(!hostMusic)music.volume=.65;
window.danceMusic=music;
window.musicState={bpm:124,ready:false,playing:false,error:null};
music.addEventListener('canplay',()=>{window.musicState.ready=true});
music.addEventListener('play',()=>{window.musicState.playing=true});
music.addEventListener('pause',()=>{window.musicState.playing=false;clockOffset=music.currentTime;clockStart=performance.now()});
music.addEventListener('error',()=>{window.musicState.error=music.error?.message||'BGM could not be loaded'});
window.startDanceMusic=async()=>{try{music.currentTime=0;await music.play();effects.bpm=124;window.musicState.error=null;if(!effects.playing)window.setEffectsPlaying(true)}catch(error){window.musicState.error=String(error)}};
const uiCanvas=document.createElement('canvas');uiCanvas.width=1080;uiCanvas.height=2340;
let uiDirty=true,animationId=0,lastFrame=0,clockStart=performance.now(),clockOffset=0,assetsReady=false;
const floorCache=[];
const worldCanvas=document.createElement('canvas');worldCanvas.width=1080;worldCanvas.height=2340;
const worldContext=worldCanvas.getContext('2d',{alpha:false});
const beamCache={};
const lamps=[
 {image:'spotlight-new-cyan',x:30,y:509.618,w:150,h:175.575,pivot:[105,550],emitter:[104.547,649.066],color:'68,220,255',amplitude:.16,phase:0,split:.19},
 {image:'spotlight-new-magenta',x:900,y:509.684,w:150,h:175.287,pivot:[975,550],emitter:[974.058,649.031],color:'240,95,255',amplitude:.16,phase:2.2,split:.19},
 {image:'spotlight-new-blue',x:265,y:517.589,w:120,h:140.92,pivot:[325,550],emitter:[324.442,629.419],color:'80,180,255',amplitude:.20,phase:1.1,split:.19},
 {image:'spotlight-new-yellow',x:695,y:517.703,w:120,h:140.421,pivot:[755,550],emitter:[754.435,629.245],color:'255,215,102',amplitude:.20,phase:3.1,split:.19}
];
layout.lamps=lamps;
const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
const smooth=value=>{const x=clamp(value);return x*x*(3-2*x)};
const rewards=[{plays:1,image:'reward-coins',amount:'5,000',received:true},{plays:3,image:'reward-gem',amount:'100',next:true},{plays:5,image:'reward-chest',amount:'1'},{plays:6,image:'reward-gem',amount:'100'}];
function image(name,x,y,w,h){ctx.drawImage(images[name],x,y,w,h)}
function layer(item){image(item.image,item.x,item.y,item.w,item.h)}
function box(x,y,w,h,r,fill,stroke='#101827',line=4){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke()}}
function text(value,x,y,size=38,color='#ffffff',align='left',stroke=true){ctx.font=`400 ${size}px Game,sans-serif`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.lineJoin='round';if(stroke){ctx.lineWidth=size*.13;ctx.strokeStyle='#151212';ctx.strokeText(value,x,y)}ctx.fillStyle=color;ctx.fillText(value,x,y)}
function coin(x,y,r){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle='#ffb91c';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#4b2a05';ctx.stroke();ctx.beginPath();ctx.arc(x,y,r*.67,0,Math.PI*2);ctx.strokeStyle='#ffe875';ctx.stroke();}
function gem(x,y,s){ctx.beginPath();ctx.moveTo(x-s,y-s*.3);ctx.lineTo(x-s*.5,y-s*.75);ctx.lineTo(x+s*.5,y-s*.75);ctx.lineTo(x+s,y-s*.3);ctx.lineTo(x,y+s*.8);ctx.closePath();ctx.fillStyle='#00c9f1';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#07262d';ctx.stroke();ctx.beginPath();ctx.moveTo(x-s*.5,y-s*.75);ctx.lineTo(x,y-s*.3);ctx.lineTo(x+s*.5,y-s*.75);ctx.fillStyle='#9aebff';ctx.fill()}
function bolt(x,y,s){ctx.beginPath();ctx.moveTo(x+s*.2,y-s);ctx.lineTo(x-s*.6,y+s*.12);ctx.lineTo(x-s*.05,y+s*.12);ctx.lineTo(x-s*.3,y+s);ctx.lineTo(x+s*.65,y-s*.12);ctx.lineTo(x+s*.08,y-s*.12);ctx.closePath();ctx.fillStyle='#ffda26';ctx.fill();ctx.strokeStyle='#402f10';ctx.lineWidth=3;ctx.stroke()}
function lock(x,y,s=24){ctx.strokeStyle='#f4e5c6';ctx.lineWidth=6;ctx.beginPath();ctx.arc(x,y-s*.16,s*.3,Math.PI,0);ctx.stroke();box(x-s*.48,y-s*.08,s*.96,s*.8,5,'#f4e5c6','#1b202d',3);ctx.fillStyle='#2c3347';ctx.fillRect(x-2,y+s*.12,4,s*.29)}
function hud(){
  box(124,43,325,82,15,'#293248','#101322',4);image('profile-knight',22,37,96,89);text('용감한토끼',142,84,36);
  box(462,47,206,76,13,'#111b2d',null);coin(491,85,21);text('34,800',523,85,33);
  box(680,47,188,76,13,'#111b2d',null);gem(708,85,21);text('6,430',737,85,33);
  box(880,47,180,76,13,'#111b2d',null);bolt(908,85,25);text('30/30',936,85,33);
  box(33,163,84,77,13,'#837367','#171923',5);ctx.strokeStyle='#fff3d0';ctx.lineWidth=11;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(81,184);ctx.lineTo(61,201);ctx.lineTo(81,218);ctx.moveTo(63,201);ctx.lineTo(94,201);ctx.stroke();text('이벤트',146,202,51);
}
function rewardCard(reward,index){
  const {x,y,cardWidth,gap,h}=layout.carousel;
  const left=x+index*(cardWidth+gap)-state.rewardOffset;
  image(reward.next?'reward-card-selected':'reward-card',left,y,cardWidth,h);
  box(left+25,y+20,220,46,22,'#f7e7c5',null);text(`${reward.plays}회 플레이`,left+135,y+44,28,'#201910','center',false);
  const icon=images[reward.image];const scale=Math.min(147/icon.width,111/icon.height);
  image(reward.image,left+135-icon.width*scale/2,y+88,icon.width*scale,icon.height*scale);
  text(reward.amount,left+135,y+229,39,'#ffffff','center');
  box(left+24,y+264,222,48,20,reward.received?'#33891e':reward.next?'#384d6b':'#6a6866',reward.received?'#8bc56b':'#b9b8ad',3);
  if(reward.received){text('✓ 수령 완료',left+135,y+288,26,'#ffffff','center')}
  else{lock(left+56,y+283,22);text('잠금',left+149,y+288,27,'#ffffff','center')}
}
function progress(){
  const p=layout.checkpoints;
  image('progress-track',p.x,p.y-11,p.width,27);
  image('progress-fill',p.x,p.y-8,p.width/(p.count-1),17);
  for(let i=0;i<p.count;i++){
    const x=p.x+i*p.width/(p.count-1);
    image(i<p.completed?'checkpoint-complete':'checkpoint-locked',x-31,p.y-31,62,62);
    box(x-57,p.y+40,114,43,18,'#343d52','#aaaab2',3);text(`${i+1}회`,x,p.y+61,27,'#ffffff','center');
  }
}
function drawUi(){
  const previous=ctx;ctx=uiCanvas.getContext('2d');ctx.clearRect(0,0,1080,2340);
  layer(layout.title);layer(layout.schedule);hud();
  layer(layout.heading);text('주말 보상',321,1465,49,'#ffffff','center');ctx.strokeStyle='#c4c4d3';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(551,1439);ctx.lineTo(551,1489);ctx.stroke();text('플레이',601,1465,42);text('2회',783,1465,48,'#ffe524');
  layer(layout.rewardPanel);
  const c=layout.carousel;ctx.save();ctx.beginPath();ctx.rect(c.x,c.y-8,c.w,c.h+18);ctx.clip();rewards.forEach(rewardCard);ctx.restore();
  progress();const b=layout.button;image('dance-start-'+state.variant,b.x,b.y+(state.press?5:0),b.w,b.h);
  ctx=previous;uiDirty=false;
}
function pathPolygon(context,points){context.beginPath();points.forEach(([x,y],index)=>index?context.lineTo(x,y):context.moveTo(x,y));context.closePath()}
// Grid intersections measured on the original 1734x481 trimmed floor image.
// Only additive glow is layered over the original tiles; nothing darkens them.
const floorGrid={columns:11,rows:8,rear:[397,483,570,654,739,825,910,996,1083,1170,1255,1340],front:[-210,-9,214,421,615,802,982,1178,1372,1561,1750,1940],y:[30,43,76,115,163,218,286,355,420]};
function floorPoint(u,v){
  const gx=clamp(u)*floorGrid.columns,gy=clamp(v)*floorGrid.rows;
  const col=Math.min(floorGrid.columns-1,Math.floor(gx)),row=Math.min(floorGrid.rows-1,Math.floor(gy));
  const y=floorGrid.y[row]+(floorGrid.y[row+1]-floorGrid.y[row])*(gy-row);
  const rear=floorGrid.rear[col]+(floorGrid.rear[col+1]-floorGrid.rear[col])*(gx-col);
  const front=floorGrid.front[col]+(floorGrid.front[col+1]-floorGrid.front[col])*(gx-col);
  return [(rear+(front-rear)*(y-30)/370)*1104/1734,y*307/481];
}
function buildFloorCache(){
  for(let checker=-1;checker<2;checker++){
    const surface=document.createElement('canvas');surface.width=1104;surface.height=307;const painter=surface.getContext('2d');
    painter.save();painter.beginPath();painter.moveTo(350*1104/1734,25*307/481);painter.lineTo(1380*1104/1734,25*307/481);painter.lineTo(1708*1104/1734,327*307/481);painter.quadraticCurveTo(867*1104/1734,465*307/481,26*1104/1734,327*307/481);painter.closePath();painter.clip();
    const {rows,columns}=floorGrid;
    for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
      const inset=.055;const polygon=[floorPoint((col+inset)/columns,(row+inset)/rows),floorPoint((col+1-inset)/columns,(row+inset)/rows),floorPoint((col+1-inset)/columns,(row+1-inset)/rows),floorPoint((col+inset)/columns,(row+1-inset)/rows)];
      if(checker>=0&&(row+col)%2===checker){
        // Blur the source's own cyan/purple light instead of filling new colors.
        painter.save();pathPolygon(painter,polygon);painter.clip();
        painter.filter='blur(7px)';painter.globalAlpha=.45;
        painter.drawImage(images.floor,0,0,1104,307);painter.restore();
      }
    }
    painter.restore();
    floorCache.push(surface);
  }
}
function softGlow(x,y,rx,ry,color,opacity){
  ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=opacity;ctx.translate(x,y);ctx.scale(rx,ry);
  const gradient=ctx.createRadialGradient(0,0,0,0,0,1);gradient.addColorStop(0,`rgba(${color},.9)`);gradient.addColorStop(.35,`rgba(${color},.3)`);gradient.addColorStop(1,`rgba(${color},0)`);
  ctx.fillStyle=gradient;ctx.fillRect(-1,-1,2,2);ctx.restore();
}
function buildBeamCache(){
  for(const lamp of lamps){
    if(beamCache[lamp.color])continue;
    const texture=document.createElement('canvas');texture.width=384;texture.height=960;const painter=texture.getContext('2d');
    for(const pass of [{blur:22,width:170,alpha:.19},{blur:10,width:112,alpha:.25}]){
      painter.save();painter.filter=`blur(${pass.blur}px)`;
      const gradient=painter.createLinearGradient(0,48,0,925);
      gradient.addColorStop(0,`rgba(${lamp.color},${pass.alpha})`);gradient.addColorStop(.18,`rgba(${lamp.color},${pass.alpha*.65})`);gradient.addColorStop(.68,`rgba(${lamp.color},${pass.alpha*.18})`);gradient.addColorStop(1,`rgba(${lamp.color},0)`);
      painter.fillStyle=gradient;pathPolygon(painter,[[176,48],[208,48],[192+pass.width,925],[192-pass.width,925]]);painter.fill();painter.restore();
    }
    beamCache[lamp.color]=texture;
  }
}
function lights(time){
  // The original four lights are baked into the restored background.
  // No replacement fixture, animated beam, added glow or sweep is drawn.
  window.lampFrameInfo=[];window.homeLightingInfo={source:'original-background',static:true,extraFixtures:0,extraBeams:0};
}

function animatedFloor(beat){
  const local=beat%2;const checker=Math.floor(beat/2)%2;
  const light=(.22+.78*smooth(local/.16))*(1-smooth((local-1.50)/.45));
  const f=layout.scene[0];image('floor',f.x,f.y,f.w,f.h);
  ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=light*effects.floorStrength;ctx.drawImage(floorCache[checker+1],f.x,f.y,f.w,f.h);ctx.restore();
  window.discoFrameInfo={beat,checker,light,resting:local>1.93};
}
function animatedSpeaker(item,kick){
  const amount=kick*effects.speakerStrength;
  ctx.save();ctx.translate(item.x+item.w/2,item.y+item.h);
  ctx.translate(0,-7*amount);ctx.scale(1+.045*amount,1+.025*amount);ctx.translate(-item.w/2,-item.h);
  image(item.image,0,0,item.w,item.h);
  const source=images[item.image];const right=item.image==='speaker-right';
  const cones=right?[{x:319/832,y:338/1101,rx:132/832,ry:138/1101},{x:322/832,y:719/1101,rx:149/832,ry:150/1101}]:[{x:488/789,y:316/1104,rx:132/789,ry:139/1104},{x:475/789,y:702/1104,rx:154/789,ry:158/1104}];
  for(const cone of cones){
    const x=cone.x*item.w,y=cone.y*item.h,rx=cone.rx*item.w,ry=cone.ry*item.h;
    ctx.save();ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.clip();
    const zoom=1+.22*amount;ctx.translate(x,y);ctx.scale(zoom,zoom);ctx.translate(-x,-y);ctx.drawImage(source,0,0,item.w,item.h);ctx.restore();
    softGlow(x,y,rx*1.7,ry*1.7,right?'213,100,255':'76,219,255',.07+.19*amount);
  }
  ctx.restore();
}
function renderScene(time){
  if(!assetsReady)return;
  effects.time=time;ctx=worldContext;ctx.clearRect(0,0,1080,2340);layer(layout.background);lights(time);
  const beat=time*effects.bpm/60;const phase=beat%1;const kick=Math.exp(-phase*6.2)*(.88+.12*Math.cos(phase*Math.PI*4));
  animatedFloor(beat);
  layer(layout.scene[1]);
  ctx=screenContext;ctx.drawImage(worldCanvas,0,0);
  if(effects.speakerAir&&window.SpeakerAir)window.SpeakerAir.draw(ctx,worldCanvas,layout.scene.filter(item=>item.image.startsWith('speaker-')),beat,effects.speakerStrength);
  window.dancerFrameInfo=[];
  for(const item of layout.scene.slice(2)){
    if(item.image.startsWith('speaker-'))animatedSpeaker(item,kick);
    else if(item.image.startsWith('unit-hip-')&&window.DanceAnimation){window.dancerFrameInfo.push(window.DanceAnimation.draw(ctx,item,time,effects.bpm))}
    else layer(item);
  }
  if(uiDirty||window.weekendUiAnimated)drawUi();ctx.drawImage(uiCanvas,0,0);
  if(!music.paused){const phase=(music.currentTime*124/60)%1,pulse=Math.pow((1+Math.cos(phase*Math.PI*2))*.5,1.4),opacity=.14+.24*pulse;softGlow(0,1170,95+20*pulse,1570,'36,217,237',opacity);softGlow(1080,1170,95+20*pulse,1570,'233,95,174',opacity);softGlow(540,0,740,95+18*pulse,'36,217,237',opacity*.8);softGlow(540,2340,740,110+18*pulse,'233,95,174',opacity*.85);window.homeBorderInfo={source:'original-124bpm-drum-sequence',musicTime:music.currentTime,pulse,opacity,style:'smooth-breath'};}
  effects.frames++;
}
function draw(){uiDirty=true;renderScene(effects.time)}
function animate(now){
  if(!effects.playing){animationId=0;return}
  if(now-lastFrame>=1000/30){lastFrame=now;renderScene(!music.paused&&music.readyState>=2?music.currentTime:clockOffset+(now-clockStart)/1000)}
  animationId=requestAnimationFrame(animate);
}
window.setEffectTime=seconds=>{effects.playing=false;cancelAnimationFrame(animationId);animationId=0;clockOffset=Math.max(0,Number(seconds)||0);renderScene(clockOffset)};
window.setEffectsPlaying=playing=>{if(playing===effects.playing)return;effects.playing=!!playing;if(effects.playing){clockOffset=effects.time;clockStart=performance.now();lastFrame=0;animationId=requestAnimationFrame(animate)}else{cancelAnimationFrame(animationId);animationId=0}};
window.setEffectsBpm=bpm=>{effects.bpm=clamp(Number(bpm)||108,50,180);renderScene(effects.time)};
window.renderComposition=draw;
window.setButtonVariant=variant=>{if(['a','b','c'].includes(variant)){state.variant=variant;draw()}};
window.setRewardOffset=value=>{state.rewardOffset=Math.max(0,Math.min(144,value));draw()};
function canvasPoint(event){const r=canvas.getBoundingClientRect();return {x:(event.clientX-r.left)*1080/r.width,y:(event.clientY-r.top)*canvas.height/r.height}}
let drag=null;
canvas.addEventListener('pointerdown',event=>{const p=canvasPoint(event),c=layout.carousel,b=layout.button;if(p.y>=c.y&&p.y<=c.y+c.h){drag={x:p.x,offset:state.rewardOffset};canvas.setPointerCapture(event.pointerId)}else if(p.y>=b.y&&p.y<=b.y+b.h&&p.x>=b.x&&p.x<=b.x+b.w){state.press=true;canvas.setPointerCapture(event.pointerId);draw()}});
canvas.addEventListener('pointermove',event=>{if(drag){const p=canvasPoint(event);window.setRewardOffset(drag.offset+drag.x-p.x)}});
function release(event){drag=null;if(state.press){state.press=false;const p=canvasPoint(event),b=layout.button;draw();if(p.y>=b.y&&p.y<=b.y+b.h&&p.x>=b.x&&p.x<=b.x+b.w){clockOffset=0;clockStart=performance.now();effects.time=0;window.startDanceMusic()}}}
canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',()=>{drag=null;state.press=false;draw()});
canvas.addEventListener('wheel',event=>{const p=canvasPoint(event),c=layout.carousel;if(p.y>=c.y&&p.y<=c.y+c.h){event.preventDefault();window.setRewardOffset(state.rewardOffset+event.deltaX+event.deltaY)}},{passive:false});
window.addEventListener('keydown',event=>{if(['1','2','3'].includes(event.key))window.setButtonVariant(['a','b','c'][Number(event.key)-1]);if(event.key==='ArrowRight')window.setRewardOffset(state.rewardOffset+290);if(event.key==='ArrowLeft')window.setRewardOffset(state.rewardOffset-290);if(event.key.toLowerCase()==='m')window.parent.GameHome.toggleMusic()});
window.compositionReady=false;
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&effects.playing){clockOffset=effects.time;clockStart=performance.now();lastFrame=0}});
Promise.all([document.fonts.load('40px Game'),...assetNames.map(name=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{images[name]=img;resolve()};img.onerror=()=>reject(new Error('Missing asset: '+name));img.src=({'reward-coins':'assets/wd-coin.webp','reward-gem':'assets/wd-gem.webp','reward-chest':'assets/wd-chest.webp'})[name]||'assets/'+name+'.png'})),window.DanceAnimation.load()]).then(()=>{assetsReady=true;buildFloorCache();draw();window.compositionReady=true;document.getElementById('loading')?.remove();if(effects.playing){clockStart=performance.now();animationId=requestAnimationFrame(animate)}}).catch(error=>{window.compositionError=String(error);const status=document.getElementById('loading');if(status){status.textContent='이미지를 불러오지 못했어요. 눌러서 다시 시도';status.onclick=()=>location.reload()}console.error(error)});
