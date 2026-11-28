/* One passive action pose per role. Attribute colours are a game rendering material. */
(() => {
  const api=window.WDSkillVFX,root=new URL('motions/passive/',document.currentScript.src);
  const images=new Map(),materials=new Map();let meta={};
  const palette=[null,[242,73,40],[35,126,241],[90,213,235],[246,204,44],[76,182,158],[178,125,68],[106,180,65],[232,206,117],[140,73,181]];
  api.passiveAtlasReady=fetch(new URL('meta.json',root)).then(r=>r.json()).then(async data=>{meta=data;await Promise.all(Object.entries(meta).map(async([tier,m])=>{const im=new Image();im.src=new URL(m.file,root);await im.decode();images.set(+tier,im);}));}).catch(e=>api.errors.push('Passive atlas: '+e.message));
  api.applyPassivePose=(T,key,t,impact=0)=>{T._passivePose=null;if(meta[T.len]?.frames[key]&&images.has(T.len)&&(key!=='miner'||t>=impact))T._passivePose={key,element:T.el};};
  function material(tier,key,element){
    const id=tier+':'+key+':'+element;if(materials.has(id))return materials.get(id);
    const f=meta[tier]?.frames[key],im=images.get(tier);if(!f||!im)return null;
    const c=document.createElement('canvas');c.width=f.w;c.height=f.h;const g=c.getContext('2d');g.drawImage(im,f.x,f.y,f.w,f.h,0,0,f.w,f.h);
    const color=palette[element];if(color){const data=g.getImageData(0,0,c.width,c.height),p=data.data;
      // Tint neutral armour/stone/effect ink; keep black contours, skin, hair and coins.
      for(let i=0;i<p.length;i+=4){if(!p[i+3])continue;const hi=Math.max(p[i],p[i+1],p[i+2]),lo=Math.min(p[i],p[i+1],p[i+2]);if(hi-lo>24||lo<24||hi>244)continue;const l=(p[i]+p[i+1]+p[i+2])/3/255;for(let k=0;k<3;k++){const v=l<.5?color[k]*l*2:color[k]+(255-color[k])*(l-.5)*2;p[i+k]=Math.round(p[i+k]*.30+v*.70);}}
      g.putImageData(data,0,0);
    }
    const result={im:c,frame:f};materials.set(id,result);if(materials.size>48)materials.delete(materials.keys().next().value);return result;
  }
  const original=unitSrc;
  unitSrc=function(T){const pose=T?._passivePose,m=pose&&material(T.len,pose.key,pose.element);if(!m)return original(T);const f=m.frame;
    return{img:m.im,sx:0,sy:0,sw:f.w,sh:f.h,dw:f.w,dh:f.h,box:null,flip:T.face<0,fb:{cx:f.w/2,foot:f.h},v2:{k:UNIT_H/f.h,mx:1,my:1,rot:0,dx:0,dy:0},ownFrame:'passive-'+pose.key,ownKey:'passive/tier-'+T.len+'.png#'+pose.key+'@element-'+pose.element};
  };
  api.passiveAtlasInfo=()=>({tiers:Object.keys(meta),roles:Object.keys(meta[6]?.frames||{}),materialCount:materials.size});
})();
