/* Progressive card locks: presentation only; deal capacity lives in the native wave pipeline. */
(()=>{
 const drawBeforeLocks=drawHud;
 drawHud=function(){
  drawBeforeLocks.apply(this,arguments);if(!G||G.wb)return;
  const cap=cardCapacity();if(cap>=CFG.TILE_COUNT)return;
  for(let i=cap;i<CFG.TILE_COUNT;i++){
   const r=homeRect(i),fresh=G.cardLockIndex===i,t=fresh?Math.max(0,G.t-(G.cardLockAt??-10)):10;
   const q=Math.min(1,t/.38),e=1+2.70158*(q-1)**3+1.70158*(q-1)**2;
   const settle=t<.65?Math.sin(Math.max(0,t-.35)*28)*Math.exp(-Math.max(0,t-.35)*12)*.10:0;
   ctx.save();ctx.fillStyle='rgba(24,30,39,.66)';rr(r.x,r.y,r.w,r.h,8);ctx.fill();
   const cx=r.x+r.w/2,cy=r.y+r.h/2+4;ctx.translate(cx,cy-(1-e)*r.h*.6);ctx.scale(1+settle,Math.max(.1,e)*(1-settle));
   ctx.lineCap='round';ctx.lineJoin='round';
   for(const dir of [-1,1]){ctx.save();ctx.rotate(dir*.70);for(let j=-3;j<=3;j++){ctx.beginPath();ctx.ellipse(0,j*10,5,8,0,0,Math.PI*2);ctx.strokeStyle='#18212c';ctx.lineWidth=5;ctx.stroke();ctx.strokeStyle='#8193a5';ctx.lineWidth=2;ctx.stroke();}ctx.restore();}
   ctx.beginPath();ctx.arc(0,-9,12,Math.PI,0);ctx.lineTo(12,4);ctx.lineTo(-12,4);ctx.closePath();ctx.strokeStyle='#172231';ctx.lineWidth=7;ctx.stroke();ctx.strokeStyle='#bcc9d4';ctx.lineWidth=3;ctx.stroke();
   const g=ctx.createLinearGradient(0,-4,0,24);g.addColorStop(0,'#afbfcc');g.addColorStop(.4,'#71869a');g.addColorStop(1,'#3a5065');ctx.fillStyle=g;ctx.strokeStyle='#172231';ctx.lineWidth=3;rr(-19,-3,38,29,6);ctx.fill();ctx.stroke();ctx.fillStyle='#182332';ctx.beginPath();ctx.arc(0,8,4,0,Math.PI*2);ctx.fill();ctx.fillRect(-2,8,4,9);ctx.restore();
  }
 };
 Object.assign(window.__wd,{cardCapacity,drawHud});
})();
