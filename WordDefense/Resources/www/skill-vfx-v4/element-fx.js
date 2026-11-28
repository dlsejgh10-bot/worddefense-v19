/* Element impact presentation. Gameplay damage remains in the native combat pipeline. */
(() => {
  'use strict';
  const P=window.P3,fx=window.WDElementFX={},list=()=>G?(G.elementBursts||(G.elementBursts=[])):[];
  function push(k,x,y,R,dur){list().push({k,x,y,R,start:G.t,dur,seed:Math.random()*90});}
  fx.waterHit=(T,m,strong)=>{if(!G||!m)return;push(strong?'water':'waterSoft',m.x,m.y-8,strong?58:15,strong?.52:.22);if(strong)SFX.approved('splash',.8);};
  fx.fireBurst=m=>{if(list().some(b=>b.k==='fire'&&G.t-b.start<.1&&Math.hypot(b.x-m.x,b.y-(m.y-8))<28))return;push('fire',m.x,m.y-8,70,.9);SFX.approved('fireboom',.55);};
  fx.freezeStart=m=>{m._iceVisualAt=G.t;SFX.approved('iceCrack',.8);};
  fx.freezeEnd=m=>{push('ice',m.x,m.y-12,46,.48);SFX.approved('iceShatter',1.17);};
  function water(x,y,R,t,D,seed){
    const q=P.cl(t/D),open=P.E.out5(P.cl(t/.085)),fade=(1-q)**1.25;
    const w=R*(.25+.43*open),h=R*.78*open*(1-q*.65);
    ctx.save();ctx.translate(x,y+7);ctx.globalAlpha=fade;ctx.lineJoin='round';ctx.lineCap='round';
    // A filled crown of water and detached droplets; no radial light rays.
    const g=ctx.createLinearGradient(0,-h,0,8);g.addColorStop(0,'#b0f1ff');g.addColorStop(.5,'#54c8ef');g.addColorStop(1,'#248ccf');
    ctx.fillStyle=g;ctx.strokeStyle='#227cab';ctx.lineWidth=1.4;
    ctx.beginPath();ctx.moveTo(-w,3);
    ctx.bezierCurveTo(-w*1.12,-h*.12,-w*1.24,-h*.67,-w*.91,-h*.63);
    ctx.bezierCurveTo(-w*.62,-h*.57,-w*.66,-h*.18,-w*.39,-h*.28);
    ctx.bezierCurveTo(-w*.19,-h*.36,-w*.24,-h*1.08,0,-h);
    ctx.bezierCurveTo(w*.23,-h*.92,w*.08,-h*.28,w*.37,-h*.32);
    ctx.bezierCurveTo(w*.56,-h*.35,w*.74,-h*.85,w*.94,-h*.72);
    ctx.bezierCurveTo(w*1.19,-h*.55,w*.98,-h*.18,w,3);
    ctx.quadraticCurveTo(0,17,-w,3);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle='#d5f8ff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-w*.76,-h*.12);ctx.quadraticCurveTo(-w*.43,-h*.08,-w*.27,-h*.21);ctx.moveTo(w*.12,-h*.17);ctx.quadraticCurveTo(w*.43,-h*.09,w*.72,-h*.2);ctx.stroke();
    for(let i=0;i<7;i++){
      const side=(i-3)/3,vx=side*R*(1.0+.35*P.H(seed+i)),vy=-R*(1.5+.8*P.H(seed+i+17));
      const px=vx*t,py=vy*t+R*2.7*t*t,s=(2.3+2*P.H(seed+i+9))*(1-q*.5);
      ctx.save();ctx.translate(px,py);ctx.rotate(side*.55);ctx.fillStyle='#83ddf7';ctx.strokeStyle='#2c8fbd';ctx.lineWidth=.8;
      ctx.beginPath();ctx.moveTo(0,-s*1.7);ctx.bezierCurveTo(s*1.7,-s*.1,s, s,0,s);ctx.bezierCurveTo(-s,s,-s*1.6,-s*.1,0,-s*1.7);ctx.fill();ctx.stroke();ctx.restore();
    }
    ctx.strokeStyle='#d6f8ff';ctx.lineWidth=1.8*(1-q)+.5;ctx.beginPath();ctx.ellipse(0,5,R*(.27+.5*open),R*(.09+.10*open),0,.1,Math.PI*1.8);ctx.stroke();ctx.restore();
  }
  function fire(x,y,R,t,D,seed){
    const model=P.S.artillery;if(!model)return;
    const scene=Object.assign(Object.create(model),{Bp:{x,y},mz:{x,y},tf:-10,tl:-9,tb:0,vic:[]});
    ctx.save();ctx.translate(x,y);ctx.scale(R/150,R/150);ctx.translate(-x,-y);model.top.call(scene,t);ctx.restore();
  }
  function ice(x,y,R,t,D,seed){
    const q=P.cl(t/D),open=P.E.out5(P.cl(t/.16)),fade=(1-q)**1.3;ctx.save();ctx.globalCompositeOperation='screen';P.bloom(x,y,R*.55,'#92ddff',fade*.65);
    for(let i=0;i<13;i++){
      const a=i/13*Math.PI*2+P.H(seed+i)*.15,r=R*(.4+.6*P.H(seed+i+7))*open,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r*.65-t*22+t*t*50,sz=(4+R*.065*P.H(seed+i+15))*fade;
      ctx.save();ctx.translate(px,py);ctx.rotate(a+q*2);ctx.fillStyle=`rgba(166,230,255,${fade*.85})`;ctx.strokeStyle=`rgba(244,254,255,${fade})`;ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(-sz*.5,sz);ctx.lineTo(-sz*.7,-sz*.35);ctx.lineTo(sz*.1,-sz*1.5);ctx.lineTo(sz*.6,sz*.25);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
    }ctx.restore();
  }
  fx.drawIceImpact=(x,y,R,t,layer)=>{if(t<0||t>1)return;if(layer==='ground'){P.ringGlow(x,y,R*P.E.out5(P.cl(t/.22)),.62,2,'#b8eeff',(1-P.cl(t/.5))*.8);return;}ice(x,y-12,R,t,.85,37);};
  fx.drawBurn=(m,sp,bob,appear)=>{
    const x=m.x,y=m.y+6+bob,w=Math.max(14,sp.w*.65),h=Math.max(15,sp.h*.48);ctx.save();
    for(let i=0;i<5;i++){
      const ph=(G.t*2.7+i*.21+m.phase*.08)%1,s=Math.sin(ph*Math.PI),cx=x+(i-2)*w*.17+Math.sin(ph*5+i)*2,cy=y-ph*h*.6,hh=h*(.55+.45*s),ww=(3+w*.07)*(1-ph*.35);
      const g=ctx.createLinearGradient(cx,cy,cx,cy-hh);g.addColorStop(0,'rgba(249,69,12,.76)');g.addColorStop(.48,'rgba(255,157,28,.86)');g.addColorStop(.8,'rgba(255,230,117,.76)');g.addColorStop(1,'rgba(255,244,193,0)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(cx-ww,cy);ctx.bezierCurveTo(cx-ww*1.4,cy-hh*.4,cx+ww*.6,cy-hh*.7,cx+Math.sin(G.t*7+i)*ww*.4,cy-hh);ctx.bezierCurveTo(cx+ww*.5,cy-hh*.45,cx+ww*1.2,cy-hh*.23,cx+ww,cy);ctx.closePath();ctx.fill();
    }
    for(let i=0;i<3;i++){const ph=(G.t*1.4+i*.33)%1;ctx.globalAlpha=(1-ph)*.7;ctx.fillStyle='#ffd376';ctx.fillRect(x+(P.H(i+m.id)-.5)*w,y-h*.4-ph*h,1.4,2.4);}ctx.restore();
  };
  const freezeOld=drawFreeze10;drawFreeze10=function(m,sp,bob,appear){
    if(!m.freezeT)return;const x=m.x,y=m.y+6+bob,w=Math.max(17,sp.w*.60),h=Math.max(25,sp.h*1.03),age=Math.max(0,G.t-(m._iceVisualAt??G.t)),enter=P.E.out5(P.cl(age/.13));
    ctx.save();ctx.translate(x,y);ctx.scale(enter||.01,enter||.01);
    const g=ctx.createLinearGradient(-w,-h,w,0);g.addColorStop(0,'rgba(227,251,255,.55)');g.addColorStop(.4,'rgba(89,185,235,.14)');g.addColorStop(1,'rgba(72,146,210,.32)');ctx.fillStyle=g;ctx.strokeStyle='rgba(182,237,255,.95)';ctx.lineWidth=1.6;
    ctx.beginPath();ctx.moveTo(-w*.86,0);ctx.lineTo(-w,-h*.63);ctx.lineTo(-w*.46,-h*.88);ctx.lineTo(-w*.18,-h*1.08);ctx.lineTo(w*.25,-h*.94);ctx.lineTo(w*.8,-h*.66);ctx.lineTo(w*.95,-h*.22);ctx.lineTo(w*.68,2);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle='rgba(236,253,255,.82)';ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(-w,-h*.63);ctx.lineTo(-w*.25,-h*.51);ctx.lineTo(-w*.18,-h*1.08);ctx.moveTo(-w*.25,-h*.51);ctx.lineTo(w*.45,-h*.30);ctx.lineTo(w*.8,-h*.66);ctx.moveTo(w*.45,-h*.30);ctx.lineTo(w*.68,2);ctx.stroke();
    ctx.strokeStyle='rgba(57,121,169,.65)';ctx.beginPath();ctx.moveTo(0,-h*.7);ctx.lineTo(-w*.12,-h*.43);ctx.lineTo(w*.17,-h*.25);ctx.lineTo(w*.05,-h*.05);ctx.stroke();ctx.restore();
  };
  const drawOld=drawFx;drawFx=function(ui){drawOld(ui);if(ui||!G)return;G.elementBursts=list().filter(b=>G.t-b.start<b.dur);for(const b of list()){const t=G.t-b.start;if(t<0)continue;if(b.k==='water')water(b.x,b.y,b.R,t,b.dur,b.seed);if(b.k==='waterSoft'){const q=P.cl(t/b.dur);P.ringGlow(b.x,b.y+4,4+b.R*P.E.out3(q),.45,.8,'#a6e5f1',(1-q)*.32);}if(b.k==='fire')fire(b.x,b.y,b.R,t,b.dur,b.seed);if(b.k==='ice')ice(b.x,b.y,b.R,t,b.dur,b.seed);}ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';};
  window.WDSkillVFX.waterHit=fx.waterHit;
  // Thin angular electrical arcs. No brown outline, tubular body or rounded rope.
  drawCh13=function(){
    const now=nowMs();
    CH13=CH13.filter(c=>{
      const p=c.fq??(now-c.t0)/Math.max(CHLIFE10,165);if(p>=1)return false;if(p<0)return true;
      if(c.a){c.x0=c.a.x;c.y0=c.a.y-12;}if(c.b){c.x1=c.b.x;c.y1=c.b.y-12;}
      const fade=p<.18?1:((1-p)/.82)**1.4,x1=c.x1,y1=c.y1;
      const dx=x1-c.x0,dy=y1-c.y0,d=Math.hypot(dx,dy)||1,n=Math.max(3,Math.min(7,Math.ceil(d/24))),pts=[[c.x0,c.y0]],fr=Math.floor((now-c.t0)/75);
      for(let i=1;i<n;i++){const q=(i+(hsh(c.sd+i*13)-.5)*.32)/n,j=(i%2?1:-1)*Math.min(d*.17,6+7*hsh(c.sd+i*29+fr*7));pts.push([c.x0+dx*q-dy/d*j,c.y0+dy*q+dx/d*j]);}pts.push([x1,y1]);
      ctx.save();ctx.lineCap='butt';ctx.lineJoin='miter';ctx.miterLimit=3;ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
      ctx.globalAlpha=.12*fade;ctx.strokeStyle='#ffe76b';ctx.lineWidth=5;ctx.stroke();
      ctx.globalAlpha=.9*fade;ctx.strokeStyle='#ffda45';ctx.lineWidth=2;ctx.stroke();
      ctx.globalAlpha=fade;ctx.strokeStyle='#fff9d7';ctx.lineWidth=.8;ctx.stroke();
      if(d>35){const v=pts[Math.max(1,Math.floor(n/2))],side=c.sd%2<1?1:-1;ctx.globalAlpha=.65*fade;ctx.strokeStyle='#ffe978';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(v[0],v[1]);ctx.lineTo(v[0]+dx/d*5-dy/d*side*6,v[1]+dy/d*5+dx/d*side*6);ctx.lineTo(v[0]+dx/d*12-dy/d*side*4,v[1]+dy/d*12+dx/d*side*4);ctx.stroke();}
      ctx.restore();return true;
    });
  };
  Object.assign(window.__wd,{drawFx});
})();
